import { RouteObject } from 'react-router-dom';

// 1. IMPORTACIÓN DE CONTACTOS CON UN SOLO PUNTO (Está al lado de la carpeta pages)
import ContactDirectory from '../contactos/pages/ContactDirectory';

// 2. IMPORTACIÓN DE NOTIFICACIONES SALIENDO HASTA LA RAÍZ (src/)
import HistorialNotificaciones from '../notificaciones/pages/HistorialNotificaciones';

import CreateNotification from '../notificaciones/components/CreateNotification';

const routes: RouteObject[] = [
  {
    // Tu ruta de contactos original que funciona perfectamente
    path: "/contactos", 
    element: <ContactDirectory />,
  },
  {
    // Tu nueva ruta de notificaciones apuntada con precisión
    path: "/notificaciones", 
    element: <HistorialNotificaciones />,
  },

  {
    path: "/notificaciones/crear",
    element: <CreateNotification />,
  }
];

export default routes;