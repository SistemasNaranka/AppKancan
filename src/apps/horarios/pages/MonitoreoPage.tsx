import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, Pagination,
    TextField, InputAdornment,
} from '@mui/material';
import {
    Storefront as StorefrontIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

// ===== IMPORTS =====
import { getStores, getEmpleados, getTimeRecords } from '../api/directus/read';
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

        try {
            const dataResumen = await Promise.all(
                tiendas.map(async (tienda) => {
                    const empleadosTienda = await getEmpleados(tienda.id);
                    const recordsTienda = await getTimeRecords(tienda.id, hoy);

                    let completados = 0;
                    empleadosTienda.forEach((emp) => {
                        const registrosDelEmpleado = recordsTienda.filter(
                            (r: any) => Number(r.employee_id?.id || r.employee_id) === Number(emp.id)
                        );
                        const tieneEntrada = registrosDelEmpleado.some((r: any) => r.log_type === 'Comenzar Jornada');
                        const tieneSalida = registrosDelEmpleado.some((r: any) => r.log_type === 'Terminar Jornada');
                        if (tieneEntrada && tieneSalida) completados++;
                    });

                    return {
                        id: tienda.id,
                        nombre: tienda.name,
                        totalEmpleados: empleadosTienda.length,
                        completados,
                        pendientes: empleadosTienda.length - completados,
                    };
                })
            );
            setResumenTiendas(dataResumen);
        } catch (error) {
            setErrorResumen('Error al cargar los datos. Intenta nuevamente.');
        } finally {
            setCargandoResumen(false);
        }
    };

    useEffect(() => {
        cargarResumenGlobal();
    }, [tiendas]);

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
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={cargarResumenGlobal}
                            disabled={cargandoResumen}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            {cargandoResumen ? 'Cargando...' : 'Refrescar'}
                        </Button>
                    </Box>
                </Paper>

                {/* Tabla de tiendas con paginación dentro */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '30%' }}>TIENDA</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">EMPLEADOS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">COMPLETADOS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '15%' }} align="center">PENDIENTES</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#546e7a', width: '25%' }} align="center">ACCIONES</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tiendasPagina.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                                onChange={(e, p) => setPaginaTiendas(p - 1)}
                                color="primary"
                                shape="rounded"
                                size="small"
                            />
                        )}
                    </Box>
                </TableContainer>

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