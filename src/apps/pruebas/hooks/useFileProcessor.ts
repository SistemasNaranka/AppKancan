import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    findBestMatch,
    mapearNombresTiendasEnTodasLasCeldas,
    eliminarColumnasPorNombre,
    obtenerColumnasRestantes
} from '../utils/fileNormalization';
import { formatearValor } from '../utils/formatters';
import {
    obtenerMapeosArchivos,
    procesarMapeosParaNormalizacion
} from '../services/mapeoService';
import {
    MapeoArchivo,
    TiendaMapeo,
    ArchivoSubido
} from '../types/mapeo.types';

export const useFileProcessor = () => {
    const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSubido | null>(null);
    const [tablasMapeo, setTablasMapeo] = useState<MapeoArchivo[]>([]);
    const [tiendaMapeos, setTiendaMapeos] = useState<TiendaMapeo[]>([]);
    const [cargando, setCargando] = useState(false);
    const [cargandoMapeos, setCargandoMapeos] = useState(true);
    const [errorMapeos, setErrorMapeos] = useState<string | null>(null);

    useEffect(() => {
        cargarDatosMapeo();
    }, []);

    const cargarDatosMapeo = async () => {
        setCargandoMapeos(true);
        setErrorMapeos(null);
        try {
            const mapeosDirectus = await obtenerMapeosArchivos();
            const { tablasMapeo, tiendaMapeos } = procesarMapeosParaNormalizacion(mapeosDirectus);
            setTablasMapeo(tablasMapeo);
            setTiendaMapeos(tiendaMapeos);
        } catch (error) {
            console.error('❌ Error al cargar mapeos:', error);
            setErrorMapeos('Error al cargar los mapeos desde Directus.');
        } finally {
            setCargandoMapeos(false);
        }
    };

    const leerArchivo = (archivo: File): Promise<ArchivoSubido> => {
        return new Promise((resolve, reject) => {
            const extension = archivo.name.split(".").pop()?.toLowerCase();
            if (extension === "csv") {
                Papa.parse(archivo, {
                    header: true,
                    skipEmptyLines: 'greedy',
                    complete: (resultado) => {
                        const datosLimpios = resultado.data.filter((fila: any) =>
                            Object.values(fila).some(val => val !== null && val !== undefined && String(val).trim() !== "")
                        );
                        resolve({
                            nombre: archivo.name,
                            tipo: "CSV",
                            datos: datosLimpios,
                            columnas: resultado.meta.fields || [],
                        });
                    },
                    error: reject
                });
            } else if (extension === "xlsx" || extension === "xls") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayData = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(arrayData, { type: "array", cellDates: true });
                        const hojasUtiles = workbook.SheetNames.filter(name => !name.toLowerCase().includes("portada"));
                        const nombreHoja = hojasUtiles.length > 0 ? hojasUtiles[0] : workbook.SheetNames[0];
                        const hoja = workbook.Sheets[nombreHoja];
                        const jsonData: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });
                        const filasNoVacias = jsonData.filter(fila => fila && fila.some(celda => celda !== null && celda !== undefined && String(celda).trim() !== ""));
                        const columnas = filasNoVacias[0].map((col: any) => String(col || ""));
                        const filas = filasNoVacias.slice(1).map((fila: any[]) => {
                            const obj: any = {};
                            columnas.forEach((col, index) => obj[col] = fila[index] !== undefined ? fila[index] : "");
                            return obj;
                        });
                        resolve({
                            nombre: archivo.name,
                            tipo: extension.toUpperCase(),
                            datos: filas,
                            columnas: columnas,
                        });
                    } catch (error) { reject(error); }
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo"));
                reader.readAsArrayBuffer(archivo);
            } else { reject(new Error("Formato no soportado")); }
        });
    };

    const handleSubirArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setCargando(true);

        for (let i = 0; i < files.length; i++) {
            try {
                const nuevoArchivo = await leerArchivo(files[i]);
                const resultadoDecision = findBestMatch(nuevoArchivo.nombre, tablasMapeo);

                if (resultadoDecision) {
                    nuevoArchivo.tipoArchivo = resultadoDecision.tipoArchivo;
                    nuevoArchivo.columnasEliminar = resultadoDecision.mapeo.columnasEliminar;
                }

                setArchivos(prev => [...prev, nuevoArchivo]);
                if (i === 0) setArchivoSeleccionado(nuevoArchivo);
            } catch (error) { console.error(`Error al leer ${files[i].name}:`, error); }
        }
        setCargando(false);
        e.target.value = "";
    };

    const handleEliminarArchivo = (nombre: string) => {
        setArchivos(prev => prev.filter(a => a.nombre !== nombre));
        if (archivoSeleccionado?.nombre === nombre) setArchivoSeleccionado(null);
    };

    const procesarArchivo = (archivo: ArchivoSubido): ArchivoSubido | null => {
        if (!archivo.tipoArchivo) return null;
        let datosNormalizados = mapearNombresTiendasEnTodasLasCeldas(archivo.datos, tiendaMapeos, archivo.tipoArchivo);

        const mapeoDocumento: Record<string, string> = {};
        const keywordsDocumento = ['cedula', 'nit', 'cc', 'idemisor', 'nro_doc', 'identi'];
        const keywordsDebiles = ['documento', 'identificaci'];
        const excludeKeywords = ['fecha', 'valor', 'monto', 'total', 'neto', 'operacion', 'transaccion', 'terminal', 'adquiriente'];
        const normalizarString = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const columnasAEliminarAdicionales: string[] = [];
        archivo.columnas.forEach(col => {
            const colNorm = normalizarString(col);

            // Regla especial para ReporteDiariodeVentasComercio: ocultar columna documento
            // ya que este reporte trae direcciones en ese campo
            if (archivo.tipoArchivo?.trim().toLowerCase() === 'reportediariodeventascomercio' && (colNorm.includes('documento') || colNorm === 'documento')) {
                columnasAEliminarAdicionales.push(col);
                return;
            }

            // Identificar documentos para mapeo
            let esDoc = false;
            if (keywordsDocumento.some(key => colNorm.includes(key)) && !excludeKeywords.some(ex => colNorm.includes(ex))) {
                mapeoDocumento[col] = "Documento";
                esDoc = true;
            } else if (keywordsDebiles.some(key => colNorm.includes(key)) && !excludeKeywords.some(ex => colNorm.includes(ex))) {
                mapeoDocumento[col] = "Documento";
                esDoc = true;
            }

            // Solo añadir a eliminar si NO es una columna que acabamos de mapear como Documento
            // o si es explícitamente una columna de descuento
            if (colNorm.includes('descuento')) {
                columnasAEliminarAdicionales.push(col);
            } else if (esDoc && col !== "Documento") {
                // Si mapeamos una columna (ej. "Cedula") a "Documento", debemos ocultar la original "Cedula"
                columnasAEliminarAdicionales.push(col);
            }
        });

        // --- SOLUCIÓN: Aplicar el mapeo a los datos ---
        if (Object.keys(mapeoDocumento).length > 0) {
            datosNormalizados = datosNormalizados.map(fila => {
                const nuevaFila = { ...fila };
                Object.entries(mapeoDocumento).forEach(([original, nuevo]) => {
                    if (fila[original] !== undefined) {
                        nuevaFila[nuevo] = String(fila[original]).trim();
                    }
                });
                return nuevaFila;
            });
        }

        const columnasCriticas = ['fecha', 'valor', 'monto', 'total', 'neto', 'factura', 'pagare'];
        const todasLasColumnasAEliminar = [...(archivo.columnasEliminar || []), ...columnasAEliminarAdicionales].filter(col => {
            const colNorm = normalizarString(col);

            // Proteger "Documento" si no es el reporte especial
            if (archivo.tipoArchivo?.trim().toLowerCase() !== 'reportediariodeventascomercio' && colNorm === 'documento') {
                return false;
            }

            return !columnasCriticas.some(crit => colNorm.includes(crit));
        });

        if (todasLasColumnasAEliminar.length > 0) {
            datosNormalizados = eliminarColumnasPorNombre(datosNormalizados, todasLasColumnasAEliminar);
        }

        let columnasFinales = obtenerColumnasRestantes(archivo.columnas, todasLasColumnasAEliminar);

        // Si detectamos documentos, asegurar la columna final
        if (Object.keys(mapeoDocumento).length > 0) {
            if (!columnasFinales.some(c => c.toLowerCase() === "documento")) {
                columnasFinales = ["Documento", ...columnasFinales];
            }
        }

        // Doble verificación: Si es ReporteDiariodeVentasComercio, NUNCA mostrar Documento
        if (archivo.tipoArchivo?.trim().toLowerCase() === 'reportediariodeventascomercio') {
            columnasFinales = columnasFinales.filter(c => c.toLowerCase() !== 'documento');
        }

        return { ...archivo, datos: datosNormalizados, columnas: columnasFinales, normalizado: true };
    };

    const normalizarTodosArchivos = async () => {
        const archivosSinNormalizar = archivos.filter(a => !a.normalizado && a.tipoArchivo);
        if (archivosSinNormalizar.length === 0) return;
        setCargando(true);
        try {
            const nuevosArchivos = archivos.map(archivo => {
                if (!archivo.normalizado && archivo.tipoArchivo) {
                    return procesarArchivo(archivo) || archivo;
                }
                return archivo;
            });
            setArchivos(nuevosArchivos);
            if (archivoSeleccionado) {
                const seleccionadoActualizado = nuevosArchivos.find(a => a.nombre === archivoSeleccionado.nombre);
                if (seleccionadoActualizado) setArchivoSeleccionado(seleccionadoActualizado);
            }
        } catch (error) {
            console.error("Error en normalización masiva:", error);
        } finally { setCargando(false); }
    };

    const gruposPorTienda = useMemo(() => {
        const grupos: Record<string, Record<string, any[]>> = {};

        // Mapeo detallado para asegurar que coincidan los nombres de los archivos
        const mapeoVisual = [
            { keys: ["transactions", "addi"], label: "ADDI" },
            { keys: ["reportediario", "ventascomercio", "redebana"], label: "REDEBANA" },
            { keys: ["maria", "perez", "occidente", "transferencias"], label: "TRANSFERENCIAS" },
            { keys: ["creditos", "sistecreditos"], label: "SISTECREDITOS" }
        ];

        archivos.filter(a => a.normalizado).forEach(archivo => {
            const nombreLower = archivo.nombre.toLowerCase();
            const tipoLower = (archivo.tipoArchivo || "").toLowerCase();

            // Buscamos coincidencia parcial en el nombre del archivo o en el tipo detectado
            const match = mapeoVisual.find(m =>
                m.keys.some(k => nombreLower.includes(k) || tipoLower.includes(k))
            );

            const fuenteNombre = match ? match.label : (archivo.tipoArchivo || archivo.nombre);

            archivo.datos.forEach(fila => {
                const tienda = fila._tienda_normalizada || "SIN TIENDA";
                if (!grupos[tienda]) grupos[tienda] = {};
                if (!grupos[tienda][fuenteNombre]) grupos[tienda][fuenteNombre] = [];
                grupos[tienda][fuenteNombre].push(fila);
            });
        });
        return grupos;
    }, [archivos]);

    const columnasPorFuente = useMemo(() => {
        const cache: Record<string, string[]> = {};
        Object.entries(gruposPorTienda).forEach(([_, fuentes]) => {
            Object.entries(fuentes).forEach(([fuente, datos]) => {
                if (!cache[fuente] && datos.length > 0) {
                    const todasLasColumnas = Object.keys(datos[0]);
                    const keywords = ['fecha', 'documento', 'cedula', 'nit', 'cc', 'idemisor', 'identificaci', 'referencia', 'tienda', 'valor', 'monto', 'total', 'cliente', 'hora', 'comercio', 'sucursal'];
                    cache[fuente] = todasLasColumnas.filter(col => {
                        const colLower = col.toLowerCase();
                        if (col.startsWith('_') || col === 'tiendaId' || colLower.includes('descuento')) return false;
                        // Regla para ocultar documento en REDEBANA (basado en el nombre nuevo o el antiguo)
                        if ((fuente.includes('REDEBANA') || fuente.toLowerCase().includes('reportediario') || fuente.toLowerCase().includes('ventascomercio')) && colLower.includes('documento')) return false;
                        return keywords.some(key => colLower.includes(key));
                    }).sort((a, b) => {
                        const getScore = (s: string) => {
                            const sl = s.toLowerCase();
                            if (sl.includes('fecha')) return 0;
                            if (sl.includes('documento') || sl.includes('cedula') || sl.includes('nit')) return 1;
                            if (sl.includes('tienda')) return 2;
                            if (sl.includes('valor') || sl.includes('monto') || sl.includes('total')) return 3;
                            return 10;
                        };
                        return getScore(a) - getScore(b);
                    });
                }
            });
        });
        return cache;
    }, [gruposPorTienda]);

    const exportarArchivosNormalizados = async () => {
        const archivosNormalizados = archivos.filter(a => a.normalizado);
        if (archivosNormalizados.length === 0) return;

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Reporte Kancan");

            let currentRow = 1;

            Object.entries(gruposPorTienda).forEach(([tienda, fuentes]) => {
                // TÍTULO DE LA TIENDA
                const tiendaRow = worksheet.getRow(currentRow);
                tiendaRow.values = [`TIENDA: ${tienda.toUpperCase()}`];
                worksheet.mergeCells(currentRow, 1, currentRow, 5); // Fusionar para el título

                tiendaRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                tiendaRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1976D2' } // Color Azul Principal de la Tienda para Excel
                };
                tiendaRow.alignment = { horizontal: 'center' };
                currentRow += 2; // Espacio después del título

                Object.entries(fuentes).forEach(([fuente, datos]) => {
                    if (datos.length === 0) return;

                    // FUENTE TITLE
                    const fuenteRow = worksheet.getRow(currentRow);
                    fuenteRow.values = [`FUENTE: ${fuente.toUpperCase()}`];
                    fuenteRow.font = { bold: true, size: 12, color: { argb: 'FF333333' } };
                    currentRow++;

                    // COLUMNS
                    let columnasFuente = columnasPorFuente[fuente] || [];
                    if (columnasFuente.length === 0) {
                        columnasFuente = Object.keys(datos[0]).filter(col => !col.startsWith('_') && col !== 'tiendaId');
                    }

                    const headerRow = worksheet.getRow(currentRow);
                    headerRow.values = columnasFuente.map(c => String(c).toUpperCase());

                    // Estilo de encabezados de tabla
                    headerRow.eachCell((cell) => {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF424242' } // Gris oscuro para encabezados
                        };
                        cell.alignment = { horizontal: 'center' };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                    currentRow++;

                    // DATA
                    let totalFuente = 0;
                    datos.forEach(fila => {
                        const rowData = columnasFuente.map(col => {
                            let val = fila[col];
                            const colL = col.toLowerCase();

                            // Normalización de Fechas para Excel (Formato TRANSFERENCIAS: YYYY-MM-DD)
                            if (colL.includes('fecha')) {
                                // Usamos la lógica de formatearValor para asegurar consistencia
                                return formatearValor(val, col);
                            }

                            // Sumar totales si es columna de valor
                            if (colL.includes('valor') || colL.includes('monto') || colL.includes('total') || colL.includes('neto')) {
                                const num = typeof val === 'number' ? val : Number(String(val || 0).replace(/[^0-9.-]+/g, ""));
                                totalFuente += isNaN(num) ? 0 : num;
                                return isNaN(num) ? 0 : num;
                            }
                            return val;
                        });

                        const dataRow = worksheet.getRow(currentRow);
                        dataRow.values = rowData;

                        // Formatear celdas de datos
                        dataRow.eachCell((cell, colNumber) => {
                            const colName = columnasFuente[colNumber - 1].toLowerCase();
                            if (colName.includes('valor') || colName.includes('monto') || colName.includes('total') || colName.includes('neto')) {
                                cell.numFmt = '"$"#,##0';
                            }
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        });
                        currentRow++;
                    });

                    // FILA DE TOTAL
                    const totalRow = worksheet.getRow(currentRow);
                    const totalValues = new Array(columnasFuente.length).fill("");
                    if (columnasFuente.length >= 2) {
                        totalValues[columnasFuente.length - 2] = `TOTAL ${fuente.toUpperCase()}:`;
                        totalValues[columnasFuente.length - 1] = totalFuente;
                    } else {
                        totalValues[0] = `TOTAL ${fuente.toUpperCase()}: ${totalFuente}`;
                    }
                    totalRow.values = totalValues;

                    // Estilo de fila de total
                    totalRow.font = { bold: true };
                    totalRow.getCell(columnasFuente.length).numFmt = '"$"#,##0';
                    totalRow.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF5F5F5' } // Gris muy claro
                        };
                    });

                    currentRow += 2; // Espacio entre fuentes
                });

                // Separador de tiendas
                worksheet.addRow([]);
                currentRow++;
            });

            // Ajuste dinámico de columnas
            worksheet.columns = Array(15).fill(0).map((_, i) => ({ width: i === 0 ? 30 : 20 }));

            // Generar y descargar
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Reporte_Kancan_Agrupado_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Error al exportar Excel con ExcelJS:", error);
        }
    };

    return {
        archivos,
        archivoSeleccionado,
        cargando,
        cargandoMapeos,
        errorMapeos,
        setArchivoSeleccionado,
        handleSubirArchivos,
        handleEliminarArchivo,
        normalizarTodosArchivos,
        exportarArchivosNormalizados,
        gruposPorTienda,
        columnasPorFuente,
        cargarDatosMapeo
    };
};
