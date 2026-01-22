export interface MapeoArchivo {
  archivoOrigen: string;      // "creditos", "transactions", etc.
  columnasEliminar: string[]; // Columnas a eliminar
}

export interface TiendaMapeo {
  archivoOrigen: string; // Nombre orignal del archivo
  tiendaArchivo: string; // Nombre de la tienda dentro del archivo
  tiendaNormalizada: string; // Nombre final de la tienda
  tiendaId: number;
}

export interface ArchivoSubido {
  nombre: string;
  tipo: string;
  datos: any[];
  columnas: string[];
  normalizado?: boolean;
  mapeoEncontrado?: MapeoArchivo;
  tipoArchivo?: string; // "creditos", "transactions", etc.
}
