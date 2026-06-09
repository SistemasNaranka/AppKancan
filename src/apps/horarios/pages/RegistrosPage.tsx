import { useState } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip, Tabs, Tab, Paper, Avatar } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import GridViewIcon from '@mui/icons-material/GridView';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EmployeeCard from '../components/EmployeeCard';
import { useHorarios } from '../hooks/useHorarios';
import HistorialPage from './HistorialPage';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ mt: -2 }}>{children}</Box>}
    </div>
  );
}

export default function RegistrosPage() {
  const { empleados, registrarEvento, resetHorarios } = useHorarios();
  const [tabValue, setTabValue] = useState(0);

  const fechaHoy = dayjs().format('dddd D [de] MMMM [de] YYYY');
  const total = empleados.length;
  const activos = empleados.filter(
    (e) => e.estadoActual === 'jornada_iniciada' || e.estadoActual === 'regreso_almuerzo'
  ).length;
  const pendientes = empleados.filter((e) => e.estadoActual === 'entrada_pendiente').length;
  const finalizados = empleados.filter((e) => e.estadoActual === 'jornada_finalizada').length;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(145deg, #f0f4fa 0%, #d9e2ef 100%)',
        px: { xs: 2, md: 4 },
        pt: 3,
        pb: 5,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgba(0,64,122,0.1)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: { xs: 2, md: 3 },
            pb: { xs: 1, md: 1 },
            borderBottom: '1px solid #eef2f6',
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#00407a', letterSpacing: '-0.02em' }}>
              Panel de Asistencia
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#5a6e85', mt: 0.5, textTransform: 'capitalize' }}>
              {fechaHoy}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: '#00407a', width: 22, height: 22, fontSize: '0.7rem' }}>{total}</Avatar>}
              label="Total"
              size="small"
              sx={{ bgcolor: '#e8f0fe', color: '#00407a', fontWeight: 600, borderRadius: 2 }}
            />
            <Chip
              label={`${activos} activos`}
              size="small"
              sx={{ bgcolor: '#e0f2e9', color: '#1e7b48', fontWeight: 600, borderRadius: 2 }}
            />
            <Chip
              label={`${pendientes} pendientes`}
              size="small"
              sx={{ bgcolor: '#fff4e0', color: '#b45309', fontWeight: 600, borderRadius: 2 }}
            />
            {finalizados > 0 && (
              <Chip
                label={`${finalizados} finalizados`}
                size="small"
                sx={{ bgcolor: '#f1f3f5', color: '#4b5565', fontWeight: 600, borderRadius: 2 }}
              />
            )}
            <Tooltip title="Reiniciar todos los registros">
              <IconButton
                onClick={resetHorarios}
                sx={{
                  bgcolor: '#00407a',
                  color: '#fff',
                  borderRadius: 2,
                  width: 34,
                  height: 34,
                  '&:hover': { bgcolor: '#002d5a', transform: 'rotate(15deg)' },
                  transition: 'all 0.2s',
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: { xs: 1, md: 2 },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 1.5,
              minHeight: 48,
              color: '#5a6e85',
              '&.Mui-selected': { color: '#00407a' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#00407a', height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab icon={<EventNoteIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="REGISTROS" />
          <Tab icon={<AssignmentIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="NOVEDADES" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="HISTORIAL" />
          <Tab icon={<GridViewIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="MALLA HORARIA" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
          {empleados.map((empleado) => (
            <EmployeeCard key={empleado.id} empleado={empleado} onRegistrarEvento={registrarEvento} />
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">Módulo de Novedades en construcción</Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <HistorialPage />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">Malla Horaria</Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}