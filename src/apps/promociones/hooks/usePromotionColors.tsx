import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPromotionTypes } from "../api/directus/read";

import { PromotionType } from "../types/promotion";

const DEFAULT_COLORS: Record<string, string> = {
  "Black Friday": "#000000",
  "Navidad": "#EF280F",
  "2x1": "#024A86",
  "Halloween": "#FF9800",
  "Descuento": "#01831B",
  "Liquidacion": "#01831B",
};

export const usePromotionColors = () => {
  const { data: tiposPromocion, isLoading } = useQuery({
    queryKey: ["tipos_promocion"],
    queryFn: getPromotionTypes,
    staleTime: 1000 * 60 * 60,
  });

  const colors = useMemo(() => {
    const colorMap: Record<string, string> = { ...DEFAULT_COLORS };

    if (tiposPromocion) {
      tiposPromocion.forEach((tipo) => {
        if (tipo.color_code) {
          colorMap[tipo.name] = tipo.color_code;
        }
      });
    }

    return colorMap;
  }, [tiposPromocion]);

  const getColor = (tipo: string | PromotionType): string => {
    return colors[tipo] || DEFAULT_COLORS["Descuento"] || "#01831B";
  };

  return {
    colors,
    getColor,
    isLoading,
  };
};