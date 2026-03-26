export interface Traslado {
  traslado: number; // ID único del traslado
  fecha: string;
  bodega_origen: string | number;
  nombre_origen: string;
  bodega_destino: string | number;
  nombre_destino: string;
  unidades: number;
  referencia?: string; // Campo nuevo para el detalle
  nombre_referencia?: string; // Campo nuevo para el detalle
}
