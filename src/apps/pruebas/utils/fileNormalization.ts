// src/pruebas/utils/fileNormalization.ts
import { MapeoArchivo, TiendaMapeo } from '../types/mapeo.types';

/**
 * Calcula similitud entre dos strings usando fuzzy matching
 * Retorna un valor entre 0 y 1
 */
export const fuzzyMatch = (search: string, target: string): number => {
  // Normalizar: minúsculas, quitar caracteres especiales y fechas
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, '') // Quitar fechas DD-MM-YYYY
      .replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, '') // Quitar fechas YYYY-MM-DD
      .replace(/[^a-z0-9\s]/g, ' ')            // Caracteres especiales -> espacios
      .replace(/\s+/g, ' ')                    // Múltiples espacios -> uno
      .trim();
  };
  
  const searchNorm = normalize(search);
  const targetNorm = normalize(target);
  
  // Coincidencia exacta
  if (searchNorm === targetNorm) return 1.0;
  
  // Uno contiene al otro
  if (targetNorm.includes(searchNorm) || searchNorm.includes(targetNorm)) {
    return 0.9;
  }
  
  // Comparar palabras clave
  const searchWords = searchNorm.split(' ').filter(w => w.length > 2);
  const targetWords = targetNorm.split(' ').filter(w => w.length > 2);
  
  if (searchWords.length === 0 || targetWords.length === 0) return 0;
  
  let matches = 0;
  searchWords.forEach(searchWord => {
    if (targetWords.some(targetWord => 
      targetWord.includes(searchWord) || searchWord.includes(targetWord)
    )) {
      matches++;
    }
  });
  
  return matches / Math.max(searchWords.length, targetWords.length);
};

/**
 * Encuentra el mejor mapeo para un nombre de archivo
 */
export const findBestMatch = (
  fileName: string,
  mappingTable: MapeoArchivo[]
): { mapeo: MapeoArchivo; tipoArchivo: string } | null => {
  let bestMatch: MapeoArchivo | null = null;
  let bestScore = 0.5; // Umbral mínimo de coincidencia
  let tipoArchivo = '';
  
  console.log(`🔍 Buscando mapeo para: "${fileName}"`);
  
  mappingTable.forEach((mapping) => {
    const score = fuzzyMatch(mapping.archivoOrigen, fileName);
    console.log(`  - "${mapping.archivoOrigen}" → Score: ${(score * 100).toFixed(1)}%`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
      tipoArchivo = mapping.archivoOrigen;
    }
  });
  
  if (bestMatch) {
    console.log(`✓ Mejor coincidencia: "${tipoArchivo}" (${(bestScore * 100).toFixed(1)}%)`);
  } else {
    console.log(`✗ No se encontró coincidencia válida (umbral: 50%)`);
  }
  
  return bestMatch ? { mapeo: bestMatch, tipoArchivo } : null;
};

/**
 * Elimina columnas específicas de los datos
 */
export const eliminarColumnasPorNombre = (
  datos: any[],
  columnasEliminar: string[]
): any[] => {
  const columnasSet = new Set(columnasEliminar.map(c => c.toLowerCase()));
  
  return datos.map((fila) => {
    const filaNueva: any = {};
    Object.keys(fila).forEach(col => {
      if (!columnasSet.has(col.toLowerCase())) {
        filaNueva[col] = fila[col];
      }
    });
    return filaNueva;
  });
};

/**
 * Mapea nombres de tiendas en todas las celdas del archivo
 * Busca coincidencias y reemplaza con el nombre normalizado + agrega tiendaId
 */
export const mapearNombresTiendasEnTodasLasCeldas = (
  datos: any[],
  mapeosTienda: TiendaMapeo[],
  tipoArchivo: string
): any[] => {
  // Filtrar solo los mapeos relevantes para este tipo de archivo
  const mapeosRelevantes = mapeosTienda.filter(
    m => m.archivoOrigen.toLowerCase() === tipoArchivo.toLowerCase()
  );

  console.log(`📋 Mapeos de tiendas para "${tipoArchivo}":`, mapeosRelevantes);

  if (mapeosRelevantes.length === 0) {
    console.warn(`⚠ No hay mapeos de tiendas configurados para "${tipoArchivo}"`);
    return datos;
  }

  return datos.map((fila, index) => {
    const filaNueva: any = { ...fila };
    let tiendaIdEncontrado: number | null = null;
    let tiendaEncontrada: string | null = null;
    
    // Buscar en cada celda de la fila
    Object.keys(fila).forEach((columna) => {
      const valor = String(fila[columna] || '').trim();
      if (!valor) return;
      
      // Buscar coincidencia con algún mapeo
      for (const mapeo of mapeosRelevantes) {
        const valorLower = valor.toLowerCase();
        const tiendaLower = mapeo.tiendaArchivo.toLowerCase();
        
        // Coincidencia exacta o parcial
        if (valorLower === tiendaLower || 
            valorLower.includes(tiendaLower) || 
            tiendaLower.includes(valorLower)) {
          
          filaNueva[columna] = mapeo.tiendaNormalizada;
          tiendaIdEncontrado = mapeo.tiendaId;
          tiendaEncontrada = mapeo.tiendaArchivo;
          
          if (index < 3) { // Log solo para las primeras filas
            console.log(`  Fila ${index + 1}: "${valor}" → "${mapeo.tiendaNormalizada}" (ID: ${mapeo.tiendaId})`);
          }
          break;
        }
      }
    });
    
    // Agregar tiendaId a la fila
    if (tiendaIdEncontrado !== null) {
      filaNueva['tiendaId'] = tiendaIdEncontrado;
    }
    
    return filaNueva;
  });
};

/**
 * Obtiene las columnas que quedan después de eliminar las especificadas
 */
export const obtenerColumnasRestantes = (
  columnasOriginales: string[],
  columnasEliminar: string[]
): string[] => {
  const eliminarSet = new Set(columnasEliminar.map(c => c.toLowerCase()));
  return columnasOriginales.filter(col => !eliminarSet.has(col.toLowerCase()));
};