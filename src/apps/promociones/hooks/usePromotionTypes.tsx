import { useQuery } from "@tanstack/react-query";
import { getPromotionTypes, DirectusPromoTipo } from "../api/directus/read";

export const usePromotionTypes = () => {
  return useQuery<DirectusPromoTipo[], Error>({
    queryKey: ["tipos_promocion"],
    queryFn: getPromotionTypes,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
    refetchOnWindowFocus: false,
  });
};