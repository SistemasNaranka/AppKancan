import { useState, useEffect } from 'react';
import {
  Box, Typography, Tooltip, Tabs, Tab, Paper,
  Chip, CircularProgress, Alert, TextField, InputAdornment, Button, Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getStores, getStoreIdUsuarioActual } from '../api/directus/read';
import { Tienda } from '../interfaces/horarios.interface';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import GridViewIcon from '@mui/icons-material/GridView';
import EventNoteIcon from '@mui/icons-material/EventNote';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EmployeeCard from '../components/EmployeeCard';
import NovedadesTab from '../components/NovedadesTab';
import { useHorarios } from '../hooks/useHorarios';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');
import HistorialPage from '../pages/HistorialPage';
import { HorariosTourProvider, useHorariosTour, HorariosTab } from '../components/tour/HorariosTourContext';
import { HorariosTour } from '../components/tour/HorariosTour';
import TutorialButton from '../components/tour/TutorialButton';
import { useTutorial } from '@/shared/hooks/TutorialContext';
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';
import AdminEmpleadosPage from './AdminEmpleadosPage';
import ExportEventosDialog from '../components/ExportEventosDialog';
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

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function RegistrosPageContent() {
  const { user } = useAuth();
  const { esAdmin } = useHorariosPolicies();

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
    guardarObservacion, agregarNovedad, reportarEvento,
  } = useHorarios(storeOverride);

  const { setTabChangeCallback, startFullTour } = useHorariosTour();
  const { activeTutorial, endTutorial } = useTutorial();
  const [tabValue, setTabValue] = useState(0);
  const [vistaAdmin, setVistaAdmin] = useState(false);
  const [exportEventosOpen, setExportEventosOpen] = useState(false);

  useEffect(() => {
    setTabChangeCallback((tab: HorariosTab) => setTabValue(tab));
  }, [setTabChangeCallback]);

  useEffect(() => {
    if (activeTutorial === 'horarios' && !loading) {
      const t = setTimeout(() => {
        startFullTour();
        endTutorial();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [activeTutorial, loading, startFullTour, endTutorial]);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
              <Button
                className="tour-export-eventos"
                onClick={() => setExportEventosOpen(true)}
                variant="contained"
                disableElevation
                startIcon={<FileDownloadIcon />}
                sx={{ bgcolor: '#004680', textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 32, '&:hover': { bgcolor: '#003a6b' } }}
              >
                Exportar
              </Button>
              <Chip
                label={`Total Empleados: ${empleados.length}`}
                sx={{
                  bgcolor: '#eaf2fb',
                  color: '#004680',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #d6e6f7',
                  height: 32,
                  px: 0.5,
                }}
              />
            </Box>
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
              onReportarEvento={reportarEvento}
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
        <NovedadesTab novedades={novedades} esAdmin={esAdmin()} storeOverride={storeOverride} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <HistorialPage storeIdAdmin={storeOverride} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="h6" color="#64748b">Malla Horaria</Typography>
        </Paper>
      </TabPanel>
      </>
      )}

      <ExportEventosDialog
        open={exportEventosOpen}
        onClose={() => setExportEventosOpen(false)}
        storeId={storeOverride}
      />
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
