import TrasladosPanel from './pages/TrasladosPanel';

import { RouteObject } from "react-router-dom";

const routes : RouteObject[] = [
  {
    path: "/traslados", // <- se monta como /reportes
    element: <TrasladosPanel />,
  },
];

export default routes;