import { Box, Paper, Typography, Button, Tabs, Tab, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TerminalIcon from '@mui/icons-material/Terminal';
import SchoolIcon from '@mui/icons-material/School';
import BugReportIcon from '@mui/icons-material/BugReport';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

interface HeaderStickyProps {
  activeTab: number;
  setActiveTab: (val: number) => void;
  copySuccess: string | null;
}

export default function HeaderSticky({ activeTab, setActiveTab, copySuccess }: HeaderStickyProps) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: '#f8fafc',
        pt: { xs: 1.5, md: 2 },
        pb: 1.5,
        mb: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#ffffff',
          p: 2.5,
          borderRadius: 3,
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' }, alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Botón Volver a la izquierda */}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/gestion_proyectos')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, justifySelf: { xs: 'flex-start', md: 'auto' } }}
          >
            Volver a Proyectos
          </Button>

          {/* Título y Subtítulo perfectamente CENTRADOS */}
          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <SchoolIcon sx={{ fontSize: 32, color: '#2563eb' }} />
              Taller Interactivo de Directus & Base de Datos
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
              Entorno educativo para aprender sintaxis SQL, llamadas al SDK de Directus y diagnóstico de errores en tiempo real.
            </Typography>
          </Box>

          {/* Chip de Notificación a la derecha */}
          <Box sx={{ minWidth: 120, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            {copySuccess && (
              <Chip label={`Copiado: ${copySuccess}`} color="success" icon={<CheckCircleIcon />} />
            )}
          </Box>
        </Box>

        {/* Navegación por Pestañas CENTRADAS */}
        <Box sx={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            centered
            sx={{
              minHeight: 44,
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                py: 1,
                px: 2.5,
                fontSize: '0.92rem',
                minHeight: 44,
              },
            }}
          >
            <Tab icon={<TerminalIcon />} iconPosition="start" label="1. Probador e Inspector" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="2. Ejercicios y Práctica" />
            <Tab icon={<BugReportIcon />} iconPosition="start" label="3. Diagnóstico de Errores" />
            <Tab icon={<HelpOutlineIcon />} iconPosition="start" label="4. Guía de Referencia" />
          </Tabs>
        </Box>
      </Paper>
    </Box>
  );
}
