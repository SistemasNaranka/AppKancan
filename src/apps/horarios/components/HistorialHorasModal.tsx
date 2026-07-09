import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton as MuiIconButton, Tooltip, Badge,
} from '@mui/material';
import {
    Close as CloseIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
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
    onDayClick: (fecha: string, empleadoNombre: string) => void;
}

export default function HistorialHorasModal({
    open,
    onClose,
    empleado,
    tiendaId,
    todasNovedades,
    onDayClick,
}: HistorialHorasModalProps) {
    const [mesActual, setMesActual] = useState(dayjs().startOf('month'));

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
            <DialogTitle component="div" sx={{ bgcolor: '#004680', color: '#fff' }}>
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
