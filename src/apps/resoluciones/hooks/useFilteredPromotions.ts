// useFilteredPromotions.ts
import { useMemo } from "react";
import { Promotion } from "../types/promotion";
import { usePromotionsFilter } from "./usePromotionsFilter";
import { usePromotions } from "./usePromotions";

/**
 * Hook que devuelve las promociones filtradas según los filtros del Provider
 */
export const useFilteredPromotions = (): Promotion[] => {
  const promotions = usePromotions(); // todas las promociones (mock o API)
  const { tipos, descuentoRange, duracion, tiendas } = usePromotionsFilter(); // ✅ incluye tiendas

  return useMemo(() => {
    return promotions.filter((promo) => {
      // 🔹 Filtro por duración
      if (duracion && promo.duracion !== duracion) return false;

      // 🔹 Filtro por tipos
      if (tipos.length > 0 && !tipos.includes(promo.tipo)) return false;

      // 🔹 Filtro por rango de descuento
      if (promo.descuento < descuentoRange.min || promo.descuento > descuentoRange.max) return false;

      // 🔹 Filtro por tiendas seleccionadas
      if (tiendas.length > 0 && !promo.tiendas.some((t) => tiendas.includes(t))) return false;

      return true;
    });
  }, [promotions, tipos, descuentoRange, duracion, tiendas]); // ✅ dependencias completas
};
