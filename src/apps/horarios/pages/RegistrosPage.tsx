import { useState } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Tabs, Tab, Paper, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert,
  TextField, InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import GridViewIcon from '@mui/icons-material/GridView';
import EventNoteIcon from '@mui/icons-material/EventNote';
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
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EmployeeCard from '../components/EmployeeCard';
import { useHorarios } from '../hooks/useHorarios';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');
import HistorialPage from '../pages/HistorialPage';

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

const getIconForTipo = (tipo: any) => {
  const tipoLower = String(tipo || '').toLowerCase();
  if (tipoLower.includes('descanso')) return <FreeBreakfastIcon fontSize="small" sx={{ color: '#0284c7' }} />;
  if (tipoLower.includes('ausencia')) return <BlockIcon fontSize="small" sx={{ color: '#475569' }} />;
  if (tipoLower.includes('calamidad')) return <WarningIcon fontSize="small" sx={{ color: '#dc2626' }} />;
  if (tipoLower.includes('capacitaci')) return <SchoolIcon fontSize="small" sx={{ color: '#3b82f6' }} />;
  if (tipoLower.includes('familia')) return <FamilyRestroomIcon fontSize="small" sx={{ color: '#8b5cf6' }} />;
  if (tipoLower.includes('incapacidad')) return <HealthAndSafetyIcon fontSize="small" sx={{ color: '#16a34a' }} />;
  if (tipoLower.includes('permiso')) return <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
  if (tipoLower.includes('retiro')) return <ExitToAppIcon fontSize="small" sx={{ color: '#6b7280' }} />;
  if (tipoLower.includes('suspensi')) return <GavelIcon fontSize="small" sx={{ color: '#991b1b' }} />;
  if (tipoLower.includes('vacaciones')) return <BeachAccessIcon fontSize="small" sx={{ color: '#0ea5e9' }} />;
  return <AssignmentIcon fontSize="small" sx={{ color: '#64748b' }} />;
};

const getChipColor = (tipo: any) => {
  const tipoLower = String(tipo || '').toLowerCase();
  if (tipoLower.includes('descanso')) return { bg: '#e0f2fe', text: '#0284c7' };
  if (tipoLower.includes('ausencia')) return { bg: '#f1f5f9', text: '#475569' };
  if (tipoLower.includes('calamidad')) return { bg: '#fee2e2', text: '#dc2626' };
  if (tipoLower.includes('capacitaci')) return { bg: '#dbeafe', text: '#3b82f6' };
  if (tipoLower.includes('familia')) return { bg: '#ede9fe', text: '#8b5cf6' };
  if (tipoLower.includes('incapacidad')) return { bg: '#dcfce7', text: '#16a34a' };
  if (tipoLower.includes('permiso')) return { bg: '#fef3c7', text: '#f59e0b' };
  if (tipoLower.includes('retiro')) return { bg: '#f3f4f6', text: '#6b7280' };
  if (tipoLower.includes('suspensi')) return { bg: '#fecaca', text: '#991b1b' };
  if (tipoLower.includes('vacaciones')) return { bg: '#e0f2fe', text: '#0ea5e9' };
  return { bg: '#f8fafc', text: '#64748b' };
};

export default function RegistrosPage() {
  const {
    empleados, novedades, tiposNovedad, loading, error,
    registrarEvento, resetHorarios, eliminarEmpleado,
    guardarObservacion, agregarNovedad,
  } = useHorarios();

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState<Dayjs | null>(null);

  const titulosTab = ['Registros de Asistencia', 'Registro de Novedades', 'Historial de Asistencia', 'Malla Horaria'];
  const subtitulosTab = [
    'Gestiona las marcaciones de asistencia del día',
    'Gestiona y revisa las incidencias de asistencia en tiempo real',
    'Consulta y verifica los registros históricos de la jornada laboral',
    'Visualiza la planificación de turnos y horarios'
  ];
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  const novedadesFiltradas = novedades.filter((n: any) => {
    const matchNombre = (n.empleadoNombre || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFecha = fechaFiltro
      ? dayjs(n.fecha).isSame(fechaFiltro, 'day')
      : true;
    return matchNombre && matchFecha;
  });

  const paginated = novedadesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(novedadesFiltradas.length / rowsPerPage));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={50} sx={{ color: '#004a99' }} />
        <Typography color="#64748b" fontWeight={600}>Cargando datos del servidor...</Typography>
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
              tiposNovedad={tiposNovedad || []}
              onRegistrarEvento={registrarEvento}
              onEliminarEmpleado={eliminarEmpleado}
              onGuardarObservacion={guardarObservacion}
              onAgregarNovedad={agregarNovedad}
            />
          ))}
          {empleados.length === 0 && (
            <Typography variant="body1" sx={{ color: '#64748b', mt: 4 }}>
              No hay empleados pendientes por gestionar.
            </Typography>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6' }}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#004a99', fontSize: '1rem' }}>
                Registro de Novedades
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Gestiona y revisa las incidencias de asistencia en tiempo real.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* Buscador por nombre */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Nombre del Empleado
                </Typography>
                <TextField
                  size="small"
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <PersonSearchIcon sx={{ color: '#000000' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 220,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2, bgcolor: '#eef4fd', height: 36,
                      '& fieldset': { borderColor: '#cbd5e1' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused fieldset': { borderColor: '#004a99' },
                    },
                    '& .MuiOutlinedInput-input': { fontSize: '0.85rem', color: '#475569' }
                  }}
                />
              </Box>

              {/* Filtro por día concreto */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Filtrar por Fecha
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label=""
                    format="DD/MM/YYYY"
                    value={fechaFiltro}
                    onChange={(newVal) => { setFechaFiltro(newVal ? dayjs(newVal) : null); setPage(0); }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        placeholder: 'DD/MM/YYYY',
                        sx: {
                          width: 160,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2, bgcolor: '#eef4fd', height: 36,
                            '& fieldset': { borderColor: '#cbd5e1' },
                            '&:hover fieldset': { borderColor: '#94a3b8' },
                            '&.Mui-focused fieldset': { borderColor: '#004a99' },
                          },
                          '& .MuiOutlinedInput-input': { fontSize: '0.85rem', color: '#475569' }
                        }
                      },
                      // Botón para limpiar la fecha
                      field: { clearable: true, onClear: () => { setFechaFiltro(null); setPage(0); } },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f8fafd' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Tipo de Novedad</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1 }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((novedad: any, idx: number) => {
                  const chipColors = getChipColor(novedad.tipo);
                  const nombreEmpleado = novedad.empleadoNombre || 'Empleado';
                  const inicial = nombreEmpleado.charAt(0).toUpperCase();
                  return (
                    <TableRow key={novedad.id || idx} hover sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                      <TableCell>{novedad.fecha ? dayjs(novedad.fecha).format('DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#004a99', fontSize: '0.75rem' }}>
                            {inicial}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{nombreEmpleado}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getIconForTipo(novedad.tipo)}
                          label={novedad.tipo || 'Sin tipo'}
                          size="small"
                          sx={{ bgcolor: chipColors.bg, color: chipColors.text, fontWeight: 600 }}
                        />
                      </TableCell>
                      {/* CAMBIO: '—' en lugar de '— Sin observaciones —' */}
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {novedad.observaciones || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {novedadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="#94a3b8">No hay novedades registradas con este filtro o búsqueda</Typography>
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
        <HistorialPage />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="h6" color="#64748b">Malla Horaria</Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}