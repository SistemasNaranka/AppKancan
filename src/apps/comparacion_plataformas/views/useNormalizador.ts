import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ModalTipo } from "../components/modals/Modalconfirmacion";

import {
  findBestMatch,
  mapearNombresTiendasEnTodasLasCeldas,
  eliminarColumnasPorNombre,
  obtenerColumnasRestantes
} from '../utils/fileNormalization';

import {
  obtenerMapeosArchivos,
  procesarMapeosParaNormalizacion
} from '../services/mapeoService';

import { ArchivoSubido } from '../types/mapeo.types';

export interface ModalState {
  abierto: boolean;
  tipo: ModalTipo;
  titulo: string;
  mensaje: string | string[];
  onConfirmar?: () => void;
}

export const useNormalizador = () => {
  const queryClient = useQueryClient();

  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSubido | null>(null);
  const [cargando, setCargando] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "normalized">("preview");

  const [modal, setModal] = useState<ModalState>({
    abierto: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
  });

  const {
    data: mapeosData,
    isLoading: cargandoMapeos,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["mapeos_archivos"],
    queryFn: async () => {
      const mapeosDirectus = await obtenerMapeosArchivos();
      const resultado = procesarMapeosParaNormalizacion(mapeosDirectus);
      return resultado;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const tablasMapeo = mapeosData?.tablasMapeo || [];
  const tiendaMapeos = mapeosData?.tiendaMapeos || [];
  const errorMapeos = isError ? (queryError?.message || 'Error al cargar los mapeos desde Directus.') : null;

  const refrescarMapeos = () => {
    queryClient.invalidateQueries({ queryKey: ["mapeos_archivos"] });
  };

  const mostrarModal = (tipo: ModalTipo, titulo: string, mensaje: string | string[], onConfirmar?: () => void) => {
    setModal({ abierto: true, tipo, titulo, mensaje, onConfirmar });
  };

  const cerrarModal = () => {
    setModal(prev => ({ ...prev, abierto: false }));
  };

  const leerArchivo = (archivo: File): Promise<ArchivoSubido> => {
    return new Promise((resolve, reject) => {
      const extension = archivo.name.split(".").pop()?.toLowerCase();

      if (extension === "csv") {
        Papa.parse(archivo, {
          header: true,
          skipEmptyLines: true,
          complete: (resultado) => {
            resolve({
              nombre: archivo.name,
              tipo: "CSV",
              datos: resultado.data,
              columnas: resultado.meta.fields || [],
            });
          },
          error: (error) => {
            reject(error);
          },
        });
      } else if (extension === "xlsx" || extension === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayData = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(arrayData, { type: "array" });
            const nombreHoja = workbook.SheetNames.length > 1
              ? workbook.SheetNames[1]
              : workbook.SheetNames[0];
            const hoja = workbook.Sheets[nombreHoja];
            const jsonData: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });

            if (jsonData.length === 0) {
              reject(new Error("El archivo está vacío"));
              return;
            }

            const columnas = jsonData[0].map((col: any) => String(col || ""));
            const filas = jsonData.slice(1).map((fila: any[]) => {
              const obj: any = {};
              columnas.forEach((col, index) => {
                obj[col] = fila[index] !== undefined ? fila[index] : "";
              });
              return obj;
            });

            resolve({
              nombre: archivo.name,
              tipo: extension.toUpperCase(),
              datos: filas,
              columnas: columnas,
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsArrayBuffer(archivo);
      } else {
        reject(new Error("Formato no soportado"));
      }
    });
  };

  const handleSubirArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setCargando(true);
    const archivosDuplicados: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const yaExiste = archivos.some(a => a.nombre === files[i].name);
        if (yaExiste) {
          archivosDuplicados.push(files[i].name);
          continue;
        }

        const nuevoArchivo = await leerArchivo(files[i]);
        const resultado = findBestMatch(nuevoArchivo.nombre, tablasMapeo);

        if (resultado) {
          nuevoArchivo.tipoArchivo = resultado.tipoArchivo;
          nuevoArchivo.columnasEliminar = resultado.mapeo.columnasEliminar;
        } else {
          console.warn(`No se encontró mapeo para ${nuevoArchivo.nombre}`);
        }

        setArchivos((prev) => [...prev, nuevoArchivo]);

        if (i === 0 && !archivoSeleccionado) {
          setArchivoSeleccionado(nuevoArchivo);
        }
      } catch (error) {
        console.error(`Error al leer ${files[i].name}:`, error);
      }
    }

    if (archivosDuplicados.length > 0) {
      mostrarModal(
        "advertencia",
        "Archivos duplicados",
        archivosDuplicados.length === 1
          ? `El archivo "${archivosDuplicados[0]}" ya fue subido`
          : [`Los siguientes archivos ya fueron subidos:`, ...archivosDuplicados.map(a => `• ${a}`)]
      );
    }

    setCargando(false);
    e.target.value = "";
  };

  const handleEliminarArchivo = (nombre: string) => {
    setArchivos((prev) => prev.filter((a) => a.nombre !== nombre));
    if (archivoSeleccionado?.nombre === nombre) {
      setArchivoSeleccionado(null);
    }
  };

  const exportarArchivosNormalizados = () => {
    const archivosNormalizados = archivos.filter(a => a.normalizado);

    if (archivosNormalizados.length === 0) {
      mostrarModal("advertencia", "Sin archivos", "No hay archivos normalizados para exportar");
      return;
    }

    let datosCombinados: any[] = [];

    archivosNormalizados.forEach(archivo => {
      const datosFiltrados = filtrarFilasVacias(archivo.datos);
      const datosConOrigen = datosFiltrados.map(fila => ({
        ...fila,
        _archivo_origen: archivo.tipoArchivo || archivo.nombre
      }));
      datosCombinados = [...datosCombinados, ...datosConOrigen];
    });

    const todasLasColumnas = new Set<string>();
    archivosNormalizados.forEach(archivo => {
      archivo.columnas.forEach(col => todasLasColumnas.add(col));
    });
    todasLasColumnas.add('_archivo_origen');

    const columnasArray = Array.from(todasLasColumnas);

    const csvHeader = columnasArray.join(',');
    const csvRows = datosCombinados.map(fila => {
      return columnasArray.map(col => {
        const valor = fila[col] ?? '';
        const valorStr = String(valor);
        if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')) {
          return `"${valorStr.replace(/"/g, '""')}"`;
        }
        return valorStr;
      }).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archivos_normalizados_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarModal("exito", "Exportación completada", [
      `${archivosNormalizados.length} archivo(s) exportado(s)`,
      `${datosCombinados.length} filas en total`
    ]);
  };

  const normalizarArchivoIndividual = (archivo: ArchivoSubido): ArchivoSubido | null => {
    if (!archivo.tipoArchivo) {
      console.warn(`⚠ No se puede normalizar ${archivo.nombre}: no hay mapeo definido`);
      return null;
    }

    try {
      let datosNormalizados = mapearNombresTiendasEnTodasLasCeldas(
        archivo.datos,
        tiendaMapeos,
        archivo.tipoArchivo
      );

      if (archivo.columnasEliminar && archivo.columnasEliminar.length > 0) {
        datosNormalizados = eliminarColumnasPorNombre(
          datosNormalizados,
          archivo.columnasEliminar
        );
      }

      const columnasFinales = obtenerColumnasRestantes(
        archivo.columnas,
        archivo.columnasEliminar || []
      );

      return {
        ...archivo,
        datos: datosNormalizados,
        columnas: columnasFinales,
        normalizado: true
      };
    } catch (error) {
      console.error(`Error al normalizar ${archivo.nombre}:`, error);
      return null;
    }
  };

  const normalizarTodosLosArchivos = async () => {
    const archivosPorNormalizar = archivos.filter(a => a.tipoArchivo && !a.normalizado);

    if (archivosPorNormalizar.length === 0) {
      mostrarModal("advertencia", "Sin archivos", "No hay archivos pendientes por normalizar");
      return;
    }

    setCargando(true);

    try {
      let normalizados = 0;
      let errores = 0;
      const archivosActualizados = archivos.map(archivo => {
        if (archivo.normalizado || !archivo.tipoArchivo) {
          if (!archivo.tipoArchivo && !archivo.normalizado) {
            errores++;
          }
          return archivo;
        }

        const archivoNormalizado = normalizarArchivoIndividual(archivo);
        if (archivoNormalizado) {
          normalizados++;
          return archivoNormalizado;
        } else {
          errores++;
          return archivo;
        }
      });

      setArchivos(archivosActualizados);

      const primerNormalizado = archivosActualizados.find(a => a.normalizado);
      if (primerNormalizado) {
        setArchivoSeleccionado(primerNormalizado);
      }

      if (normalizados > 0) {
        setViewMode("normalized");
      }

      mostrarModal("exito", "Normalización completada", [
        `${normalizados} archivo(s) normalizado(s)`,
        `${errores} archivo(s) sin mapeo`
      ]);
    } catch (error) {
      console.error("Error al normalizar archivos:", error);
      mostrarModal("error", "Error", "Ocurrió un error al normalizar los archivos");
    } finally {
      setCargando(false);
    }
  };

  const limpiarTodosLosArchivos = () => {
    if (archivos.length === 0) {
      mostrarModal("advertencia", "Sin archivos", "No hay archivos para eliminar");
      return;
    }

    mostrarModal(
      "confirmacion",
      "Confirmar eliminación",
      `¿Estás seguro de eliminar los ${archivos.length} archivo(s) cargados?`,
      () => {
        setArchivos([]);
        setArchivoSeleccionado(null);
        setViewMode("preview");
        cerrarModal();
      }
    );
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "number") return valor.toLocaleString();
    return String(valor);
  };

  const filtrarFilasVacias = (datos: any[]): any[] => {
    return datos.filter(fila => {
      return Object.values(fila).some(valor =>
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ""
      );
    });
  };

  const obtenerNombreTabla = (nombreArchivo: string): string => {
    const nombreLower = nombreArchivo.toLowerCase();

    if (nombreLower.includes("maria perez")) {
      return "TRANSFERENCIAS";
    } else if (nombreLower.includes("creditos")) {
      return "SISTECREDITOS";
    } else if (nombreLower.includes("transactions")) {
      return "ADDI";
    } else if (nombreLower.includes("reporte")) {
      return "REDEBAN";
    } else {
      return nombreArchivo;
    }
  };

  return {
    archivos,
    archivoSeleccionado,
    setArchivoSeleccionado,
    cargando,
    viewMode,
    setViewMode,
    modal,
    cerrarModal,
    cargandoMapeos,
    errorMapeos,
    refrescarMapeos,
    handleSubirArchivos,
    handleEliminarArchivo,
    exportarArchivosNormalizados,
    normalizarTodosLosArchivos,
    limpiarTodosLosArchivos,
    formatearValor,
    filtrarFilasVacias,
    obtenerNombreTabla
  };
};