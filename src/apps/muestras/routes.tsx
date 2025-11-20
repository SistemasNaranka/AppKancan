import { RouteObject } from "react-router-dom";
import ArticulosLayout from "./layouts/ReferenciasLayout";

const routes: RouteObject[] = [
  {
    path: "/muestras",
    element: <ArticulosLayout />,
  },
];

export default routes;
