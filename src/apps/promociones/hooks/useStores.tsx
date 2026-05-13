import { useQuery } from "@tanstack/react-query";
import { getStores } from "../api/directus/read";
import { Store } from "../types/promotion";


export const useStores = () => {
  return useQuery<Store[], Error>({
    queryKey: ["prom_tiendas"],
    queryFn: async () => await getStores(),
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
  });
};
