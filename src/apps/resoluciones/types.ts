export type StatusResolution =
  | "Vigente"
  | "Por vencer"
  | "Vencido"
  | "Pendiente";

export interface Resolution {
  id: number;
  id_ultra?: number;
  numero_formulario: string;
  razon_social: string;
  prefijo: string;
  desde_numero: number;
  hasta_numero: number;
  vigencia: number;
  tipo_solicitud: string;
  fecha_creacion: string;
  fecha_vencimiento: string;
  ultima_factura: number;
  estado: StatusResolution;
  tienda_nombre: string;
  ente_facturador: string;
  empresa: string;
  facturas_disponibles?: number;
  facturas_restantes?: number;
}
