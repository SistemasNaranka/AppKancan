import { MapeoArchivo, TiendaMapeo } from "../types/mapeo.types";

export const fuzzyMatch = (search: string, target: string): number => {
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, "")
      .replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const searchNorm = normalize(search);
  const targetNorm = normalize(target);

  if (searchNorm === targetNorm) return 1.0;

  if (targetNorm.includes(searchNorm) || searchNorm.includes(targetNorm)) {
    return 0.9;
  }

  const searchWords = searchNorm.split(" ").filter((w) => w.length > 2);
  const targetWords = targetNorm.split(" ").filter((w) => w.length > 2);

  if (searchWords.length === 0 || targetWords.length === 0) return 0;

  let matches = 0;
  searchWords.forEach((searchWord) => {
    if (
      targetWords.some(
        (targetWord) =>
          targetWord.includes(searchWord) || searchWord.includes(targetWord),
      )
    ) {
      matches++;
    }
  });

  return matches / Math.max(searchWords.length, targetWords.length);
};

export const findBestMatch = (
  fileName: string,
  mappingTable: MapeoArchivo[],
): { mapeo: MapeoArchivo; tipoArchivo: string } | null => {
  let bestMatch: MapeoArchivo | null = null;
  let bestScore = 0.5;
  let tipoArchivo = "";


  mappingTable.forEach((mapping) => {
    const score = fuzzyMatch(mapping.source_file, fileName);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
      tipoArchivo = mapping.source_file;
    }
  });

  if (bestMatch) {
  } else {
  }

  return bestMatch ? { mapeo: bestMatch, tipoArchivo } : null;
};

export const eliminarColumnasPorNombre = (
  datos: any[],
  columnasEliminar: string[],
): any[] => {
  const columnasSet = new Set(columnasEliminar.map((c) => c.toLowerCase()));

  return datos.map((fila) => {
    const filaNueva: any = {};
    Object.keys(fila).forEach((col) => {
      if (!columnasSet.has(col.toLowerCase())) {
        filaNueva[col] = fila[col];
      }
    });
    return filaNueva;
  });
};

