import { useContext } from "react";
import PromotionsFilterContext from "./PromotionsFilterContext";

// ✅ Named export para consistencia
export const usePromotionsFilter = () => {
  const context = useContext(PromotionsFilterContext);
  if (!context) {
    throw new Error("usePromotionsFilter must be used within PromotionsFilterProvider");
  }
  return context;
};

// También exportar como default para compatibilidad
export default usePromotionsFilter;