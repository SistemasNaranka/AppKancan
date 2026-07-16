import { useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Pagination, TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
    IconButton as MuiIconButton, Avatar, Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    CalendarMonth as CalendarMonthIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as AccessTimeIcon,
    History as HistoryIcon,
    Refresh as RefreshIcon,
    Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { getTimeRecords, getNovedades, fetchTimeRecords } from '../api/directus/read';
import { useHorarios } from '../hooks/useHorarios';

import {
    EmpleadoFila,
    getNovedadIcon,
    calcularMinutosDia,
    formatearHoras,
    calcularHorasSemana,
} from './ModalDetalleTiendaUtils';

import NovedadDetalleModal from './NovedadDetalleModal';
import HistorialHorasModal from './HistorialHorasModal';
import CalendarioMensualTienda from './CalendarioMensualTienda';

// ============================================================
//  COMPONENTE PRINCIPAL (CON BOTÓN DE LIMPIEZA Y SIN BORDE AZUL)
// ========================================================================
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
        queryFn: () => fetchTimeRecords(fechaSeleccionada, fechaSeleccionada, tiendaId),
        enabled: !!tiendaId,
        staleTime: 5 * 60 * 1000,
    });

    const hoy = dayjs(fechaSeleccionada);
    const diaSemana = hoy.day();
    const lunes = hoy.subtract((diaSemana + 6) % 7, 'day');
    const { data: weekRecords = [] } = useQuery({
        queryKey: ['weekRecords', tiendaId, lunes.format('YYYY-MM-DD')],
        queryFn: () => fetchTimeRecords(
            lunes.format('YYYY-MM-DD'),
            lunes.add(4, 'day').format('YYYY-MM-DD'),
            tiendaId
        ),
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
        return record ? (record.record_time || '').substring(0, 5) : null;
    };

    const getNovedadEmpleado = (empId: string | number) => {
        const novedad = novedadesDia.find(n => Number(n.employee_id?.id || n.employee_id) === Number(empId));
        return novedad ? { tiene: true, tipo: novedad.newness_id?.name || 'Novedad', observacion: novedad.observations || 'Sin observación', id: novedad.id } : null;
    };

    // Construir la unión de empleados para la fecha seleccionada
    const empleadosMap = new Map<string, { id: string | number; nombre: string; documento: string; cargo: string }>();

    // 1. Empleados actualmente asignados a la tienda
    empleados.forEach((emp: any) => {
        empleadosMap.set(String(emp.id), {
            id: emp.id,
            nombre: emp.nombre,
            documento: emp.documento || '--',
            cargo: emp.cargo || 'Sin cargo',
        });
    });

    // 2. Empleados históricos con marcas registradas este día
    recordsDia.forEach((rec: any) => {
        const empId = rec.employee_id?.id;
        if (empId && !empleadosMap.has(String(empId))) {
            const parts = [
                rec.employee_id.first_name,
                rec.employee_id.middle_name,
                rec.employee_id.last_name,
                rec.employee_id.second_last_name
            ].filter(part => part && part.trim() !== "");
            const fullName = parts.join(" ").trim() || "Empleado Sin Nombre";
            empleadosMap.set(String(empId), {
                id: empId,
                nombre: fullName,
                documento: rec.employee_id.document_number || '--',
                cargo: 'Sin cargo',
            });
        }
    });

    // 3. Empleados históricos con novedades este día
    novedadesDia.forEach((nov: any) => {
        const empId = nov.employee_id?.id;
        if (empId && !empleadosMap.has(String(empId))) {
            const parts = [
                nov.employee_id.first_name,
                nov.employee_id.middle_name,
                nov.employee_id.last_name,
                nov.employee_id.second_last_name
            ].filter(part => part && part.trim() !== "");
            const fullName = parts.join(" ").trim() || "Empleado Sin Nombre";
            empleadosMap.set(String(empId), {
                id: empId,
                nombre: fullName,
                documento: '--',
                cargo: 'Sin cargo',
            });
        }
    });

    const filasEmpleados: EmpleadoFila[] = Array.from(empleadosMap.values()).map((emp) => {
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
            id: String(emp.id), nombre: emp.nombre, documento: emp.documento, cargo: emp.cargo,
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
        <Dialog 
            open 
            onClose={onClose} 
            maxWidth="xl" 
            fullWidth 
            PaperProps={{ 
                sx: { 
                    borderRadius: 3, 
                    overflow: 'hidden',
                    height: '90vh',
                    maxHeight: '90vh'
                } 
            }}
        >
            <DialogTitle component="div" sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3 }}>
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
                        todasNovedades={todasNovedades}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0a1929">
                            Registros del {fechaDisplay}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                size="medium"
                                icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                                label={`${dayjs(fechaSeleccionada).format('DD/MM/YYYY')}`}
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
                                                     {(() => {
                                                         let labelEstado = 'Sin Registro';
                                                         let colorEstado = '#757575';
                                                         let bgEstado = '#f5f5f5';

                                                         if (fila.tieneNovedad) {
                                                             labelEstado = 'No Aplica';
                                                             colorEstado = '#0d47a1';
                                                             bgEstado = '#e3f2fd';
                                                         } else if (fila.estado === 'jornada_finalizada') {
                                                             labelEstado = 'Finalizado';
                                                             colorEstado = '#2e7d32';
                                                             bgEstado = '#e8f5e9';
                                                         } else if (fila.estado === 'Pendiente') {
                                                             labelEstado = 'Sin Registro';
                                                             colorEstado = '#757575';
                                                             bgEstado = '#f5f5f5';
                                                         } else {
                                                             labelEstado = 'En curso';
                                                             colorEstado = '#856404';
                                                             bgEstado = '#fff3cd';
                                                         }

                                                         return (
                                                             <Chip
                                                                 size="small"
                                                                 label={labelEstado}
                                                                 sx={{
                                                                     bgcolor: bgEstado,
                                                                     color: colorEstado,
                                                                     fontWeight: 700,
                                                                     fontSize: '0.7rem'
                                                                 }}
                                                             />
                                                         );
                                                     })()}
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