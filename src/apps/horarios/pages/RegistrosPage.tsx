import { useState } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Tabs, Tab, Paper, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, Select, MenuItem, Chip, CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import GridViewIcon from '@mui/icons-material/GridView';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FilterListIcon from '@mui/icons-material/FilterList';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GavelIcon from '@mui/icons-material/Gavel';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import EmployeeCard from '../components/EmployeeCard';
import { useHorarios } from '../hooks/useHorarios';
import Historialpage from '../pages/HistorialPage';
import { Novedad } from '../interfaces/horarios.interface';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const filtrarPorFecha = (novedades: any[], filtro: string) => {
  if (filtro === 'todos') return novedades;
  const hoy = dayjs().startOf('day');
  return novedades.filter((n) => {
    if (!n.fecha) return false;
    const fecha = dayjs(n.fecha);
    switch (filtro) {
      case 'hoy':
        return fecha.isSame(hoy, 'day');
      case 'ayer':
        return fecha.isSame(hoy.subtract(1, 'day'), 'day');
      case '7dias':
        return fecha.isAfter(hoy.subtract(7, 'day'));
      case '30dias':
        return fecha.isAfter(hoy.subtract(30, 'day'));
      default:
        return true;
    }
  });
};

const getIconForTipo = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('descanso') || tipoLower === 'rest') return <FreeBreakfastIcon fontSize="small" sx={{ color: '#0284c7' }} />;
  if (tipoLower.includes('ausencia') || tipoLower === 'absence') return <BlockIcon fontSize="small" sx={{ color: '#475569' }} />;
  if (tipoLower.includes('calamidad') || tipoLower === 'calamity') return <WarningIcon fontSize="small" sx={{ color: '#dc2626' }} />;
  if (tipoLower.includes('capacitación') || tipoLower === 'training') return <SchoolIcon fontSize="small" sx={{ color: '#3b82f6' }} />;
  if (tipoLower.includes('familia') || tipoLower === 'family day') return <FamilyRestroomIcon fontSize="small" sx={{ color: '#8b5cf6' }} />;
  if (tipoLower.includes('incapacidad') || tipoLower === 'medical leave') return <HealthAndSafetyIcon fontSize="small" sx={{ color: '#16a34a' }} />;
  if (tipoLower.includes('permiso') || tipoLower === 'permission') return <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
  if (tipoLower.includes('retiro') || tipoLower === 'retirement') return <ExitToAppIcon fontSize="small" sx={{ color: '#6b7280' }} />;
  if (tipoLower.includes('suspensión') || tipoLower === 'suspension') return <GavelIcon fontSize="small" sx={{ color: '#991b1b' }} />;
  if (tipoLower.includes('vacaciones') || tipoLower === 'vacation') return <BeachAccessIcon fontSize="small" sx={{ color: '#0ea5e9' }} />;
  return null;
};

const getChipColor = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('descanso') || tipoLower === 'rest') return { bg: '#e0f2fe', text: '#0284c7' };
  if (tipoLower.includes('ausencia') || tipoLower === 'absence') return { bg: '#f1f5f9', text: '#475569' };
  if (tipoLower.includes('calamidad') || tipoLower === 'calamity') return { bg: '#fee2e2', text: '#dc2626' };
  if (tipoLower.includes('capacitación') || tipoLower === 'training') return { bg: '#dbeafe', text: '#3b82f6' };
  if (tipoLower.includes('familia') || tipoLower === 'family day') return { bg: '#ede9fe', text: '#8b5cf6' };
  if (tipoLower.includes('incapacidad') || tipoLower === 'medical leave') return { bg: '#dcfce7', text: '#16a34a' };
  if (tipoLower.includes('permiso') || tipoLower === 'permission') return { bg: '#fef3c7', text: '#f59e0b' };
  if (tipoLower.includes('retiro') || tipoLower === 'retirement') return { bg: '#f3f4f6', text: '#6b7280' };
  if (tipoLower.includes('suspensión') || tipoLower === 'suspension') return { bg: '#fecaca', text: '#991b1b' };
  if (tipoLower.includes('vacaciones') || tipoLower === 'vacation') return { bg: '#e0f2fe', text: '#0ea5e9' };
  return { bg: '#f8fafc', text: '#64748b' };
};

