import { useState, useEffect, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Pagination,
    Tabs, Tab, Grid, TextField, InputAdornment
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
    Search as SearchIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

// ===== IMPORTS =====
import { getStores, getEmpleadosBulk, getTimeRecordsBulkRange, getNovedadesBulkRange, getEditedTimeRecords } from '../api/directus/read';
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';
import { Tienda } from '../interfaces/horarios.interface';
import ModalDetalleTienda from '../components/ModalDetalleTienda';

// ============================================================
//  TIPOS
// ============================================================
interface TiendaResumen {
    id: number;
    nombre: string;
    totalEmpleados: number;
    personasRegistradas: number;
    completados: number;
    pendientes: number;
}

interface MonitoreoPageProps {
    storeId?: number | null;
}

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
export default function MonitoreoGeneralPage({ storeId }: MonitoreoPageProps) {
    const { esAdmin, esReport } = useHorariosPolicies();

    const [subTab, setSubTab] = useState(0); // 0 = Asistencia, 1 = Auditoría Ediciones

    // Estados para Auditoría de Ediciones
    const [fechaInicio, setFechaInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState(dayjs().format('YYYY-MM-DD'));
    const [buscarEmpleado, setBuscarEmpleado] = useState('');
    const [paginaEdiciones, setPaginaEdiciones] = useState(0);
    const rowsPerPageEdiciones = 10;

    const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | null>(null);
    const [paginaTiendas, setPaginaTiendas] = useState(0);
    const rowsPerPageTiendas = 10;

    // Obtener tiendas
    const { data: todasLasTiendas = [], isLoading: cargandoTiendas } = useQuery<Tienda[]>({
        queryKey: ['adminTiendas'],
        queryFn: getStores,
        enabled: esAdmin() || esReport(),
        staleTime: 30 * 60 * 1000,
    });

    const { data: editedRecords = [], isLoading: cargandoEdiciones } = useQuery({
        queryKey: ['editedRecords', storeId, fechaInicio, fechaFin, todasLasTiendas],
        queryFn: () => {
            const storeIds = storeId ? [storeId] : todasLasTiendas.map(t => t.id);
            return getEditedTimeRecords(storeIds, fechaInicio, fechaFin);
        },
        enabled: !cargandoTiendas && (esAdmin() || esReport()),
        staleTime: 5 * 60 * 1000,
    });

    const statsEdiciones = useMemo(() => {
        const uniqueEmployees = new Set(editedRecords.map(r => r.empleadoId));
        const storeCounts: Record<string, number> = {};
        editedRecords.forEach(r => {
            storeCounts[r.tiendaNombre] = (storeCounts[r.tiendaNombre] || 0) + 1;
        });
        let topStore = 'Ninguna';
        let maxCount = 0;
        Object.entries(storeCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topStore = `${name} (${count})`;
            }
        });
        return {
            total: editedRecords.length,
            empleados: uniqueEmployees.size,
            topStore
        };
    }, [editedRecords]);

    const edicionesFiltradas = useMemo(() => {
        return editedRecords.filter(r =>
            r.empleadoNombre.toLowerCase().includes(buscarEmpleado.toLowerCase())
        );
    }, [editedRecords, buscarEmpleado]);

    const edicionesPagina = useMemo(() => {
        const start = paginaEdiciones * rowsPerPageEdiciones;
        return edicionesFiltradas.slice(start, start + rowsPerPageEdiciones);
    }, [edicionesFiltradas, paginaEdiciones]);

    useEffect(() => {
        setPaginaEdiciones(0);
    }, [buscarEmpleado, fechaInicio, fechaFin]);

    const tiendas = useMemo(() => {
        if (storeId) {
            return todasLasTiendas.filter(t => t.id === storeId);
        }
        return todasLasTiendas;
    }, [todasLasTiendas, storeId]);

    const [resumenTiendas, setResumenTiendas] = useState<TiendaResumen[]>([]);
    const [cargandoResumen, setCargandoResumen] = useState(false);
    const [errorResumen, setErrorResumen] = useState<string | null>(null);

    const cargarResumenGlobal = async () => {
        if (tiendas.length === 0) {
            setResumenTiendas([]);
            return;
        }
        setCargandoResumen(true);
        setErrorResumen(null);
        const hoy = dayjs().format('YYYY-MM-DD');
        const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');

        try {
            const storeIds = tiendas.map(t => t.id);
            const [todosLosEmpleados, todosLosRecords, todasLasNovedades] = await Promise.all([
                getEmpleadosBulk(storeIds),
                getTimeRecordsBulkRange(storeIds, inicioMes, hoy),
                getNovedadesBulkRange(storeIds, inicioMes, hoy)
            ]);

            // Agrupar empleados por storeId
            const empleadosPorTienda: Record<number, any[]> = {};
            todosLosEmpleados.forEach((emp: any) => {
                const sId = emp.storeId;
                if (sId != null) {
                    (empleadosPorTienda[sId] ||= []).push(emp);
                }
            });

            // Agrupar registros de tiempo por store_id
            const recordsPorTienda: Record<number, any[]> = {};
            todosLosRecords.forEach((rec: any) => {
                const sId = rec.store_id ? Number(typeof rec.store_id === 'object' ? rec.store_id.id : rec.store_id) : null;
                if (sId != null) {
                    (recordsPorTienda[sId] ||= []).push(rec);
                }
            });

            // Agrupar novedades por store_id
            const novedadesPorTienda: Record<number, any[]> = {};
            todasLasNovedades.forEach((nov: any) => {
                const sId = nov.store_id ? Number(typeof nov.store_id === 'object' ? nov.store_id.id : nov.store_id) : null;
                if (sId != null) {
                    (novedadesPorTienda[sId] ||= []).push(nov);
                }
            });

            // Generar lista de fechas del mes actual hasta el día de hoy
            const diasMes: string[] = [];
            let cursor = dayjs().startOf('month');
            const hoyDayjs = dayjs();
            while (cursor.isSameOrBefore(hoyDayjs, 'day')) {
                diasMes.push(cursor.format('YYYY-MM-DD'));
                cursor = cursor.add(1, 'day');
            }

            const dataResumen = tiendas.map((tienda) => {
                const empleadosTienda = empleadosPorTienda[tienda.id] || [];
                const recordsTienda = recordsPorTienda[tienda.id] || [];
                const novedadesTienda = novedadesPorTienda[tienda.id] || [];

                // 1. Empleados asignados actualmente
                const totalEmpleados = empleadosTienda.length;

                // 2. Personas que registraron marcas o novedades en el mes (historial)
                const employeeIdsMonth = new Set<number>();
                empleadosTienda.forEach(emp => employeeIdsMonth.add(Number(emp.id)));
                recordsTienda.forEach(r => {
                    const empId = r.employee_id?.id || r.employee_id;
                    if (empId) employeeIdsMonth.add(Number(empId));
                });
                novedadesTienda.forEach(n => {
                    const empId = n.employee_id?.id || n.employee_id;
                    if (empId) employeeIdsMonth.add(Number(empId));
                });
                const personasRegistradas = employeeIdsMonth.size;

                // 3. Completados Hoy
                const recordsHoy = recordsTienda.filter(r => r.record_date === hoy);
                const employeeIdsToday = Array.from(new Set(recordsHoy.map((r: any) => Number(r.employee_id?.id || r.employee_id))));
                let completados = 0;
                employeeIdsToday.forEach(empId => {
                    const registrosDelEmpleado = recordsHoy.filter(
                        (r: any) => Number(r.employee_id?.id || r.employee_id) === empId
                    );
                    const tieneEntrada = registrosDelEmpleado.some((r: any) => r.log_type === 'Comenzar Jornada');
                    const tieneSalida = registrosDelEmpleado.some((r: any) => r.log_type === 'Terminar Jornada');
                    if (tieneEntrada && tieneSalida) completados++;
                });

                // 4. Días pendientes (días sin marcas ni novedades)
                const fechasConActividad = new Set<string>();
                recordsTienda.forEach(r => fechasConActividad.add(r.record_date));
                novedadesTienda.forEach(n => {
                    if (n.report_date) fechasConActividad.add(n.report_date);
                });
                const pendientes = diasMes.filter(d => !fechasConActividad.has(d)).length;

                return {
                    id: tienda.id,
                    nombre: tienda.name,
                    totalEmpleados,
                    personasRegistradas,
                    completados,
                    pendientes,
                };
            });

            setResumenTiendas(dataResumen);
        } catch (error) {
            console.error('Error al cargar resumen global:', error);
            setErrorResumen('Error al cargar los datos. Intenta nuevamente.');
        } finally {
            setCargandoResumen(false);
        }
    };

    useEffect(() => {
        if (!cargandoTiendas) {
            cargarResumenGlobal();
        }
    }, [tiendas, cargandoTiendas]);



    const tiendasPagina = useMemo(() => {
        const start = paginaTiendas * rowsPerPageTiendas;
        return resumenTiendas.slice(start, start + rowsPerPageTiendas);
    }, [resumenTiendas, paginaTiendas]);

    const totalTiendas = tiendas.length;
    const totalEmpleados = resumenTiendas.reduce((acc, t) => acc + t.totalEmpleados, 0);
    const totalCompletados = resumenTiendas.reduce((acc, t) => acc + t.completados, 0);
    const totalPendientes = resumenTiendas.reduce((acc, t) => acc + t.pendientes, 0);

    if (cargandoTiendas || (cargandoResumen && resumenTiendas.length === 0)) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={40} sx={{ color: '#004680' }} />
                <Typography color="text.secondary" fontWeight={600}>Cargando métricas...</Typography>
            </Box>
        );
    }

    if (errorResumen) {
        return (
            <Container>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={cargarResumenGlobal}>
                        Reintentar
                    </Button>
                }>
                    {errorResumen}
                </Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ backgroundColor: 'transparent', py: 2 }}>
            <Container maxWidth="xl" disableGutters>

                {/* Sub-pestañas de navegación */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} textColor="primary" indicatorColor="primary">
                        <Tab label="Resumen de Asistencia" sx={{ fontWeight: 700, textTransform: 'none' }} />
                        <Tab label="Auditoría de Ediciones Manuales" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    </Tabs>
                </Box>

                {subTab === 0 ? (
                    <>
                        {/* Estadísticas */}
                        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StorefrontIcon sx={{ color: '#004680' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>TIENDAS</Typography>
                                    <Typography variant="h6" fontWeight={700} color="#0a1929">{totalTiendas}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ color: '#004680' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>EMPLEADOS</Typography>
                                    <Typography variant="h6" fontWeight={700} color="#0a1929">{totalEmpleados}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>COMPLETADOS</Typography>
                                    <Typography variant="h6" fontWeight={700} color="#2e7d32">{totalCompletados}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PendingIcon sx={{ color: '#d32f2f' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>PENDIENTES</Typography>
                                    <Typography variant="h6" fontWeight={700} color="#d32f2f">{totalPendientes}</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Tabla de tiendas con paginación dentro */}
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Table size="medium">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '25%' }}>TIENDA</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">EMPLEADOS ACT.</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">PERS. REGISTRADAS</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">COMPLETADOS HOY</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">DÍAS PENDIENTES</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">ACCIONES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tiendasPagina.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No hay tiendas disponibles
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tiendasPagina.map((tienda) => (
                                            <TableRow key={tienda.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <StorefrontIcon sx={{ color: '#004680' }} />
                                                        <Typography fontWeight={600} color="#0a1929">
                                                            {tienda.nombre}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip size="small" label={tienda.totalEmpleados} sx={{ bgcolor: '#e3f2fd', color: '#0a1929', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip size="small" label={tienda.personasRegistradas} sx={{ bgcolor: '#ede7f6', color: '#5e35b1', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip size="small" label={tienda.completados} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip size="small" label={tienda.pendientes} sx={{ bgcolor: '#fbe9e7', color: '#d32f2f', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => setTiendaSeleccionada(tienda.id)}
                                                        sx={{ bgcolor: '#004680', '&:hover': { bgcolor: '#003a6b' }, textTransform: 'none', borderRadius: 2 }}
                                                    >
                                                        Ver empleados
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Paginación dentro de la tabla */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Mostrando {tiendasPagina.length} de {resumenTiendas.length} tiendas
                                </Typography>
                                {resumenTiendas.length > rowsPerPageTiendas && (
                                    <Pagination
                                        count={Math.ceil(resumenTiendas.length / rowsPerPageTiendas)}
                                        page={paginaTiendas + 1}
                                        onChange={(_, p) => setPaginaTiendas(p - 1)}
                                        color="primary"
                                        shape="rounded"
                                        size="small"
                                    />
                                )}
                            </Box>
                        </TableContainer>
                    </>
                ) : (
                    <>
                        {/* KPIs de Auditoría */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ bgcolor: '#ffebee', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <EditNoteIcon sx={{ color: '#c62828', fontSize: 28 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>TOTAL MODIFICACIONES</Typography>
                                        <Typography variant="h5" fontWeight={700} color="#c62828">{statsEdiciones.total}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <SupervisorAccountIcon sx={{ color: '#0d47a1', fontSize: 28 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>EMPLEADOS MONITOREADOS</Typography>
                                        <Typography variant="h5" fontWeight={700} color="#0d47a1">{statsEdiciones.empleados}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ bgcolor: '#fff8e1', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <WarningIcon sx={{ color: '#f57f17', fontSize: 28 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, width: '100%' }}>
                                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>TIENDA CON MÁS CAMBIOS</Typography>
                                        <Typography variant="h6" fontWeight={700} color="#f57f17" noWrap title={statsEdiciones.topStore}>{statsEdiciones.topStore}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Filtros de Auditoría */}
                        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                label="Fecha Inicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{ width: 180 }}
                            />
                            <TextField
                                label="Fecha Fin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{ width: 180 }}
                            />
                            <TextField
                                label="Buscar Empleado"
                                placeholder="Nombre del empleado..."
                                value={buscarEmpleado}
                                onChange={(e) => setBuscarEmpleado(e.target.value)}
                                size="small"
                                sx={{ flexGrow: 1, minWidth: 200 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Paper>

                        {/* Tabla de Auditoría */}
                        {cargandoEdiciones ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#004680' }} /></Box>
                        ) : (
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                                <Table size="medium">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '12%' }}>FECHA</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '18%' }}>EMPLEADO</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }}>TIENDA</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '12%' }}>REGISTRO</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '10%' }} align="center">HORA ORIG.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '10%' }} align="center">HORA MOD.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '13%' }}>MOTIVO</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '10%' }}>OBSERVACIONES</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {edicionesPagina.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No se encontraron marcaciones modificadas en este período
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            edicionesPagina.map((r) => (
                                                <TableRow key={r.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} color="#0a1929">
                                                            {r.fecha}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} color="#0a1929">
                                                            {r.empleadoNombre}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <StorefrontIcon fontSize="small" sx={{ color: '#64748b' }} />
                                                            <Typography variant="body2" color="#0a1929">
                                                                {r.tiendaNombre}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="small" label={r.tipoRegistro} sx={{ bgcolor: '#f0f4f8', color: '#004680', fontWeight: 600 }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                            {r.horaOriginal ? r.horaOriginal.substring(0, 5) : '--:--'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={700} color="#c62828">
                                                            {r.horaModificada ? r.horaModificada.substring(0, 5) : '--:--'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="small" label={r.motivo} sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }} title={r.observaciones}>
                                                            {r.observaciones || 'Sin comentarios'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Paginación */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderTop: '1px solid #e0e0e0', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Mostrando {edicionesPagina.length} de {edicionesFiltradas.length} modificaciones
                                    </Typography>
                                    {edicionesFiltradas.length > rowsPerPageEdiciones && (
                                        <Pagination
                                            count={Math.ceil(edicionesFiltradas.length / rowsPerPageEdiciones)}
                                            page={paginaEdiciones + 1}
                                            onChange={(_, p) => setPaginaEdiciones(p - 1)}
                                            color="primary"
                                            shape="rounded"
                                            size="small"
                                        />
                                    )}
                                </Box>
                            </TableContainer>
                        )}
                    </>
                )}

                {/* Modal de detalle */}
                {tiendaSeleccionada && (
                    <ModalDetalleTienda
                        tiendaId={tiendaSeleccionada}
                        tiendaNombre={tiendas.find(t => t.id === tiendaSeleccionada)?.name || 'Detalle de Tienda'}
                        onClose={() => setTiendaSeleccionada(null)}
                    />
                )}

            </Container>
        </Box>
    );
}