const normalizarParaComparacion = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const mapearNombresTiendasEnTodasLasCeldas = (
  datos: any[],
  mapeosTienda: TiendaMapeo[],
  tipoArchivo: string,
): any[] => {
  const datosFiltrados = datos.filter((fila) => {
    const valores = Object.values(fila).map((v) => String(v || "").trim());

    const esPruebaRBM = valores.some((v) =>
      v.toLowerCase().includes("prueba rbm"),
    );

    const esFilaTotal = valores.some((v) => v.toUpperCase() === "TOTAL");

    const esRechazada = valores.some((v) => {
      const val = v.toUpperCase().trim();
      return (
        val === "RECHAZADA" || val === "RECHAZADO" || val.includes("RECHAZADA")
      );
    });

    const esAbandonada = valores.some((v) => {
      const val = v.toUpperCase().trim();
      return (
        val.includes("ABANDONAD") || val.includes("ABANDONO")
      );
    });

    if (esPruebaRBM) {
      return false;
    }

    if (esFilaTotal) {
      return false;
    }

    if (esRechazada) {
      return false;
    }

    if (esAbandonada) {
      return false;
    }

    return true;
  });


  let mapeosRelevantes = mapeosTienda.filter(
    (m) => m.source_file.toLowerCase() === tipoArchivo.toLowerCase(),
  );

  if (tipoArchivo === "ARCHIVO EXTERNO" || mapeosRelevantes.length === 0) {
    if (mapeosRelevantes.length === 0 && tipoArchivo !== "ARCHIVO EXTERNO") {
    }
    mapeosRelevantes = mapeosTienda;
  }


  if (mapeosRelevantes.length === 0) {
    return datosFiltrados;
  }

  let filasMapeadas = 0;
  let filasNoMapeadas = 0;
  const tiendasEncontradas = new Set<string>();


  const datosMapeados = datosFiltrados.map((fila, index) => {
    const filaNueva: any = { ...fila };
    let tiendaIdEncontrado: number | null = null;
    let tiendaEncontrada: string | null = null;

    for (const columna of Object.keys(fila)) {
      const valor = String(fila[columna] || "").trim();
      if (!valor || valor.length < 2) continue;

      const valorNormalizado = normalizarParaComparacion(valor);

      for (const mapeo of mapeosRelevantes) {
        const tiendaNormalizada = normalizarParaComparacion(
          mapeo.store_file,
        );

        if (valorNormalizado === tiendaNormalizada) {
          const esMapeoGenericoNaranka =
            tiendaNormalizada === "naranka sas" ||
            tiendaNormalizada === "naranka";

          if (esMapeoGenericoNaranka) {

            if (mapeo.acquirer_id) {
              const idAdquirienteMapeo = String(mapeo.acquirer_id)
                .trim()
                .toLowerCase();

              const tieneIdAdquiriente = Object.values(fila).some((v) => {
                if (v === null || v === undefined) return false;
                const valorCelda = String(v).trim().toLowerCase();
                const match =
                  valorCelda === idAdquirienteMapeo ||
                  (valorCelda.includes(idAdquirienteMapeo) &&
                    idAdquirienteMapeo.length > 3) ||
                  (idAdquirienteMapeo.includes(valorCelda) &&
                    valorCelda.length > 3);

                if (valorNormalizado.includes("naranka") && match) {
                }
                return match;
              });

              if (!tieneIdAdquiriente) {
                continue;
              }
            } else {
              continue;
            }
          } else if (
            valorNormalizado.includes("naranka") &&
            mapeo.acquirer_id
          ) {
          
            const idAdquirienteMapeo = String(mapeo.acquirer_id)
              .trim()
              .toLowerCase();
            const tieneIdAdquiriente = Object.values(fila).some((v) => {
              if (v === null || v === undefined) return false;
              const valorCelda = String(v).trim().toLowerCase();
              return (
                valorCelda === idAdquirienteMapeo ||
                (valorCelda.includes(idAdquirienteMapeo) &&
                  idAdquirienteMapeo.length > 3) ||
                (idAdquirienteMapeo.includes(valorCelda) &&
                  valorCelda.length > 3)
              );
            });

            if (!tieneIdAdquiriente) continue;
          }

          tiendaIdEncontrado = mapeo.store_id;
          tiendaEncontrada = mapeo.tiendaNormalizada;
          filaNueva[columna] = tiendaEncontrada;

          break;
        }
      }
      if (tiendaIdEncontrado) break;
    }

    if (!tiendaIdEncontrado && tipoArchivo !== "ARCHIVO EXTERNO") {
      for (const columna of Object.keys(fila)) {
        const valor = String(fila[columna] || "").trim();
        if (
          !valor ||
          valor.length < 5 ||
          /^\d+$/.test(valor) ||
          valor.includes("-") ||
          valor.includes("/")
        )
          continue;

        if (valor.length > 40) continue;

        const valorNormalizado = normalizarParaComparacion(valor);

        for (const mapeo of mapeosRelevantes) {
          const tiendaNormalizada = normalizarParaComparacion(
            mapeo.store_file,
          );
          if (tiendaNormalizada.length < 5) continue;

          if (valorNormalizado.includes(tiendaNormalizada)) {
            const esMapeoGenericoNaranka =
              tiendaNormalizada === "naranka sas" ||
              tiendaNormalizada === "naranka";

            if (esMapeoGenericoNaranka) {
              if (mapeo.acquirer_id) {
                const idAdquirienteMapeo = String(mapeo.acquirer_id)
                  .trim()
                  .toLowerCase();
                const tieneIdAdquiriente = Object.values(fila).some((v) => {
                  if (v === null || v === undefined) return false;
                  const valorCelda = String(v).trim().toLowerCase();
                  return (
                    valorCelda === idAdquirienteMapeo ||
                    (valorCelda.includes(idAdquirienteMapeo) &&
                      idAdquirienteMapeo.length > 3) ||
                    (idAdquirienteMapeo.includes(valorCelda) &&
                      valorCelda.length > 3)
                  );
                });

                if (!tieneIdAdquiriente) continue;
              } else {
                continue;
              }
            } else if (
              valorNormalizado.includes("naranka") &&
              mapeo.acquirer_id
            ) {
              const idAdquirienteMapeo = String(mapeo.acquirer_id)
                .trim()
                .toLowerCase();
              const tieneIdAdquiriente = Object.values(fila).some((v) => {
                if (v === null || v === undefined) return false;
                const valorCelda = String(v).trim().toLowerCase();
                return (
                  valorCelda === idAdquirienteMapeo ||
                  (valorCelda.includes(idAdquirienteMapeo) &&
                    idAdquirienteMapeo.length > 3) ||
                  (idAdquirienteMapeo.includes(valorCelda) &&
                    valorCelda.length > 3)
                );
              });

              if (!tieneIdAdquiriente) continue;
            }

            tiendaIdEncontrado = mapeo.store_id;
            tiendaEncontrada = mapeo.tiendaNormalizada;
            filaNueva[columna] = tiendaEncontrada;

            if (index < 3) {
            }
            break;
          }
        }
        if (tiendaIdEncontrado) break;
      }
    }

    if (tiendaIdEncontrado !== null) {
      filaNueva["tiendaId"] = tiendaIdEncontrado;
      filaNueva["_tienda_normalizada"] = tiendaEncontrada;
      filasMapeadas++;
      tiendasEncontradas.add(tiendaEncontrada!);
    } else {
      filasNoMapeadas++;
      if (filasNoMapeadas <= 3) {
      }
    }

    return filaNueva;
  });

  if (filasNoMapeadas > 0) {
  }

  return datosMapeados;
};

export const obtenerColumnasRestantes = (
  columnasOriginales: string[],
  columnasEliminar: string[],
): string[] => {
  const eliminarSet = new Set(columnasEliminar.map((c) => c.toLowerCase()));
  return columnasOriginales.filter(
    (col) => !eliminarSet.has(col.toLowerCase()),
  );
};

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

export const validarDatosNormalizados = (
  datos: any[],
  tipoArchivo: string,
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
        tiendasUnicas: [],
      },
    };
  }

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

  if (filasNoMapeadas === datos.length) {
    errores.push(
      `NINGUNA fila fue mapeada a una tienda para "${tipoArchivo}". Verifica la configuración de mapeos en Directus.`,
    );
  } else if (porcentajeMapeado < 50) {
    advertencias.push(
      `Solo ${porcentajeMapeado.toFixed(1)}% de las filas fueron mapeadas. Esto puede indicar un problema con los mapeos.`,
    );
  } else if (filasNoMapeadas > 0) {
    advertencias.push(
      `${filasNoMapeadas} filas (${((filasNoMapeadas / datos.length) * 100).toFixed(1)}%) no tienen tienda asignada`,
    );
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
      tiendasUnicas: Array.from(tiendasUnicas).sort(),
    },
  };
};
