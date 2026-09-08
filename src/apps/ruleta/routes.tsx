import { RouteObject } from 'react-router-dom';
import RuletaHome from './page/RuletaHome';

const routes: RouteObject[] = [
  {
    path: '/ruleta',
    element: <RuletaHome />,
  },
];

export default routes;