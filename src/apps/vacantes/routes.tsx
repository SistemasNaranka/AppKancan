import { RouteObject } from 'react-router-dom';
import VacantesPage from './page/VacantesPage';

const routes: RouteObject[] = [
  {
    path: '/vacantes',
    element: <VacantesPage />,
  },
];

export default routes;