import { useMemo } from "react";
import { Promotion } from "../types/promotion";
import { usePromotionsFilter } from "./usePromotionsFilter";
import { usePromotions } from "./usePromotions";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Hook que devuelve las promociones filtradas según los filtros del Provider
 * Usa datos de Directus mediante React Query
 */
export const useFilteredPromotions = (): Promotion[] => {
  const { data: promotions = [], isLoading, isError } = usePromotions();
  const {
    tipos,
    descuentoRange,
    duracion,
    tiendas,
    soloVigentes,
    focusedYear,
    selectedView,
  } = usePromotionsFilter();

  const filteredPromotions = useMemo(() => {
    // Si está cargando o hay error, devolver array vacío
    if (isLoading || isError || !promotions) {
      return [];
    }

    const today = dayjs();

    return promotions.filter((promo) => {
      // 🔹 Filtro por duración
      if (duracion && promo.duracion !== duracion) return false;

      // 🔹 Filtro por tipos
      if (tipos.length > 0 && !tipos.includes(promo.tipo)) return false;

      // 🔹 Filtro por rango de descuento
      if (
        promo.descuento < descuentoRange.min ||
        promo.descuento > descuentoRange.max
      )
        return false;

      // 🔹 Filtro por tiendas seleccionadas
      if (tiendas.length > 0) {
        // Verificar si alguna tienda de la promoción está en las seleccionadas
        const hasMatchingStore = promo.tiendas.some((tienda) =>
          tiendas.includes(tienda)
        );
        if (!hasMatchingStore) return false;
      }

      // 🔹 Filtro solo vigentes (activas hoy)
      if (soloVigentes) {
        const start = dayjs(promo.fecha_inicio, "YYYY-MM-DD", true);
        const end = promo.fecha_final
          ? dayjs(promo.fecha_final, "YYYY-MM-DD", true)
          : null;

        // Si tiene fecha final, verificar que hoy esté dentro del rango
        if (end) {
          if (
            !today.isSameOrAfter(start, "day") ||
            !today.isSameOrBefore(end, "day")
          ) {
            return false;
          }
        } else {
          // Si no tiene fecha final (fija), verificar que ya haya iniciado
          if (!today.isSameOrAfter(start, "day")) {
            return false;
          }
        }
      }

      // 🔹 Filtro sigiloso por año (solo en vista anual)
      if (selectedView === "anual") {
        const start = dayjs(promo.fecha_inicio, "YYYY-MM-DD", true);
        const end = promo.fecha_final
          ? dayjs(promo.fecha_final, "YYYY-MM-DD", true)
          : null;

        // Verificar si la promoción toca el año enfocado
        const yearStart = dayjs().year(focusedYear).startOf("year");
        const yearEnd = dayjs().year(focusedYear).endOf("year");

        if (end) {
          // Promoción temporal: debe intersectar con el año
          const startsBeforeYearEnd =
            start.isBefore(yearEnd) || start.isSame(yearEnd, "day");
          const endsAfterYearStart =
            end.isAfter(yearStart) || end.isAfter(yearStart, "day");
          if (!startsBeforeYearEnd || !endsAfterYearStart) return false;
        } else {
          // Promoción fija: solo mostrar si inicia en este año
          if (start.year() !== focusedYear) return false;
        }
      }

      return true;
    });
  }, [
    promotions,
    tipos,
    descuentoRange,
    duracion,
    tiendas,
    soloVigentes,
    focusedYear,
    selectedView,
    isLoading,
    isError,
  ]);

  return filteredPromotions;
};
