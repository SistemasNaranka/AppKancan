import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Pagination,
    TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
    IconButton as MuiIconButton, Avatar, Tooltip, Badge,
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    CalendarMonth as CalendarMonthIcon,
    InfoOutlined as InfoOutlinedIcon,
    Assignment as AssignmentIcon,
    WarningAmber as WarningAmberIcon,
    CheckCircle as CheckCircleIcon,
    LocalHospital as LocalHospitalIcon,
    BeachAccess as BeachAccessIcon,
    EventAvailable as EventAvailableIcon,
    ReportProblem as ReportProblemIcon,
    FlightTakeoff as FlightTakeoffIcon,
    School as SchoolIcon,
    Gavel as GavelIcon,
    FamilyRestroom as FamilyRestroomIcon,
    Storefront as StorefrontIcon,
    Person as PersonIcon,
    Pending as PendingIcon,
    AccessTime as AccessTimeIcon,
    FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/es';

dayjs.extend(isSameOrBefore);

// ===== IMPORTS DE TU API =====
import { getTimeRecords, getNovedades } from '../api/directus/read';
import { useHorarios } from '../hooks/useHorarios';

// ============================================================
//  TIPOS
// ============================================================
type EstadoDia = 'completo' | 'parcial' | 'sin_registro';

interface EmpleadoFila {
    id: string;
    nombre: string;
    documento: string;
    cargo: string;
    inicioJornada: string | null;
    inicioAlmuerzo: string | null;
    finAlmuerzo: string | null;
    finJornada: string | null;
    estado: string;
    tieneNovedad: boolean;
    novedadTipo?: string;
    novedadObservacion?: string;
    novedadId?: string;
    horasSemana: string;
}

// ============================================================
//  MAPEO DE ICONOS POR TIPO DE NOVEDAD
// ============================================================
const getNovedadIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('incapacidad')) return <LocalHospitalIcon sx={{ color: '#d32f2f' }} />;
    if (tipoLower.includes('vacaciones')) return <BeachAccessIcon sx={{ color: '#1976d2' }} />;
    if (tipoLower.includes('permiso')) return <EventAvailableIcon sx={{ color: '#2e7d32' }} />;
    if (tipoLower.includes('ausencia')) return <ReportProblemIcon sx={{ color: '#d32f2f' }} />;
    if (tipoLower.includes('retiro')) return <FlightTakeoffIcon sx={{ color: '#757575' }} />;
    if (tipoLower.includes('calamidad')) return <WarningAmberIcon sx={{ color: '#ed6c02' }} />;
    if (tipoLower.includes('dia de la familia')) return <FamilyRestroomIcon sx={{ color: '#9c27b0' }} />;
    if (tipoLower.includes('capacitación')) return <SchoolIcon sx={{ color: '#0288d1' }} />;
    if (tipoLower.includes('suspensión')) return <GavelIcon sx={{ color: '#424242' }} />;
    if (tipoLower.includes('descanso')) return <AssignmentIcon sx={{ color: '#00897b' }} />;
    return <AssignmentIcon sx={{ color: '#004680' }} />;
};

// ============================================================
//  COMPONENTE: MODAL DE DETALLE DE NOVEDAD
// ============================================================
function NovedadDetalleModal({ open, onClose, tipo, observacion, empleadoNombre }: any) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNovedadIcon(tipo)}
                    <Typography variant="h6">Detalle de Novedad</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Empleado</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>{empleadoNombre}</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Tipo de Novedad</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>{tipo}</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Observación</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">{observacion || 'Sin observación'}</Typography>
                </Paper>
                <Button fullWidth variant="contained" onClick={onClose} sx={{ mt: 3, bgcolor: '#004680' }}>Cerrar</Button>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
