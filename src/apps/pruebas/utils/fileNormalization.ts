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
 * Normaliza un string para comparación robusta
 * Elimina acentos, espacios extra, caracteres especiales, y convierte a minúsculas
 */
const normalizarParaComparacion = (str: string): string => {
  return str
    .normalize("NFD") // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ") // Reemplazar caracteres especiales con espacios
    .replace(/\s+/g, " ") // Múltiples espacios a uno solo
    .trim();
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
  // Intento 1: Filtrar por tipo de archivo específico
  let mapeosRelevantes = mapeosTienda.filter(m => m.archivoOrigen.toLowerCase() === tipoArchivo.toLowerCase());

  // Intento 2: Si es ARCHIVO EXTERNO o no hay mapeos específicos para este tipo, usar todos los mapeos disponibles
  if (tipoArchivo === "ARCHIVO EXTERNO" || mapeosRelevantes.length === 0) {
    if (mapeosRelevantes.length === 0 && tipoArchivo !== "ARCHIVO EXTERNO") {
      console.log(`ℹ️ No hay mapeos de tiendas específicos para "${tipoArchivo}". Intentando búsqueda global con todos los mapeos disponibles.`);
    }
    mapeosRelevantes = mapeosTienda;
  }

  console.log(`📋 Mapeos de tiendas a usar para "${tipoArchivo}" (${mapeosRelevantes.length} disponibles)`);

  if (mapeosRelevantes.length === 0) {
    console.warn(`⚠ No hay NINGÚN mapeo de tiendas configurado en el sistema.`);
    return datos;
  }

  // Estadísticas de mapeo
  let filasMapeadas = 0;
  let filasNoMapeadas = 0;
  const tiendasEncontradas = new Set<string>();

  // --- FASE 0: Filtrado de filas inválidas (ej. "Prueba RBM" o filas de totales) ---
  const datosFiltrados = datos.filter((fila) => {
    const valores = Object.values(fila).map(v => String(v || '').trim());

    // 1. Filtrar "Prueba RBM"
    const esPruebaRBM = valores.some(v => v.toLowerCase().includes("prueba rbm"));

    // 2. Filtrar filas de "TOTAL" (Suma del archivo original, no es una transacción real)
    // Buscamos coincidencia EXACTA para evitar borrar "TOTAL SPORT" o similares
    const esFilaTotal = valores.some(v => v.toUpperCase() === "TOTAL");

    // 3. Filtrar filas "RECHAZADA" o "RECHAZADO"
    const esRechazada = valores.some(v => {
      const val = v.toUpperCase();
      return val === "RECHAZADA" || val === "RECHAZADO";
    });

    if (esPruebaRBM) {
      console.log("  🚫 Fila ignorada (contiene 'Prueba RBM'):", fila);
      return false;
    }

    if (esFilaTotal) {
      console.log("  🚫 Fila ignorada (es fila de 'TOTAL'):", fila);
      return false;
    }

    if (esRechazada) {
      console.log("  🚫 Fila ignorada (es 'RECHAZADA/O'):", fila);
      return false;
    }

    return true;
  });

  console.log(`ℹ️ Se filtraron ${datos.length - datosFiltrados.length} filas inválidas.`);

  const datosMapeados = datosFiltrados.map((fila, index) => {
    const filaNueva: any = { ...fila };
    let tiendaIdEncontrado: number | null = null;
    let tiendaEncontrada: string | null = null;

    // --- FASE 1: Búsqueda de Coincidencia Exacta de Nombre ---
    for (const columna of Object.keys(fila)) {
      const valor = String(fila[columna] || '').trim();
      if (!valor || valor.length < 2) continue;

      const valorNormalizado = normalizarParaComparacion(valor);

      for (const mapeo of mapeosRelevantes) {
        const tiendaNormalizada = normalizarParaComparacion(mapeo.tiendaArchivo);

        if (valorNormalizado === tiendaNormalizada) {
          // Si encontramos "NARANKA SAS" (Nombre genérico), necesitamos verificar el terminal
          // Pero si es "KAN CAN JEANS - NARANKA", es un nombre específico y no deberíamos forzar la lógica genérica a menos que tenga terminal.

          const esMapeoGenericoNaranka = tiendaNormalizada === "naranka sas" || tiendaNormalizada === "naranka";

          if (esMapeoGenericoNaranka) {
            // Lógica estricta para NARANKA GENÉRICO:

            if (mapeo.terminal) {
              // Normalizar terminal del mapeo para comparación más robusta
              const terminalMapeo = String(mapeo.terminal).trim().toLowerCase();

              // Buscar coincidencia en valores de la fila
              const tieneTerminal = Object.values(fila).some(v => {
                const valorCelda = String(v).trim().toLowerCase();
                // Comparación exacta o si el valor de la celda contiene el terminal
                const match = valorCelda === terminalMapeo || (valorCelda.includes(terminalMapeo) && terminalMapeo.length > 3);
                // DEBUG SOLO PARA NARANKA
                if (valorNormalizado.includes("naranka") && (valorCelda.includes(terminalMapeo) || valorCelda === terminalMapeo)) {
                  console.log(`    🔍 Debug Naranka: Comparando celda '${valorCelda}' con terminal '${terminalMapeo}' -> Match: ${match}`);
                }
                return match;
              });

              if (!tieneTerminal) {
                if (index < 5) console.log(`    ❌ Falló validación terminal para '${valor}'. Buscaba '${mapeo.terminal}' en fila.`);
                continue;
              }
            } else {
              // Es un mapeo de NARANKA SAS sin terminal definido.
              // AL SER GENÉRICO y no tener terminal para diferenciar, LO IGNORAMOS para evitar agrupación optimista.
              continue;
            }
          } else if (valorNormalizado.includes("naranka") && mapeo.terminal) {
            // Caso: Nombre específico (ej. Kan Can) pero TIENE terminal definido en el mapeo.
            // Debemos validar el terminal si existe obligatoriamente.
            const terminalMapeo = String(mapeo.terminal).trim().toLowerCase();
            const tieneTerminal = Object.values(fila).some(v => {
              const valorCelda = String(v).trim().toLowerCase();
              return valorCelda === terminalMapeo || (valorCelda.includes(terminalMapeo) && terminalMapeo.length > 3);
            });

            if (!tieneTerminal) continue;
          }

          tiendaIdEncontrado = mapeo.tiendaId;
          tiendaEncontrada = mapeo.tiendaNormalizada;
          filaNueva[columna] = tiendaEncontrada; // ¡REEMPLAZAR EL NOMBRE EN EL ARCHIVO!

          if (index < 3) {
            console.log(`  ✓ Fila ${index + 1} [Exacto en "${columna}"]: "${valor}" → "${tiendaEncontrada}"`);
            if (mapeo.terminal) console.log(`    (Validado con Terminal: ${mapeo.terminal})`);
          }
          break;
        }
      }
      if (tiendaIdEncontrado) break;
    }

    // --- FASE 2: Búsqueda de Coincidencia Parcial (Último recurso) ---
    if (!tiendaIdEncontrado) {
      for (const columna of Object.keys(fila)) {
        const valor = String(fila[columna] || '').trim();
        // Ignorar celdas con números muy largos o fechas
        if (!valor || valor.length < 4 || /^\d+$/.test(valor) || valor.includes('-') || valor.includes('/')) continue;

        const valorNormalizado = normalizarParaComparacion(valor);

        for (const mapeo of mapeosRelevantes) {
          const tiendaNormalizada = normalizarParaComparacion(mapeo.tiendaArchivo);
          if (tiendaNormalizada.length < 4) continue;

          if (valorNormalizado.includes(tiendaNormalizada)) {
            // --- INICIO LÓGICA DE PROTECCIÓN NARANKA (FASE 2) ---
            const esMapeoGenericoNaranka = tiendaNormalizada === "naranka sas" || tiendaNormalizada === "naranka";

            if (esMapeoGenericoNaranka) {
              if (mapeo.terminal) {
                const terminalMapeo = String(mapeo.terminal).trim().toLowerCase();
                const tieneTerminal = Object.values(fila).some(v => {
                  const valorCelda = String(v).trim().toLowerCase();
                  return valorCelda === terminalMapeo || (valorCelda.includes(terminalMapeo) && terminalMapeo.length > 3);
                });

                if (!tieneTerminal) continue;
              } else {
                continue; // Ignorar mapeo genérico en parciales también
              }
            } else if (valorNormalizado.includes("naranka") && mapeo.terminal) {
              const terminalMapeo = String(mapeo.terminal).trim().toLowerCase();
              const tieneTerminal = Object.values(fila).some(v => {
                const valorCelda = String(v).trim().toLowerCase();
                return valorCelda === terminalMapeo || (valorCelda.includes(terminalMapeo) && terminalMapeo.length > 3);
              });

              if (!tieneTerminal) continue;
            }
            // --- FIN LÓGICA DE PROTECCIÓN NARANKA ---

            tiendaIdEncontrado = mapeo.tiendaId;
            tiendaEncontrada = mapeo.tiendaNormalizada;
            filaNueva[columna] = tiendaEncontrada; // ¡REEMPLAZAR EL NOMBRE EN EL ARCHIVO!

            if (index < 3) {
              console.log(`  ≈ Fila ${index + 1} [Parcial en "${columna}"]: "${valor}" ≈ "${tiendaEncontrada}"`);
            }
            break;
          }
        }
        if (tiendaIdEncontrado) break;
      }
    }

    // Agregar metadatos de tienda a la fila
    if (tiendaIdEncontrado !== null) {
      filaNueva['tiendaId'] = tiendaIdEncontrado;
      filaNueva['_tienda_normalizada'] = tiendaEncontrada;
      filasMapeadas++;
      tiendasEncontradas.add(tiendaEncontrada!);
    } else {
      filasNoMapeadas++;
      if (filasNoMapeadas <= 3) {
        console.warn(`  ⚠ Fila ${index + 1}: No se encontró tienda. Valores:`, Object.values(fila).slice(0, 5));
      }
    }

    return filaNueva;
  });

  // Resumen de estadísticas
  console.log(`\n📊 Estadísticas de mapeo para "${tipoArchivo}":`);
  console.log(`  ✓ Filas mapeadas: ${filasMapeadas}/${datos.length} (${((filasMapeadas / datos.length) * 100).toFixed(1)}%)`);
  console.log(`  ⚠ Filas sin mapear: ${filasNoMapeadas}/${datos.length} (${((filasNoMapeadas / datos.length) * 100).toFixed(1)}%)`);
  console.log(`  🏪 Tiendas únicas encontradas: ${tiendasEncontradas.size}`, Array.from(tiendasEncontradas));

  if (filasNoMapeadas > 0) {
    console.warn(`\n⚠️ ADVERTENCIA: ${filasNoMapeadas} filas no se pudieron mapear a ninguna tienda.`);
    console.warn(`   Estas filas aparecerán como "SIN TIENDA" en la agrupación.`);
  }

  return datosMapeados;
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

/**
 * Interfaz para resultados de validación
 */
export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  estadisticas: {
    totalFilas: number;
    filasMapeadas: number;
    filasNoMapeadas: number;
    porcentajeMapeado: number;
    tiendasUnicas: string[];
  };
}