export default function RegistrosPage() {
  const {
    empleados,
    novedades,
    loading,
    error,
    registrarEvento,
    resetHorarios,
    eliminarEmpleado,
    guardarObservacion,
    agregarNovedad,
  } = useHorarios();

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;
  const [filtroFecha, setFiltroFecha] = useState('todos');

  const titulosTab = ['Registros de Asistencia', 'Registro de Novedades', 'Historial de Asistencia', 'Malla Horaria'];
  const subtitulosTab = [
    'Gestiona las marcaciones de asistencia del día',
    'Gestiona y revisa las incidencias de asistencia en tiempo real',
    'Consulta y verifica los registros históricos de la jornada laboral',
    'Visualiza la planificación de turnos y horarios'
  ];
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  const novedadesFiltradas = filtrarPorFecha(novedades, filtroFecha);
  const paginated = novedadesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(novedadesFiltradas.length / rowsPerPage));

  const filtros = [
    { value: 'todos', label: 'Mostrar Todo' },
    { value: 'hoy', label: 'Hoy' },
    { value: 'ayer', label: 'Ayer' },
    { value: '7dias', label: 'Últimos 7 días' },
    { value: '30dias', label: 'Últimos 30 días' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: 'transparent', px: { xs: 2, md: 4 }, pt: 4, pb: 4 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tarjeta de Tabs: mb: 3 (24px) iguala el respiro vertical con el resto de tarjetas */}
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f0e2e2ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mt: 2.5, mb: 3, bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, bgcolor: '#fff', p: { xs: 1.5, md: 2 }, borderBottom: '1px solid #eef2f6' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#004a99', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
              {titulosTab[tabValue]}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.2 }}>
              {subtitulosTab[tabValue]}
            </Typography>
          </Box>
          <Tooltip title="Reiniciar todos los registros">
            <IconButton onClick={resetHorarios} sx={{ bgcolor: '#004a99', color: '#fff', borderRadius: 2, width: 32, height: 32, '&:hover': { bgcolor: '#003366', transform: 'rotate(15deg)' } }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ px: { xs: 1, md: 2 }, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 1, minHeight: 40, color: '#64748b', '&.Mui-selected': { color: '#004a99' } }, '& .MuiTabs-indicator': { backgroundColor: '#004a99', height: 3 } }}>
          <Tab icon={<EventNoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="REGISTROS" />
          <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="NOVEDADES" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="HISTORIAL" />
          <Tab icon={<GridViewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="MALLA HORARIA" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {empleados.map((empleado) => (
            <EmployeeCard
              key={empleado.id}
              empleado={empleado}
              onRegistrarEvento={registrarEvento}
              onEliminarEmpleado={eliminarEmpleado}
              onGuardarObservacion={guardarObservacion}
              onAgregarNovedad={agregarNovedad}
            />
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6' }}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filtroFecha}
                onChange={(e) => { setFiltroFecha(e.target.value); setPage(0); }}
                startAdornment={<FilterListIcon sx={{ color: '#ffffff', fontSize: 16, mr: 0.5 }} />}
                sx={{ borderRadius: 2, bgcolor: '#004a99', color: '#ffffff', fontWeight: 500, fontSize: '0.8rem', '& .MuiSelect-icon': { color: '#ffffff' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover': { bgcolor: '#003366' }, height: 32 }}
              >
                {filtros.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f8fafd' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Tipo de Novedad</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Nota</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((novedad, idx) => {
                  const chipColors = getChipColor(novedad.tipo);
                  return (
                    <TableRow key={novedad.id} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                      <TableCell sx={{ py: 1 }}>{novedad.fecha}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#004a99', fontSize: '0.75rem' }}>
                            {novedad.empleadoNombre.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{novedad.empleadoNombre}</Typography>
                            {novedad.empleadoDocumento && (
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                CC: {novedad.empleadoDocumento}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getIconForTipo(novedad.tipo) || undefined}
                          label={novedad.tipo}
                          size="small"
                          sx={{ bgcolor: chipColors.bg, color: chipColors.text, fontWeight: 600, fontSize: '0.7rem', '& .MuiChip-icon': { color: chipColors.text, ml: 0.5 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.8rem' }}>
                          {novedad.description || '— Sin descripción —'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.8rem' }}>
                          {novedad.notes || '— Sin notas —'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {novedadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="#94a3b8">No hay novedades registradas con este filtro</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1.5, px: 2, bgcolor: '#f8fafc', borderTop: '1px solid #eef2f6' }}>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Box onClick={() => setPage(p => Math.max(p - 1, 0))} sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.8rem', userSelect: 'none', opacity: page === 0 ? 0.5 : 1, pointerEvents: page === 0 ? 'none' : 'auto', '&:hover': { bgcolor: '#f1f5f9' } }}>‹</Box>
              {[...Array(totalPages)].map((_, i) => (
                <Box key={i} onClick={() => setPage(i)} sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, cursor: 'pointer', bgcolor: page === i ? '#004a99' : '#ffffff', color: page === i ? '#ffffff' : '#004a99', border: page === i ? '1px solid #004a99' : '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.8rem', userSelect: 'none', '&:hover': { bgcolor: page === i ? '#004a99' : '#f1f5f9' } }}>{i + 1}</Box>
              ))}
              <Box onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.8rem', userSelect: 'none', opacity: page === totalPages - 1 ? 0.5 : 1, pointerEvents: page === totalPages - 1 ? 'none' : 'auto', '&:hover': { bgcolor: '#f1f5f9' } }}>›</Box>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Historialpage />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="h6" color="#64748b">Malla Horaria</Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}