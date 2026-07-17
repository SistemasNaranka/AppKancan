import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton as MuiIconButton, Tooltip, Badge,
    Grid, Divider, Avatar, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    PlayArrow as PlayIcon,
    Coffee as CoffeeIcon,
    Restaurant as RestaurantIcon,
    ExitToApp as LogoutIcon,
    Assignment as AssignmentIcon,
    AccessTime as AccessTimeIcon,
    Comment as CommentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/es';

dayjs.extend(isSameOrBefore);

import { fetchTimeRecords } from '../api/directus/read';
import {
    EmpleadoFila,
    getNovedadIcon,
    calcularMinutosDia,
    formatearHoras,
} from './ModalDetalleTiendaUtils';

interface HistorialHorasModalProps {
    open: boolean;
    onClose: () => void;
    empleado: EmpleadoFila | null;
    tiendaId: number;
    todasNovedades: any[];
    onDayClick?: (fecha: string, empleadoNombre: string) => void;
}

// Meta para los tipos de registro en el timeline
const REGISTRO_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    'Comenzar Jornada': { icon: <PlayIcon sx={{ fontSize: 18 }} />, color: '#16a34a', bg: '#dcfce7' },
    'Iniciar Almuerzo': { icon: <CoffeeIcon sx={{ fontSize: 18 }} />, color: '#ea580c', bg: '#ffedd5' },
    'Finalizar Almuerzo': { icon: <RestaurantIcon sx={{ fontSize: 18 }} />, color: '#ca8a04', bg: '#fef9c3' },
    'Terminar Jornada': { icon: <LogoutIcon sx={{ fontSize: 18 }} />, color: '#004680', bg: '#eaf2fb' },
};

