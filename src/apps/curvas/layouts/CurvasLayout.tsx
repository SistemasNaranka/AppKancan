import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

/**
 * Layout principal del módulo de Curvas
 * 
 * Proporciona la estructura visual general con:
 * - AppBar con navegación
 * - Tabs para cambiar entre vistas
 * - Contenedor principal para el contenido
 */
interface CurvasLayoutProps {
  children: ReactNode;
  titulo?: string;
}

export const CurvasLayout = ({ children, titulo }: CurvasLayoutProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar el tab activo basado en la ruta
  const getActiveTab = (): number => {
    if (location.pathname.includes('/upload')) return 0;
    if (location.pathname.includes('/dashboard')) return 1;
    if (location.pathname.includes('/envios')) return 2;
    if (location.pathname.includes('/analisis')) return 3;
    return 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/curvas/upload');
        break;
      case 1:
        navigate('/curvas/dashboard');
        break;
      case 2:
        navigate('/curvas/envios');
        break;
      case 3:
        navigate('/curvas/analisis');
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2, color: 'text.secondary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            {titulo || 'Curvas de Distribución'}
          </Typography>
        </Toolbar>
        
        {/* Tabs de navegación */}
        <Tabs
          value={getActiveTab()}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              bgcolor: theme.palette.primary.main,
            },
          }}
        >
          <Tab 
            label="Carga de Archivos" 
            icon={<UploadFileIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Dashboard" 
            icon={<DashboardIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Envíos" 
            icon={<LocalShippingIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Análisis" 
            icon={<AnalyticsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </AppBar>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          py: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default CurvasLayout;
