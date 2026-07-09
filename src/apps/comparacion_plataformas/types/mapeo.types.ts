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

export interface MapeoArchivo {
  source_file: string;
  columnasEliminar: string[];
}

export interface TiendaMapeo {
  source_file: string;
  store_file: string;
  tiendaNormalizada: string;
  store_id: number;
  terminal?: string;
  acquirer_id?: string;
}

export interface ArchivoSubido {
  nombre: string;
  tipo: string;
  datos: any[];
  columnas: string[];
  datosOriginales?: any[];
  columnasOriginales?: string[];
  normalizado?: boolean;
  tipoArchivo?: string;
  columnasEliminar?: string[];
}