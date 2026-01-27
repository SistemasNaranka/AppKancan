import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ModalConfirmacion, { ModalTipo } from "../components/modals/Modalconfirmacion";

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

import {
  MapeoArchivo,
  TiendaMapeo,
  ArchivoSubido
} from '../types/mapeo.types';

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Interfaz para el estado del modal
interface ModalState {
  abierto: boolean;
  tipo: ModalTipo;
  titulo: string;
  mensaje: string | string[];
  onConfirmar?: () => void;
}

const NormalizarView: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSubido | null>(null);
  const [cargando, setCargando] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "normalized">("preview");

  // Estado del modal
  const [modal, setModal] = useState<ModalState>({
    abierto: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
  });

  // ✅ Query para cargar mapeos con cache automático
  const {
    data: mapeosData,
    isLoading: cargandoMapeos,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["mapeos_archivos"],
    queryFn: async () => {
      const mapeosDirectus = await obtenerMapeosArchivos();
      console.log('📦 Datos cargados de Directus:', mapeosDirectus);
      
      const resultado = procesarMapeosParaNormalizacion(mapeosDirectus);
      
      console.log('✅ Mapeos procesados:');
      console.log('  - Tipos de archivo:', resultado.tablasMapeo.map(t => t.archivoOrigen));
      console.log('  - Tiendas mapeadas:', resultado.tiendaMapeos.length);
      
      return resultado;
    },
    staleTime: 1000 * 60 * 60, // 1 hora - los datos se consideran frescos
    gcTime: 1000 * 60 * 60 * 2, // 2 horas - tiempo en cache
  });

  // Extraer datos del query
  const tablasMapeo = mapeosData?.tablasMapeo || [];
  const tiendaMapeos = mapeosData?.tiendaMapeos || [];
  const errorMapeos = isError ? (queryError?.message || 'Error al cargar los mapeos desde Directus.') : null;

  // Función para refrescar mapeos manualmente
  const refrescarMapeos = () => {
    queryClient.invalidateQueries({ queryKey: ["mapeos_archivos"] });
  };

  // Función para mostrar modal
  const mostrarModal = (
    tipo: ModalTipo,
    titulo: string,
    mensaje: string | string[],
    onConfirmar?: () => void
  ) => {
    setModal({ abierto: true, tipo, titulo, mensaje, onConfirmar });
  };

  // Función para cerrar modal
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
          console.log(`✓ Mapeo encontrado para ${nuevoArchivo.nombre} → Tipo: ${resultado.tipoArchivo}`);
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
      // Filtrar filas vacías antes de agregar
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
      
      let columnasFinales = obtenerColumnasRestantes(
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

      // Cambiar a vista de normalizados si hubo archivos normalizados
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

  // Función para filtrar filas vacías
  const filtrarFilasVacias = (datos: any[]): any[] => {
    return datos.filter(fila => {
      // Verifica si la fila tiene algún valor que no esté vacío
      return Object.values(fila).some(valor =>
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ""
      );
    });
  };

  // Función para obtener nombre de tabla según el archivo
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
      // Default fallback
      return nombreArchivo;
    }
  };

  if (cargandoMapeos) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Cargando configuración de mapeos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {errorMapeos && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refrescarMapeos}>
              Reintentar
            </Button>
          }
        >
          {errorMapeos}
        </Alert>
      )}

      {viewMode === "preview" ? (
        /* Vista de subida y previsualización */
        <Box>
          {/* Botones principales */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              multiple
              style={{ display: "none" }}
              id="input-archivo"
              onChange={handleSubirArchivos}
            />
            <label htmlFor="input-archivo">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={cargandoMapeos || !!errorMapeos}
                sx={{ 
                  backgroundColor: "#ffffff63", 
                  boxShadow: 'none', 
                  color: '#004680', 
                  border: 'solid 1px',
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#0c4c810e"
                  }
                }}
              >
                Subir Archivos
              </Button>
            </label>

            <Button
              variant="contained"
              onClick={normalizarTodosLosArchivos}
              disabled={archivos.length === 0 || archivos.every(a => a.normalizado || !a.tipoArchivo) || cargando}
              sx={{ 
                backgroundColor: "#28a745", 
                boxShadow: 'none', 
                color: '#ffffff',
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#218838"
                }
              }}
            >
              {cargando ? "Procesando..." : "Normalizar Todo"}
            </Button>

            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={limpiarTodosLosArchivos}
              disabled={archivos.length === 0}
              sx={{ 
                backgroundColor: "#dc3545", 
                boxShadow: 'none', 
                color: '#ffffff',
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#c82333"
                }
              }}
            >
              Limpiar Todo
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportarArchivosNormalizados}
              disabled={!archivos.some(a => a.normalizado)}
              sx={{ 
                backgroundColor: "#004680", 
                boxShadow: 'none', 
                color: '#ffffff',
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#0f5fa1"
                }
              }}
            >
              Exportar
            </Button>

            {/* Botón para ver archivos normalizados */}
            {archivos.some(a => a.normalizado) && (
              <Button
                variant="outlined"
                onClick={() => setViewMode("normalized")}
                sx={{ 
                  marginLeft: "auto",
                  borderColor: "#00468000",
                  backgroundColor: "#004680",
                  color: "#ffffff",
                  "&:hover": {
                    boxShadow: "none",
                    backgroundColor: "#0f5fa1"
                }
                }}
              >
                Ver Normalizados
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 3 }}>
            {/* Panel izquierdo - Lista de archivos */}
            <Card sx={{ width: 335, height: "fit-content", borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
                  Archivos Subidos ({archivos.length})
                </Typography>

                {archivos.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    No hay archivos subidos
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {archivos.map((archivo) => (
                      <Box
                        key={archivo.nombre}
                        onClick={() => setArchivoSeleccionado(archivo)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          backgroundColor:
                            archivoSeleccionado?.nombre === archivo.nombre
                              ? "#e3f2fd"
                              : "#f5f5f5",
                          border:
                            archivoSeleccionado?.nombre === archivo.nombre
                              ? "2px solid #1976d2"
                              : "2px solid transparent",
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <InsertDriveFileIcon sx={{ color: "#1976d2" }} />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                maxWidth: 150,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {archivo.nombre}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              <Chip
                                label={archivo.tipo}
                                size="small"
                                color="primary"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                              <Chip
                                label={`${filtrarFilasVacias(archivo.datos).length} filas`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                              {archivo.normalizado && (
                                <Chip
                                  label="Normalizado"
                                  size="small"
                                  color="success"
                                  sx={{ fontSize: "0.7rem", height: 20 }}
                                />
                              )}
                              {!archivo.tipoArchivo && (
                                <Chip
                                  label="Sin mapeo"
                                  size="small"
                                  sx={{ fontSize: "0.7rem", height: 20, backgroundColor: "#d63e3e", color: "#fff"}}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarArchivo(archivo.nombre);
                          }}
                          sx={{ color: "#d63e3e" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Panel derecho - Vista previa */}
            <Card sx={{ flex: 1, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold"}}>
                  Vista Previa
                </Typography>

                {!archivoSeleccionado ? (
                  <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
                    Selecciona un archivo para ver su contenido
                  </Typography>
                ) : (
                  <>

                    <TableContainer component={Paper} sx={{ 
                      maxHeight: 500, 
                      overflow: "auto", 
                      boxShadow: "none",
                      "&::-webkit-scrollbar": {
                        display: "none"
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f1f1f1",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#c1c1c1",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: "#a1a1a1",
                        },
                      },
                    }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                backgroundColor: "#1976d2",
                                color: "white",
                                minWidth: 50,
                              }}
                            >
                              #
                            </TableCell>
                            {archivoSeleccionado.columnas.map((columna, index) => (
                              <TableCell
                                key={index}
                                sx={{
                                  fontWeight: "bold",
                                  backgroundColor: "#1976d2",
                                  color: "white",
                                  minWidth: 120,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {columna}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filtrarFilasVacias(archivoSeleccionado.datos).slice(0, 50).map((fila, indexFila) => (
                            <TableRow
                              key={indexFila}
                              hover
                              sx={{
                                backgroundColor: indexFila % 2 === 0 ? "#ffffff" : "#f5f5f5",
                              }}
                            >
                              <TableCell sx={{ color: "#666", fontWeight: "bold" }}>
                                {indexFila + 1}
                              </TableCell>
                              {archivoSeleccionado.columnas.map((columna, indexCol) => (
                                <TableCell
                                  key={indexCol}
                                  sx={{
                                    whiteSpace: "nowrap",
                                    maxWidth: 200,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {formatearValor(fila[columna])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {filtrarFilasVacias(archivoSeleccionado.datos).length > 50 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, textAlign: "center" }}
                      >
                        Mostrando 50 de {filtrarFilasVacias(archivoSeleccionado.datos).length} filas
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      ) : (
        /* Vista de archivos normalizados */
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            {/* Botón Exportar a la izquierda */}
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportarArchivosNormalizados}
              sx={{ 
                backgroundColor: "#004680", 
                boxShadow: 'none', 
                color: '#ffffff',
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#0f5fa1"
                }
              }}
            >
              Exportar
            </Button>

            {/* Título centrado */}
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a2a3ae0"}}>
              Archivos Normalizados
            </Typography>
            
            {/* Botón Volver a la derecha */}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setViewMode("preview")}
              sx={{ 
                borderColor: "#1976d200",
                color: "#ffffff",
                backgroundColor: "#004680",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#0f5fa1"
                }
              }}
            >
              Volver
            </Button>
          </Box>

          {(() => {
            const archivosNormalizados = archivos.filter(a => a.normalizado);
            return archivosNormalizados.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
                No hay archivos normalizados para mostrar
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                    "@media (max-width: 1200px)": {
                      gridTemplateColumns: "repeat(2, 1fr)",
                    },
                    "@media (max-width: 900px)": {
                      gridTemplateColumns: "1fr",
                    }
                  }}
                >
                  {archivosNormalizados.map((archivo) => (
                    <Card key={archivo.nombre} sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}>
                          {obtenerNombreTabla(archivo.nombre)}
                        </Typography>

                        <TableContainer component={Paper} sx={{ 
                          maxHeight: 400, 
                          overflow: "auto", 
                          boxShadow: "none",
                          "&::-webkit-scrollbar": {
                            display: "none"
                          }
                        }}>
                          <Table stickyHeader size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    minWidth: 50,
                                  }}
                                >
                                  #
                                </TableCell>
                                {archivo.columnas.map((columna, index) => (
                                  <TableCell
                                    key={index}
                                    sx={{
                                      fontWeight: "bold",
                                      backgroundColor: "#1976d2",
                                      color: "white",
                                      minWidth: 120,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {columna}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filtrarFilasVacias(archivo.datos).slice(0, 50).map((fila, indexFila) => (
                                <TableRow
                                  key={indexFila}
                                  hover
                                  sx={{
                                    backgroundColor: indexFila % 2 === 0 ? "#ffffff" : "#f5f5f5",
                                  }}
                                >
                                  <TableCell sx={{ color: "#666", fontWeight: "bold" }}>
                                    {indexFila + 1}
                                  </TableCell>
                                  {archivo.columnas.map((columna, indexCol) => (
                                    <TableCell
                                      key={indexCol}
                                      sx={{
                                        whiteSpace: "nowrap",
                                        maxWidth: 200,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {formatearValor(fila[columna])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </>
            );
          })()}
        </Box>
      )}

      {/* Modal de confirmación/alerta */}
      <ModalConfirmacion
        abierto={modal.abierto}
        onCerrar={cerrarModal}
        onConfirmar={modal.onConfirmar}
        tipo={modal.tipo}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
      />
    </Box>
  );
};

export default NormalizarView;