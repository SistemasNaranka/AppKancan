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
}

// ============================================================
//  MAPEO DE ICONOS POR TIPO DE NOVEDAD
// ============================================================
const getNovedadIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('incapacidad')) {
        return <LocalHospitalIcon sx={{ color: '#d32f2f' }} />;
    }
    if (tipoLower.includes('vacaciones')) {
        return <BeachAccessIcon sx={{ color: '#1976d2' }} />;
    }
    if (tipoLower.includes('permiso')) {
        return <EventAvailableIcon sx={{ color: '#2e7d32' }} />;
    }
    if (tipoLower.includes('ausencia')) {
        return <ReportProblemIcon sx={{ color: '#d32f2f' }} />;
    }
    if (tipoLower.includes('retiro')) {
        return <FlightTakeoffIcon sx={{ color: '#757575' }} />;
    }
    if (tipoLower.includes('calamidad')) {
        return <WarningAmberIcon sx={{ color: '#ed6c02' }} />;
    }
    if (tipoLower.includes('dia de la familia') || tipoLower.includes('familia')) {
        return <FamilyRestroomIcon sx={{ color: '#9c27b0' }} />;
    }
    if (tipoLower.includes('capacitación') || tipoLower.includes('capacitacion')) {
        return <SchoolIcon sx={{ color: '#0288d1' }} />;
    }
    if (tipoLower.includes('suspensión') || tipoLower.includes('suspension')) {
        return <GavelIcon sx={{ color: '#424242' }} />;
    }
    if (tipoLower.includes('descanso')) {
        return <AssignmentIcon sx={{ color: '#00897b' }} />;
    }
    return <AssignmentIcon sx={{ color: '#004680' }} />;
};

// ============================================================
//  COMPONENTE: MODAL DE DETALLE DE NOVEDAD
// ============================================================
function NovedadDetalleModal({
    open,
    onClose,
    tipo,
    observacion,
    empleadoNombre,
}: {
    open: boolean;
    onClose: () => void;
    tipo: string;
    observacion: string;
    empleadoNombre: string;
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNovedadIcon(tipo)}
                    <Typography variant="h6">Detalle de Novedad</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                    Empleado
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                    {empleadoNombre}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                    Tipo de Novedad
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
                    {tipo}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                    Observación
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {observacion || 'Sin observación registrada'}
                    </Typography>
                </Paper>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onClose}
                    sx={{ mt: 3, bgcolor: '#004680', '&:hover': { bgcolor: '#003a6b' } }}
                >
                    Cerrar
                </Button>
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
                        <InfoOutlinedIcon
                            sx={{ fontSize: 16, color: '#90a4ae', cursor: 'help' }}
                        />
                    </Tooltip>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: '#004680' }} />
                    </Box>
                ) : (
                    <Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                                <Typography
                                    key={dia}
                                    variant="caption"
                                    align="center"
                                    fontWeight={600}
                                    color="text.secondary"
                                >
                                    {dia}
                                </Typography>
                            ))}
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 1,
                            }}
                        >
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
                                            border: selected
                                                ? '2px solid #004680'
                                                : esHoy
                                                ? '2px solid #0a1929'
                                                : 'none',
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

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 3,
                                mt: 2.5,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: '#2e7d32',
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Registrado Correctamente
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: '#ef6c00',
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Incompleto / Tarde
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: '#d32f2f',
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Sin Registro
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

