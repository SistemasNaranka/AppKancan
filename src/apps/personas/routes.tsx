import PersonasHome from "./pages/PersonasHome";
import { RouteObject } from "react-router-dom";

const routes : RouteObject[] = [
  {
    path: "/personas", // <- se monta como /reportes
    element: <PersonasHome />,
  },
];

export default routes;