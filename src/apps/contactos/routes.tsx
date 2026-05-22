import { RouteObject } from 'react-router-dom';
import ContactDirectory from './pages/ContactDirectory';
import ContactoDetallePage from './pages/ContactoDetallePage';

const routes: RouteObject[] = [
  {
    path: "/contactos",
    element: <ContactDirectory />,
  },
  {
    path: "/contactos/:id",
    element: <ContactoDetallePage />,
  },
];

export default routes;