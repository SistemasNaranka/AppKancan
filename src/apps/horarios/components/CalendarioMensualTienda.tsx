import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tooltip, CircularProgress,
    IconButton as MuiIconButton,
} from '@mui/material';
import {
    CalendarMonth as CalendarMonthIcon,
    InfoOutlined as InfoOutlinedIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/es';

dayjs.extend(isSameOrBefore);

import { fetchTimeRecords } from '../api/directus/read';
import { EstadoDia } from './ModalDetalleTiendaUtils';

interface CalendarioMensualTiendaProps {
    tiendaId: number;
    totalEmpleados: number;
    fechaSeleccionada: string;
    onDateSelect: (fecha: string) => void;
    todasNovedades: any[];
}

export default function CalendarioMensualTienda({
    tiendaId,
    totalEmpleados,
    fechaSeleccionada,
    onDateSelect,
    todasNovedades,
}: CalendarioMensualTiendaProps) {
    const [mesActual, setMesActual] = useState(() => dayjs(fechaSeleccionada).startOf('month'));

    useEffect(() => {
        const mesSel = dayjs(fechaSeleccionada).startOf('month');
        if (!mesActual.isSame(mesSel, 'month')) setMesActual(mesSel);
    }, [fechaSeleccionada]);

    const hoy = dayjs();
    const inicioMes = mesActual.startOf('month');
    const finMes = mesActual.endOf('month');

    const { data: diasEstado = {}, isLoading } = useQuery({
        queryKey: ['calendarioAsistencia', tiendaId, mesActual.format('YYYY-MM'), todasNovedades.length],
        queryFn: async () => {
            if (mesActual.isAfter(hoy, 'month')) return {};
            const limite = mesActual.isSame(hoy, 'month') ? hoy : finMes;
            
            const recordsMes = await fetchTimeRecords(
                inicioMes.format('YYYY-MM-DD'),
                limite.format('YYYY-MM-DD'),
                tiendaId
            );

            // Agrupar registros en memoria por fecha
            const recordsPorDia: Record<string, any[]> = {};
            recordsMes.forEach((r: any) => {
                const dateKey = r.record_date;
                (recordsPorDia[dateKey] ||= []).push(r);
            });

            // Agrupar novedades en memoria por fecha
            const novedadesPorDia: Record<string, any[]> = {};
            todasNovedades.forEach((n: any) => {
                const dateKey = n.report_date;
                if (dateKey) {
                    (novedadesPorDia[dateKey] ||= []).push(n);
                }
            });

            const dias: string[] = [];
            let cursor = inicioMes;
            while (cursor.isSameOrBefore(limite, 'day')) {
                dias.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }

            const resultados = dias.map((fecha) => {
                const records = recordsPorDia[fecha] || [];
                const novelties = novedadesPorDia[fecha] || [];

                if (records.length === 0 && novelties.length === 0) {
                    return { fecha, estado: 'sin_registro' as EstadoDia };
                }

                // Identificar los empleados únicos que tuvieron marcas en esta fecha
                const employeeIdsWithRecords = Array.from(
                    new Set(records.map((r: any) => Number(r.employee_id?.id || r.employee_id)))
                );

                let hasIncomplete = false;
                let hasComplete = false;

                employeeIdsWithRecords.forEach((empId) => {
                    const empRecs = records.filter(
                        (r: any) => Number(r.employee_id?.id || r.employee_id) === empId
                    );
                    const tieneEntrada = empRecs.some((r: any) => r.log_type === 'Comenzar Jornada');
                    const tieneSalida = empRecs.some((r: any) => r.log_type === 'Terminar Jornada');
                    if (tieneEntrada && tieneSalida) {
                        hasComplete = true;
                    } else {
                        hasIncomplete = true;
                    }
                });

                let estado: EstadoDia = 'sin_registro';
                if (hasIncomplete) {
                    estado = 'parcial';
                } else if (hasComplete || novelties.length > 0) {
                    // Si todos los que trabajaron completaron su jornada, o si solo hay novedades justificadas
                    estado = 'completo';
                }

                return { fecha, estado };
            });

            return resultados.reduce((acc, { fecha, estado }) => ({ ...acc, [fecha]: estado }), {} as Record<string, EstadoDia>);
        },
        enabled: !!tiendaId && !mesActual.isAfter(hoy, 'month'),
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
                        <MuiIconButton size="small" onClick={handleMesSiguiente} disabled={mesActual.isSame(dayjs(), 'month')}>
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
                                            border: selected ? '2px solid #ffffff' : esHoy ? '1.5px dashed #0a1929' : 'none',
                                            outline: selected ? '3px solid #004680' : 'none',
                                            boxShadow: selected ? '0 4px 10px rgba(0,0,0,0.25)' : 'none',
                                            transform: selected ? 'scale(1.15)' : 'none',
                                            zIndex: selected ? 2 : 1,
                                            transition: 'all 0.15s ease-in-out',
                                            '&:hover': { transform: esFuturo ? 'none' : selected ? 'scale(1.15)' : 'scale(1.1)', boxShadow: esFuturo ? 'none' : 2 },
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
