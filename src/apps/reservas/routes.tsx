import { RouteObject } from "react-router-dom";
import Home from "../reservas/pages/home";

const routes: RouteObject[] = [
  {
    path: "/reservas",
    element: <Home />,
  },
];

export default routes;
