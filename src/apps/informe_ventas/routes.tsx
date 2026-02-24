/**
 * Rutas del módulo de Informe de Ventas
 */

import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";

const routes: RouteObject[] = [
  {
    path: "/informe_ventas",
    element: <Home />,
  },
];

export default routes;
