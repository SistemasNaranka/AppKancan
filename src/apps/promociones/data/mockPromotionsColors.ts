import { PromotionType } from "../types/promotion";

// Colores por defecto si Directus no tiene colores configurados
export const defaultPromotionColors: Record<PromotionType, string> = {
  "Black Friday": "#000000",
  "Navidad": "#EF280F",
  "2x1": "#024A86",
  "Halloween": "#FF9800",
  "Descuento": "#01831B",
  "Liquidacion": "#01831B",
};

/**
 * Mapeo legacy para compatibilidad
 * @deprecated Usar usePromotionColors hook en su lugar
 */
export const promotionColors: Record<string, string> = {
  "Black Friday": "#000000",
  "Navidad": "#EF280F",
  "2x1": "#024A86",
  "Halloween": "#FF9800",
  "Descuento": "#01831B",
  "Liquidacion": "#01831B",
};

/**
 * Hook para obtener colores de promociones desde Directus
 * con fallback a colores por defecto
 */
export const usePromotionColors = () => {
  const { data: tiposPromocion, isLoading } = (() => {
    try {
      // Intentar importar el hook dinámicamente
      const { usePromotionTypes } = require("../hooks/usePromotionTypes");
      return usePromotionTypes();
    } catch {
      return { data: undefined, isLoading: false };
    }
  })();

  // Crear mapa de colores desde Directus
  const colorsFromDirectus: Record<string, string> = {};
  
  if (tiposPromocion) {
    tiposPromocion.forEach((tipo) => {
      if (tipo.color) {
        colorsFromDirectus[tipo.nombre] = tipo.color;
      }
    });
  }

  // Combinar colores de Directus con los por defecto
  const colors = {
    ...defaultPromotionColors,
    ...colorsFromDirectus,
  };

  return {
    colors,
    isLoading,
    getColor: (tipoPromocion: string) => {
      return colors[tipoPromocion] || defaultPromotionColors["Descuento"];
    },
  };
};