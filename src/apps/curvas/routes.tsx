import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { CurvasProvider } from './contexts/CurvasContext';
import CurvasRouteLayout from './layouts/CurvasRouteLayout';

// Lazy loading de páginas para optimización
const UploadPage = lazy(() => import('./pages/UploadPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EnviosPage = lazy(() => import('./pages/EnviosPage'));
const AnalisisPage = lazy(() => import('./pages/AnalisisPage'));

// Componente de carga para Suspense
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

/**
 * RUTAS DEL MÓDULO DE CURVAS DE DISTRIBUCIÓN
 * 
 * Define las URLs de acceso para el módulo:
 * - /curvas - Página de carga de archivos Excel
 * - /curvas/upload - Página de carga de archivos Excel
 * - /curvas/dashboard - Dashboard principal con DataGrid editable
 * - /curvas/envios - Gestión de envíos para Bodega
 * - /curvas/analisis - Vista de análisis detallado
 * 
 * Todas las rutas comparten el mismo CurvasProvider para mantener
 * el estado entre navegación.
 */
const routes: RouteObject[] = [
  {
    path: '/curvas',
    element: (
      <CurvasProvider>
        <CurvasRouteLayout />
      </CurvasProvider>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UploadPage />
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UploadPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'envios',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EnviosPage />
          </Suspense>
        ),
      },
      {
        path: 'analisis',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AnalisisPage />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes;
