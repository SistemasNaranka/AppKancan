// src/pruebas/types/mapeo.types.ts

/**
 * Estructura tal cual viene de Directus (tabla Mapeo_Nombres_Archivos)
 */
export interface FileNameMapping {
  id: number;
  source_file: string;
  store_file: string;
  store_id: number;
  name: string;
  terminal: string;
  acquirer_id?: string;
}

/**
 * Configuración de normalización por tipo de archivo
 */
export interface MapeoArchivo {
  source_file: string;
  columnasEliminar: string[];
}

/**
 * Mapeo de nombres de tiendas para reemplazo
 */
export interface TiendaMapeo {
  source_file: string;
  store_file: string;
  tiendaNormalizada: string;
  store_id: number;
  terminal?: string;
  acquirer_id?: string;
}

/**
 * Archivo subido por el usuario
 */

export interface ArchivoSubido {
  nombre: string;
  tipo: string;
  datos: any[];
  columnas: string[];
  normalizado?: boolean;
  tipoArchivo?: string;
  columnasEliminar?: string[];
}