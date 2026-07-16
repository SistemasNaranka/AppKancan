import { useState, useEffect, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Pagination,
    Tabs, Tab, Grid, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput,
    Autocomplete, Avatar,
} from '@mui/material';
import {
    Storefront as StorefrontIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Visibility as VisibilityIcon,
    EditNote as EditNoteIcon,
    Warning as WarningIcon,
    SupervisorAccount as SupervisorAccountIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Assignment as AssignmentIcon,
    Message as MessageIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    CalendarToday as CalendarTodayIcon,
    ArrowBackIos as ArrowBackIosIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

import { getStores, getEmpleadosBulk, getTimeRecordsBulkRange, getNovedadesBulkRange, getEditedTimeRecords } from '../api/directus/read';
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';
import { Tienda } from '../interfaces/horarios.interface';
import ModalDetalleTienda from '../components/ModalDetalleTienda';
import DateRangeFilter from '../components/DateRangeFilter';

const COLORS_FOR_MOTIVO = [
    { bg: '#e3f2fd', text: '#0d47a1' }, { bg: '#e8f5e9', text: '#1b5e20' },
    { bg: '#fff3e0', text: '#e65100' }, { bg: '#fce4ec', text: '#880e4f' },
    { bg: '#f3e5f5', text: '#4a148c' }, { bg: '#e0f7fa', text: '#006064' },
    { bg: '#f1f8e9', text: '#33691e' }, { bg: '#ffebee', text: '#b71c1c' },
    { bg: '#fff8e1', text: '#f57f17' }, { bg: '#e8eaf6', text: '#1a237e' },
    { bg: '#fbe9e7', text: '#bf360c' }, { bg: '#e0f2f1', text: '#004d40' },
];

const getColorForMotivo = (motivo: string) => {
    let hash = 0;
    for (let i = 0; i < motivo.length; i++) hash = motivo.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS_FOR_MOTIVO[Math.abs(hash) % COLORS_FOR_MOTIVO.length];
};

const OPCIONES_ORDEN = [
    { value: 'nombre', label: 'Tienda' },
    { value: 'totalEmpleados', label: 'Empleados Act.' },
    { value: 'personasRegistradas', label: 'Pers. Registradas' },
    { value: 'completados', label: 'Completados Hoy' },
    { value: 'pendientes', label: 'Días Pendientes' },
] as const;

const COLUMNAS_TIENDAS = [
    { label: 'TIENDA', value: 'nombre' },
    { label: 'EMPLEADOS ACT.', value: 'totalEmpleados' },
    { label: 'PERS. REGISTRADAS', value: 'personasRegistradas' },
    { label: 'COMPLETADOS HOY', value: 'completados' },
    { label: 'DÍAS PENDIENTES', value: 'pendientes' },
    { label: 'ACCIONES', value: null },
];

const COLUMNAS_EDICIONES = ['FECHA', 'EMPLEADO', 'TIENDA', 'REGISTRO', 'HORA ORIG.', 'HORA MOD.', 'MOTIVO', 'OBSERVACIONES'];
const TARJETAS_RESUMEN = [
    { icon: StorefrontIcon, label: 'TIENDAS', color: '#004680' },
    { icon: PersonIcon, label: 'EMPLEADOS', color: '#004680' },
    { icon: CheckCircleIcon, label: 'COMPLETADOS', color: '#2e7d32' },
    { icon: PendingIcon, label: 'PENDIENTES', color: '#d32f2f' },
];
const TARJETAS_ESTADISTICAS = [
    { icon: EditNoteIcon, label: 'TOTAL MODIFICACIONES', color: '#c62828', bg: '#ffebee' },
    { icon: SupervisorAccountIcon, label: 'EMPLEADOS MONITOREADOS', color: '#0d47a1', bg: '#e3f2fd' },
    { icon: WarningIcon, label: 'TIENDA CON MÁS CAMBIOS', color: '#f57f17', bg: '#fff8e1' },
];

interface TiendaResumen { id: number; nombre: string; totalEmpleados: number; personasRegistradas: number; completados: number; pendientes: number; }
interface MonitoreoPageProps { storeId?: number | null; }

export default function MonitoreoGeneralPage({ storeId }: MonitoreoPageProps) {
    const { esAdmin, esReport } = useHorariosPolicies();
    const [subTab, setSubTab] = useState(0);
    const [fechas, setFechas] = useState<{ inicio: Dayjs | null; fin: Dayjs | null }>({
        inicio: dayjs().startOf('month'),
        fin: dayjs(),
    });
    const [buscarEmpleado, setBuscarEmpleado] = useState('');
    const [paginaEdiciones, setPaginaEdiciones] = useState(0);
    const [motivosSeleccionados, setMotivosSeleccionados] = useState<string[]>([]);
    const [modalObs, setModalObs] = useState({ open: false, empleado: '', fecha: '', texto: '' });
    const [modalEmpleadosOpen, setModalEmpleadosOpen] = useState(false);
    const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | null>(null);
    const [paginaTiendas, setPaginaTiendas] = useState(0);
    const [paginaRanking, setPaginaRanking] = useState(0);
    const [buscarEmpleadoRanking, setBuscarEmpleadoRanking] = useState('');
    const [ordenTiendas, setOrdenTiendas] = useState<{ by: 'nombre' | 'totalEmpleados' | 'personasRegistradas' | 'completados' | 'pendientes'; dir: 'asc' | 'desc' }>({
        by: 'nombre',
        dir: 'asc',
    });
    const [ordenEdiciones, setOrdenEdiciones] = useState<'asc' | 'desc'>('desc');
    const [calendario, setCalendario] = useState<{ empleadoId: number | null; mes: Dayjs; dia: string | null; open: boolean }>({
        empleadoId: null,
        mes: dayjs(),
        dia: null,
        open: false,
    });
    const rowsPerPage = { tiendas: 10, ediciones: 10, ranking: 10 };

    const { data: todasLasTiendas = [], isLoading: cargandoTiendas } = useQuery<Tienda[]>({
        queryKey: ['adminTiendas'],
        queryFn: getStores,
        enabled: esAdmin() || esReport(),
        staleTime: 30 * 60 * 1000,
    });

    const { data: editedRecords = [], isLoading: cargandoEdiciones } = useQuery({
        queryKey: ['editedRecords', storeId, fechas.inicio?.format('YYYY-MM-DD'), fechas.fin?.format('YYYY-MM-DD'), todasLasTiendas],
        queryFn: () => {
            const storeIds = storeId ? [storeId] : todasLasTiendas.map(t => t.id);
            const inicio = fechas.inicio ? fechas.inicio.format('YYYY-MM-DD') : dayjs().startOf('month').format('YYYY-MM-DD');
            const fin = fechas.fin ? fechas.fin.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
            return getEditedTimeRecords(storeIds, inicio, fin);
        },
        enabled: !cargandoTiendas && (esAdmin() || esReport()),
        staleTime: 5 * 60 * 1000,
    });

    const motivosUnicos = useMemo(() => {
        const set = new Set<string>();
        editedRecords.forEach(r => r.motivo && set.add(r.motivo));
        return Array.from(set).sort();
    }, [editedRecords]);

    const statsEdiciones = useMemo(() => {
        const uniqueEmpleados = new Set(editedRecords.map(r => r.empleadoId));
        const storeCounts: Record<string, number> = {};
        editedRecords.forEach(r => { storeCounts[r.tiendaNombre] = (storeCounts[r.tiendaNombre] || 0) + 1; });
        let topStore = 'Ninguna', max = 0;
        Object.entries(storeCounts).forEach(([name, count]) => { if (count > max) { max = count; topStore = `${name} (${count})`; } });
        return { total: editedRecords.length, empleados: uniqueEmpleados.size, topStore };
    }, [editedRecords]);

    const rankingBase = useMemo(() => {
        const counts: Record<number, { id: number; nombre: string; total: number }> = {};
        editedRecords.forEach(r => {
            if (!counts[r.empleadoId]) counts[r.empleadoId] = { id: r.empleadoId, nombre: r.empleadoNombre, total: 0 };
            counts[r.empleadoId].total += 1;
        });
        return Object.values(counts);
    }, [editedRecords]);

    const rankingEmpleados = useMemo(() => {
        const ordenados = [...rankingBase];
        ordenados.sort((a, b) => (ordenEdiciones === 'asc' ? a.total - b.total : b.total - a.total));
        return ordenados;
    }, [rankingBase, ordenEdiciones]);

    const rankingFiltrado = useMemo(() => {
        if (!buscarEmpleadoRanking.trim()) return rankingEmpleados;
        return rankingEmpleados.filter(e => e.nombre.toLowerCase().includes(buscarEmpleadoRanking.toLowerCase().trim()));
    }, [rankingEmpleados, buscarEmpleadoRanking]);

    const topEmpleado = rankingEmpleados[0] ? `${rankingEmpleados[0].nombre} (${rankingEmpleados[0].total})` : 'Ninguno';

    const edicionesFiltradas = useMemo(() => {
        return editedRecords.filter(r => {
            const coincideEmpleado = r.empleadoNombre.toLowerCase().includes(buscarEmpleado.toLowerCase());
            const coincideMotivo = motivosSeleccionados.length === 0 || motivosSeleccionados.includes(r.motivo);
            return coincideEmpleado && coincideMotivo;
        });
    }, [editedRecords, buscarEmpleado, motivosSeleccionados]);

    const edicionesPagina = useMemo(() => {
        const start = paginaEdiciones * rowsPerPage.ediciones;
        return edicionesFiltradas.slice(start, start + rowsPerPage.ediciones);
    }, [edicionesFiltradas, paginaEdiciones]);

    const tiendas = useMemo(() => storeId ? todasLasTiendas.filter(t => t.id === storeId) : todasLasTiendas, [todasLasTiendas, storeId]);

    // Resumen de tiendas
    const [resumenTiendas, setResumenTiendas] = useState<TiendaResumen[]>([]);
    const [cargandoResumen, setCargandoResumen] = useState(false);
    const [errorResumen, setErrorResumen] = useState<string | null>(null);

    useEffect(() => {
        const cargarResumen = async () => {
            if (tiendas.length === 0) { setResumenTiendas([]); return; }
            setCargandoResumen(true); setErrorResumen(null);
            const inicio = fechas.inicio ? fechas.inicio.format('YYYY-MM-DD') : dayjs().startOf('month').format('YYYY-MM-DD');
            const fin = fechas.fin ? fechas.fin.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
            try {
                const storeIds = tiendas.map(t => t.id);
                const [empleados, records, novedades] = await Promise.all([
                    getEmpleadosBulk(storeIds),
                    getTimeRecordsBulkRange(storeIds, inicio, fin),
                    getNovedadesBulkRange(storeIds, inicio, fin),
                ]);
                const empleadosPorTienda: Record<number, any[]> = {};
                empleados.forEach((e: any) => { if (e.storeId != null) (empleadosPorTienda[e.storeId] ||= []).push(e); });
                const recordsPorTienda: Record<number, any[]> = {};
                records.forEach((r: any) => {
                    const sId = r.store_id ? Number(typeof r.store_id === 'object' ? r.store_id.id : r.store_id) : null;
                    if (sId != null) (recordsPorTienda[sId] ||= []).push(r);
                });
                const novedadesPorTienda: Record<number, any[]> = {};
                novedades.forEach((n: any) => {
                    const sId = n.store_id ? Number(typeof n.store_id === 'object' ? n.store_id.id : n.store_id) : null;
                    if (sId != null) (novedadesPorTienda[sId] ||= []).push(n);
                });
                const dias: string[] = [];
                let cursor = dayjs(inicio);
                while (cursor.isSameOrBefore(dayjs(fin), 'day')) { dias.push(cursor.format('YYYY-MM-DD')); cursor = cursor.add(1, 'day'); }
                const data = tiendas.map(tienda => {
                    const emp = empleadosPorTienda[tienda.id] || [];
                    const rec = recordsPorTienda[tienda.id] || [];
                    const nov = novedadesPorTienda[tienda.id] || [];
                    const totalEmpleados = emp.length;
                    const employeeIds = new Set<number>();
                    emp.forEach(e => employeeIds.add(Number(e.id)));
                    rec.forEach(r => { const id = r.employee_id?.id || r.employee_id; if (id) employeeIds.add(Number(id)); });
                    nov.forEach(n => { const id = n.employee_id?.id || n.employee_id; if (id) employeeIds.add(Number(id)); });
                    const personasRegistradas = employeeIds.size;
                    const recordsHoy = rec.filter(r => r.record_date === fin);
                    const idsHoy = new Set(recordsHoy.map((r: any) => Number(r.employee_id?.id || r.employee_id)));
                    let completados = 0;
                    idsHoy.forEach(id => {
                        const rEmp = recordsHoy.filter((r: any) => Number(r.employee_id?.id || r.employee_id) === id);
                        if (rEmp.some(r => r.log_type === 'Comenzar Jornada') && rEmp.some(r => r.log_type === 'Terminar Jornada')) completados++;
                    });
                    const fechasActividad = new Set<string>();
                    rec.forEach(r => fechasActividad.add(r.record_date));
                    nov.forEach(n => { if (n.report_date) fechasActividad.add(n.report_date); });
                    const pendientes = dias.filter(d => !fechasActividad.has(d)).length;
                    return { id: tienda.id, nombre: tienda.name, totalEmpleados, personasRegistradas, completados, pendientes };
                });
                setResumenTiendas(data);
                setOrdenTiendas({ by: 'nombre', dir: 'asc' });
            } catch (error) {
                console.error(error);
                setErrorResumen('Error al cargar los datos. Intenta nuevamente.');
            } finally { setCargandoResumen(false); }
        };
        if (!cargandoTiendas) cargarResumen();
    }, [tiendas, cargandoTiendas, fechas]);

    const tiendasOrdenadas = useMemo(() => {
        const sorted = [...resumenTiendas];
        const { by, dir } = ordenTiendas;
        sorted.sort((a, b) => {
            const va = a[by], vb = b[by];
            if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
            return dir === 'asc' ? va - (vb as number) : (vb as number) - va;
        });
        return sorted;
    }, [resumenTiendas, ordenTiendas]);

    const tiendasPagina = useMemo(() => {
        return tiendasOrdenadas.slice(paginaTiendas * rowsPerPage.tiendas, (paginaTiendas + 1) * rowsPerPage.tiendas);
    }, [tiendasOrdenadas, paginaTiendas]);

    const totalTiendas = tiendas.length;
    const totalEmpleados = resumenTiendas.reduce((acc, t) => acc + t.totalEmpleados, 0);
    const totalCompletados = resumenTiendas.reduce((acc, t) => acc + t.completados, 0);
    const totalPendientes = resumenTiendas.reduce((acc, t) => acc + t.pendientes, 0);

    const handleOrdenTiendas = (field: typeof ordenTiendas.by) => {
        if (ordenTiendas.by === field) {
            setOrdenTiendas(prev => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }));
        } else {
            setOrdenTiendas({ by: field, dir: 'asc' });
        }
        setPaginaTiendas(0);
    };

    const handleAbrirCalendario = (empleadoId: number) => {
        setCalendario({ empleadoId, mes: dayjs(), dia: null, open: true });
    };
    const handleCerrarCalendario = () => {
        setCalendario({ empleadoId: null, mes: dayjs(), dia: null, open: false });
    };

    // Datos calendario
    const edicionesPorEmpleado = useMemo(() => {
        if (!calendario.empleadoId) return [];
        return editedRecords.filter(r => r.empleadoId === calendario.empleadoId);
    }, [editedRecords, calendario.empleadoId]);
    const diasConEdiciones = useMemo(() => {
        const set = new Set<string>();
        edicionesPorEmpleado.forEach(r => set.add(r.fecha));
        return set;
    }, [edicionesPorEmpleado]);
    const edicionesDelDia = useMemo(() => {
        if (!calendario.dia) return [];
        return edicionesPorEmpleado.filter(r => r.fecha === calendario.dia);
    }, [edicionesPorEmpleado, calendario.dia]);
    const conteoPorDia = useMemo(() => {
        const conteo: Record<string, number> = {};
        edicionesPorEmpleado.forEach(r => { conteo[r.fecha] = (conteo[r.fecha] || 0) + 1; });
        return conteo;
    }, [edicionesPorEmpleado]);
    const edicionesDelMes = useMemo(() => {
        const inicioMes = calendario.mes.startOf('month').format('YYYY-MM-DD');
        const finMes = calendario.mes.endOf('month').format('YYYY-MM-DD');
        return edicionesPorEmpleado.filter(r => r.fecha >= inicioMes && r.fecha <= finMes);
    }, [edicionesPorEmpleado, calendario.mes]);
    const diasConEdicionesMes = useMemo(() => {
        const set = new Set<string>();
        edicionesDelMes.forEach(r => set.add(r.fecha));
        return set;
    }, [edicionesDelMes]);
    const promedioEdicionesMes = useMemo(() => {
        return diasConEdicionesMes.size > 0 ? edicionesDelMes.length / diasConEdicionesMes.size : 0;
    }, [edicionesDelMes, diasConEdicionesMes]);

    useEffect(() => setPaginaEdiciones(0), [buscarEmpleado, fechas, motivosSeleccionados]);
    useEffect(() => setPaginaRanking(0), [rankingFiltrado]);

    if (cargandoTiendas || (cargandoResumen && resumenTiendas.length === 0)) {
        return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress size={40} sx={{ color: '#004680' }} />
            <Typography color="text.secondary" fontWeight={600}>Cargando métricas...</Typography>
        </Box>;
    }
    if (errorResumen) {
        return <Container><Alert severity="error" action={<Button color="inherit" size="small" onClick={() => {}}>Reintentar</Button>}>{errorResumen}</Alert></Container>;
    }

    return (
        <Box sx={{ backgroundColor: 'transparent', py: 2 }}>
            <Container maxWidth="xl" disableGutters>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} textColor="primary" indicatorColor="primary">
                        <Tab label="Resumen de Asistencia" sx={{ fontWeight: 700, textTransform: 'none' }} />
                        <Tab label="Auditoría de Ediciones Manuales" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    </Tabs>
                </Box>

                {subTab === 0 && (
                    <>
                        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            {TARJETAS_RESUMEN.map((k, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <k.icon sx={{ color: k.color }} />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{k.label}</Typography>
                                        <Typography variant="h6" fontWeight={700} color={k.color}>
                                            {k.label === 'TIENDAS' ? totalTiendas : k.label === 'EMPLEADOS' ? totalEmpleados : k.label === 'COMPLETADOS' ? totalCompletados : totalPendientes}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1, mb: 2, borderRadius: 2, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', bgcolor: '#f8fafc' }}>
                            <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ letterSpacing: '0.5px', mr: 0.5 }}>Ordenar</Typography>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                    value={ordenTiendas.by}
                                    onChange={(e) => handleOrdenTiendas(e.target.value as typeof ordenTiendas.by)}
                                    variant="outlined" size="small"
                                    sx={{ bgcolor: '#fff', borderRadius: 1.5, '& .MuiSelect-select': { py: 0.5, fontSize: '0.8rem' } }}
                                >
                                    {OPCIONES_ORDEN.map(opt => <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>{opt.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Paper>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Table size="medium">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        {COLUMNAS_TIENDAS.map(col => (
                                            <TableCell
                                                key={col.label}
                                                sx={{ fontWeight: 700, color: '#546e7a', cursor: col.value ? 'pointer' : 'default', userSelect: 'none', '&:hover': col.value ? { color: '#004680' } : {} }}
                                                align={col.label === 'ACCIONES' ? 'center' : 'left'}
                                                onClick={() => col.value && handleOrdenTiendas(col.value as typeof ordenTiendas.by)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: col.label === 'ACCIONES' ? 'center' : 'flex-start' }}>
                                                    {col.label}
                                                    {ordenTiendas.by === col.value && (
                                                        <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                                            {ordenTiendas.dir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: '1rem', color: '#004680' }} /> : <ArrowDownwardIcon sx={{ fontSize: '1rem', color: '#004680' }} />}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tiendasPagina.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay tiendas disponibles</TableCell></TableRow>
                                    ) : (
                                        tiendasPagina.map(tienda => (
                                            <TableRow key={tienda.id} hover>
                                                <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><StorefrontIcon sx={{ color: '#004680' }} /><Typography fontWeight={600} color="#0a1929">{tienda.nombre}</Typography></Box></TableCell>
                                                <TableCell align="center"><Chip size="small" label={tienda.totalEmpleados} sx={{ bgcolor: '#e3f2fd', color: '#0a1929', fontWeight: 700 }} /></TableCell>
                                                <TableCell align="center"><Chip size="small" label={tienda.personasRegistradas} sx={{ bgcolor: '#ede7f6', color: '#5e35b1', fontWeight: 700 }} /></TableCell>
                                                <TableCell align="center"><Chip size="small" label={tienda.completados} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} /></TableCell>
                                                <TableCell align="center"><Chip size="small" label={tienda.pendientes} sx={{ bgcolor: '#fbe9e7', color: '#d32f2f', fontWeight: 700 }} /></TableCell>
                                                <TableCell align="center">
                                                    <Button variant="contained" size="small" startIcon={<VisibilityIcon />} onClick={() => setTiendaSeleccionada(tienda.id)} sx={{ bgcolor: '#004680', '&:hover': { bgcolor: '#003a6b' }, textTransform: 'none', borderRadius: 2 }}>Ver empleados</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">Mostrando {tiendasPagina.length} de {tiendasOrdenadas.length} tiendas</Typography>
                                {tiendasOrdenadas.length > rowsPerPage.tiendas && (
                                    <Pagination count={Math.ceil(tiendasOrdenadas.length / rowsPerPage.tiendas)} page={paginaTiendas + 1} onChange={(_, p) => setPaginaTiendas(p - 1)} color="primary" shape="rounded" size="small" />
                                )}
                            </Box>
                        </TableContainer>
                    </>
                )}

                {subTab === 1 && (
                    <>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {TARJETAS_ESTADISTICAS.map((k, idx) => (
                                <Grid item xs={12} md={3} key={idx}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ bgcolor: k.bg, p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <k.icon sx={{ color: k.color, fontSize: 28 }} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, width: '100%' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{k.label}</Typography>
                                            <Typography variant={k.label === 'TIENDA CON MÁS CAMBIOS' ? 'h6' : 'h5'} fontWeight={700} color={k.color} noWrap title={k.label === 'TOTAL MODIFICACIONES' ? statsEdiciones.total : k.label === 'EMPLEADOS MONITOREADOS' ? statsEdiciones.empleados : statsEdiciones.topStore}>
                                                {k.label === 'TOTAL MODIFICACIONES' ? statsEdiciones.total : k.label === 'EMPLEADOS MONITOREADOS' ? statsEdiciones.empleados : statsEdiciones.topStore}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                            <Grid item xs={12} md={3}>
                                <Paper elevation={0} onClick={() => setModalEmpleadosOpen(true)} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#004680', boxShadow: '0 2px 8px rgba(0,70,128,0.15)' } }}>
                                    <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PersonIcon sx={{ color: '#004680', fontSize: 28 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, width: '100%' }}>
                                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>EMPLEADO CON MÁS EDICIONES</Typography>
                                        <Typography variant="h6" fontWeight={700} color="#004680" noWrap title={topEmpleado}>{topEmpleado}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ flexGrow: 0, minWidth: 280 }}>
                                <DateRangeFilter
                                    fechaInicio={fechas.inicio}
                                    fechaFin={fechas.fin}
                                    onChange={(inicio, fin) => { setFechas({ inicio, fin }); setPaginaEdiciones(0); }}
                                />
                            </Box>
                            <FormControl size="small" sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                                <InputLabel id="motivo-multi-label">Motivos</InputLabel>
                                <Select
                                    labelId="motivo-multi-label"
                                    multiple
                                    value={motivosSeleccionados}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (Array.isArray(value) && value.includes('limpiar')) { setMotivosSeleccionados([]); setPaginaEdiciones(0); return; }
                                        if (Array.isArray(value) && value.includes('todos')) setMotivosSeleccionados(motivosUnicos);
                                        else setMotivosSeleccionados(typeof value === 'string' ? value.split(',') : value);
                                        setPaginaEdiciones(0);
                                    }}
                                    input={
                                        <OutlinedInput
                                            label="Motivos"
                                            endAdornment={
                                                motivosSeleccionados.length > 0 ? (
                                                    <InputAdornment position="end">
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMotivosSeleccionados([]); setPaginaEdiciones(0); }} onMouseDown={(e) => e.stopPropagation()} sx={{ p: 0.5, mr: 0.5 }}>
                                                            <CloseIcon fontSize="small" sx={{ color: '#64748b' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : null
                                            }
                                        />
                                    }
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, width: '100%', maxHeight: 80, overflow: 'auto', alignContent: 'flex-start' }}>
                                            {selected.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', gridColumn: '1 / -1' }}>Todos</Typography> :
                                            selected.map((value) => {
                                                const colors = getColorForMotivo(value);
                                                return (
                                                    <Box key={value} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: colors.bg, color: colors.text, px: 1, py: 0.5, borderRadius: 1, minWidth: 0, overflow: 'hidden', height: '28px', cursor: 'default' }} onMouseDown={(e) => e.stopPropagation()}>
                                                        <Typography variant="body2" fontWeight={500} color={colors.text} noWrap sx={{ fontSize: '0.75rem', flex: 1 }}>{value}</Typography>
                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', p: 0.5, borderRadius: '50%', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMotivosSeleccionados(motivosSeleccionados.filter(item => item !== value)); setPaginaEdiciones(0); }} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                                            <CloseIcon fontSize="small" sx={{ fontSize: '0.9rem', color: colors.text }} />
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 280, width: 280 }, sx: { '& .MuiMenuItem-root.Mui-selected': { bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }, '& .MuiMenuItem-root': { borderRadius: 1, mx: 0.5, my: 0.3 } } } }}
                                    sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'flex-start', minHeight: '40px', py: '4px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: motivosSeleccionados.length > 0 ? '#004680' : '#d0d7de', borderWidth: motivosSeleccionados.length > 0 ? '2px' : '1px' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' } }}
                                >
                                    <MenuItem value="todos" sx={{ fontWeight: 700, borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#e8e8e8', border: '1px solid #9e9e9e' }} />Todos</Box>
                                        {motivosSeleccionados.length === motivosUnicos.length && <CheckCircleIcon sx={{ color: '#004680', fontSize: 18 }} />}
                                    </MenuItem>
                                    <MenuItem value="limpiar" sx={{ fontWeight: 700, borderBottom: '1px solid #e0e0e0', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffebee', border: '1px solid #c62828' }} />Limpiar</Box>
                                        {motivosSeleccionados.length === 0 && <CheckCircleIcon sx={{ color: '#004680', fontSize: 18 }} />}
                                    </MenuItem>
                                    {motivosUnicos.map((motivo) => (
                                        <MenuItem key={motivo} value={motivo} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, fontWeight: motivosSeleccionados.includes(motivo) ? 700 : 400 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getColorForMotivo(motivo).bg, border: `1px solid ${getColorForMotivo(motivo).text}` }} />{motivo}</Box>
                                            {motivosSeleccionados.includes(motivo) && <CheckCircleIcon sx={{ color: '#004680', fontSize: 18 }} />}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Buscar Empleado"
                                placeholder="Nombre del empleado..."
                                value={buscarEmpleado}
                                onChange={(e) => { setBuscarEmpleado(e.target.value); setPaginaEdiciones(0); }}
                                size="small"
                                sx={{ flexGrow: 1, minWidth: 200 }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment>,
                                    endAdornment: buscarEmpleado ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => { setBuscarEmpleado(''); setPaginaEdiciones(0); }}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                }}
                            />
                        </Paper>

                        {cargandoEdiciones ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></Box>
                        ) : (
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                                <Table size="medium">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            {COLUMNAS_EDICIONES.map(t => (
                                                <TableCell key={t} sx={{ fontWeight: 700, color: '#546e7a' }} align={['HORA ORIG.', 'HORA MOD.', 'OBSERVACIONES'].includes(t) ? 'center' : 'left'}>{t}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {edicionesPagina.length === 0 ? (
                                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No se encontraron marcaciones modificadas en este período</TableCell></TableRow>
                                        ) : (
                                            edicionesPagina.map((r) => (
                                                <TableRow key={r.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={600} color="#0a1929">{r.fecha}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600} color="#0a1929">{r.empleadoNombre}</Typography></TableCell>
                                                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><StorefrontIcon fontSize="small" sx={{ color: '#64748b' }} /><Typography variant="body2" color="#0a1929">{r.tiendaNombre}</Typography></Box></TableCell>
                                                    <TableCell><Chip size="small" label={r.tipoRegistro} sx={{ bgcolor: '#f0f4f8', color: '#004680', fontWeight: 600 }} /></TableCell>
                                                    <TableCell align="center"><Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{r.horaOriginal ? r.horaOriginal.substring(0, 5) : '--:--'}</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="body2" fontWeight={700} color="#c62828">{r.horaModificada ? r.horaModificada.substring(0, 5) : '--:--'}</Typography></TableCell>
                                                    <TableCell><Chip size="small" label={r.motivo} sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} /></TableCell>
                                                    <TableCell align="center">
                                                        {r.observaciones && r.observaciones.toLowerCase() !== 'sin comentarios' ? (
                                                            <Tooltip title="Ver observación completa">
                                                                <IconButton size="small" onClick={() => setModalObs({ open: true, empleado: r.empleadoNombre, fecha: r.fecha, texto: r.observaciones })} sx={{ color: '#004680', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, p: 0.5 }}>
                                                                    <MessageIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : <Typography variant="caption" color="#94a3b8" sx={{ fontStyle: 'italic' }}>Sin observación</Typography>}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Mostrando {edicionesPagina.length} de {edicionesFiltradas.length} modificaciones</Typography>
                                    {edicionesFiltradas.length > rowsPerPage.ediciones && (
                                        <Pagination count={Math.ceil(edicionesFiltradas.length / rowsPerPage.ediciones)} page={paginaEdiciones + 1} onChange={(_, p) => setPaginaEdiciones(p - 1)} color="primary" shape="rounded" size="small" />
                                    )}
                                </Box>
                            </TableContainer>
                        )}
                    </>
                )}

                {tiendaSeleccionada && (
                    <ModalDetalleTienda
                        tiendaId={tiendaSeleccionada}
                        tiendaNombre={tiendas.find(t => t.id === tiendaSeleccionada)?.name || 'Detalle de Tienda'}
                        onClose={() => setTiendaSeleccionada(null)}
                    />
                )}

                <Dialog open={modalObs.open} onClose={() => setModalObs(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ m: 0, p: 2.5, bgcolor: '#004680', color: '#ffffff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><AssignmentIcon /><Typography variant="h6" fontWeight={700}>Detalle de Observación</Typography></Box>
                        <IconButton onClick={() => setModalObs(prev => ({ ...prev, open: false }))} sx={{ color: '#ffffff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                            <Grid item xs={6}><Typography variant="caption" color="text.secondary" fontWeight={700} display="block">EMPLEADO</Typography><Typography variant="body2" color="#0a1929" fontWeight={600}>{modalObs.empleado}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="caption" color="text.secondary" fontWeight={700} display="block">FECHA DE REGISTRO</Typography><Typography variant="body2" color="#0a1929" fontWeight={600}>{modalObs.fecha}</Typography></Grid>
                        </Grid>
                        <Box><Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1 }}>OBSERVACIÓN COMPLETA</Typography>
                            <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" color="#334155" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{modalObs.texto}</Typography>
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={() => setModalObs(prev => ({ ...prev, open: false }))} variant="contained" disableElevation sx={{ bgcolor: '#004680', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#003a6b' } }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={modalEmpleadosOpen} onClose={() => setModalEmpleadosOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ bgcolor: '#004680', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><PersonIcon sx={{ fontSize: 28 }} /><Typography variant="h6" fontWeight={700}>Empleados con Más Ediciones</Typography></Box>
                        <IconButton onClick={() => setModalEmpleadosOpen(false)} sx={{ color: '#ffffff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, pt: 1 }}>
                        <Box sx={{ mb: 3, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, letterSpacing: '0.5px' }}>BUSCAR EMPLEADO</Typography>
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e0e0e0', bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                                <Autocomplete
                                    fullWidth size="small"
                                    options={rankingEmpleados}
                                    getOptionLabel={(option) => option.nombre}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={null}
                                    onChange={(_, newValue) => { if (newValue) { setBuscarEmpleadoRanking(newValue.nombre); setPaginaRanking(0); } }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Escribe el nombre del empleado..."
                                            variant="standard" size="small"
                                            InputProps={{
                                                ...params.InputProps,
                                                disableUnderline: true,
                                                endAdornment: buscarEmpleadoRanking ? (
                                                    <InputAdornment position="end">
                                                        <IconButton size="small" onClick={() => { setBuscarEmpleadoRanking(''); setPaginaRanking(0); }}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : null,
                                            }}
                                            sx={{ '& .MuiInput-root': { fontSize: '0.95rem' } }}
                                        />
                                    )}
                                    sx={{ flex: 1 }}
                                />
                                {buscarEmpleadoRanking && <Chip label={`${rankingFiltrado.length} resultados`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#004680', fontWeight: 600, fontSize: '0.7rem', height: 26, flexShrink: 0 }} />}
                            </Paper>
                        </Box>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 2 }}>
                            <Table size="medium">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '40%' }}>EMPLEADO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '20%', cursor: 'pointer', userSelect: 'none', '&:hover': { color: '#004680' } }} align="center" onClick={() => { setOrdenEdiciones(prev => prev === 'asc' ? 'desc' : 'asc'); setPaginaRanking(0); }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                EDICIONES
                                                {ordenEdiciones === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: '1rem', ml: 0.5, color: '#004680' }} /> : <ArrowDownwardIcon sx={{ fontSize: '1rem', ml: 0.5, color: '#004680' }} />}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '40%' }} align="center">ACCIONES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(() => {
                                        const start = paginaRanking * rowsPerPage.ranking;
                                        const pagina = rankingFiltrado.slice(start, start + rowsPerPage.ranking);
                                        return pagina.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>{buscarEmpleadoRanking ? 'No se encontraron empleados' : 'No hay ediciones registradas'}</TableCell></TableRow>
                                        ) : (
                                            pagina.map(emp => (
                                                <TableRow key={emp.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={600} color="#0a1929">{emp.nombre}</Typography></TableCell>
                                                    <TableCell align="center"><Chip size="small" label={emp.total} sx={{ bgcolor: '#e1f5fe', color: '#0288d1', fontWeight: 700, minWidth: 40 }} /></TableCell>
                                                    <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                        <Button size="small" variant="outlined" onClick={() => { setBuscarEmpleado(emp.nombre); setPaginaEdiciones(0); setModalEmpleadosOpen(false); setSubTab(1); }} sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#004680', color: '#004680', '&:hover': { bgcolor: '#e3f2fd', borderColor: '#003366' } }}>Ver registros</Button>
                                                        <Tooltip title="Ver calendario de ediciones">
                                                            <IconButton onClick={() => handleAbrirCalendario(emp.id)} sx={{ color: '#004680' }}><CalendarTodayIcon /></IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        );
                                    })()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">Mostrando {Math.min(rowsPerPage.ranking, rankingFiltrado.length - paginaRanking * rowsPerPage.ranking)} de {rankingFiltrado.length} registros</Typography>
                            {rankingFiltrado.length > rowsPerPage.ranking && (
                                <Pagination count={Math.ceil(rankingFiltrado.length / rowsPerPage.ranking)} page={paginaRanking + 1} onChange={(_, p) => setPaginaRanking(p - 1)} color="primary" shape="rounded" size="small" showFirstButton showLastButton siblingCount={2} />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={() => setModalEmpleadosOpen(false)} variant="contained" disableElevation sx={{ bgcolor: '#004680', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#003366' } }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={calendario.open} onClose={handleCerrarCalendario} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
                    <DialogTitle sx={{ bgcolor: '#004680', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#ffffff', color: '#004680', width: 40, height: 40 }}>
                                {edicionesPorEmpleado.length > 0 ? edicionesPorEmpleado[0].empleadoNombre.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>{edicionesPorEmpleado.length > 0 ? edicionesPorEmpleado[0].empleadoNombre : 'Empleado'}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>{edicionesPorEmpleado.length} ediciones en {diasConEdiciones.size} días</Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={handleCerrarCalendario} sx={{ color: '#ffffff' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, bgcolor: '#f5f7fa' }}>
                        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e0e0e0', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EditNoteIcon sx={{ color: '#004680' }} />
                                <Typography fontWeight={700}>
                                    Ediciones en {calendario.mes.format('MMMM YYYY')}: <span style={{ color: '#004680' }}>{edicionesDelMes.length}</span>
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarTodayIcon sx={{ color: '#004680' }} />
                                <Typography fontWeight={600}>Días con ediciones: <span style={{ color: '#004680' }}>{diasConEdicionesMes.size}</span></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={600}>Promedio: <span style={{ color: '#004680' }}>{promedioEdicionesMes.toFixed(1)}</span> por día</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, md: 'auto' } }}>
                                <Typography variant="caption" color="text.secondary">
                                    Histórico total: <b style={{ color: '#546e7a' }}>{edicionesPorEmpleado.length}</b> ediciones en <b style={{ color: '#546e7a' }}>{diasConEdiciones.size}</b> días
                                </Typography>
                            </Box>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CalendarTodayIcon sx={{ color: '#004680' }} /><Typography variant="h6" fontWeight={700} color="#0a1929">{calendario.mes.format('MMMM YYYY')}</Typography></Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton onClick={() => setCalendario(prev => ({ ...prev, mes: prev.mes.subtract(1, 'month') }))} sx={{ color: '#004680' }}><ArrowBackIosIcon fontSize="small" /></IconButton>
                                    <IconButton onClick={() => setCalendario(prev => ({ ...prev, mes: prev.mes.add(1, 'month') }))} sx={{ color: '#004680' }} disabled={calendario.mes.isSame(dayjs(), 'month')}><ArrowForwardIosIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>
                            <Grid container spacing={1}>
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <Grid item xs key={d}><Typography align="center" variant="caption" fontWeight={700} color="text.secondary">{d}</Typography></Grid>)}
                            </Grid>
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                {Array.from({ length: (calendario.mes.startOf('month').day() + 6) % 7 }, (_, i) => <Grid item xs key={`empty-${i}`} />)}
                                {Array.from({ length: calendario.mes.daysInMonth() }, (_, i) => {
                                    const day = calendario.mes.date(i + 1);
                                    const fecha = day.format('YYYY-MM-DD');
                                    const count = conteoPorDia[fecha] || 0;
                                    const hasEdicion = count > 0;
                                    const isSelected = calendario.dia === fecha;
                                    const isToday = day.isSame(dayjs(), 'day');
                                    const esFuturo = day.isAfter(dayjs(), 'day');
                                    const isEdited = hasEdicion && !esFuturo;
                                    return (
                                        <Grid item xs key={fecha}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: 2, bgcolor: isSelected ? '#004680' : 'transparent',
                                                    color: isSelected ? '#ffffff' : (esFuturo ? '#bdbdbd' : '#000'),
                                                    border: isToday ? '2px solid #004680' : `1px solid ${isEdited ? '#004680' : '#e0e0e0'}`,
                                                    cursor: isEdited ? 'pointer' : 'default', minHeight: 60,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { transform: isEdited ? 'scale(1.05)' : 'none', boxShadow: isEdited ? 2 : 'none' },
                                                }}
                                                onClick={() => isEdited && setCalendario(prev => ({ ...prev, dia: fecha }))}
                                            >
                                                <Typography variant="body2" fontWeight={isSelected || isEdited ? 700 : 400}>{day.date()}</Typography>
                                                {isEdited && <Chip size="small" label={count} sx={{ mt: 0.5, bgcolor: isSelected ? 'rgba(255,255,255,0.25)' : '#004680', color: '#ffffff', fontWeight: 700, fontSize: '0.65rem', height: 18, minWidth: 24 }} />}
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                        {calendario.dia && edicionesDelDia.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="#004680" gutterBottom>
                                        Ediciones del {dayjs(calendario.dia).format('dddd, D [de] MMMM [de] YYYY')}
                                        <Chip size="small" label={`${edicionesDelDia.length} registros`} sx={{ ml: 2, bgcolor: '#e3f2fd', color: '#004680', fontWeight: 600 }} />
                                    </Typography>
                                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mt: 2 }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>Registro</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>Hora Original</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>Hora Modificada</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>Motivo</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#546e7a' }}>Observación</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {edicionesDelDia.map(r => (
                                                    <TableRow key={r.id} hover>
                                                        <TableCell>{r.tipoRegistro}</TableCell>
                                                        <TableCell><Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{r.horaOriginal ? r.horaOriginal.substring(0,5) : '--:--'}</Typography></TableCell>
                                                        <TableCell><Typography variant="body2" fontWeight={700} color="#c62828">{r.horaModificada ? r.horaModificada.substring(0,5) : '--:--'}</Typography></TableCell>
                                                        <TableCell><Chip size="small" label={r.motivo} sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} /></TableCell>
                                                        <TableCell>{r.observaciones && r.observaciones.toLowerCase() !== 'sin comentarios' ? <Tooltip title={r.observaciones}><IconButton size="small" sx={{ color: '#004680', p: 0.5 }}><MessageIcon fontSize="small" /></IconButton></Tooltip> : <Typography variant="caption" color="#94a3b8" fontStyle="italic">Sin obs.</Typography>}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Box>
                        )}
                        {calendario.dia && edicionesDelDia.length === 0 && <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>No hay ediciones para este día.</Box>}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={handleCerrarCalendario} variant="contained" disableElevation sx={{ bgcolor: '#004680', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#003366' } }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}