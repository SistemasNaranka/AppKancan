import { useQuery } from "@tanstack/react-query";

interface FestivoApi {
  date: string;
  localName: string;
  name: string;
}

export interface FestivoMap {
  [fecha: string]: string;
}

async function fetchFestivos(year: number): Promise<FestivoMap> {
  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/CO`,
  );
  if (!res.ok) return {};
  const data: FestivoApi[] = await res.json();
  const map: FestivoMap = {};
  for (const f of data) map[f.date] = f.localName;
  return map;
}

export function useFestivos(year: number) {
  return useQuery({
    queryKey: ["festivos", "CO", year],
    queryFn: () => fetchFestivos(year),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}
