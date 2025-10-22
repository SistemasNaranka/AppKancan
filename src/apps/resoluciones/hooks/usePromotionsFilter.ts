import { useContext } from "react";
import PromotionsFilterContext from "./PromotionsFilterContext";

export const usePromotionsFilter = () => {
  const context = useContext(PromotionsFilterContext);
  if (!context) throw new Error("usePromotionsFilter must be used within PromotionsFilterProvider");
  return context;
};
