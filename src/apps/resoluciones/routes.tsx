import { RouteObject } from "react-router-dom";
import PromotionsLayout from "./layouts/PromotionsLayout";
import { PromotionsFilterProvider } from "./hooks/PromotionsFilterProvider";

const routes: RouteObject[] = [
  {
    path: "/resoluciones",
    element: (
      <PromotionsFilterProvider>
        <PromotionsLayout />
      </PromotionsFilterProvider>
    ),
  },
];

export default routes;
