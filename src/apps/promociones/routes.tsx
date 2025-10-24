import { RouteObject } from "react-router-dom";
import PromotionsLayout from "./layouts/PromotionsLayout";
import CreatePromotionPage from "./components/CreatePromotionPage";
import { PromotionsFilterProvider } from "./hooks/PromotionsFilterProvider";

const routes: RouteObject[] = [
  {
    path: "/promociones",
    element: (
      <PromotionsFilterProvider>
        <PromotionsLayout />
      </PromotionsFilterProvider>
    ),
  },
  {
    path: "/promociones/crear",
    element: <CreatePromotionPage />,
  },
];

export default routes;