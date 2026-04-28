import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";

const routes: RouteObject[] = [
  {
    path: "/contactos",
    element: <Home />,
  },
];

export default routes;