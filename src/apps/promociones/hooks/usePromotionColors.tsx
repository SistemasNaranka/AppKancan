import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { obtenerTiposPromocion } from "../api/directus/read";
import { PromotionType } from "../types/promotion";

// Colores por defecto como fallback
const DEFAULT_COLORS: Record<string, string> = {
  "Black Friday": "#000000",
  "Navidad": "#EF280F",
  "2x1": "#024A86",
  "Halloween": "#FF9800",
  "Descuento": "#01831B",
  "Liquidacion": "#01831B",
};

/**
 * Hook para obtener colores de tipos de promoción desde Directus
 * Incluye fallback a colores por defecto
 */
export const usePromotionColors = () => {
  const { data: tiposPromocion, isLoading } = useQuery({
    queryKey: ["tipos_promocion"],
    queryFn: obtenerTiposPromocion,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Crear mapa de colores desde Directus con fallback
  const colors = useMemo(() => {
    const colorMap: Record<string, string> = { ...DEFAULT_COLORS };

    if (tiposPromocion) {
      tiposPromocion.forEach((tipo) => {
        if (tipo.color) {
          colorMap[tipo.nombre] = tipo.color;
        }
      });
    }

    return colorMap;
  }, [tiposPromocion]);

  /**
   * Obtener color para un tipo específico
   * @param tipo - Nombre del tipo de promoción
   * @returns Color en formato hex
   */
  const getColor = (tipo: string | PromotionType): string => {
    return colors[tipo] || DEFAULT_COLORS["Descuento"] || "#01831B";
  };

  return {
    colors,
    getColor,
    isLoading,
  };
};