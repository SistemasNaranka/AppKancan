import { Promotion } from "../types/promotion";

export const mockPromotions: Promotion[] = [
  {
    id: 1,
    tipo: "Halloween",
    descripcion: "Descuento por Halloween",
    tiendas: ["Tienda Centro", "Tienda Norte", "Tienda Sur"],
    fecha_inicio: "2025-10-26",
    fecha_final: "2025-11-01",
    hora_inicio: "09:00",
    hora_final: "22:00",
    descuento: 35,
    duracion: "temporal"
  },
  {
    id: 2,
    tipo: "Black Friday",
    descripcion: "Ofertas en toda la línea de invierno",
    tiendas: ["Outlet Premium", "Tienda Sur"],
    fecha_inicio: "2025-11-25",
    fecha_final: "2025-11-30",
    descuento: 50,
    duracion: "temporal"
  },
  {
    id: 3,
    tipo: "Liquidación",
    descripcion: "Liquidación de temporada",
    tiendas: ["Tienda Centro"],
    fecha_inicio: "2025-09-01",
    descuento: 30,
    duracion: "fija"
  },
  {
    id: 4,
    tipo: "Descuento",
    descripcion: "Descuento permanente en básicos",
    tiendas: ["Tienda Norte"],
    fecha_inicio: "2025-01-01",
    descuento: 10,
    duracion: "fija"
  }
];
