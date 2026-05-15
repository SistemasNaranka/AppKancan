import { RouteObject } from 'react-router-dom';
import ContactDirectory from './pages/ContactDirectory';

const routes: RouteObject[] = [
  {
    // Cambia el "/" por el nombre exacto de la ruta en tu navegador
    path: "/contactos", 
    element: <ContactDirectory />,
  }
];

export default routes;