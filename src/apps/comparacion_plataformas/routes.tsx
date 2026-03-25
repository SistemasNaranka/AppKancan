import { RouteObject } from "react-router-dom";
import Home from "./pages/home";

const routes: RouteObject[] = [
  {
    path: "/comparacion_plataformas",
    element: <Home />,
  },
];

export default routes;
