export type PromotionType =
  | "discount"
  | "season"
  | "bogo"
  | "bundle"
  | "clearance"
  | "special";

export type PromotionDuration = "fija" | "temporal";

export interface Promotion {
  id: string;
  title: string;
  description: string;
  stores: string[]; // ✅ ahora puede tener varias tiendas
  type: PromotionType;
  duration: PromotionDuration;
  startDate: Date;
  endDate: Date;
  discount?: number;
}

export const promotionTypeLabels: Record<PromotionType, string> = {
  discount: "Descuento",
  season: "Temporada",
  bogo: "2x1",
  bundle: "Paquete",
  clearance: "Liquidación",
  special: "Especial",
};

export const stores = [
  "Ipiales Centro",
  "Buga Centro",
  "CosmoCentro",
  "Unico Cali",
  "Popayan Castilla",
  "Popayan Centro",
  "Armenia Centro",
  "Jamundi Centro",
  "Unico Yumbo",
  "Unicentro Palmira",
  "Unicentro1 Cali",
  "Unicentro2 Cali",
  "Palmira Centro",
  "Armenia 14",
  "Tulua Centro",
  "Pasto Centro",
  "Cali Centro",
  "Cali Salomia",
  "Palmetto",
  "Campanario",
  "Chipichape",
  "Unico Neiva",
  "Calima",
  "Unico Pasto",
  "Llanogrande",
  "La Herradura",
  "Cartago Centro",
  "Nuestro Cartago",
  "Victoria Plaza",
  "Unico Dosquebradas",
  "Terraplaza",
  "Manizales 23",
  "Manizales Centro",
  "Cali Carrera8",
  "Unico Bucaramanga",
  "Popayan Arquidiocesis",
  "Unico Liquidador",
  "SuperCentro",
  "Oficina",
  "Tienda Online",
  "Pereira Centro",
  "Bucaramanga Centro",
  "Corte",
  "Mall Plaza"
];
