import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Pagination,
    TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
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
    AccessTime as AccessTimeIcon,
    History as HistoryIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/es';

dayjs.extend(isSameOrBefore);

import { getTimeRecords, getNovedades } from '../api/directus/read';
import { useHorarios } from '../hooks/useHorarios';

// ============================================================
//  UTILIDADES
// ============================================================
const getNovedadIcon = (tipo: string): JSX.Element => {
    const map: { [key: string]: JSX.Element } = {
        incapacidad: <LocalHospitalIcon sx={{ color: '#d32f2f' }} />,
        vacaciones: <BeachAccessIcon sx={{ color: '#1976d2' }} />,
        permiso: <EventAvailableIcon sx={{ color: '#2e7d32' }} />,
        ausencia: <ReportProblemIcon sx={{ color: '#d32f2f' }} />,
        retiro: <FlightTakeoffIcon sx={{ color: '#757575' }} />,
        calamidad: <WarningAmberIcon sx={{ color: '#ed6c02' }} />,
        'dia de la familia': <FamilyRestroomIcon sx={{ color: '#9c27b0' }} />,
        capacitación: <SchoolIcon sx={{ color: '#0288d1' }} />,
        suspensión: <GavelIcon sx={{ color: '#424242' }} />,
        descanso: <AssignmentIcon sx={{ color: '#00897b' }} />,
    };
    const key = Object.keys(map).find(k => tipo.toLowerCase().includes(k));
    return key ? map[key] : <AssignmentIcon sx={{ color: '#004680' }} />;
};

type EstadoDia = 'completo' | 'parcial' | 'sin_registro';
interface EmpleadoFila {
    id: string; nombre: string; documento: string; cargo: string;
    inicioJornada: string | null; inicioAlmuerzo: string | null;
    finAlmuerzo: string | null; finJornada: string | null;
    estado: string; tieneNovedad: boolean; novedadTipo?: string;
    novedadObservacion?: string; novedadId?: string;
    horasDia: string; horasSemana: string;
}

const calcularMinutosDia = (records: any[], empId: string | number): number => {
    const r = records.filter(r => Number(r.employee_id?.id || r.employee_id) === Number(empId));
    if (r.length === 0) return 0;
    const entrada = r.find(r => r.log_type === 'Comenzar Jornada');
    const salida = r.find(r => r.log_type === 'Terminar Jornada');
    if (!entrada || !salida) return 0;
    const h1 = entrada.record_time || entrada.time;
    const h2 = salida.record_time || salida.time;
    if (!h1 || !h2) return 0;
    const [a, b] = h1.split(':').map(Number);
    const [c, d] = h2.split(':').map(Number);
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) return 0;
    return (c * 60 + d) - (a * 60 + b);
};

const formatearHoras = (min: number): string =>
    min === 0 ? '0h 0m' : `${Math.floor(min / 60)}h ${min % 60}m`;

const calcularHorasSemana = (empId: string | number, records: any[]): string => {
    const empRecords = records.filter(r => Number(r.employee_id?.id || r.employee_id) === Number(empId));
    if (empRecords.length === 0) return '0h 0m';
    const byDay: Record<string, any[]> = {};
    empRecords.forEach(r => { (byDay[r.record_date] ||= []).push(r); });
    let total = 0;
    for (const date in byDay) {
        const recs = byDay[date];
        const entrada = recs.find(r => r.log_type === 'Comenzar Jornada');
        const salida = recs.find(r => r.log_type === 'Terminar Jornada');
        if (entrada && salida) {
            const h1 = entrada.record_time || entrada.time;
            const h2 = salida.record_time || salida.time;
            if (h1 && h2) {
                const [a, b] = h1.split(':').map(Number);
                const [c, d] = h2.split(':').map(Number);
                if (!isNaN(a) && !isNaN(b) && !isNaN(c) && !isNaN(d)) {
                    total += (c * 60 + d) - (a * 60 + b);
                }
            }
        }
    }
    return formatearHoras(total);
};