// ============================================================
//  COMPONENTE PRINCIPAL DEL MODAL
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

    // Fecha seleccionada (por defecto hoy)
    const [fechaSeleccionada, setFechaSeleccionada] = useState(
        dayjs().format('YYYY-MM-DD')
    );

    // Estado para el modal de detalle de novedad
    const [novedadModalOpen, setNovedadModalOpen] = useState(false);
    const [novedadSeleccionada, setNovedadSeleccionada] = useState<{
        tipo: string;
        observacion: string;
        empleadoNombre: string;
    } | null>(null);

    // 1. Obtener empleados de la tienda (hook existente)
    const { empleados, loading } = useHorarios(tiendaId);

    // 2. Obtener registros de tiempo de la fecha seleccionada
    const { data: recordsDia = [] } = useQuery({
        queryKey: ['recordsDiaModal', tiendaId, fechaSeleccionada],
        queryFn: () => getTimeRecords(tiendaId, fechaSeleccionada),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    // 3. Obtener TODAS las novedades de la tienda usando getNovedades
    const { data: todasNovedades = [] } = useQuery({
        queryKey: ['todasNovedadesTienda', tiendaId],
        queryFn: () => getNovedades(tiendaId),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    // 4. Filtrar novedades por la fecha seleccionada
    const novedadesDia = todasNovedades.filter(
        (n: any) => n.report_date === fechaSeleccionada
    );

    // 5. Función para obtener la hora de un tipo de marcación
    const getHora = (empId: string | number, logType: string): string | null => {
        const record = recordsDia.find(
            (r: any) =>
                Number(r.employee_id?.id || r.employee_id) === Number(empId) &&
                r.log_type === logType
        );
        if (!record) return null;
        const hora = record.record_time || record.time;
        return hora ? hora.substring(0, 5) : 'Marcado';
    };

    // 6. Función para obtener novedad del empleado en la fecha seleccionada
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

    // 7. Construir filas combinando datos
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

    const completadosCount = filasEmpleados.filter(
        (e) => e.inicioJornada && e.finJornada
    ).length;

    const fechaDisplay = dayjs(fechaSeleccionada).locale('es').format('dddd, D [de] MMMM [de] YYYY');

    // Manejar clic en novedad
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
            PaperProps={{ sx: { bgcolor: '#f5f7fa' } }}
        >
            <DialogTitle
                sx={{
                    bgcolor: '#004680',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        {tiendaNombre}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {filasEmpleados.length} empleados • {completadosCount} completados en{' '}
                        {dayjs(fechaSeleccionada).format('DD/MM/YYYY')}
                    </Typography>
                </Box>
                <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </MuiIconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Calendario interactivo */}
                <CalendarioMensualTienda
                    tiendaId={tiendaId}
                    totalEmpleados={filasEmpleados.length}
                    fechaSeleccionada={fechaSeleccionada}
                    onDateSelect={(fecha) => {
                        setFechaSeleccionada(fecha);
                        setPaginaEmpleados(0);
                    }}
                />

                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#0a1929' }}>
                    Registros del {fechaDisplay}
                </Typography>

                <TextField
                    placeholder="Buscar por nombre o documento..."
                    size="small"
                    value={searchEmpleado}
                    onChange={(e) => {
                        setSearchEmpleado(e.target.value);
                        setPaginaEmpleados(0);
                    }}
                    fullWidth
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 2 }}
                    >
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        EMPLEADO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        CARGO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        INICIO JORNADA
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        INICIO ALMUERZO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        FIN ALMUERZO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        FIN JORNADA
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>
                                        ESTADO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#546e7a' }} align="center">
                                        NOVEDADES
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {empleadosPagina.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No hay registros en esta tienda para esta fecha
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    empleadosPagina.map((fila) => (
                                        <TableRow key={fila.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#004680' }}>
                                                        {fila.nombre.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} color="#0a1929">
                                                            {fila.nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Doc: {fila.documento}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#455a64', fontSize: '0.85rem' }}>
                                                {fila.cargo}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={fila.inicioJornada || 'Pendiente'}
                                                    sx={{
                                                        bgcolor: fila.inicioJornada ? '#e8f5e9' : '#f5f5f5',
                                                        color: fila.inicioJornada ? '#2e7d32' : '#757575',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={fila.inicioAlmuerzo || 'Pendiente'}
                                                    sx={{
                                                        bgcolor: fila.inicioAlmuerzo ? '#e8f5e9' : '#f5f5f5',
                                                        color: fila.inicioAlmuerzo ? '#2e7d32' : '#757575',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={fila.finAlmuerzo || 'Pendiente'}
                                                    sx={{
                                                        bgcolor: fila.finAlmuerzo ? '#e8f5e9' : '#f5f5f5',
                                                        color: fila.finAlmuerzo ? '#2e7d32' : '#757575',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={fila.finJornada || 'Pendiente'}
                                                    sx={{
                                                        bgcolor: fila.finJornada ? '#e8f5e9' : '#f5f5f5',
                                                        color: fila.finJornada ? '#2e7d32' : '#757575',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={
                                                        fila.estado === 'jornada_finalizada'
                                                            ? 'Finalizado'
                                                            : 'En curso'
                                                    }
                                                    sx={{
                                                        bgcolor:
                                                            fila.estado === 'jornada_finalizada'
                                                                ? '#e8f5e9'
                                                                : '#fff3cd',
                                                        color:
                                                            fila.estado === 'jornada_finalizada'
                                                                ? '#2e7d32'
                                                                : '#856404',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {fila.tieneNovedad ? (
                                                    <Tooltip title={`Novedad: ${fila.novedadTipo}`}>
                                                        <MuiIconButton
                                                            size="small"
                                                            onClick={() => handleNovedadClick(fila)}
                                                            sx={{ color: 'inherit' }}
                                                        >
                                                            <Badge color="error" variant="dot">
                                                                {getNovedadIcon(fila.novedadTipo || 'Novedad')}
                                                            </Badge>
                                                        </MuiIconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <CheckCircleIcon
                                                        sx={{ color: '#2e7d32', fontSize: 20 }}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Paginación */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: 2.5,
                                py: 1.5,
                                borderTop: '1px solid #e0e0e0',
                                flexWrap: 'wrap',
                                gap: 1,
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

            {/* Modal de detalle de novedad */}
            {novedadSeleccionada && (
                <NovedadDetalleModal
                    open={novedadModalOpen}
                    onClose={() => {
                        setNovedadModalOpen(false);
                        setNovedadSeleccionada(null);
                    }}
                    tipo={novedadSeleccionada.tipo}
                    observacion={novedadSeleccionada.observacion}
                    empleadoNombre={novedadSeleccionada.empleadoNombre}
                />
            )}
        </Dialog>
    );
}