export interface Traslado {
  traslado: number; // ✅ Cambiado de 'id?' a 'traslado' (obligatorio)
  fecha: string;
  bodega_origen: string;
  nombre_origen: string;
  bodega_destino: string;
  nombre_destino: string;
  unidades: number;
}
