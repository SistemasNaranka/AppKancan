import { Promotion } from "../types/promotion";

export const mockPromotions: Promotion[] = [
  {
  id: 1,
  tipo: "Halloween",
  descripcion: "Descuento por Halloween",
  tiendas: [
    "Tienda Centro",
    "Tienda Norte",
    "Tienda Sur",
    "Tienda Este",
    "Tienda Oeste",
    "Tienda Mall Plaza",
    "Tienda Aeropuerto",
    "Tienda Universidad",
    "Tienda Parque Central",
    "Tienda Industrial",
    "Tienda Premium",
    "Tienda Virtual",
    "Tienda Campestre",
    "Tienda Estación",
    "Tienda Riviera"
  ],
  fecha_inicio: "2025-10-26",
  fecha_final: "2025-11-01",
  hora_inicio: "09:00",
  hora_final: "22:00",
  descuento: 35,
  duracion: "temporal"
},
  {
    id: 2,
    tipo: "Liquidacion",
    descripcion: "Liquidación de temporada",
    tiendas: ["Tienda Centro"],
    fecha_inicio: "2025-09-01",
    fecha_final: null, // ✅ Promoción fija debe tener null
    hora_inicio: "08:00",
    hora_final: null, // ✅ Promoción fija debe tener null
    descuento: 30,
    duracion: "fija"
  },
  {
    id: 3,
    tipo: "Black Friday",
    descripcion: "Super descuentos Black Friday",
    tiendas: ["Tienda Centro", "Tienda Norte", "Tienda Este"],
    fecha_inicio: "2025-11-29",
    fecha_final: "2025-11-30",
    hora_inicio: "00:00",
    hora_final: "23:59",
    descuento: 50,
    duracion: "temporal"
  },
  {
    id: 4,
    tipo: "Navidad",
    descripcion: "Promociones navideñas",
    tiendas: ["Tienda Centro", "Tienda Sur", "Tienda Oeste"],
    fecha_inicio: "2025-12-15",
    fecha_final: "2025-12-25",
    hora_inicio: "10:00",
    hora_final: "20:00",
    descuento: 40,
    duracion: "temporal"
  },
  {
    id: 5,
    tipo: "Descuento",
    descripcion: "Descuento permanente en productos seleccionados",
    tiendas: ["Tienda Norte", "Tienda Este"],
    fecha_inicio: "2025-01-01",
    fecha_final: null, // ✅ Promoción fija debe tener null
    hora_inicio: "10:00",
    hora_final: null, // ✅ Promoción fija debe tener null
    descuento: 15,
    duracion: "fija"
  },
  {
    id: 6,
    tipo: "2x1",
    descripcion: "Lleva 2 paga 1",
    tiendas: ["Tienda Sur", "Tienda Oeste"],
    fecha_inicio: "2025-10-20",
    fecha_final: "2025-10-31",
    hora_inicio: "12:00",
    hora_final: "18:00",
    descuento: 50,
    duracion: "temporal"
  },
];