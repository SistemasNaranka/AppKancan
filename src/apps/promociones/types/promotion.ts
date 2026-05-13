export type PromotionType =
  | "Black Friday"
  | "Navidad"
  | "2x1"
  | "Halloween"
  | "Liquidacion"
  | "Descuento";

export type PromotionDuration = "temporal" | "fija";

export interface Promotion {
  id: number;
  type: string;
  name: string;
  notes?: string;
  stores: string[];
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string | null;
  discount: number;
  duration: "temporal" | "fija";
  color: string;
}

export interface Store {
  id: string | number;
  name: string;
  codigo_ultra?: number;
  company?: string;
}
