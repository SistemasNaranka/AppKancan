import { useMemo } from "react";
import { Promotion } from "../types/promotion";
import { usePromotionsFilter } from "./usePromotionsFilter";
import { usePromotions } from "./usePromotions";
import { useQuery } from "@tanstack/react-query";
import { getStores } from "../api/directus/read";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

// Devuelve las promociones filtradas según los filtros del Provider usando React Query.
export const useFilteredPromotions = (): Promotion[] => {
  const { data: promotions = [], isLoading, isError } = usePromotions();
  const { data: stores = [] } = useQuery({
    queryKey: ["prom_tiendas"],
    queryFn: getStores,
    staleTime: 1000 * 60 * 10,
  });
  const {
    tipos,
    descuentoRange,
    duracion,
    tiendas,
    soloVigentes,
    focusedYear,
    selectedView,
    focusedDate,
  } = usePromotionsFilter();

  const filteredPromotions = useMemo(() => {
    if (isLoading || isError || !promotions) {
      return [];
    }

    const today = dayjs();

    return promotions
      .filter((promo) => {
        // Filtro por duración
        if (duracion.length > 0 && !duracion.includes(promo.duration))
          return false;

        // Filtro por tipos
        if (tipos.length > 0 && !tipos.includes(promo.type)) return false;

        // Filtro por rango de descuento
        if (
          promo.discount < descuentoRange.min ||
          promo.discount > descuentoRange.max
        )
          return false;

        // Filtro por tiendas seleccionadas
        if (tiendas.length > 0) {
          const hasMatchingStore = promo.stores.some((tiendaNombre) => {
            const store = stores.find((s) => s.name === tiendaNombre);
            return store && tiendas.includes(store.id);
          });
          if (!hasMatchingStore) return false;
        }

        // Filtro solo vigentes (activas hoy)
        if (soloVigentes) {
          const start = dayjs(promo.start_date, "YYYY-MM-DD", true);
          const end = promo.end_date
            ? dayjs(promo.end_date, "YYYY-MM-DD", true)
            : null;

          if (end) {
            if (
              !today.isSameOrAfter(start, "day") ||
              !today.isSameOrBefore(end, "day")
            ) {
              return false;
            }
          } else {
            if (!today.isSameOrAfter(start, "day")) {
              return false;
            }
          }
        }

        // Filtros automáticos por vista
        if (selectedView === "anual") {
          const start = dayjs(promo.start_date, "YYYY-MM-DD", true);
          const end = promo.end_date
            ? dayjs(promo.end_date, "YYYY-MM-DD", true)
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
            if (start.year() !== focusedYear) return false;
          }
        } else if (selectedView === "mensual") {
          const start = dayjs(promo.start_date, "YYYY-MM-DD", true);
          const end = promo.end_date
            ? dayjs(promo.end_date, "YYYY-MM-DD", true)
            : null;

          const monthStart = focusedDate.startOf("month");
          const monthEnd = focusedDate.endOf("month");

          if (end) {
            const startsBeforeMonthEnd =
              start.isBefore(monthEnd) || start.isSame(monthEnd, "day");
            const endsAfterMonthStart =
              end.isAfter(monthStart) || end.isSame(monthStart, "day");
            if (!startsBeforeMonthEnd || !endsAfterMonthStart) return false;
          } else {
            if (
              !start.isSame(monthStart, "month") ||
              start.year() !== focusedDate.year()
            )
              return false;
          }
        } else if (selectedView === "semanal") {
          const start = dayjs(promo.start_date, "YYYY-MM-DD", true);
          const end = promo.end_date
            ? dayjs(promo.end_date, "YYYY-MM-DD", true)
            : null;

          const weekStart = focusedDate.startOf("week");
          const weekEnd = focusedDate.endOf("week");

          if (end) {
            const startsBeforeWeekEnd =
              start.isBefore(weekEnd) || start.isSame(weekEnd, "day");
            const endsAfterWeekStart =
              end.isAfter(weekStart) || end.isAfter(weekStart, "day");
            if (!startsBeforeWeekEnd || !endsAfterWeekStart) return false;
          } else {
            if (!start.isBetween(weekStart, weekEnd, null, "[]")) return false;
          }
        } else if (selectedView === "dia") {
          const start = dayjs(promo.start_date, "YYYY-MM-DD", true);

          if (!start.isSame(focusedDate, "day")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));
  }, [
    promotions,
    stores,
    tipos,
    descuentoRange,
    duracion,
    tiendas,
    soloVigentes,
    focusedYear,
    selectedView,
    focusedDate,
    isLoading,
    isError,
  ]);

  return filteredPromotions;
};
