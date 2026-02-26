import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";
import NuevoProyecto from "./pages/NuevoProyecto";
import DetalleProyecto from "./pages/DetalleProyecto";
import PostLanzamiento from "./pages/PostLanzamiento";

const routes: RouteObject[] = [
  {
    path: "/gestion_proyectos",
    element: <Home />,
  },
  {
    path: "/gestion_proyectos/nuevo",
    element: <NuevoProyecto />,
  },
  {
    path: "/gestion_proyectos/:id",
    element: <DetalleProyecto />,
  },
  {
    path: "/gestion_proyectos/:id/postlanzamiento",
    element: <PostLanzamiento />,
  },
];

export default routes;
