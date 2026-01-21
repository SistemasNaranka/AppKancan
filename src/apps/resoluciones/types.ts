// Estado posible de una resolución
export type EstadoResolucion = 'Vigente' | 'Por vencer' | 'Vencido' | 'Pendiente';

// Interfaz principal de una resolución
export interface Resolucion {
  id: number;
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
  estado: EstadoResolucion;
  tienda_nombre: string;
  ente_facturador: string;
}