import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";

const routes: RouteObject[] = [
  {
    path: "/resoluciones",
    element: <Home />,
  },
];

export default routes;
