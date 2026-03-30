import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, useTheme, Tabs, Tab, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useCurvasPolicies } from '../hooks/useCurvasPolicies';

/**
 * Layout principal del módulo de Curvas
 * 
 * Envuelve todas las páginas del módulo con:
 * - AppBar con navegación
 * - Tabs para cambiar entre vistas
 * - Contenedor principal para el contenido
 */
export const CurvasRouteLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { debeAterrizarEnDespacho } = useCurvasPolicies();

  const isRestrictedToBodega = debeAterrizarEnDespacho();

  // Redirección para usuarios de bodega - Aterrizaje dentro del módulo
  useEffect(() => {
    const p = location.pathname.toLowerCase();
    if (isRestrictedToBodega && (p === '/curvas' || p === '/curvas/' || p.includes('/upload') || p.includes('/dashboard'))) {
      navigate('/curvas/envios', { replace: true });
    }
  }, [isRestrictedToBodega, location.pathname, navigate]);

  // Determinar el tab activo basado en la ruta y el rol
  const getActiveTab = (): number => {
    if (location.pathname.includes('/envios')) return isRestrictedToBodega ? 0 : 2;
    if (isRestrictedToBodega) return 0;

    if (location.pathname.includes('/upload') || location.pathname === '/curvas') return 0;
    if (location.pathname.includes('/dashboard')) return 1;
    if (location.pathname.includes('/analisis')) return 3;
    return 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (isRestrictedToBodega) {
      navigate('/curvas/envios');
      return;
    }

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: '#004680',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
          top: 0,
          zIndex: theme.zIndex.appBar + 100,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 'auto', md: '74px' },
            py: { xs: 1.5, md: 1.5 },
            px: { xs: 1.5, sm: 2, md: 3 },
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 1.5, md: 2 },
            justifyContent: 'space-between'
          }}
        >
          {/* LEFT: Back + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { xs: 'auto', md: 180 } }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{
                mr: 2,
                color: 'rgba(255,255,255,0.7)',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' },
                width: 38, height: 38
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1.1,
                  letterSpacing: -0.2,
                  textTransform: 'uppercase',
                  fontSize: '0.85rem'
                }}
              >
                Curvas
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  display: { xs: 'none', sm: 'block' } // Ocultar en móviles muy pequeños para ahorrar espacio
                }}
              >
                {isRestrictedToBodega ? 'SISTEMA DE DESPACHO' : 'DISTRIBUCIÓN CENTRAL'}
              </Typography>
            </Box>
          </Box>

          {/* CENTER: Navigation Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center', order: { xs: 2, lg: 2 }, width: { xs: '100%', sm: 'auto' } }}>
            <Tabs
              value={getActiveTab()}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '24px',
                p: 0.4,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': { gap: 0.3 }
              }}
            >
              {!isRestrictedToBodega && (
                <Tab
                  label="Carga"
                  icon={<UploadFileIcon sx={{ fontSize: '16px !important' }} />}
                  iconPosition="start"
                  sx={tabStyles(getActiveTab() === 0)}
                />
              )}
              {!isRestrictedToBodega && (
                <Tab
                  label="Dashboard"
                  icon={<DashboardIcon sx={{ fontSize: '16px !important' }} />}
                  iconPosition="start"
                  sx={tabStyles(getActiveTab() === 1)}
                />
              )}
              <Tab
                label="Envíos"
                icon={<LocalShippingIcon sx={{ fontSize: '16px !important' }} />}
                iconPosition="start"
                sx={tabStyles(getActiveTab() === (isRestrictedToBodega ? 0 : 2))}
              />
              {!isRestrictedToBodega && (
                <Tab
                  label="Análisis"
                  icon={<AnalyticsIcon sx={{ fontSize: '16px !important' }} />}
                  iconPosition="start"
                  sx={tabStyles(getActiveTab() === 3)}
                />
              )}
            </Tabs>
          </Box>

          {/* RIGHT: Portal target for Contextual Header Controls */}
          <Box
            sx={{
              flexGrow: { xs: 1, md: 0 },
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1,
              minWidth: { xs: '100%', sm: 'auto' },
              maxWidth: { sm: 520, md: 640, lg: 'none' },
              overflow: 'hidden',
              pb: { xs: 0.5, md: 0 },
              order: { xs: 1, sm: 2, lg: 3 }
            }}
          >
            <Box id="upload-page-header-portal" />
            <Box id="dashboard-page-header-portal" />
            <Box id="envios-page-header-portal" />
            <Box id="analisis-page-header-portal" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', overflow: 'hidden' }} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles Helpers
// ─────────────────────────────────────────────────────────────────────────────

const tabStyles = (selected: boolean) => ({
  textTransform: 'none',
  fontWeight: 800,
  minHeight: 34,
  borderRadius: '20px',
  fontSize: { xs: '0.7rem', md: '0.78rem' },
  px: { xs: 1.5, sm: 2, md: 2.2 },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  color: selected ? '#004680' : 'rgba(255,255,255,0.85)',
  bgcolor: selected ? 'white' : 'transparent',
  boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
  '&:hover': {
    bgcolor: selected ? 'white' : 'rgba(255,255,255,0.12)',
    color: selected ? '#004680' : 'white',
  },
  '&.Mui-selected': {
    color: '#004680',
  },
  '& .MuiTab-iconWrapper': {
    marginRight: '5px !important',
  }
});

export default CurvasRouteLayout;
