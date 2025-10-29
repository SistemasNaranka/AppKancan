import { useQuery } from "@tanstack/react-query";
import { obtenerTiposPromocion, DirectusPromoTipo } from "../api/directus/read";

/**
 * Hook para obtener todos los tipos de promoción desde Directus
 */
export const usePromotionTypes = () => {
  return useQuery<DirectusPromoTipo[], Error>({
    queryKey: ["tipos_promocion"],
    queryFn: obtenerTiposPromocion,
    staleTime: 1000 * 60 * 60, // 1 hora - los tipos rara vez cambian
    gcTime: 1000 * 60 * 120, // 2 horas en caché
    refetchOnWindowFocus: false,
  });
};