import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";
import { CommissionProvider } from "./contexts/CommissionContext";

const routes: RouteObject[] = [
  {
    path: "/comisiones",
    element: (
      <CommissionProvider>
        <Home />
      </CommissionProvider>
    ),
  },
];

export default routes;
