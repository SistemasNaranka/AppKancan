import { useQuery } from "@tanstack/react-query";
import { Promotion } from "../types/promotion";
import { obtenerPromociones } from "../api/directus/read";

/**
 * Hook para obtener todas las promociones desde Directus.
 * Los componentes pueden filtrar por año, mes, día o tipo.
 * 
 * @returns Query object con las promociones
 */
export const usePromotions = () => {
  return useQuery<Promotion[], Error>({
    queryKey: ["promociones"],
    queryFn: obtenerPromociones,
    staleTime: 1000 * 60 * 5, // 5 minutos - los datos se consideran frescos
    gcTime: 1000 * 60 * 30, // 30 minutos - tiempo en caché
    refetchOnWindowFocus: true, // Recargar al volver a la ventana
    refetchOnMount: true, // Recargar al montar el componente
  });
};

/**
 * Hook para obtener una promoción específica por ID
 */
export const usePromotion = (id: number) => {
  return useQuery<Promotion | null, Error>({
    queryKey: ["promocion", id],
    queryFn: async () => {
      const { obtenerPromocionPorId } = await import("../api/directus/read");
      return obtenerPromocionPorId(id);
    },
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};