//  COMPONENTE: CALENDARIO MENSUAL INTERACTIVO
// ============================================================
function CalendarioMensualTienda({
    tiendaId,
    totalEmpleados,
    fechaSeleccionada,
    onDateSelect,
}: {
    tiendaId: number;
    totalEmpleados: number;
    fechaSeleccionada: string;
    onDateSelect: (fecha: string) => void;
}) {
    const mesActual = dayjs(fechaSeleccionada);
    const inicioMes = mesActual.startOf('month');
    const finMes = mesActual.endOf('month');
    const hoy = dayjs();

    const { data: diasEstado = {}, isLoading } = useQuery({
        queryKey: ['calendarioAsistencia', tiendaId, mesActual.format('YYYY-MM')],
        queryFn: async () => {
            const limite = hoy.isBefore(finMes) ? hoy : finMes;
            const dias: string[] = [];
            let cursor = inicioMes;
            while (cursor.isSameOrBefore(limite, 'day')) {
                dias.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }

            const resultados = await Promise.all(
                dias.map(async (fecha) => {
                    const records = await getTimeRecords(tiendaId, fecha);

                    const empleadosConEntrada = new Set(
                        records
                            .filter((r: any) => r.log_type === 'Comenzar Jornada')
                            .map((r: any) => Number(r.employee_id?.id || r.employee_id))
                    );
                    const empleadosConSalida = new Set(
                        records
                            .filter((r: any) => r.log_type === 'Terminar Jornada')
                            .map((r: any) => Number(r.employee_id?.id || r.employee_id))
                    );

                    let estado: EstadoDia = 'sin_registro';
                    if (empleadosConEntrada.size > 0 || empleadosConSalida.size > 0) {
                        estado =
                            totalEmpleados > 0 &&
                            empleadosConEntrada.size >= totalEmpleados &&
                            empleadosConSalida.size >= totalEmpleados
                                ? 'completo'
                                : 'parcial';
                    }
                    return { fecha, estado };
                })
            );

            return resultados.reduce((acc, { fecha, estado }) => {
                acc[fecha] = estado;
                return acc;
            }, {} as Record<string, EstadoDia>);
        },
        enabled: !!tiendaId && totalEmpleados > 0,
        staleTime: 5 * 60 * 1000,
    });

    const diasSinRegistro = Object.values(diasEstado).filter((e) => e === 'sin_registro').length;

    const primerDiaSemana = (inicioMes.day() + 6) % 7;
    const totalDiasMes = finMes.date();
    const celdas: (number | null)[] = [
        ...Array(primerDiaSemana).fill(null),
        ...Array.from({ length: totalDiasMes }, (_, i) => i + 1),
    ];

    const colorPorEstado = (estado?: EstadoDia, esFuturo?: boolean) => {
        if (esFuturo || !estado) return { bg: 'transparent', color: '#cfd8dc' };
        if (estado === 'completo') return { bg: '#2e7d32', color: '#fff' };
        if (estado === 'parcial') return { bg: '#ef6c00', color: '#fff' };
        return { bg: '#d32f2f', color: '#fff' };
    };

    const isSelected = (fecha: string) => fecha === fechaSeleccionada;

    return (
        <Box sx={{ mb: 3 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: 3,
                    bgcolor: diasSinRegistro > 0 ? '#fdf2f2' : '#f0fdf4',
                    border: '1px solid',
                    borderColor: diasSinRegistro > 0 ? '#fde8e8' : '#bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: diasSinRegistro > 0 ? '#d32f2f' : '#2e7d32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <CalendarMonthIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography fontWeight={700} color={diasSinRegistro > 0 ? '#9b1c1c' : '#15803d'}>
                        {isLoading
                            ? 'Calculando días...'
                            : `${diasSinRegistro} días sin registro este mes`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Historial de asistencia de {mesActual.locale('es').format('MMMM [de] YYYY')}
                    </Typography>
                </Box>
            </Paper>

            <Paper
                elevation={0}
                sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2 }}>
                    <CalendarMonthIcon sx={{ color: '#004680', fontSize: 20 }} />
                    <Typography fontWeight={700} color="#0a1929" sx={{ letterSpacing: 0.5 }}>
                        CALENDARIO DE ASISTENCIA
                    </Typography>
                    <Tooltip title="Haz clic en un día para ver los registros de ese día.">
                        <InfoOutlinedIcon sx={{ fontSize: 16, color: '#90a4ae', cursor: 'help' }} />
                    </Tooltip>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: '#004680' }} />
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                                <Typography key={dia} variant="caption" align="center" fontWeight={600} color="text.secondary">
                                    {dia}
                                </Typography>
                            ))}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                            {celdas.map((dia, idx) => {
                                if (dia === null) return <Box key={`vacio-${idx}`} />;
                                const fechaDayjs = inicioMes.date(dia);
                                const fecha = fechaDayjs.format('YYYY-MM-DD');
                                const esFuturo = fechaDayjs.isAfter(hoy, 'day');
                                const esHoy = fechaDayjs.isSame(hoy, 'day');
                                const estado = diasEstado[fecha];
                                const { bg, color } = colorPorEstado(estado, esFuturo);
                                const selected = isSelected(fecha);

                                return (
                                    <Box
                                        key={fecha}
                                        onClick={() => !esFuturo && onDateSelect(fecha)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: bg,
                                            color: color,
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            mx: 'auto',
                                            cursor: esFuturo ? 'default' : 'pointer',
                                            border: selected ? '2px solid #004680' : esHoy ? '2px solid #0a1929' : 'none',
                                            transition: 'all 0.15s',
                                            '&:hover': {
                                                transform: esFuturo ? 'none' : 'scale(1.1)',
                                                boxShadow: esFuturo ? 'none' : 2,
                                            },
                                        }}
                                    >
                                        {dia}
                                    </Box>
                                );
                            })}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, mt: 2.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                                <Typography variant="caption" color="text.secondary">Registrado Correctamente</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef6c00' }} />
                                <Typography variant="caption" color="text.secondary">Incompleto / Tarde</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#d32f2f' }} />
                                <Typography variant="caption" color="text.secondary">Sin Registro</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

