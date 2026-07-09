import { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    findBestMatch,
    mapearNombresTiendasEnTodasLasCeldas,
    eliminarColumnasPorNombre,
    obtenerColumnasRestantes,
    validarDatosNormalizados,
    ResultadoValidacion
} from '../utils/fileNormalization';
import { ordenarGruposPorCodigo } from '../utils/sortingUtils';
import { ordenarTiendasPorCodigo } from '../utils/storeSorting';
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
    const [validacionesArchivos, setValidacionesArchivos] = useState<Record<string, ResultadoValidacion>>({});
    const [duplicadosAdvertencia, setDuplicadosAdvertencia] = useState<string[]>([]);
    const [mostrarConfirmacionDuplicados, setMostrarConfirmacionDuplicados] = useState(false);
    const [duplicadosParaNormalizar, setDuplicadosParaNormalizar] = useState<string[]>([]);
    const [refrescando, setRefrescando] = useState(false);

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
                            datosOriginales: JSON.parse(JSON.stringify(datosLimpios)),
                            columnasOriginales: resultado.meta.fields ? [...resultado.meta.fields] : [],
                        });
                    },
                    error: reject
                });
            } else if (extension === "xlsx" || extension === "xls") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayData = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(arrayData, {
                            type: "array",
                            cellDates: true,
                            cellStyles: false,
                            cellFormula: false,
                            cellNF: false
                        });
                        const hojasUtiles = workbook.SheetNames.filter(name => !name.toLowerCase().includes("portada"));
                        const nombreHoja = hojasUtiles.length > 0 ? hojasUtiles[0] : workbook.SheetNames[0];
                        const hoja = workbook.Sheets[nombreHoja];
                        const jsonData: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });
                        const filasNoVacias = jsonData.filter(fila => fila && fila.some(celda => celda !== null && celda !== undefined && String(celda).trim() !== ""));
                        
                        let headerIndex = 0;
                        if (filasNoVacias.length > 0 && String(filasNoVacias[0][0] || "").toLowerCase().includes("filtros aplicados")) {
                            for (let i = 0; i < filasNoVacias.length; i++) {
                                const row = filasNoVacias[i].map(c => String(c || "").trim().toLowerCase());
                                if (row.includes("tienda") || row.includes("cédula") || row.includes("cedula")) {
                                    headerIndex = i;
                                    break;
                                }
                            }
                            if (headerIndex === 0 && filasNoVacias.length > 2) {
                                headerIndex = 2;
                            }
                        }

                        const columnas = filasNoVacias[headerIndex].map((col: any) => String(col || "").trim());
                        const filas = filasNoVacias.slice(headerIndex + 1).map((fila: any[]) => {
                            const obj: any = {};
                            columnas.forEach((col, index) => {
                                if (col) {
                                    obj[col] = fila[index] !== undefined ? fila[index] : "";
                                }
                            });
                            return obj;
                        });
                        resolve({
                            nombre: archivo.name,
                            tipo: extension.toUpperCase(),
                            datos: filas,
                            columnas: columnas,
                            datosOriginales: JSON.parse(JSON.stringify(filas)),
                            columnasOriginales: [...columnas],
                        });
                    } catch (error) { reject(error); }
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo"));
                reader.readAsArrayBuffer(archivo);
            } else { reject(new Error("Formato no soportado")); }
        });
    };

    const procesarArchivosRaw = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        setCargando(true);
        setDuplicadosAdvertencia([]);

        const fileArray = Array.from(files);

        try {
            const nuevosArchivos = await Promise.all(fileArray.map(async (file) => {
                try {
                    const nuevoArchivo = await leerArchivo(file);
                    const resultadoDecision = findBestMatch(nuevoArchivo.nombre, tablasMapeo);
                    const nombreLower = nuevoArchivo.nombre.toLowerCase();
                    const esSumas = nombreLower.includes("reporte ventas") || 
                                    nombreLower.includes("sumas") ||
                                    nombreLower.includes("data") ||
                                    (nombreLower.includes("maria fernanda") && nombreLower.includes("reporte")) ||
                                    (nombreLower.includes("naranka") && nombreLower.includes("reporte"));

                    if (esSumas) {
                        nuevoArchivo.tipoArchivo = "SUMAS";
                        const sumasMapeo = tablasMapeo.find(m => m.source_file === "SUMAS");
                        nuevoArchivo.columnasEliminar = sumasMapeo ? sumasMapeo.columnasEliminar : [];
                    } else if (resultadoDecision) {
                        nuevoArchivo.tipoArchivo = resultadoDecision.tipoArchivo;
                        nuevoArchivo.columnasEliminar = resultadoDecision.mapeo.columnasEliminar;
                    } else {
                        nuevoArchivo.tipoArchivo = "ARCHIVO EXTERNO";
                        nuevoArchivo.columnasEliminar = [];
                    }
                    return nuevoArchivo;
                } catch (error) {
                    console.error(`Error al leer ${file.name}:`, error);
                    return null;
                }
            }));

            const archivosValidos = nuevosArchivos.filter((a): a is ArchivoSubido => a !== null);

            if (archivosValidos.length > 0) {
                const nombresExistentes = new Set(archivos.map(a => a.nombre));
                const duplicadosDetectados: string[] = [];
                const archivosSinDuplicar: ArchivoSubido[] = [];

                archivosValidos.forEach(archivo => {
                    if (nombresExistentes.has(archivo.nombre)) {
                        duplicadosDetectados.push(archivo.nombre);
                    } else {
                        archivosSinDuplicar.push(archivo);
                    }
                });

                if (duplicadosDetectados.length > 0) {
                    setDuplicadosAdvertencia(duplicadosDetectados);
                }

                if (archivosSinDuplicar.length > 0) {
                    setArchivos(prev => [...prev, ...archivosSinDuplicar]);
                    setArchivoSeleccionado(prev => prev ? prev : archivosSinDuplicar[0]);
                }
            }
        } catch (error) {
            console.error("Error general al procesar archivos:", error);
        } finally {
            setCargando(false);
        }
    };

    const handleSubirArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        await procesarArchivosRaw(files);
        e.target.value = "";
    };

    const handleEliminarArchivo = (nombre: string) => {
        setArchivos(prev => prev.filter(a => a.nombre !== nombre));
        if (archivoSeleccionado?.nombre === nombre) setArchivoSeleccionado(null);
    };

    const procesarArchivo = (archivo: ArchivoSubido, mapeosTiendaCustom?: TiendaMapeo[]): ArchivoSubido | null => {
        if (!archivo.tipoArchivo) return null;
        const mapeosUsar = mapeosTiendaCustom || tiendaMapeos;
        let datosNormalizados = mapearNombresTiendasEnTodasLasCeldas(archivo.datos, mapeosUsar, archivo.tipoArchivo);

        const mapeoDocumento: Record<string, string> = {};
        const keywordsDocumento = ['cedula', 'nit', 'cc', 'idemisor', 'nro_doc', 'identi'];
        const keywordsDebiles = ['documento', 'identificaci'];
        const excludeKeywords = ['fecha', 'valor', 'monto', 'total', 'neto', 'operacion', 'transaccion', 'terminal', 'adquiriente'];
        const normalizarString = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        const columnasAEliminarAdicionales: string[] = [];
        archivo.columnas.forEach(col => {
            const colNorm = normalizarString(col);
            
            let esDoc = false;
            const esTipoSumas = archivo.tipoArchivo?.trim().toLowerCase() === 'sumas';
            if (!esTipoSumas) {
                if (keywordsDocumento.some(key => colNorm.includes(key)) && !excludeKeywords.some(ex => colNorm.includes(ex))) {
                    mapeoDocumento[col] = "Documento";
                    esDoc = true;
                } else if (keywordsDebiles.some(key => colNorm.includes(key)) && !excludeKeywords.some(ex => colNorm.includes(ex))) {
                    mapeoDocumento[col] = "Documento";
                    esDoc = true;
                }
            }

            if (colNorm.includes('descuento')) {
                columnasAEliminarAdicionales.push(col);
            } else if (esDoc && col !== "Documento") {
                columnasAEliminarAdicionales.push(col);
            }
        });

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

            if (archivo.tipoArchivo?.trim().toLowerCase() !== 'reportediariodeventascomercio' && colNorm === 'documento') {
                return false;
            }

            return !columnasCriticas.some(crit => colNorm.includes(crit));
        });

        if (todasLasColumnasAEliminar.length > 0) {
            datosNormalizados = eliminarColumnasPorNombre(datosNormalizados, todasLasColumnasAEliminar);
        }

        let columnasFinales = obtenerColumnasRestantes(archivo.columnas, todasLasColumnasAEliminar);

        if (Object.keys(mapeoDocumento).length > 0) {
            if (!columnasFinales.some(c => c.toLowerCase() === "documento")) {
                columnasFinales = ["Documento", ...columnasFinales];
            }
        }

        if (archivo.tipoArchivo?.trim().toLowerCase() === 'reportediariodeventascomercio') {
            columnasFinales = columnasFinales.filter(c => c.toLowerCase() !== 'documento');
        }

        const validacion = validarDatosNormalizados(datosNormalizados, archivo.tipoArchivo);

        setValidacionesArchivos(prev => ({
            ...prev,
            [archivo.nombre]: validacion
        }));

        if (validacion.errores.length > 0) {
            console.error('❌ Errores:', validacion.errores);
        }
        if (validacion.advertencias.length > 0) {
        }

        return { ...archivo, datos: datosNormalizados, columnas: columnasFinales, normalizado: true };
    };

    const normalizarTodosArchivos = async () => {
        const archivosSinNormalizar = archivos.filter(a => !a.normalizado && a.tipoArchivo);
        if (archivosSinNormalizar.length === 0) return;

        const nombresArchivos = archivosSinNormalizar.map(a => a.nombre);
        const nombresDuplicados = nombresArchivos.filter((nombre, index) => 
            nombresArchivos.indexOf(nombre) !== index
        );
        const duplicadosUnicos = [...new Set(nombresDuplicados)];

        if (duplicadosUnicos.length > 0) {
            setDuplicadosParaNormalizar(duplicadosUnicos);
            setMostrarConfirmacionDuplicados(true);
            return;
        }

        await ejecutarNormalizacion();
    };

    const ejecutarNormalizacion = async () => {
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
        } finally { 
            setCargando(false);
            setMostrarConfirmacionDuplicados(false);
            setDuplicadosParaNormalizar([]);
        }
    };

    const confirmarNormalizacionConDuplicados = async () => {
        await ejecutarNormalizacion();
    };

    const cancelarNormalizacionConDuplicados = () => {
        setMostrarConfirmacionDuplicados(false);
        setDuplicadosParaNormalizar([]);
    };

    const limpiarAdvertenciaDuplicados = useCallback(() => {
        setDuplicadosAdvertencia([]);
    }, []);

    const gruposPorTienda = useMemo(() => {
        const grupos: Record<string, Record<string, any[]>> = {};
        let totalFilasProcesadas = 0;
        let filasSinTienda = 0;

        const mapeoVisual = [
            { keys: ["sumas"], label: "SUMAS" },
            { keys: ["transactions", "addi"], label: "ADDI" },
            { keys: ["reportediario", "ventascomercio", "redebana"], label: "REDEBAN" },
            { keys: ["maria", "perez", "occidente", "transferencia", "banco"], label: "TRANSFERENCIAS" },
            { keys: ["credito", "sistecredito", "sistecrédito"], label: "SISTECREDITOS" }
        ];

        archivos.filter(a => a.normalizado).forEach(archivo => {
            const nombreLower = archivo.nombre.toLowerCase();
            const tipoLower = (archivo.tipoArchivo || "").toLowerCase();

            const match = mapeoVisual.find(m =>
                m.keys.some(k => nombreLower.includes(k) || tipoLower.includes(k))
            );

            let fuenteNombre = match ? match.label : (archivo.tipoArchivo || archivo.nombre);

            if (!match) {
                const fuenteUpper = fuenteNombre.toUpperCase();
                if (fuenteUpper.includes('TRANSFERENCIA')) fuenteNombre = 'TRANSFERENCIAS';
                else if (fuenteUpper.includes('ADDI')) fuenteNombre = 'ADDI';
                else if (fuenteUpper.includes('REDEBANA') || fuenteUpper.includes('REDEBAN')) fuenteNombre = 'REDEBAN';
                else if (fuenteUpper.includes('CREDITO') || fuenteUpper.includes('SISTECREDITO')) fuenteNombre = 'SISTECREDITOS';
                else if (fuenteUpper.includes('SUMAS')) fuenteNombre = 'SUMAS';
            }

            let filasAgrupadasEnArchivo = 0;
            const tiendasVistasEnEsteArchivo = new Set<string>();

            archivo.datos.forEach(fila => {
                totalFilasProcesadas++;
                const tiendaRaw = fila._tienda_normalizada || "SIN TIENDA";
                const tienda = String(tiendaRaw).trim().toUpperCase();

                if (tienda === "SIN TIENDA") {
                    filasSinTienda++;
                } else {
                    tiendasVistasEnEsteArchivo.add(tienda);
                }

                if (!grupos[tienda]) grupos[tienda] = {};
                if (!grupos[tienda][fuenteNombre]) grupos[tienda][fuenteNombre] = [];
                grupos[tienda][fuenteNombre].push(fila);
                filasAgrupadasEnArchivo++;
            });
        });
        const gruposConRegistrosOrdenados = ordenarGruposPorCodigo(grupos);

        return ordenarTiendasPorCodigo(gruposConRegistrosOrdenados, tiendaMapeos);
    }, [archivos, tiendaMapeos]);

    const columnasPorFuente = useMemo(() => {
        const cache: Record<string, string[]> = {};
        Object.entries(gruposPorTienda).forEach(([_, fuentes]) => {
            Object.entries(fuentes).forEach(([fuente, datos]) => {
                if (!cache[fuente] && datos.length > 0) {
                    const todasLasColumnas = Object.keys(datos[0]);
                    const keywords = ['fecha', 'documento', 'cedula', 'nit', 'cc', 'idemisor', 'identificaci', 'referencia', 'tienda', 'valor', 'monto', 'total', 'cliente', 'hora', 'comercio', 'sucursal', 'sumas'];
                    const normalizarParaFiltro = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    cache[fuente] = todasLasColumnas.filter(col => {
                        const colNorm = normalizarParaFiltro(col);
                        if (col.startsWith('_') || col === 'tiendaId' || colNorm.includes('descuento')) return false;
                        if ((fuente.includes('REDEBAN') || fuente.toLowerCase().includes('reportediario') || fuente.toLowerCase().includes('ventascomercio')) && colNorm.includes('documento')) return false;
                        return keywords.some(key => colNorm.includes(key)) || colNorm === 'no';
                    }).sort((a, b) => {
                        const getScore = (s: string) => {
                            const sl = normalizarParaFiltro(s);
                            if (sl.includes('fecha')) return 0;
                            if (sl.includes('documento') || sl.includes('cedula') || sl.includes('nit')) return 1;
                            if (sl.includes('tienda')) return 2;
                            if (sl.includes('valor') || sl.includes('monto') || sl.includes('total') || sl.includes('sumas')) return 3;
                            return 10;
                        };
                        return getScore(a) - getScore(b);
                    });
                }
            });
        });
        return cache;
    }, [gruposPorTienda]);

    const exportarArchivosNormalizados = async (tiendaFiltrada?: string | null) => {
        const archivosNormalizados = archivos.filter(a => a.normalizado);
        if (archivosNormalizados.length === 0) return;

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Reporte Kancan");

            let currentStoreRow = 1;

            const tiendasAExportar = tiendaFiltrada
                ? Object.entries(gruposPorTienda).filter(([tienda]) => tienda === tiendaFiltrada)
                : Object.entries(gruposPorTienda);

            tiendasAExportar.forEach(([tienda, fuentes]) => {
                const tiendaRow = worksheet.getRow(currentStoreRow);
                tiendaRow.values = [`TIENDA: ${tienda.toUpperCase()}`];
                worksheet.mergeCells(currentStoreRow, 1, currentStoreRow, 15);

                tiendaRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                tiendaRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1976D2' }
                };
                tiendaRow.alignment = { horizontal: 'center' };

                let startRowSources = currentStoreRow + 2;
                let maxRowInThisSection = startRowSources;

                const nombresFuentes = Object.keys(fuentes);
                for (let i = 0; i < nombresFuentes.length; i += 2) {
                    const fuentesEnEstaFila = [nombresFuentes[i], nombresFuentes[i + 1]].filter(Boolean);
                    const rowForThisPair = startRowSources;
                    let innerMaxRow = rowForThisPair;

                    fuentesEnEstaFila.forEach((fuente, index) => {
                        const colStart = index === 0 ? 1 : 9;
                        const datos = fuentes[fuente];
                        let r = rowForThisPair;

                        const fRow = worksheet.getRow(r);
                        fRow.getCell(colStart).value = `FUENTE: ${fuente.toUpperCase()}`;
                        fRow.getCell(colStart).font = { bold: true, size: 12, color: { argb: 'FF333333' } };
                        r++;

                        let columnasFuente = columnasPorFuente[fuente] || [];
                        if (columnasFuente.length === 0 && datos.length > 0) {
                            columnasFuente = Object.keys(datos[0]).filter(col => !col.startsWith('_') && col !== 'tiendaId');
                        }

                        const hRow = worksheet.getRow(r);
                        columnasFuente.forEach((col, cIdx) => {
                            const cell = hRow.getCell(colStart + cIdx);
                            cell.value = String(col).toUpperCase();
                            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
                            cell.alignment = { horizontal: 'center' };
                            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        });
                        r++;

                        let totalFuente = 0;
                        datos.forEach(fila => {
                            const dRow = worksheet.getRow(r);
                            columnasFuente.forEach((col, cIdx) => {
                                const val = fila[col];
                                const colL = col.toLowerCase();
                                const cell = dRow.getCell(colStart + cIdx);

                                if (colL.includes('fecha') || colL.includes('hora') || colL.includes('time') || colL.includes('creacion')) {
                                    cell.value = formatearValor(val, col);
                                } else if (colL.includes('valor') || colL.includes('monto') || colL.includes('total') || colL.includes('neto') || colL.includes('sumas')) {
                                    const num = typeof val === 'number' ? val : Number(String(val || 0).replace(/[^0-9.-]+/g, ""));
                                    totalFuente += isNaN(num) ? 0 : num;
                                    cell.value = isNaN(num) ? 0 : num;
                                    cell.numFmt = '"$"#,##0';
                                } else {
                                    cell.value = val;
                                }

                                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                            });
                            r++;
                        });

                        const tRow = worksheet.getRow(r);
                        const labelCell = tRow.getCell(colStart + Math.max(0, columnasFuente.length - 2));
                        const valueCell = tRow.getCell(colStart + Math.max(0, columnasFuente.length - 1));

                        labelCell.value = `TOTAL ${fuente.toUpperCase()}:`;
                        labelCell.font = { bold: true };
                        valueCell.value = totalFuente;
                        valueCell.font = { bold: true };
                        valueCell.numFmt = '"$"#,##0';

                        for (let c = 0; c < columnasFuente.length; c++) {
                            tRow.getCell(colStart + c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
                        }
                        r += 2;

                        if (r > innerMaxRow) innerMaxRow = r;
                    });

                    startRowSources = innerMaxRow;
                    if (innerMaxRow > maxRowInThisSection) maxRowInThisSection = innerMaxRow;
                }

                currentStoreRow = maxRowInThisSection + 1;
                worksheet.addRow([]);
                currentStoreRow++;
            });

            worksheet.columns = Array(20).fill(0).map(() => ({ width: 18 }));

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Reporte_Kancan_Agrupado_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Error al exportar Excel con ExcelJS:", error);
        }
    };

    const refrescarMapeosYProcesar = async () => {
        setRefrescando(true);
        try {
            const mapeosDirectus = await obtenerMapeosArchivos();
            const { tablasMapeo: nuevasTablasMapeo, tiendaMapeos: nuevosTiendaMapeos } = procesarMapeosParaNormalizacion(mapeosDirectus);
            setTablasMapeo(nuevasTablasMapeo);
            setTiendaMapeos(nuevosTiendaMapeos);

            setArchivos(prevArchivos => {
                const actualizados = prevArchivos.map(archivo => {
                    const archivoReset: ArchivoSubido = {
                        ...archivo,
                        datos: archivo.datosOriginales ? JSON.parse(JSON.stringify(archivo.datosOriginales)) : archivo.datos,
                        columnas: archivo.columnasOriginales ? [...archivo.columnasOriginales] : archivo.columnas,
                        normalizado: false
                    };

                    const resultadoDecision = findBestMatch(archivoReset.nombre, nuevasTablasMapeo);
                    const nombreLower = archivoReset.nombre.toLowerCase();
                    const esSumas = nombreLower.includes("reporte ventas") || 
                                    nombreLower.includes("sumas") ||
                                    nombreLower.includes("data") ||
                                    (nombreLower.includes("maria fernanda") && nombreLower.includes("reporte")) ||
                                    (nombreLower.includes("naranka") && nombreLower.includes("reporte"));

                    if (esSumas) {
                        archivoReset.tipoArchivo = "SUMAS";
                        const sumasMapeo = nuevasTablasMapeo.find(m => m.source_file === "SUMAS");
                        archivoReset.columnasEliminar = sumasMapeo ? sumasMapeo.columnasEliminar : [];
                    } else if (resultadoDecision) {
                        archivoReset.tipoArchivo = resultadoDecision.tipoArchivo;
                        archivoReset.columnasEliminar = resultadoDecision.mapeo.columnasEliminar;
                    } else {
                        archivoReset.tipoArchivo = "ARCHIVO EXTERNO";
                        archivoReset.columnasEliminar = [];
                    }

                    if (archivo.normalizado) {
                        const procesado = procesarArchivo(archivoReset, nuevosTiendaMapeos);
                        return procesado || archivoReset;
                    }
                    return archivoReset;
                });

                if (archivoSeleccionado) {
                    const seleccionadoActualizado = actualizados.find(a => a.nombre === archivoSeleccionado.nombre);
                    if (seleccionadoActualizado) {
                        setArchivoSeleccionado(seleccionadoActualizado);
                    }
                }

                return actualizados;
            });
        } catch (error) {
            console.error("Error al refrescar y re-procesar:", error);
        } finally {
            setRefrescando(false);
        }
    };

    return {
        archivos,
        archivoSeleccionado,
        cargando,
        cargandoMapeos,
        refrescando,
        errorMapeos,
        validacionesArchivos,
        duplicadosAdvertencia,
        mostrarConfirmacionDuplicados,
        duplicadosParaNormalizar,
        setArchivoSeleccionado,
        handleSubirArchivos,
        handleEliminarArchivo,
        normalizarTodosArchivos,
        confirmarNormalizacionConDuplicados,
        cancelarNormalizacionConDuplicados,
        limpiarAdvertenciaDuplicados,
        exportarArchivosNormalizados,
        refrescarMapeosYProcesar,
        procesarArchivosRaw,
        gruposPorTienda,
        columnasPorFuente,
        cargarDatosMapeo
    };
};