// ============================================================
//  MODAL DE DETALLE DE NOVEDAD
// ============================================================
function NovedadDetalleModal({ open, onClose, tipo, observacion, empleadoNombre }: any) {
    const icon = getNovedadIcon(tipo || 'Novedad');
    const fecha = dayjs().format('DD [de] MMMM [de] YYYY');
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {React.cloneElement(icon, { sx: { fontSize: 32, color: '#fff' } })}
                    <Typography variant="h6" fontWeight={700}>Detalle de Novedad</Typography>
                </Box>
                <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Empleado</Typography>
                        <Typography variant="h6" fontWeight={700} color="#0a1929" sx={{ mt: 0.5 }}>{empleadoNombre}</Typography></Box>
                    <Box><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo de Novedad</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
                            <Typography variant="h6" fontWeight={700} color="#0a1929">{tipo}</Typography>
                        </Box>
                    </Box>
                    <Box><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Fecha de Registro</Typography>
                        <Typography variant="body1" fontWeight={500} color="#0a1929" sx={{ mt: 0.5 }}>{fecha}</Typography></Box>
                    <Box><Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Observación</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#f8fafc', borderRadius: 2, borderColor: '#e2e8f0', minHeight: 60 }}>
                            <Typography variant="body2" color="text.secondary">{observacion || 'Sin observación'}</Typography>
                        </Paper>
                    </Box>
                </Box>
                <Button fullWidth variant="contained" onClick={onClose} sx={{ mt: 4, bgcolor: '#004680', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003366' } }}>Cerrar</Button>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
//  MODAL DE HISTORIAL DE HORAS
// ============================================================
function HistorialHorasModal({
    open, onClose, empleado, tiendaId, todasNovedades, onDayClick,
}: {
    open: boolean;
    onClose: () => void;
    empleado: EmpleadoFila | null;
    tiendaId: number;
    todasNovedades: any[];
    onDayClick: (fecha: string, empleadoNombre: string) => void;
}) {
    const [mesActual, setMesActual] = useState(dayjs().startOf('month'));

    const { data: registrosMes = [], isLoading } = useQuery({
        queryKey: ['historialMes', tiendaId, empleado?.id, mesActual.format('YYYY-MM')],
        queryFn: async () => {
            if (!empleado) return [];
            const inicioMes = mesActual.startOf('month');
            const finMes = mesActual.endOf('month');
            const hoy = dayjs();
            const limite = hoy.isBefore(finMes) ? hoy : finMes;
            const dias: string[] = [];
            let cursor = inicioMes;
            while (cursor.isSameOrBefore(limite, 'day')) {
                dias.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }
            const registrosPorDia = await Promise.all(
                dias.map(async (fecha) => {
                    const records = await getTimeRecords(tiendaId, fecha);
                    return { fecha, records };
                })
            );
            return registrosPorDia;
        },
        enabled: !!empleado && open,
        staleTime: 5 * 60 * 1000,
    });

    const semanas = React.useMemo(() => {
        if (!registrosMes || registrosMes.length === 0) return [];
        const semanasMap: { [key: string]: any[] } = {};
        registrosMes.forEach(({ fecha, records }) => {
            const dayObj = dayjs(fecha);
            const semanaInicio = dayObj.startOf('week').add(1, 'day');
            const key = semanaInicio.format('YYYY-MM-DD');
            if (!semanasMap[key]) semanasMap[key] = [];
            semanasMap[key].push({ fecha, records });
        });
        const semanasArray = Object.keys(semanasMap).map((key) => ({
            inicio: dayjs(key),
            dias: semanasMap[key],
        }));
        semanasArray.sort((a, b) => b.inicio.diff(a.inicio));
        return semanasArray;
    }, [registrosMes]);

    const handleMesAnterior = () => setMesActual(mesActual.subtract(1, 'month'));
    const handleMesSiguiente = () => {
        const siguiente = mesActual.add(1, 'month');
        if (!siguiente.isAfter(dayjs(), 'month')) setMesActual(siguiente);
    };

    const getNovedadDelDia = (fecha: string) => {
        return todasNovedades.find(n => n.report_date === fecha && Number(n.employee_id?.id || n.employee_id) === Number(empleado?.id));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Historial de horas - {empleado?.nombre || ''}</Typography>
                    <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <MuiIconButton onClick={handleMesAnterior} size="small"><NavigateBeforeIcon /></MuiIconButton>
                    <Typography variant="h6" fontWeight={600} color="#004680">
                        {mesActual.locale('es').format('MMMM [de] YYYY')}
                    </Typography>
                    <MuiIconButton onClick={handleMesSiguiente} size="small" disabled={mesActual.isSame(dayjs(), 'month')}>
                        <NavigateNextIcon />
                    </MuiIconButton>
                </Box>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></Box>
                ) : semanas.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>No hay registros de horas en este mes.</Typography>
                ) : (
                    semanas.map((semana, idx) => {
                        const inicio = semana.inicio;
                        const fin = inicio.add(4, 'day');
                        const esActual = inicio.isSame(dayjs().startOf('week').add(1, 'day'), 'day');
                        let totalMinutos = 0;
                        const diasDetalle = semana.dias.map(({ fecha, records }) => {
                            const minutos = calcularMinutosDia(records, empleado!.id);
                            totalMinutos += minutos;
                            const novedad = getNovedadDelDia(fecha);
                            return {
                                fecha: dayjs(fecha),
                                minutos,
                                tieneNovedad: !!novedad,
                                novedadTipo: novedad?.newness_id?.name || '',
                                novedadObservacion: novedad?.observations || '',
                            };
                        });
                        diasDetalle.sort((a, b) => a.fecha.diff(b.fecha));
                        return (
                            <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #e0e0e0', bgcolor: esActual ? '#e3f2fd' : 'transparent' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color={esActual ? '#004680' : 'text.primary'}>
                                        {inicio.format('D MMM')} - {fin.format('D MMM YYYY')} {esActual && '(Actual)'}
                                    </Typography>
                                    <Typography variant="subtitle2" fontWeight={700} color={esActual ? '#004680' : '#0a1929'}>
                                        Total: {formatearHoras(totalMinutos)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {diasDetalle.map((dia) => (
                                        <Box
                                            key={dia.fecha.format('YYYY-MM-DD')}
                                            onClick={() => {
                                                onDayClick(dia.fecha.format('YYYY-MM-DD'), empleado?.nombre || '');
                                                onClose();
                                            }}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                bgcolor: '#f5f7fa',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1,
                                                minWidth: 100,
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: '#e3f2fd' },
                                                transition: 'background-color 0.2s',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dia.fecha.locale('es').format('ddd D')}
                                                </Typography>
                                                {dia.tieneNovedad && (
                                                    <Tooltip title={`Novedad: ${dia.novedadTipo}`}>
                                                        <Badge color="error" variant="dot" sx={{ '& .MuiBadge-dot': { width: 8, height: 8 } }}>
                                                            {getNovedadIcon(dia.novedadTipo || 'Novedad')}
                                                        </Badge>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Typography variant="caption" fontWeight={600} color="#0a1929">
                                                {formatearHoras(dia.minutos)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        );
                    })
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                    * Acumulado de lunes a viernes. Se reinicia cada semana. Haz clic en un día para ver sus registros.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#004680' }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================================
//  CALENDARIO MENSUAL
// ============================================================
function CalendarioMensualTienda({
    tiendaId, totalEmpleados, fechaSeleccionada, onDateSelect,
}: {
    tiendaId: number; totalEmpleados: number;
    fechaSeleccionada: string; onDateSelect: (fecha: string) => void;
}) {
    const [mesActual, setMesActual] = useState(() => dayjs(fechaSeleccionada).startOf('month'));
    useEffect(() => {
        const mesSel = dayjs(fechaSeleccionada).startOf('month');
        if (!mesActual.isSame(mesSel, 'month')) setMesActual(mesSel);
    }, [fechaSeleccionada]);

    const hoy = dayjs();
    const inicioMes = mesActual.startOf('month');
    const finMes = mesActual.endOf('month');

    const { data: diasEstado = {}, isLoading } = useQuery({
        queryKey: ['calendarioAsistencia', tiendaId, mesActual.format('YYYY-MM')],
        queryFn: async () => {
            if (mesActual.isAfter(hoy, 'month')) return {};
            const limite = mesActual.isSame(hoy, 'month') ? hoy : finMes;
            const dias: string[] = [];
            let cursor = inicioMes;
            while (cursor.isSameOrBefore(limite, 'day')) {
                dias.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }
            const resultados = await Promise.all(
                dias.map(async (fecha) => {
                    const records = await getTimeRecords(tiendaId, fecha);
                    const entradas = new Set(records.filter(r => r.log_type === 'Comenzar Jornada').map(r => Number(r.employee_id?.id || r.employee_id)));
                    const salidas = new Set(records.filter(r => r.log_type === 'Terminar Jornada').map(r => Number(r.employee_id?.id || r.employee_id)));
                    let estado: EstadoDia = 'sin_registro';
                    if (entradas.size > 0 || salidas.size > 0) {
                        estado = (totalEmpleados > 0 && entradas.size >= totalEmpleados && salidas.size >= totalEmpleados) ? 'completo' : 'parcial';
                    }
                    return { fecha, estado };
                })
            );
            return resultados.reduce((acc, { fecha, estado }) => ({ ...acc, [fecha]: estado }), {} as Record<string, EstadoDia>);
        },
        enabled: !!tiendaId && totalEmpleados > 0 && !mesActual.isAfter(hoy, 'month'),
        staleTime: 5 * 60 * 1000,
    });

    const diasSinRegistro = Object.values(diasEstado).filter(e => e === 'sin_registro').length;
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

    const handleDateClick = (fecha: string) => {
        onDateSelect(fecha);
        setMesActual(dayjs(fecha).startOf('month'));
    };

    const handleMesAnterior = () => setMesActual(mesActual.subtract(1, 'month'));
    const handleMesSiguiente = () => {
        const sig = mesActual.add(1, 'month');
        if (!sig.isAfter(hoy, 'month')) setMesActual(sig);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: diasSinRegistro > 0 ? '#fdf2f2' : '#f0fdf4', border: '1px solid', borderColor: diasSinRegistro > 0 ? '#fde8e8' : '#bbf7d0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: diasSinRegistro > 0 ? '#d32f2f' : '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarMonthIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography fontWeight={700} color={diasSinRegistro > 0 ? '#9b1c1c' : '#15803d'}>
                        {isLoading ? 'Calculando días...' : `${diasSinRegistro} días sin registro este mes`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Historial de asistencia de {mesActual.locale('es').format('MMMM [de] YYYY')}</Typography>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CalendarMonthIcon sx={{ color: '#004680', fontSize: 20 }} />
                        <Typography fontWeight={700} color="#0a1929" sx={{ letterSpacing: 0.5 }}>CALENDARIO DE ASISTENCIA</Typography>
                        <Tooltip title="Haz clic en un día para ver los registros de ese día.">
                            <InfoOutlinedIcon sx={{ fontSize: 16, color: '#90a4ae', cursor: 'help' }} />
                        </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MuiIconButton size="small" onClick={handleMesAnterior}><NavigateBeforeIcon /></MuiIconButton>
                        <Typography variant="subtitle2" fontWeight={600} color="#004680" sx={{ minWidth: 100, textAlign: 'center' }}>
                            {mesActual.locale('es').format('MMM YYYY')}
                        </Typography>
                        <MuiIconButton size="small" onClick={handleMesSiguiente} disabled={mesActual.isSame(hoy, 'month')}>
                            <NavigateNextIcon />
                        </MuiIconButton>
                    </Box>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#004680' }} /></Box>
                ) : (
                    <Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <Typography key={d} variant="caption" align="center" fontWeight={600} color="text.secondary">{d}</Typography>)}
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
                                const selected = fecha === fechaSeleccionada;
                                return (
                                    <Box
                                        key={fecha}
                                        onClick={() => !esFuturo && handleDateClick(fecha)}
                                        sx={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: bg, color: color, fontWeight: 700, fontSize: '0.85rem',
                                            mx: 'auto', cursor: esFuturo ? 'default' : 'pointer',
                                            border: selected ? '2px solid #004680' : esHoy ? '2px solid #0a1929' : 'none',
                                            boxShadow: selected ? '0 0 0 2px rgba(0,70,128,0.15)' : 'none',
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: esFuturo ? 'none' : 'scale(1.1)', boxShadow: esFuturo ? 'none' : 2 },
                                        }}
                                    >
                                        {dia}
                                    </Box>
                                );
                            })}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mt: 2.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2e7d32' }} /><Typography variant="caption" color="text.secondary">Registrado Correctamente</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef6c00' }} /><Typography variant="caption" color="text.secondary">Incompleto / Tarde</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#d32f2f' }} /><Typography variant="caption" color="text.secondary">Sin Registro</Typography></Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

// ============================================================
//  COMPONENTE PRINCIPAL (CON BOTÓN DE LIMPIEZA Y SIN BORDE AZUL)
// ============================================================
export default function ModalDetalleTienda({ tiendaId, tiendaNombre, onClose }: { tiendaId: number; tiendaNombre: string; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;
    const [fechaSeleccionada, setFechaSeleccionada] = useState(dayjs().format('YYYY-MM-DD'));
    const [novedadModalOpen, setNovedadModalOpen] = useState(false);
    const [novedadSeleccionada, setNovedadSeleccionada] = useState<any>(null);
    const [historialOpen, setHistorialOpen] = useState(false);
    const [empleadoHistorial, setEmpleadoHistorial] = useState<EmpleadoFila | null>(null);

    const { empleados, loading } = useHorarios(tiendaId);
    const { data: recordsDia = [] } = useQuery({
        queryKey: ['recordsDiaModal', tiendaId, fechaSeleccionada],
        queryFn: () => getTimeRecords(tiendaId, fechaSeleccionada),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    const hoy = dayjs(fechaSeleccionada);
    const diaSemana = hoy.day();
    const lunes = hoy.subtract((diaSemana + 6) % 7, 'day');
    const { data: weekRecords = [] } = useQuery({
        queryKey: ['weekRecords', tiendaId, lunes.format('YYYY-MM-DD')],
        queryFn: async () => {
            const dias = Array.from({ length: 5 }, (_, i) => lunes.add(i, 'day'));
            const records = await Promise.all(dias.map(f => getTimeRecords(tiendaId, f.format('YYYY-MM-DD'))));
            return records.flat();
        },
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    const { data: todasNovedades = [] } = useQuery({
        queryKey: ['todasNovedadesTienda', tiendaId],
        queryFn: () => getNovedades(tiendaId),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });
    const novedadesDia = todasNovedades.filter((n: any) => n.report_date === fechaSeleccionada);

    const getHora = (empId: string | number, logType: string) => {
        const record = recordsDia.find(r => Number(r.employee_id?.id || r.employee_id) === Number(empId) && r.log_type === logType);
        return record ? (record.record_time || record.time || '').substring(0, 5) : null;
    };

    const getNovedadEmpleado = (empId: string | number) => {
        const novedad = novedadesDia.find(n => Number(n.employee_id?.id || n.employee_id) === Number(empId));
        return novedad ? { tiene: true, tipo: novedad.newness_id?.name || 'Novedad', observacion: novedad.observations || 'Sin observación', id: novedad.id } : null;
    };

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
        const minutosDia = calcularMinutosDia(recordsDia, emp.id);
        const horasDia = formatearHoras(minutosDia);
        return {
            id: emp.id, nombre: emp.nombre, documento: emp.documento || '--', cargo: emp.cargo || 'Sin cargo',
            inicioJornada, inicioAlmuerzo, finAlmuerzo, finJornada, estado,
            tieneNovedad: !!novedad, novedadTipo: novedad?.tipo || '', novedadObservacion: novedad?.observacion || '', novedadId: novedad?.id || '',
            horasDia, horasSemana,
        };
    });

    const empleadosFiltrados = filasEmpleados.filter(f =>
        f.nombre.toLowerCase().includes(search.toLowerCase()) || f.documento.includes(search)
    );
    const empleadosPagina = empleadosFiltrados.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const fechaDisplay = dayjs(fechaSeleccionada).locale('es').format('dddd, D [de] MMMM [de] YYYY');

    const handleNovedadClick = (fila: EmpleadoFila) => {
        setNovedadSeleccionada({ tipo: fila.novedadTipo || 'Novedad', observacion: fila.novedadObservacion || 'Sin observación', empleadoNombre: fila.nombre });
        setNovedadModalOpen(true);
    };

    const handleOpenHistorial = (fila: EmpleadoFila) => {
        setEmpleadoHistorial(fila);
        setHistorialOpen(true);
    };

    // ===== AL SELECCIONAR UN DÍA DEL HISTORIAL =====
    const handleDayClick = (fecha: string, empleadoNombre: string) => {
        setFechaSeleccionada(fecha);
        setSearch(empleadoNombre);
        setPage(0);
    };

    // ===== BOTÓN PARA LIMPIAR FILTROS Y VOLVER A LA FECHA ACTUAL =====
    const handleClearFilters = () => {
        setFechaSeleccionada(dayjs().format('YYYY-MM-DD'));
        setSearch('');
        setPage(0);
    };

    return (
        <Dialog open onClose={onClose} fullScreen sx={{ bgcolor: '#f8f9fa', '& .MuiDialog-paper': { bgcolor: 'transparent', boxShadow: 'none', borderRadius: 0 }, '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.03)' } }}>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorefrontIcon sx={{ fontSize: 24 }} /> {tiendaNombre}
                </Typography>
                <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
            </DialogTitle>

            <Box sx={{ bgcolor: '#f8f9fa', flex: 1, overflow: 'auto' }}>
                <DialogContent sx={{ p: 3, bgcolor: 'transparent' }}>
                    <CalendarioMensualTienda
                        tiendaId={tiendaId}
                        totalEmpleados={filasEmpleados.length}
                        fechaSeleccionada={fechaSeleccionada}
                        onDateSelect={(fecha) => {
                            setFechaSeleccionada(fecha);
                            setSearch('');
                            setPage(0);
                        }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0a1929">
                            Registros del {fechaDisplay}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                size="medium"
                                icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                                label={`📌 ${dayjs(fechaSeleccionada).format('DD/MM/YYYY')}`}
                                sx={{
                                    bgcolor: '#004680',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    px: 1,
                                    '& .MuiChip-icon': { color: '#fff' },
                                }}
                            />
                            <Tooltip title="Limpiar filtros y volver a hoy">
                                <MuiIconButton
                                    size="small"
                                    onClick={handleClearFilters}
                                    sx={{
                                        color: '#004680',
                                        bgcolor: '#e3f2fd',
                                        '&:hover': { bgcolor: '#bbdefb' },
                                        p: 0.5,
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </MuiIconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <TextField
                        placeholder="Buscar por nombre o documento..."
                        size="small"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        fullWidth
                        sx={{ mb: 3, bgcolor: '#ffffff', borderRadius: 2 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment> }}
                    />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></Box>
                    ) : (
                        <TableContainer
                            key={fechaSeleccionada}
                            component={Paper}
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid #e0e0e0', // <--- BORDE SUTIL GRIS
                                mb: 2,
                                bgcolor: '#ffffff',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}
                        >
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#e8edf3' }}>
                                    <TableRow>
                                        {['EMPLEADO', 'INICIO JORNADA', 'INICIO ALMUERZO', 'FIN ALMUERZO', 'FIN JORNADA', 'ESTADO', 'HORAS DÍA', 'HORAS SEMANA', 'NOVEDADES'].map(text => (
                                            <TableCell key={text} sx={{ fontWeight: 700, fontSize: '0.75rem' }} align={text === 'NOVEDADES' ? 'center' : 'left'}>{text}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {empleadosPagina.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay registros</TableCell></TableRow>
                                    ) : (
                                        empleadosPagina.map((fila, idx) => (
                                            <TableRow key={fila.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#004680', fontSize: '0.75rem' }}>{fila.nombre.charAt(0)}</Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} fontSize="0.82rem">{fila.nombre}</Typography>
                                                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem" display="block">{fila.cargo}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                {['inicioJornada', 'inicioAlmuerzo', 'finAlmuerzo', 'finJornada'].map((campo) => (
                                                    <TableCell key={campo}>
                                                        <Chip size="small" icon={fila[campo as keyof EmpleadoFila] ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <AccessTimeIcon sx={{ fontSize: 14 }} />} label={fila[campo as keyof EmpleadoFila] || 'Pendiente'} sx={{ bgcolor: fila[campo as keyof EmpleadoFila] ? '#e8f5e9' : '#f5f5f5', color: fila[campo as keyof EmpleadoFila] ? '#2e7d32' : '#757575', fontWeight: 600, fontSize: '0.7rem', minWidth: 80 }} />
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <Chip size="small" label={fila.estado === 'jornada_finalizada' ? 'Finalizado' : 'En curso'} sx={{ bgcolor: fila.estado === 'jornada_finalizada' ? '#e8f5e9' : '#fff3cd', color: fila.estado === 'jornada_finalizada' ? '#2e7d32' : '#856404', fontWeight: 600, fontSize: '0.7rem' }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="#0a1929">{fila.horasDia}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" fontWeight={700} color="#004680">{fila.horasSemana}</Typography>
                                                        <Tooltip title="Ver historial completo">
                                                            <MuiIconButton size="small" onClick={() => handleOpenHistorial(fila)} sx={{ color: '#004680', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, p: 0.5 }}>
                                                                <HistoryIcon fontSize="small" />
                                                            </MuiIconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {fila.tieneNovedad ? (
                                                        <Chip size="small" label={fila.novedadTipo} onClick={() => handleNovedadClick(fila)} icon={getNovedadIcon(fila.novedadTipo || 'Novedad')} sx={{ bgcolor: '#fde8e8', color: '#b71c1c', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer', '&:hover': { bgcolor: '#fccfcf' } }} />
                                                    ) : (
                                                        <Chip size="small" label="Sin novedad" variant="outlined" sx={{ color: '#9e9e9e', fontWeight: 400, fontSize: '0.7rem', borderColor: '#e0e0e0' }} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', bgcolor: '#fafbfc' }}>
                                <Typography variant="caption" color="text.secondary">Mostrando {empleadosPagina.length} de {empleadosFiltrados.length} empleados</Typography>
                                {empleadosFiltrados.length > rowsPerPage && (
                                    <Pagination count={Math.ceil(empleadosFiltrados.length / rowsPerPage)} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" shape="rounded" size="small" />
                                )}
                            </Box>
                        </TableContainer>
                    )}
                </DialogContent>
            </Box>

            <HistorialHorasModal
                open={historialOpen}
                onClose={() => { setHistorialOpen(false); setEmpleadoHistorial(null); }}
                empleado={empleadoHistorial}
                tiendaId={tiendaId}
                todasNovedades={todasNovedades}
                onDayClick={handleDayClick}
            />

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