export type PromotionType =
  | "Black Friday"
  | "Navidad"
  | "2x1"
  | "Halloween"
  | "Liquidación"
  | "Descuento";

export type PromotionDuration = "temporal" | "fija";

export interface Promotion {
  id: string | number;
  tipo: PromotionType;
  descripcion: string;
  tiendas: string[];
  fecha_inicio: string;
  fecha_final?: string; // 🔹 opcional para promociones fijas
  hora_inicio?: string;
  hora_final?: string;
  descuento: number;
  duracion: PromotionDuration; // 🔹 nuevo campo
}
