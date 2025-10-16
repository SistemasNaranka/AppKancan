import ReportesHome from "./ReportesHome";
import ReporteDetalle from "./ReporteDetalle";
import { RouteObject } from "react-router-dom";

const routes : RouteObject[] = [
  {
    path: "/reportes", // <- se monta como /reportes
    element: <ReportesHome />,
    children: [
      {
        path: ":id", // <- /reportes/123
        element: <ReporteDetalle />,
      },
    ],
  },
];

export default routes;