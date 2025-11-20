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
  tipo: string;
  descripcion: string;
  observaciones?: string; // Campo opcional para observaciones
  tiendas: string[];
  fecha_inicio: string;
  fecha_final: string | null;
  hora_inicio: string;
  hora_fin: string | null;
  descuento: number;
  duracion: "temporal" | "fija";
  color: string; // 👈 agrega este campo
}
