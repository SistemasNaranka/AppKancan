import EmpresasHome from "./pages/EmpresasHome";
import { RouteObject } from "react-router-dom";

const routes : RouteObject[] = [
  {
    path: "/empresas", // <- se monta como /reportes
    element: <EmpresasHome />,
  },
];

export default routes;