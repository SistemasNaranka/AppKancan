import { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Tabs, Tab, Paper, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert,
  TextField, InputAdornment, Button, Autocomplete
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getStores, getStoreIdUsuarioActual } from '../api/directus/read';
import { Tienda } from '../interfaces/horarios.interface';
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
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EmployeeCard from '../components/EmployeeCard';
import { useHorarios } from '../hooks/useHorarios';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');
import HistorialPage from '../pages/HistorialPage';
import { HorariosTourProvider, useHorariosTour, HorariosTab } from '../components/tour/HorariosTourContext';
import { HorariosTour } from '../components/tour/HorariosTour';
import TutorialButton from '../components/tour/TutorialButton';
import { useTutorial } from '@/shared/hooks/TutorialContext';
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';
import AdminEmpleadosPage from './AdminEmpleadosPage';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '@/auth/hooks/useAuth';


const MALLA_HORARIA_HABILITADA = false;

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

const AVATAR_COLORS = [
  '#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777',
  '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669',
  '#2563eb', '#9333ea',
];

const getAvatarColor = (texto: string) => {
  const str = String(texto || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function RegistrosPageContent() {
  const { user } = useAuth();
  const { esAdmin } = useHorariosPolicies();

  // Tienda activa compartida entre la vista de tienda y el panel admin
  // (null al inicio; se fija a la tienda del propio admin al resolverla).
  const [storeOverride, setStoreOverride] = useState<number | null>(null);
  const { data: tiendasAdmin = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    enabled: esAdmin(),
    staleTime: 30 * 60 * 1000,
  });
  const { data: miTienda = null } = useQuery<number | null>({
    queryKey: ['horariosStoreId'],
    queryFn: getStoreIdUsuarioActual,
    enabled: esAdmin(),
    staleTime: 30 * 60 * 1000,
  });
  useEffect(() => {
    if (storeOverride == null && miTienda != null) setStoreOverride(miTienda);
  }, [miTienda, storeOverride]);

  const {
    empleados, novedades, tiposNovedad, reasons, loading, error,
    registrarEvento, resetHorarios, eliminarEmpleado,
    guardarObservacion, agregarNovedad,
  } = useHorarios(storeOverride);

  const { setTabChangeCallback, startFullTour } = useHorariosTour();
  const { activeTutorial, endTutorial } = useTutorial();
  const [tabValue, setTabValue] = useState(0);
  const [vistaAdmin, setVistaAdmin] = useState(false);

  useEffect(() => {
    setTabChangeCallback((tab: HorariosTab) => setTabValue(tab));
  }, [setTabChangeCallback]);

  // Arranca el tour cuando se dispara desde el PeekButton (menú global de tutoriales).
  // Se espera a que la carga termine para que los elementos del tour (.tour-tabs,
  // tarjetas, etc.) ya estén montados en el DOM antes de iniciar Joyride.
  useEffect(() => {
    if (activeTutorial === 'horarios' && !loading) {
      const t = setTimeout(() => {
        startFullTour();
        endTutorial();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [activeTutorial, loading, startFullTour, endTutorial]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const [searchQuery, setSearchQuery] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState<Dayjs | null>(null);

  const subtitulosTab = [
    'Gestiona las marcaciones de asistencia del día',
    'Gestiona y revisa las incidencias de asistencia en tiempo real',
    'Consulta y verifica los registros históricos de la jornada laboral',
    'Visualiza la planificación de turnos y horarios'
  ];
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number | 'admin') => {
    if (newValue === 'admin') {
      setVistaAdmin(true);
      return;
    }
    setVistaAdmin(false);
    setTabValue(newValue);
  };

  const novedadesFiltradas = novedades.filter((n: any) => {
    const matchNombre = (n.empleadoNombre || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFecha = fechaFiltro ? dayjs(n.fecha).isSame(fechaFiltro, 'day') : true;
    return matchNombre && matchFecha;
  });

  const paginated = novedadesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(novedadesFiltradas.length / rowsPerPage));

  const getTituloPrincipal = () => {
    switch (tabValue) {
      case 0: return 'Panel de Asistencia';
      case 1: return 'Registro de Novedades';
      case 2: return 'Historial';
      case 3: return 'Malla Horaria';
      default: return 'Panel de Asistencia';
    }
  };

  const getIconoPrincipal = () => {
    const iconSx = { fontSize: 26 };
    switch (tabValue) {
      case 0: return <EventNoteIcon sx={iconSx} />;
      case 1: return <AssignmentIcon sx={iconSx} />;
      case 2: return <HistoryIcon sx={iconSx} />;
      case 3: return <GridViewIcon sx={iconSx} />;
      default: return <EventNoteIcon sx={iconSx} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={50} sx={{ color: '#004680' }} />
        <Typography color="#64748b" fontWeight={600}>Cargando datos del servidor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: 'transparent', px: { xs: 2, md: 4 }, pt: 2, pb: 4 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f0e2e2ff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mt: 1, mb: 2, bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, bgcolor: '#fff', p: { xs: 1.5, md: 2 }, borderBottom: '1px solid #eef2f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            {/* Badge de ícono que ancla el título y refuerza el contexto de la pestaña activa */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 2.5,
                flexShrink: 0,
                color: '#004680',
                bgcolor: '#eaf2fb',
                border: '1px solid #d6e6f7',
              }}
            >
              {vistaAdmin ? <AdminPanelSettingsIcon sx={{ fontSize: 26 }} /> : getIconoPrincipal()}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#0f2c4a', lineHeight: 1.2, fontSize: { xs: '1.15rem', md: '1.4rem' } }}>
                {vistaAdmin
                  ? 'Panel Administrativo'
                  : `${getTituloPrincipal()}${(() => {
                      const nombre = storeOverride != null
                        ? (tiendasAdmin.find((t) => t.id === storeOverride)?.name ?? '')
                        : (user?.store_name ?? '');
                      return nombre ? ` - ${toTitleCase(nombre)}` : '';
                    })()}`}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#64748b', mt: 0.4, lineHeight: 1.35 }}>
                {vistaAdmin ? 'Gestión de empleados de todas las tiendas' : subtitulosTab[tabValue]}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {esAdmin() && !vistaAdmin && (
              <Autocomplete
                size="small"
                options={tiendasAdmin}
                getOptionLabel={(o) => o.name}
                value={tiendasAdmin.find((t) => t.id === storeOverride) ?? null}
                onChange={(_, v) => setStoreOverride(v ? v.id : null)}
                sx={{ width: 230 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Tiendas"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <StorefrontIcon sx={{ fontSize: 18, color: '#004680' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
                  />
                )}
              />
            )}
            {!vistaAdmin && (
              <>
                <TutorialButton />
                <Tooltip title="Actualizar registros">
                  <Button
                    className="tour-refresh"
                    onClick={resetHorarios}
                    variant="contained"
                    disableElevation
                    startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: '#004680',
                      color: '#fff',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      px: 2,
                      py: 0.75,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#003366', boxShadow: 'none' },
                    }}
                  >
                    Actualizar
                  </Button>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: { xs: 1, md: 2 } }}>
          <Tabs
            className="tour-tabs"
            value={vistaAdmin ? 'admin' : tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={false}
            TabIndicatorProps={{ sx: { display: 'none' } }}
            sx={{
              px: { xs: 1, md: 1.5 },
              py: 1.25,
              minHeight: 'auto',
              flex: 1,
              '& .MuiTabs-flexContainer': { gap: 1 },
              '& .MuiTabs-scrollButtons.Mui-disabled': { display: 'none' },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.2px',
                minHeight: 40,
                borderRadius: '10px',
                px: 2,
                color: '#64748b',
                boxShadow: 'none',
                transition: 'background-color 0.2s ease, color 0.2s ease',
                '& .MuiTab-iconWrapper': { mr: 0.75 },
                '&:hover': { backgroundColor: '#eef4fb', color: '#004680', boxShadow: 'none' },
                '&.Mui-selected': {
                  color: '#fff',
                  backgroundColor: '#004680',
                  boxShadow: 'none',
                },
                '&.Mui-selected:hover': { backgroundColor: '#003a6b', boxShadow: 'none' },
              },
            }}
          >
            <Tab value={0} icon={<EventNoteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="REGISTROS" />
            <Tab value={1} icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="NOVEDADES" />
            <Tab value={2} icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="HISTORIAL" />
            {/* La pestaña permanece en el árbol (oculta) para conservar la alineación de índices con sus TabPanel */}
            <Tab value={3} icon={<GridViewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="MALLA HORARIA" sx={{ display: MALLA_HORARIA_HABILITADA ? undefined : 'none' }} />
            {esAdmin() && (
              <Tab value="admin" icon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="ADMIN" />
            )}
          </Tabs>

          {tabValue === 0 && !vistaAdmin && (
            <Chip
              label={`Total Empleados: ${empleados.length}`}
              sx={{
                bgcolor: '#eaf2fb',
                color: '#004680',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #d6e6f7',
                ml: 2,
                height: 32,
                px: 0.5,
              }}
            />
          )}
        </Box>
      </Paper>

      {vistaAdmin ? (
        <AdminEmpleadosPage storeSel={storeOverride} onStoreChange={setStoreOverride} />
      ) : (
      <>
      <TabPanel value={tabValue} index={0}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3,
          width: '100%'
        }}>
          {empleados.map((empleado) => (
            <EmployeeCard
              key={empleado.id}
              empleado={empleado}
              tiposNovedad={tiposNovedad as any}
              reasons={reasons}
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

      {/* NOVEDADES - TABLA */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          {/* Cabecera con filtros */}
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  flexShrink: 0,
                  color: '#004680',
                  bgcolor: '#eaf2fb',
                  border: '1px solid #d6e6f7',
                }}
              >
                <AssignmentIcon sx={{ fontSize: 19 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#0f2c4a', fontSize: '1rem', lineHeight: 1.2 }}>
                Novedades registradas
              </Typography>
              <Chip
                label={novedadesFiltradas.length}
                size="small"
                sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem', bgcolor: '#eaf2fb', color: '#004680' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <Box
                className="tour-nov-search"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  width: { xs: '100%', sm: 280, md: 350 },
                  height: 38,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Nombre del empleado..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ gap: 0.5 }}>
                        {searchQuery && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSearchQuery('');
                              setPage(0);
                            }}
                          >
                            <ClearIcon sx={{ fontSize: 16, color: '#8a9bb5' }} />
                          </IconButton>
                        )}
                        <PersonSearchIcon sx={{ color: '#004680', fontSize: 20, mr: 0.5 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f1f7fe',
                      height: 38,
                      '& fieldset': { borderColor: '#cbd5e1' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused fieldset': { borderColor: '#004680' },
                    },
                    '& .MuiOutlinedInput-input': {
                      fontSize: '0.85rem',
                      color: '#475569',
                      '&::placeholder': {
                        color: '#8a9bb5',
                        opacity: 1,
                      },
                    }
                  }}
                />
              </Box>

              {/* DATE PICKER */}
              <Box className="tour-nov-fecha">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <DatePicker
                  label=""
                  value={fechaFiltro}
                  onChange={(newVal) => { setFechaFiltro(newVal as Dayjs | null); setPage(0); }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    shortcuts: {
                      items: [
                        {
                          label: 'Hoy',
                          getValue: () => dayjs(),
                        },
                        {
                          label: 'Ayer',
                          getValue: () => dayjs().subtract(1, 'day'),
                        },
                      ],
                    },
                    textField: {
                      size: 'small',
                      placeholder: 'DD/MM/YYYY',
                      sx: {
                        width: 195,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2, bgcolor: '#f9fafc', height: 38,
                          '& fieldset': { borderColor: '#cbd5e1' },
                          '&:hover fieldset': { borderColor: '#94a3b8' },
                          '&.Mui-focused fieldset': { borderColor: '#004680' },
                        },
                        '& .MuiOutlinedInput-input': { fontSize: '0.85rem', color: '#475569' }
                      }
                    },
                    field: { clearable: true, onClear: () => { setFechaFiltro(null); setPage(0); } },
                  }}
                />
              </LocalizationProvider>
              </Box>

            </Box>
          </Box>

          {/* Tabla */}
          <TableContainer className="tour-nov-tabla" sx={{ overflow: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tipo de Novedad</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((novedad: any, idx: number) => {
                  const chipColors = getChipColor(novedad.tipo);
                  const nombreEmpleado = novedad.empleadoNombre || 'Empleado';
                  const inicial = nombreEmpleado.charAt(0).toUpperCase();
                  const fechaFormateada = novedad.fecha
                    ? dayjs(novedad.fecha).format('DD [de] MMM [de] YYYY')
                    : '—';
                  const observacionCorta = novedad.observaciones?.length > 60
                    ? novedad.observaciones.substring(0, 60) + '…'
                    : novedad.observaciones || '—';

                  return (
                    <TableRow
                      key={novedad.id || idx}
                      hover
                      sx={{
                        bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: '#eef4ff',
                        }
                      }}
                    >
                      <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>
                        {fechaFormateada}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: getAvatarColor(nombreEmpleado),
                              fontSize: '1rem',
                              fontWeight: 600,
                            }}
                          >
                            {inicial}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {nombreEmpleado}
                            </Typography>
                            {novedad.empleadoDocumento && (
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Doc: {novedad.empleadoDocumento}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getIconForTipo(novedad.tipo)}
                          label={novedad.tipo || 'Sin tipo'}
                          size="medium"
                          sx={{
                            bgcolor: chipColors.bg,
                            color: chipColors.text,
                            fontWeight: 600,
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': { color: chipColors.text, ml: 0.5, fontSize: '1rem' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', maxWidth: 300, wordBreak: 'break-word' }}>
                          {observacionCorta}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}


                {novedadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                        <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                          {searchQuery && fechaFiltro
                            ? 'No hay novedades registradas con este nombre en esta fecha'
                            : searchQuery
                            ? 'No hay novedades registradas con este nombre'
                            : fechaFiltro
                            ? 'No hay novedades registradas con esta fecha'
                            : 'No hay novedades registradas'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginador */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
            <Typography variant="caption" color="#64748b">
              Mostrando {paginated.length} de {novedadesFiltradas.length} novedades
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                size="small"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                let pageNum = i;
                if (totalPages > 7) {
                  if (page < 3) pageNum = i;
                  else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
                  else pageNum = page - 3 + i;
                }
                const isActive = page === pageNum;
                return (
                  <Box
                    key={i}
                    onClick={() => setPage(pageNum)}
                    sx={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      bgcolor: isActive ? '#004680' : '#fff',
                      color: isActive ? '#fff' : '#5e6f8d',
                      border: isActive ? 'none' : '1px solid #dfe4ec',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: isActive ? '#004680' : '#f1f5f9' }
                    }}
                  >
                    {pageNum + 1}
                  </Box>
                );
              })}
              <IconButton
                size="small"
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
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
      </>
      )}
    </Box>
  );
}

export default function RegistrosPage() {
  return (
    <HorariosTourProvider>
      <HorariosTour>
        <RegistrosPageContent />
      </HorariosTour>
    </HorariosTourProvider>
  );
}