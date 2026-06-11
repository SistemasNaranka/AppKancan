import { useQuery } from "@tanstack/react-query";

interface HolidayApi {
  date: string;
  localName: string;
  name: string;
}

export interface HolidayMap {
  [date: string]: string;
}

async function fetchHolidays(year: number): Promise<HolidayMap> {
  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/CO`,
  );
  if (!res.ok) return {};
  const data: HolidayApi[] = await res.json();
  const map: HolidayMap = {};
  for (const f of data) map[f.date] = f.localName;
  return map;
}

export function useHolidays(year: number) {
  return useQuery({
    queryKey: ["holidays", "CO", year],
    queryFn: () => fetchHolidays(year),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}