/**
 * Valida que los datos normalizados tengan la información de tienda correctamente asignada
 */
export const validarDatosNormalizados = (
  datos: any[],
  tipoArchivo: string
): ResultadoValidacion => {
  const errores: string[] = [];
  const advertencias: string[] = [];

  if (datos.length === 0) {
    errores.push("No hay datos para validar");
    return {
      valido: false,
      errores,
      advertencias,
      estadisticas: {
        totalFilas: 0,
        filasMapeadas: 0,
        filasNoMapeadas: 0,
        porcentajeMapeado: 0,
        tiendasUnicas: []
      }
    };
  }

  // Contar filas con y sin tienda
  let filasMapeadas = 0;
  let filasNoMapeadas = 0;
  const tiendasUnicas = new Set<string>();

  datos.forEach((fila, index) => {
    if (fila._tienda_normalizada) {
      filasMapeadas++;
      tiendasUnicas.add(fila._tienda_normalizada);
    } else {
      filasNoMapeadas++;
      if (filasNoMapeadas <= 5) {
        advertencias.push(`Fila ${index + 1} sin tienda asignada`);
      }
    }
  });

  const porcentajeMapeado = (filasMapeadas / datos.length) * 100;

  // Validaciones
  if (filasNoMapeadas === datos.length) {
    errores.push(`NINGUNA fila fue mapeada a una tienda para "${tipoArchivo}". Verifica la configuración de mapeos en Directus.`);
  } else if (porcentajeMapeado < 50) {
    advertencias.push(`Solo ${porcentajeMapeado.toFixed(1)}% de las filas fueron mapeadas. Esto puede indicar un problema con los mapeos.`);
  } else if (filasNoMapeadas > 0) {
    advertencias.push(`${filasNoMapeadas} filas (${((filasNoMapeadas / datos.length) * 100).toFixed(1)}%) no tienen tienda asignada`);
  }

  if (tiendasUnicas.size === 0) {
    errores.push("No se encontraron tiendas en los datos");
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    estadisticas: {
      totalFilas: datos.length,
      filasMapeadas,
      filasNoMapeadas,
      porcentajeMapeado,
      tiendasUnicas: Array.from(tiendasUnicas).sort()
    }
  };
};