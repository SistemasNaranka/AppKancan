import { RouteObject } from 'react-router-dom';
import Home from "./pages/Home.tsx";

const routes: RouteObject[] = [
    {
        path: "/horarios",
        element: <Home />,
    },
];

export default routes;