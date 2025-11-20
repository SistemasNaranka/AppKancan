import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import PromotionsLayout from "./layouts/PromotionsLayout";
import LoadingSpinner from "@/shared/components/LoadingSpinner";
import { PromotionsFilterProvider } from "./hooks/PromotionsFilterProvider";

// Lazy load CreatePromotionPage for better bundle splitting
const CreatePromotionPage = lazy(
  () => import("./components/CreatePromotionPage")
);

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
    element: (
      <Suspense
        fallback={
          <LoadingSpinner
            message="Cargando formulario..."
            size="large"
            fullScreen
          />
        }
      >
        <CreatePromotionPage />
      </Suspense>
    ),
  },
];

export default routes;
