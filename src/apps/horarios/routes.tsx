import { RouteObject, Navigate } from 'react-router-dom';
import HorariosLayout from './components/HorariosLayout';
import RegistrosPage from './pages/RegistrosPage';

const rutasHorarios: RouteObject[] = [
  {
    path: 'horarios', 
    element: <HorariosLayout />,
    children: [
      {
        path: 'registros',
        element: <RegistrosPage />
      },
      {
        // El ADT acepta 'index: true' en lugar de un path vacío
        index: true,
        element: <Navigate to="registros" replace />
      },
      {
        path: '*',
        element: <Navigate to="registros" replace />
      }
    ]
  }
];

export default rutasHorarios;