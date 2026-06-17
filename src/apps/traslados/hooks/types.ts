export interface Traslado {
  traslado: number;
  fecha: string;
  bodega_origen: string | number;
  nombre_origen: string;
  bodega_destino: string | number;
  nombre_destino: string;
  unidades: number;
  referencia?: string;
  nombre_referencia?: string;
}
