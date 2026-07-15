import { useQuery } from "@tanstack/react-query";
import { Promotion } from "../types/promotion";
import { getPromotions, getPromotionById } from "../api/directus/read";

export const usePromotions = () => {
  return useQuery<Promotion[], Error>({
    queryKey: ["promociones"],
    queryFn: getPromotions,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const usePromotion = (id: number) => {
  return useQuery<Promotion | null, Error>({
    queryKey: ["promocion", id],
    queryFn: () => getPromotionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};
