import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";

const routes: RouteObject[] = [
    {
        path: "/contabilizacion_factura",
        element: <Home />,
    },
];

export default routes;
