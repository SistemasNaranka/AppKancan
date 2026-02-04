// src/pruebas/types/mapeo.types.ts

/**
 * Estructura tal cual viene de Directus (tabla Mapeo_Nombres_Archivos)
 */
export interface MapeoNombreArchivo {
  id: number;
  Archivo_origen: string;   // Nombre del archivo (ej: "Maria Perez - Bco Occidente")
  Tienda_archivo: string;   // Nombre de tienda en el archivo (ej: "SUPER CENTRO TULUA D")
  Tienda_ID: number;        // ID de la tienda
  Nombre: string;           // Nombre normalizado final (ej: "SUPERCENTRO")
  Terminal: string;         // Nuevo campo: ID de terminal para identificar la tienda
}

/**
 * Configuración de normalización por tipo de archivo
 */
export interface MapeoArchivo {
  archivoOrigen: string;
  columnasEliminar: string[];
}

/**
 * Mapeo de nombres de tiendas para reemplazo
 */
export interface TiendaMapeo {
  archivoOrigen: string;      // Para filtrar por tipo de archivo
  tiendaArchivo: string;      // Nombre original en el archivo
  tiendaNormalizada: string;  // Nombre final normalizado
  tiendaId: number;           // ID de la tienda
  terminal?: string;          // ID de terminal (opcional)
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