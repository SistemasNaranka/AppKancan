// src/pruebas/utils/fileNormalization.ts
import { MapeoArchivo, TiendaMapeo } from '../types/mapeo.types';

export const fuzzyMatch = (search: string, target: string): number => {
  const searchLower = search.toLowerCase().replace(/[^a-z0-9]/g, ''); // Quitar caracteres especiales
  const targetLower = target.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (searchLower === targetLower) return 1.0;
  if (targetLower.includes(searchLower)) return 0.9; // Si contiene la palabra completa
  
  const searchLength = searchLower.length;
  const targetLength = targetLower.length;
  
  if (searchLength > targetLength) return 0;
  
  let hits = 0;
  let hitIdx = -1;
  
  for (let i = 0; i < searchLength; i++) {
    const searchChar = searchLower[i];
    for (let j = hitIdx + 1; j < targetLength; j++) {
      if (searchChar === targetLower[j]) {
        hits++;
        hitIdx = j;
        break;
      }
    }
  }
  
  return hits / targetLength;
};

export const findBestMatch = (
  fileName: string,
  mappingTable: MapeoArchivo[]
): { mapeo: MapeoArchivo; tipoArchivo: string } | null => {
  let bestMatch: MapeoArchivo | null = null;
  let bestScore = 0.5;
  let tipoArchivo = '';
  
  mappingTable.forEach((mapping) => {
    const score = fuzzyMatch(mapping.archivoOrigen, fileName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
      tipoArchivo = mapping.archivoOrigen;
    }
  });
  
  return bestMatch ? { mapeo: bestMatch, tipoArchivo } : null;
};

// Eliminar columnas específicas
export const eliminarColumnas = (
  datos: any[],
  columnasEliminar: string[]
): any[] => {
  return datos.map((fila) => {
    const filaNueva: any = { ...fila };
    columnasEliminar.forEach((col) => {
      delete filaNueva[col];
    });
    return filaNueva;
  });
};

// Buscar y reemplazar nombres de tiendas en TODAS las celdas
export const mapearNombresTiendasEnTodasLasCeldas = (
  datos: any[],
  mapeosTienda: TiendaMapeo[],
  tipoArchivo: string
): any[] => {
  // Filtrar mapeos solo para este tipo de archivo
  const mapeosRelevantes = mapeosTienda.filter(
    m => m.archivoOrigen.toLowerCase() === tipoArchivo.toLowerCase()
  );

  return datos.map((fila) => {
    const filaNueva: any = { ...fila };
    let tiendaIdEncontrado: number | null = null;
    
    // Buscar en cada celda de la fila
    Object.keys(fila).forEach((columna) => {
      const valor = String(fila[columna] || '').trim();
      
      // Comparar con cada mapeo
      mapeosRelevantes.forEach((mapeo) => {
        const valorLower = valor.toLowerCase();
        const tiendaLower = mapeo.tiendaArchivo.toLowerCase();
        
        // Si encuentra coincidencia (exacta o contenida)
        if (valorLower === tiendaLower || valorLower.includes(tiendaLower)) {
          filaNueva[columna] = mapeo.tiendaNormalizada;
          tiendaIdEncontrado = mapeo.tiendaId;
        }
      });
    });
    
    // Agregar el ID de la tienda si se encontró
    if (tiendaIdEncontrado !== null) {
      filaNueva['tiendaId'] = tiendaIdEncontrado;
    }
    
    return filaNueva;
  });
};

// Obtener las columnas finales después de eliminar
export const obtenerColumnasFinales = (
  columnasOriginales: string[],
  columnasEliminar: string[]
): string[] => {
  return columnasOriginales.filter(col => !columnasEliminar.includes(col));
};
