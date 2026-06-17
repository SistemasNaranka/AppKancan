import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { CurvasProvider } from './contexts/CurvasContext';
import CurvasRouteLayout from './layouts/CurvasRouteLayout';
const UploadPage = lazy(() => import('./pages/UploadPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EnviosPage = lazy(() => import('./pages/EnviosPage'));
const AnalisisPage = lazy(() => import('./pages/AnalisisPage'));

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
