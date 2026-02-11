import { useState, useEffect, useMemo } from 'react';
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
                        // Optimizar lectura: ignorar estilos y fórmulas si no son necesarios
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

    const procesarArchivosRaw = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        setCargando(true);

        const fileArray = Array.from(files);

        try {
            // Procesar todos los archivos en paralelo
            const nuevosArchivos = await Promise.all(fileArray.map(async (file) => {
                try {
                    const nuevoArchivo = await leerArchivo(file);
                    const resultadoDecision = findBestMatch(nuevoArchivo.nombre, tablasMapeo);

                    if (resultadoDecision) {
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

            // Filtrar los que fallaron y actualizar estado una sola vez
            const archivosValidos = nuevosArchivos.filter((a): a is ArchivoSubido => a !== null);

            if (archivosValidos.length > 0) {
                setArchivos(prev => [...prev, ...archivosValidos]);
                setArchivoSeleccionado(prev => prev ? prev : archivosValidos[0]);
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
            /* 
                        // Regla especial para ReporteDiariodeVentasComercio: ocultar columna documento
                        // ya que este reporte trae direcciones en ese campo
                        if (archivo.tipoArchivo?.trim().toLowerCase() === 'reportediariodeventascomercio' && (colNorm.includes('documento') || colNorm === 'documento')) {
                            columnasAEliminarAdicionales.push(col);
                            return;
                        }
            */
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

        // Validar la calidad del mapeo de tiendas
        const validacion = validarDatosNormalizados(datosNormalizados, archivo.tipoArchivo);

        // Guardar validación para mostrar al usuario
        setValidacionesArchivos(prev => ({
            ...prev,
            [archivo.nombre]: validacion
        }));

        // Mostrar resumen de validación en consola
        console.log(`\n🔍 Validación de "${archivo.nombre}":`);
        if (validacion.errores.length > 0) {
            console.error('❌ Errores:', validacion.errores);
        }
        if (validacion.advertencias.length > 0) {
            console.warn('⚠️ Advertencias:', validacion.advertencias);
        }
        console.log('📊 Estadísticas:', validacion.estadisticas);

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
        let totalFilasProcesadas = 0;
        let filasSinTienda = 0;

        // Mapeo detallado para asegurar que coincidan los nombres de los archivos
        const mapeoVisual = [
            { keys: ["transactions", "addi"], label: "ADDI" },
            { keys: ["reportediario", "ventascomercio", "redebana"], label: "REDEBANA" },
            { keys: ["maria", "perez", "occidente", "transferencia", "banco"], label: "TRANSFERENCIAS" },
            { keys: ["credito", "sistecredito", "sistecrédito"], label: "SISTECREDITOS" }
        ];

        archivos.filter(a => a.normalizado).forEach(archivo => {
            const nombreLower = archivo.nombre.toLowerCase();
            const tipoLower = (archivo.tipoArchivo || "").toLowerCase();

            console.log(`\n📄 Procesando archivo: "${archivo.nombre}"`);
            console.log(`   Tipo detectado: "${archivo.tipoArchivo}"`);

            // Buscamos coincidencia parcial en el nombre del archivo o en el tipo detectado
            const match = mapeoVisual.find(m =>
                m.keys.some(k => nombreLower.includes(k) || tipoLower.includes(k))
            );

            // Si no hay match por palabras clave, intentar normalizar el tipo/nombre
            let fuenteNombre = match ? match.label : (archivo.tipoArchivo || archivo.nombre);

            // Verificación extra: si la fuente detectada se parece a alguna de las estándar, forzarla
            if (!match) {
                const fuenteUpper = fuenteNombre.toUpperCase();
                if (fuenteUpper.includes('TRANSFERENCIA')) fuenteNombre = 'TRANSFERENCIAS';
                else if (fuenteUpper.includes('ADDI')) fuenteNombre = 'ADDI';
                else if (fuenteUpper.includes('REDEBANA') || fuenteUpper.includes('REDEBAN')) fuenteNombre = 'REDEBANA';
                else if (fuenteUpper.includes('CREDITO') || fuenteUpper.includes('SISTECREDITO')) fuenteNombre = 'SISTECREDITOS';
            }

            console.log(`   ✓ Etiqueta asignada: "${fuenteNombre}"`);
            console.log(`   📊 Filas en archivo: ${archivo.datos.length}`);

            let filasAgrupadasEnArchivo = 0;
            let tiendasVistasEnEsteArchivo = new Set<string>();

            archivo.datos.forEach(fila => {
                totalFilasProcesadas++;
                // NORMALIZACIÓN DE TIENDA: Siempre Mayúsculas y Trim para agrupar correctamente
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

            console.log(`   ✓ Filas agrupadas: ${filasAgrupadasEnArchivo}`);
            console.log(`   🏬 Tiendas identificadas en este archivo:`, Array.from(tiendasVistasEnEsteArchivo));
        });

        // Logging de estadísticas de agrupación
        if (totalFilasProcesadas > 0) {
            console.log(`\n🏪 Estadísticas de Agrupación por Tienda:`);
            console.log(`  📊 Total de filas procesadas: ${totalFilasProcesadas}`);
            console.log(`  🏬 Tiendas únicas encontradas: ${Object.keys(grupos).length}`);
            console.log(`  📋 Tiendas:`, Object.keys(grupos).sort());

            // Mostrar detalle de fuentes por tienda
            Object.entries(grupos).forEach(([tienda, fuentes]) => {
                console.log(`\n  🏪 ${tienda}:`);
                Object.entries(fuentes).forEach(([fuente, datos]) => {
                    console.log(`     - ${fuente}: ${datos.length} registros`);
                });
            });

            if (filasSinTienda > 0) {
                console.warn(`\n  ⚠️ Filas sin tienda asignada: ${filasSinTienda} (${((filasSinTienda / totalFilasProcesadas) * 100).toFixed(1)}%)`);
                console.warn(`     Estas filas aparecerán en el grupo "SIN TIENDA"`);
            }
        }

        // Primero ordenar los registros dentro de cada tienda por su código
        const gruposConRegistrosOrdenados = ordenarGruposPorCodigo(grupos);

        // Luego ordenar las tiendas por su ID de la base de datos
        return ordenarTiendasPorCodigo(gruposConRegistrosOrdenados, tiendaMapeos);
    }, [archivos, tiendaMapeos]);

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

    const exportarArchivosNormalizados = async (tiendaFiltrada?: string | null) => {
        const archivosNormalizados = archivos.filter(a => a.normalizado);
        if (archivosNormalizados.length === 0) return;

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Reporte Kancan");

            let currentStoreRow = 1;

            // Filtrar tiendas si hay una seleccionada
            const tiendasAExportar = tiendaFiltrada
                ? Object.entries(gruposPorTienda).filter(([tienda]) => tienda === tiendaFiltrada)
                : Object.entries(gruposPorTienda);

            tiendasAExportar.forEach(([tienda, fuentes]) => {
                // TÍTULO DE LA TIENDA (Abarca ambas columnas de la cuadrícula)
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

                // Agrupar fuentes de dos en dos para el diseño en paralelo
                const nombresFuentes = Object.keys(fuentes);
                for (let i = 0; i < nombresFuentes.length; i += 2) {
                    const fuentesEnEstaFila = [nombresFuentes[i], nombresFuentes[i + 1]].filter(Boolean);
                    let rowForThisPair = startRowSources;
                    let innerMaxRow = rowForThisPair;

                    fuentesEnEstaFila.forEach((fuente, index) => {
                        const colStart = index === 0 ? 1 : 9; // Columna A o Columna I
                        const datos = fuentes[fuente];
                        let r = rowForThisPair;

                        // Título de la Fuente
                        const fRow = worksheet.getRow(r);
                        fRow.getCell(colStart).value = `FUENTE: ${fuente.toUpperCase()}`;
                        fRow.getCell(colStart).font = { bold: true, size: 12, color: { argb: 'FF333333' } };
                        r++;

                        // Encabezados
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

                        // Datos
                        let totalFuente = 0;
                        datos.forEach(fila => {
                            const dRow = worksheet.getRow(r);
                            columnasFuente.forEach((col, cIdx) => {
                                let val = fila[col];
                                const colL = col.toLowerCase();
                                const cell = dRow.getCell(colStart + cIdx);

                                if (colL.includes('fecha') || colL.includes('hora') || colL.includes('time') || colL.includes('creacion')) {
                                    cell.value = formatearValor(val, col);
                                } else if (colL.includes('valor') || colL.includes('monto') || colL.includes('total') || colL.includes('neto')) {
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

                        // Fila de Total
                        const tRow = worksheet.getRow(r);
                        const labelCell = tRow.getCell(colStart + Math.max(0, columnasFuente.length - 2));
                        const valueCell = tRow.getCell(colStart + Math.max(0, columnasFuente.length - 1));

                        labelCell.value = `TOTAL ${fuente.toUpperCase()}:`;
                        labelCell.font = { bold: true };
                        valueCell.value = totalFuente;
                        valueCell.font = { bold: true };
                        valueCell.numFmt = '"$"#,##0';

                        // Estilo fondo fila total
                        for (let c = 0; c < columnasFuente.length; c++) {
                            tRow.getCell(colStart + c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
                        }
                        r += 2; // Espacio después de la tabla

                        if (r > innerMaxRow) innerMaxRow = r;
                    });

                    startRowSources = innerMaxRow;
                    if (innerMaxRow > maxRowInThisSection) maxRowInThisSection = innerMaxRow;
                }

                currentStoreRow = maxRowInThisSection + 1;
                worksheet.addRow([]); // Fila vacía entre tiendas
                currentStoreRow++;
            });

            // Ajuste de anchos de columna
            worksheet.columns = Array(20).fill(0).map(() => ({ width: 18 }));

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
        validacionesArchivos,
        setArchivoSeleccionado,
        handleSubirArchivos,
        handleEliminarArchivo,
        normalizarTodosArchivos,
        exportarArchivosNormalizados,
        procesarArchivosRaw,
        gruposPorTienda,
        columnasPorFuente,
        cargarDatosMapeo
    };
};
