import { RouteObject } from 'react-router-dom';
import RuletaHome from './page/RuletaHome'; // ✅ Sin extensión .tsx

const routes: RouteObject[] = [
  {
    path: '/ruleta',
    element: <RuletaHome />,
  },
];

export default routes;