export default function HistorialHorasModal({
    open,
    onClose,
    empleado,
    tiendaId,
    todasNovedades,
    onDayClick,
}: HistorialHorasModalProps) {
    const [mesActual, setMesActual] = useState(dayjs().startOf('month'));
    const [diaSeleccionado, setDiaSeleccionado] = useState<{
        fecha: dayjs.Dayjs;
        records: any[];
        minutos: number;
        tieneNovedad: boolean;
        novedadTipo: string;
    } | null>(null);

    const { data: registrosMes = [], isLoading } = useQuery({
        queryKey: ['historialMes', tiendaId, empleado?.id, mesActual.format('YYYY-MM')],
        queryFn: async () => {
            if (!empleado) return [];
            const inicioMes = mesActual.startOf('month');
            const finMes = mesActual.endOf('month');
            const hoy = dayjs();
            const limite = hoy.isBefore(finMes) ? hoy : finMes;

            const recordsMes = await fetchTimeRecords(
                inicioMes.format('YYYY-MM-DD'),
                limite.format('YYYY-MM-DD'),
                tiendaId,
                empleado.id
            );

            // Agrupar registros en memoria por fecha
            const recordsPorDia: Record<string, any[]> = {};
            recordsMes.forEach((r: any) => {
                const dateKey = r.record_date;
                (recordsPorDia[dateKey] ||= []).push(r);
            });

            const dias: string[] = [];
            let cursor = inicioMes;
            while (cursor.isSameOrBefore(limite, 'day')) {
                dias.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }

            const registrosPorDia = dias.map((fecha) => {
                const records = recordsPorDia[fecha] || [];
                return { fecha, records };
            });

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
            const semanaInicio = dayObj.startOf('week').add(1, 'day'); // Lunes
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

    const iniciales = (empleado?.nombre || 'XX')
        .split(' ')
        .slice(0, 2)
        .map((p: string) => p[0] || '')
        .join('')
        .toUpperCase();

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
        >
            {/* Header del Diálogo */}
            <DialogTitle component="div" sx={{ bgcolor: '#004680', color: '#fff', py: 2.5, px: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#0284c7', fontWeight: 700, fontSize: '0.9rem' }}>
                            {iniciales}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                Historial de Marcaciones
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                                {empleado?.nombre} {empleado?.cargo ? `· ${empleado.cargo}` : ''}
                            </Typography>
                        </Box>
                    </Box>
                    <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
                </Box>
            </DialogTitle>

            {/* Contenido Principal */}
            <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
                
                {/* Selector de Mes */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 3, mt: 1 }}>
                    <MuiIconButton onClick={handleMesAnterior} sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <NavigateBeforeIcon />
                    </MuiIconButton>
                    <Typography variant="h6" fontWeight={800} color="#0f2c4a" sx={{ minWidth: 200, textAlign: 'center', textTransform: 'capitalize' }}>
                        {mesActual.locale('es').format('MMMM [de] YYYY')}
                    </Typography>
                    <MuiIconButton 
                        onClick={handleMesSiguiente} 
                        disabled={mesActual.isSame(dayjs(), 'month')}
                        sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', '&:hover': { bgcolor: '#f1f5f9' }, '&.Mui-disabled': { opacity: 0.3 } }}
                    >
                        <NavigateNextIcon />
                    </MuiIconButton>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress sx={{ color: '#004680' }} />
                        <Typography color="text.secondary" fontWeight={600}>Consultando registros mensuales...</Typography>
                    </Box>
                ) : semanas.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="body1" color="text.secondary">No se encontraron registros de asistencia para este mes.</Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                        {semanas.map((semana, idx) => {
                            const inicio = semana.inicio;
                            const fin = inicio.add(6, 'day'); // Lunes a Domingo
                            const esActual = inicio.isSame(dayjs().startOf('week').add(1, 'day'), 'day');
                            
                            let totalMinutos = 0;
                            const diasDetalle = semana.dias.map(({ fecha, records }) => {
                                const minutos = calcularMinutosDia(records, empleado!.id);
                                totalMinutos += minutos;
                                const novedad = getNovedadDelDia(fecha);
                                return {
                                    fecha: dayjs(fecha),
                                    records,
                                    minutos,
                                    tieneNovedad: !!novedad,
                                    novedadTipo: novedad?.newness_id?.name || '',
                                };
                            });
                            
                            diasDetalle.sort((a, b) => a.fecha.diff(b.fecha));

                            return (
                                <Paper 
                                    key={idx} 
                                    elevation={0} 
                                    sx={{ 
                                        p: 2.5, 
                                        borderRadius: 3.5, 
                                        border: esActual ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                        bgcolor: '#fff',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)'
                                    }}
                                >
                                    {/* Cabecera de la Semana */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography variant="subtitle1" fontWeight={800} color={esActual ? '#1d4ed8' : '#0f2c4a'}>
                                                Semana: {inicio.format('D MMM')} – {fin.format('D MMM YYYY')}
                                            </Typography>
                                            {esActual && (
                                                <Chip label="Actual" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTimeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <Typography variant="subtitle2" fontWeight={800} color="#0f2c4a">
                                                Acumulado: <Box component="span" sx={{ color: '#004680' }}>{formatearHoras(totalMinutos)}</Box>
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Grid de Tarjetas Diarias */}
                                    <Grid container spacing={1.5}>
                                        {diasDetalle.map((dia) => {
                                            const tieneRegistros = dia.records.length > 0;
                                            const esDomingo = dia.fecha.day() === 0;

                                            // Estilos para novedades en días sin marcas
                                            const getNovedadEstilo = (tipo: string) => {
                                                const t = tipo.toLowerCase();
                                                if (t.includes('descanso')) return { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' };
                                                if (t.includes('vacaciones')) return { bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' };
                                                if (t.includes('incapacidad') || t.includes('ausencia') || t.includes('suspensión')) return { bg: '#ffebee', color: '#c62828', border: '#ffcdd2' };
                                                if (t.includes('permiso') || t.includes('calamidad') || t.includes('familia')) return { bg: '#fff3e0', color: '#ef6c00', border: '#ffe0b2' };
                                                return { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
                                            };

                                            const novedadEstilo = dia.tieneNovedad && !tieneRegistros ? getNovedadEstilo(dia.novedadTipo) : null;
                                            const capitalizar = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

                                            return (
                                                 <Grid size={{ xs: 6, sm: 4, md: 2.4, lg: 1.71 }} key={dia.fecha.format('YYYY-MM-DD')}>
                                                    <Box
                                                        onClick={() => {
                                                            if (tieneRegistros) {
                                                                setDiaSeleccionado(dia);
                                                            }
                                                        }}
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            p: 1.5,
                                                            borderRadius: 3,
                                                            bgcolor: tieneRegistros 
                                                                ? '#f1f7fe' 
                                                                : novedadEstilo 
                                                                    ? novedadEstilo.bg 
                                                                    : '#f8fafc',
                                                            border: '1px solid',
                                                            borderColor: tieneRegistros 
                                                                ? '#c7dffc' 
                                                                : novedadEstilo 
                                                                    ? novedadEstilo.border 
                                                                    : '#e2e8f0',
                                                            cursor: tieneRegistros ? 'pointer' : 'default',
                                                            height: '100%',
                                                            minHeight: 90,
                                                            justifyContent: 'space-between',
                                                            transition: 'all 0.2s ease',
                                                            ...(tieneRegistros && {
                                                                '&:hover': {
                                                                    borderColor: '#3b82f6',
                                                                    boxShadow: '0 4px 12px rgba(59,130,246,0.12)',
                                                                    transform: 'translateY(-2px)'
                                                                }
                                                            }),
                                                            ...(esDomingo && !novedadEstilo && {
                                                                bgcolor: tieneRegistros ? '#fef9c3' : '#fffbeb',
                                                                borderColor: tieneRegistros ? '#fde68a' : '#fef3c7'
                                                            })
                                                        }}
                                                    >
                                                        {/* Día y Fecha */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography 
                                                                variant="caption" 
                                                                fontWeight={700} 
                                                                sx={{ 
                                                                    color: novedadEstilo 
                                                                        ? novedadEstilo.color 
                                                                        : esDomingo 
                                                                            ? '#b45309' 
                                                                            : '#64748b', 
                                                                    textTransform: 'capitalize' 
                                                                }}
                                                            >
                                                                {dia.fecha.locale('es').format('ddd D')}
                                                            </Typography>
                                                            {dia.tieneNovedad && (
                                                                <Tooltip title={`Novedad: ${dia.novedadTipo}`}>
                                                                    <Badge color="error" variant="dot">
                                                                        {getNovedadIcon(dia.novedadTipo)}
                                                                    </Badge>
                                                                </Tooltip>
                                                            )}
                                                        </Box>

                                                        {/* Total Horas / Novedad del Día */}
                                                        <Box>
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight={800} 
                                                                sx={{ 
                                                                    color: tieneRegistros 
                                                                        ? '#004680' 
                                                                        : novedadEstilo 
                                                                            ? novedadEstilo.color 
                                                                            : '#94a3b8', 
                                                                    fontSize: '0.85rem' 
                                                                }}
                                                            >
                                                                {tieneRegistros 
                                                                    ? formatearHoras(dia.minutos) 
                                                                    : novedadEstilo 
                                                                        ? capitalizar(dia.novedadTipo) 
                                                                        : 'Sin marcas'}
                                                            </Typography>
                                                            {tieneRegistros && (
                                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', mt: 0.25, display: 'block' }}>
                                                                    Ver detalles →
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Paper>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>

            {/* Acciones del Diálogo Principal */}
            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    disableElevation
                    sx={{ bgcolor: '#004680', borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003366' } }}
                >
                    Cerrar Historial
                </Button>
            </DialogActions>

            {/* DIÁLOGO HIJO: Detalle Diario Premium (Timeline) */}
            <Dialog
                open={!!diaSeleccionado}
                onClose={() => setDiaSeleccionado(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle component="div" sx={{ bgcolor: '#0f2c4a', color: '#fff', py: 2, px: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 20 }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                                Detalle de Asistencia
                            </Typography>
                        </Box>
                        <MuiIconButton onClick={() => setDiaSeleccionado(null)} sx={{ color: '#fff' }} size="small">
                            <CloseIcon fontSize="small" />
                        </MuiIconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5, bgcolor: '#fff' }}>
                    {diaSeleccionado && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Cabecera del día */}
                            <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ textTransform: 'uppercase', mb: 0.25 }}>
                                    JORNADA DIARIA
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={850} color="#0f2c4a" sx={{ textTransform: 'capitalize' }}>
                                    {diaSeleccionado.fecha.locale('es').format('dddd, D [de] MMMM')}
                                </Typography>
                                <Typography variant="body2" fontWeight={800} color="#004680" sx={{ mt: 0.5 }}>
                                    Tiempo Total: {formatearHoras(diaSeleccionado.minutos)}
                                </Typography>
                            </Box>

                            {/* Timeline de Marcaciones */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
                                {(() => {
                                    // Ordenar marcas cronológicamente
                                    const marcasOrdenadas = [...diaSeleccionado.records].sort((a, b) => {
                                        const h1 = a.record_time || a.time || '00:00';
                                        const h2 = b.record_time || b.time || '00:00';
                                        return h1.localeCompare(h2);
                                    });

                                    if (marcasOrdenadas.length === 0) {
                                        return <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>No se encontraron marcas de asistencia.</Typography>;
                                    }

                                    return marcasOrdenadas.map((r, idx) => {
                                        const meta = REGISTRO_META[r.log_type] || { icon: <AssignmentIcon sx={{ fontSize: 18 }} />, color: '#64748b', bg: '#f1f5f9' };
                                        const esUltimo = idx === marcasOrdenadas.length - 1;
                                        const horaStr = r.record_time || r.time || '--:--';
                                        const comentario = r.observations;

                                        return (
                                            <Box key={idx} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                                                {/* Columna Timeline */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Avatar 
                                                        sx={{ 
                                                            width: 32, 
                                                            height: 32, 
                                                            bgcolor: meta.bg, 
                                                            color: meta.color,
                                                            border: `1px solid ${meta.color}33`,
                                                            zIndex: 2 
                                                        }}
                                                    >
                                                        {meta.icon}
                                                    </Avatar>
                                                    {!esUltimo && (
                                                        <Box sx={{ width: 2, bgcolor: '#e2e8f0', flexGrow: 1, my: 0.5, zIndex: 1 }} />
                                                    )}
                                                </Box>

                                                {/* Información de la Marca */}
                                                <Box sx={{ flexGrow: 1, pb: esUltimo ? 0 : 3 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                        <Typography variant="body2" fontWeight={800} color="#0f2c4a">
                                                            {r.log_type}
                                                        </Typography>
                                                        <Chip 
                                                            label={horaStr.substring(0, 5)} 
                                                            size="small" 
                                                            sx={{ bgcolor: '#f1f5f9', fontWeight: 800, fontSize: '0.72rem', height: 20 }} 
                                                        />
                                                    </Box>
                                                    
                                                    {/* Comentarios */}
                                                    {comentario && comentario.trim() && (
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 0.75, p: 1, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                            <CommentIcon sx={{ fontSize: 12, color: '#94a3b8', mt: 0.25 }} />
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                                                                {comentario}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    });
                                })()}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', gap: 1.5 }}>
                    <Button 
                        onClick={() => setDiaSeleccionado(null)} 
                        variant="outlined" 
                        fullWidth={!onDayClick}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#0f2c4a', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
                    >
                        Volver al Historial
                    </Button>
                    {onDayClick && (
                        <Button 
                            onClick={() => {
                                if (onDayClick && diaSeleccionado) {
                                    onDayClick(diaSeleccionado.fecha.format('YYYY-MM-DD'), empleado?.nombre || '');
                                }
                                setDiaSeleccionado(null);
                                onClose();
                            }} 
                            variant="contained" 
                            color="primary"
                            disableElevation
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#004680', '&:hover': { bgcolor: '#003366' } }}
                        >
                            Ir a este día en tienda
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}