// ============================================================
//  COMPONENTE PRINCIPAL DEL MODAL (CON TOOLTIP MEJORADO)
// ============================================================
export default function ModalDetalleTienda({
    tiendaId,
    tiendaNombre,
    onClose,
}: {
    tiendaId: number;
    tiendaNombre: string;
    onClose: () => void;
}) {
    const [searchEmpleado, setSearchEmpleado] = useState('');
    const [paginaEmpleados, setPaginaEmpleados] = useState(0);
    const rowsPerPageEmpleados = 10;

    const [fechaSeleccionada, setFechaSeleccionada] = useState(dayjs().format('YYYY-MM-DD'));
    const [novedadModalOpen, setNovedadModalOpen] = useState(false);
    const [novedadSeleccionada, setNovedadSeleccionada] = useState<any>(null);

    const { empleados, loading } = useHorarios(tiendaId);

    // ===== REGISTROS DEL DÍA SELECCIONADO =====
    const { data: recordsDia = [] } = useQuery({
        queryKey: ['recordsDiaModal', tiendaId, fechaSeleccionada],
        queryFn: () => getTimeRecords(tiendaId, fechaSeleccionada),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    // ===== REGISTROS DE LA SEMANA ACTUAL Y HISTORIAL =====
    const hoy = dayjs(fechaSeleccionada);
    const diaSemana = hoy.day();
    const lunes = hoy.subtract((diaSemana + 6) % 7, 'day');
    const semanasOffset = [0, 1, 2, 3]; // Semana actual y 3 anteriores

    // Historial de semanas (para tooltip)
    const { data: historialSemanas = [] } = useQuery({
        queryKey: ['historialSemanas', tiendaId, lunes.format('YYYY-MM-DD')],
        queryFn: async () => {
            const semanasData = await Promise.all(
                semanasOffset.map(async (offset) => {
                    const fechaInicio = lunes.subtract(offset * 7, 'day');
                    const dias = Array.from({ length: 5 }, (_, i) => fechaInicio.add(i, 'day'));
                    const records = await Promise.all(
                        dias.map(fecha => getTimeRecords(tiendaId, fecha.format('YYYY-MM-DD')))
                    );
                    return {
                        offset,
                        inicio: fechaInicio.format('DD/MM/YYYY'),
                        fin: fechaInicio.add(4, 'day').format('DD/MM/YYYY'),
                        records: records.flat(),
                    };
                })
            );
            return semanasData;
        },
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    // Registros de la semana actual (para la columna principal)
    const { data: weekRecords = [] } = useQuery({
        queryKey: ['weekRecords', tiendaId, lunes.format('YYYY-MM-DD')],
        queryFn: async () => {
            const dias = Array.from({ length: 5 }, (_, i) => lunes.add(i, 'day'));
            const records = await Promise.all(
                dias.map(fecha => getTimeRecords(tiendaId, fecha.format('YYYY-MM-DD')))
            );
            return records.flat();
        },
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    // ===== NOVEDADES =====
    const { data: todasNovedades = [] } = useQuery({
        queryKey: ['todasNovedadesTienda', tiendaId],
        queryFn: () => getNovedades(tiendaId),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    const novedadesDia = todasNovedades.filter((n: any) => n.report_date === fechaSeleccionada);

    // ===== FUNCIONES AUXILIARES =====
    const getHora = (empId: string | number, logType: string): string | null => {
        const record = recordsDia.find(
            (r: any) => Number(r.employee_id?.id || r.employee_id) === Number(empId) && r.log_type === logType
        );
        if (!record) return null;
        const hora = record.record_time || record.time;
        return hora ? hora.substring(0, 5) : 'Marcado';
    };

    const getNovedadEmpleado = (empId: string | number) => {
        const novedad = novedadesDia.find(
            (n: any) => Number(n.employee_id?.id || n.employee_id) === Number(empId)
        );
        if (!novedad) return null;
        return {
            tiene: true,
            tipo: novedad.newness_id?.name || novedad.newness_id?.nombre || 'Novedad',
            observacion: novedad.observations || 'Sin observación',
            id: novedad.id,
        };
    };

    // ===== CÁLCULO DE HORAS SEMANALES (SIN NaN) =====
    const calcularHorasSemana = (empId: string | number, records: any[]): string => {
        const recordsEmp = records.filter(
            (r: any) => Number(r.employee_id?.id || r.employee_id) === Number(empId)
        );
        if (recordsEmp.length === 0) return '0h 0m';

        const recordsPorDia: Record<string, any[]> = {};
        recordsEmp.forEach((r: any) => {
            const fecha = r.record_date;
            if (!recordsPorDia[fecha]) recordsPorDia[fecha] = [];
            recordsPorDia[fecha].push(r);
        });

        let totalMinutos = 0;
        for (const fecha in recordsPorDia) {
            const recs = recordsPorDia[fecha];
            const entrada = recs.find((r: any) => r.log_type === 'Comenzar Jornada');
            const salida = recs.find((r: any) => r.log_type === 'Terminar Jornada');
            if (entrada && salida) {
                const horaEntrada = entrada.record_time || entrada.time;
                const horaSalida = salida.record_time || salida.time;
                if (horaEntrada && horaSalida) {
                    const [h1, m1] = horaEntrada.split(':').map(Number);
                    const [h2, m2] = horaSalida.split(':').map(Number);
                    if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
                        const minutosEntrada = h1 * 60 + m1;
                        const minutosSalida = h2 * 60 + m2;
                        totalMinutos += minutosSalida - minutosEntrada;
                    }
                }
            }
        }

        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        if (horas === 0 && minutos === 0) return '0h 0m';
        if (minutos === 0) return `${horas}h 0m`;
        return `${horas}h ${minutos}m`;
    };

    // ===== CONSTRUIR FILAS =====
    const filasEmpleados: EmpleadoFila[] = empleados.map((emp: any) => {
        const inicioJornada = getHora(emp.id, 'Comenzar Jornada');
        const inicioAlmuerzo = getHora(emp.id, 'Iniciar Almuerzo');
        const finAlmuerzo = getHora(emp.id, 'Finalizar Almuerzo');
        const finJornada = getHora(emp.id, 'Terminar Jornada');

        let estado = 'Pendiente';
        if (finJornada) estado = 'jornada_finalizada';
        else if (finAlmuerzo) estado = 'regreso_almuerzo';
        else if (inicioAlmuerzo) estado = 'en_almuerzo';
        else if (inicioJornada) estado = 'jornada_iniciada';

        const novedad = getNovedadEmpleado(emp.id);
        const horasSemana = calcularHorasSemana(emp.id, weekRecords);

        return {
            id: emp.id,
            nombre: emp.nombre,
            documento: emp.documento || '--',
            cargo: emp.cargo || 'Sin cargo',
            inicioJornada,
            inicioAlmuerzo,
            finAlmuerzo,
            finJornada,
            estado,
            tieneNovedad: novedad?.tiene || false,
            novedadTipo: novedad?.tipo || '',
            novedadObservacion: novedad?.observacion || '',
            novedadId: novedad?.id || '',
            horasSemana,
        };
    });

    const empleadosFiltrados = filasEmpleados.filter((f) =>
        f.nombre.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
        f.documento.includes(searchEmpleado)
    );

    const empleadosPagina = empleadosFiltrados.slice(
        paginaEmpleados * rowsPerPageEmpleados,
        (paginaEmpleados + 1) * rowsPerPageEmpleados
    );

    const completadosCount = filasEmpleados.filter((e) => e.inicioJornada && e.finJornada).length;
    const fechaDisplay = dayjs(fechaSeleccionada).locale('es').format('dddd, D [de] MMMM [de] YYYY');

    const handleNovedadClick = (fila: EmpleadoFila) => {
        setNovedadSeleccionada({
            tipo: fila.novedadTipo || 'Novedad',
            observacion: fila.novedadObservacion || 'Sin observación',
            empleadoNombre: fila.nombre,
        });
        setNovedadModalOpen(true);
    };

    return (
        <Dialog
            open={true}
            onClose={onClose}
            fullScreen
            PaperProps={{ sx: { bgcolor: '#f8f9fa', borderRadius: 0 } }}
        >
            <DialogTitle
                sx={{
                    bgcolor: '#004680',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    px: 3,
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorefrontIcon sx={{ fontSize: 24 }} />
                        {tiendaNombre}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip size="small" icon={<PersonIcon sx={{ fontSize: 14 }} />} label={`${filasEmpleados.length} empleados`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
                        <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label={`${completadosCount} completados`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
                        <Chip size="small" label={`${Math.round((completadosCount / (filasEmpleados.length || 1)) * 100)}%`} sx={{ bgcolor: '#ffc107', color: '#000', fontWeight: 700 }} />
                    </Box>
                </Box>
                <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
            </DialogTitle>

            <Box sx={{ bgcolor: '#f8f9fa', flex: 1, overflow: 'auto' }}>
                <DialogContent sx={{ p: 3, bgcolor: 'transparent' }}>
                    <CalendarioMensualTienda
                        tiendaId={tiendaId}
                        totalEmpleados={filasEmpleados.length}
                        fechaSeleccionada={fechaSeleccionada}
                        onDateSelect={(fecha) => { setFechaSeleccionada(fecha); setPaginaEmpleados(0); }}
                    />

                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#0a1929' }}>
                        Registros del {fechaDisplay}
                    </Typography>

                    <TextField
                        placeholder="Buscar por nombre o documento..."
                        size="small"
                        value={searchEmpleado}
                        onChange={(e) => { setSearchEmpleado(e.target.value); setPaginaEmpleados(0); }}
                        fullWidth
                        sx={{ mb: 3, bgcolor: '#ffffff', borderRadius: 2 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment>,
                        }}
                    />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></Box>
                    ) : (
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid #e0e0e0',
                                mb: 2,
                                bgcolor: '#ffffff',
                            }}
                        >
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#e8edf3' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>EMPLEADO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>INICIO JORNADA</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>INICIO ALMUERZO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>FIN ALMUERZO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>FIN JORNADA</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ESTADO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>HORAS SEMANA</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="center">NOVEDADES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {empleadosPagina.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay registros</TableCell>
                                        </TableRow>
                                    ) : (
                                        empleadosPagina.map((fila, idx) => (
                                            <TableRow key={fila.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#004680', fontSize: '0.75rem' }}>
                                                            {fila.nombre.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} fontSize="0.82rem">
                                                                {fila.nombre}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem" display="block">
                                                                {fila.cargo}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        icon={fila.inicioJornada ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <AccessTimeIcon sx={{ fontSize: 14 }} />}
                                                        label={fila.inicioJornada || 'Pendiente'}
                                                        sx={{
                                                            bgcolor: fila.inicioJornada ? '#e8f5e9' : '#f5f5f5',
                                                            color: fila.inicioJornada ? '#2e7d32' : '#757575',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            minWidth: 80,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        icon={fila.inicioAlmuerzo ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <AccessTimeIcon sx={{ fontSize: 14 }} />}
                                                        label={fila.inicioAlmuerzo || 'Pendiente'}
                                                        sx={{
                                                            bgcolor: fila.inicioAlmuerzo ? '#e8f5e9' : '#f5f5f5',
                                                            color: fila.inicioAlmuerzo ? '#2e7d32' : '#757575',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            minWidth: 80,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        icon={fila.finAlmuerzo ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <AccessTimeIcon sx={{ fontSize: 14 }} />}
                                                        label={fila.finAlmuerzo || 'Pendiente'}
                                                        sx={{
                                                            bgcolor: fila.finAlmuerzo ? '#e8f5e9' : '#f5f5f5',
                                                            color: fila.finAlmuerzo ? '#2e7d32' : '#757575',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            minWidth: 80,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        icon={fila.finJornada ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <AccessTimeIcon sx={{ fontSize: 14 }} />}
                                                        label={fila.finJornada || 'Pendiente'}
                                                        sx={{
                                                            bgcolor: fila.finJornada ? '#e8f5e9' : '#f5f5f5',
                                                            color: fila.finJornada ? '#2e7d32' : '#757575',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            minWidth: 80,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={fila.estado === 'jornada_finalizada' ? 'Finalizado' : 'En curso'}
                                                        sx={{
                                                            bgcolor: fila.estado === 'jornada_finalizada' ? '#e8f5e9' : '#fff3cd',
                                                            color: fila.estado === 'jornada_finalizada' ? '#2e7d32' : '#856404',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip
                                                        title={
                                                            <Box sx={{ p: 1.5, minWidth: 250 }}>
                                                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#004680', borderBottom: '1px solid #e0e0e0', pb: 0.5 }}>
                                                                    📊 Historial de horas semanales
                                                                </Typography>
                                                                {(() => {
                                                                    // Filtrar solo las semanas donde el empleado tiene registros
                                                                    const semanasConRegistros = historialSemanas.filter((semana: any) => {
                                                                        const recordsEmp = semana.records.filter(
                                                                            (r: any) => Number(r.employee_id?.id || r.employee_id) === Number(fila.id)
                                                                        );
                                                                        return recordsEmp.length > 0;
                                                                    });

                                                                    if (semanasConRegistros.length === 0) {
                                                                        return (
                                                                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                                                                No hay historial de horas registradas para este empleado.
                                                                            </Typography>
                                                                        );
                                                                    }

                                                                    return semanasConRegistros.map((semana: any, index: number) => {
                                                                        const horas = calcularHorasSemana(fila.id, semana.records);
                                                                        const esSemanaActual = index === 0;
                                                                        return (
                                                                            <Box
                                                                                key={semana.offset}
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    py: 0.75,
                                                                                    px: 1,
                                                                                    borderRadius: 1,
                                                                                    bgcolor: esSemanaActual ? '#e3f2fd' : 'transparent',
                                                                                    border: esSemanaActual ? '1px solid #90caf9' : 'none',
                                                                                    mb: 0.5,
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    fontWeight={esSemanaActual ? 700 : 400}
                                                                                    color={esSemanaActual ? '#004680' : 'text.primary'}
                                                                                    sx={{ fontSize: '0.8rem' }}
                                                                                >
                                                                                    {semana.inicio} - {semana.fin}
                                                                                    {esSemanaActual && ' (Actual)'}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    fontWeight={700}
                                                                                    color={esSemanaActual ? '#004680' : '#0a1929'}
                                                                                    sx={{ fontSize: '0.8rem' }}
                                                                                >
                                                                                    {horas}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    });
                                                                })()}
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ display: 'block', mt: 1, pt: 0.5, borderTop: '1px solid #e0e0e0', fontSize: '0.65rem' }}
                                                                >
                                                                    * Acumulado de lunes a viernes. Se reinicia cada semana.
                                                                </Typography>
                                                            </Box>
                                                        }
                                                        arrow
                                                        placement="left"
                                                        PopperProps={{
                                                            sx: {
                                                                '& .MuiTooltip-tooltip': {
                                                                    bgcolor: '#ffffff',
                                                                    color: '#0a1929',
                                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                                                    borderRadius: 2,
                                                                    padding: 0,
                                                                    maxWidth: 320,
                                                                },
                                                                '& .MuiTooltip-arrow': {
                                                                    color: '#ffffff',
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={700}
                                                            color="#004680"
                                                            sx={{
                                                                cursor: 'help',
                                                                textDecoration: 'underline dotted',
                                                                textDecorationColor: '#90caf9',
                                                                '&:hover': { color: '#003a6b' },
                                                            }}
                                                        >
                                                            {fila.horasSemana}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {fila.tieneNovedad ? (
                                                        <Tooltip title={`Novedad: ${fila.novedadTipo}`}>
                                                            <MuiIconButton
                                                                size="small"
                                                                onClick={() => handleNovedadClick(fila)}
                                                                sx={{ color: '#d32f2f' }}
                                                            >
                                                                <Badge color="error" variant="dot">
                                                                    {getNovedadIcon(fila.novedadTipo || 'Novedad')}
                                                                </Badge>
                                                            </MuiIconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <CheckCircleIcon sx={{ color: '#c8e6c9', fontSize: 20 }} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    px: 2.5,
                                    py: 1.5,
                                    borderTop: '1px solid #e0e0e0',
                                    bgcolor: '#fafbfc',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Mostrando {empleadosPagina.length} de {empleadosFiltrados.length} empleados
                                </Typography>
                                {empleadosFiltrados.length > rowsPerPageEmpleados && (
                                    <Pagination
                                        count={Math.ceil(empleadosFiltrados.length / rowsPerPageEmpleados)}
                                        page={paginaEmpleados + 1}
                                        onChange={(e, p) => setPaginaEmpleados(p - 1)}
                                        color="primary"
                                        shape="rounded"
                                        size="small"
                                    />
                                )}
                            </Box>
                        </TableContainer>
                    )}
                </DialogContent>
            </Box>

            {novedadSeleccionada && (
                <NovedadDetalleModal
                    open={novedadModalOpen}
                    onClose={() => { setNovedadModalOpen(false); setNovedadSeleccionada(null); }}
                    tipo={novedadSeleccionada.tipo}
                    observacion={novedadSeleccionada.observacion}
                    empleadoNombre={novedadSeleccionada.empleadoNombre}
                />
            )}
        </Dialog>
    );
}