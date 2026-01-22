import React, { useState, useEffect } from "react";
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
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";

const Home: React.FC = () => {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSubido | null>(null);
  const [tablasMapeo, setTablasMapeo] = useState<MapeoArchivo[]>([]);
  const [tiendaMapeos, setTiendaMapeos] = useState<TiendaMapeo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoMapeos, setCargandoMapeos] = useState(true);
  const [errorMapeos, setErrorMapeos] = useState<string | null>(null);

  // Cargar datos de mapeo desde Directus al iniciar
  useEffect(() => {
    cargarDatosMapeo();
  }, []);

  const cargarDatosMapeo = async () => {
    setCargandoMapeos(true);
    setErrorMapeos(null);
    
    try {
      // Obtener datos de Directus
      const mapeosDirectus = await obtenerMapeosArchivos();
      
      console.log('📦 Datos cargados de Directus:', mapeosDirectus);
      
      // Procesar y separar en las estructuras que necesitamos
      const { tablasMapeo, tiendaMapeos } = procesarMapeosParaNormalizacion(mapeosDirectus);
      
      setTablasMapeo(tablasMapeo);
      setTiendaMapeos(tiendaMapeos);
      
      console.log('✅ Mapeos procesados:');
      console.log('  - Tipos de archivo:', tablasMapeo.map(t => t.archivoOrigen));
      console.log('  - Tiendas mapeadas:', tiendaMapeos.length);
      
    } catch (error) {
      console.error('❌ Error al cargar mapeos:', error);
      setErrorMapeos('Error al cargar los mapeos desde Directus. Verifica la conexión.');
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
            // Si tiene más de una hoja, usar la segunda (índice 1), sino usar la primera
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

    for (let i = 0; i < files.length; i++) {
      try {
        const nuevoArchivo = await leerArchivo(files[i]);
        
        // Buscar mapeo usando fuzzy matching
        const resultado = findBestMatch(nuevoArchivo.nombre, tablasMapeo);
        
        if (resultado) {
          nuevoArchivo.tipoArchivo = resultado.tipoArchivo;
          nuevoArchivo.columnasEliminar = resultado.mapeo.columnasEliminar;
          console.log(`✓ Mapeo encontrado para ${nuevoArchivo.nombre} → Tipo: ${resultado.tipoArchivo}`);
          console.log(`  Columnas a eliminar:`, resultado.mapeo.columnasEliminar);
        } else {
          console.warn(`⚠ No se encontró mapeo para ${nuevoArchivo.nombre}`);
        }
        
        setArchivos((prev) => [...prev, nuevoArchivo]);
        
        if (i === 0) {
          setArchivoSeleccionado(nuevoArchivo);
        }
      } catch (error) {
        console.error(`Error al leer ${files[i].name}:`, error);
      }
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

  const handleComparacion = () => {
    if (archivos.length < 2) {
      alert("Necesitas al menos 2 archivos para comparar");
      return;
    }
    alert("Función de comparación en desarrollo...\n\nArchivos a comparar:\n" + archivos.map(a => `- ${a.nombre}`).join("\n"));
  };

  const exportarArchivosNormalizados = () => {
    // Filtrar solo archivos normalizados
    const archivosNormalizados = archivos.filter(a => a.normalizado);
    
    if (archivosNormalizados.length === 0) {
      alert("No hay archivos normalizados para exportar");
      return;
    }

    // Combinar todos los datos
    let datosCombinados: any[] = [];
    
    archivosNormalizados.forEach(archivo => {
      // Agregar columna de origen para identificar de qué archivo viene cada fila
      const datosConOrigen = archivo.datos.map(fila => ({
        ...fila,
        _archivo_origen: archivo.tipoArchivo || archivo.nombre
      }));
      datosCombinados = [...datosCombinados, ...datosConOrigen];
    });

    // Obtener todas las columnas únicas de todos los archivos
    const todasLasColumnas = new Set<string>();
    archivosNormalizados.forEach(archivo => {
      archivo.columnas.forEach(col => todasLasColumnas.add(col));
    });
    todasLasColumnas.add('_archivo_origen');
    
    const columnasArray = Array.from(todasLasColumnas);

    // Crear contenido CSV
    const csvHeader = columnasArray.join(',');
    const csvRows = datosCombinados.map(fila => {
      return columnasArray.map(col => {
        const valor = fila[col] ?? '';
        // Escapar valores que contengan comas o comillas
        const valorStr = String(valor);
        if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')) {
          return `"${valorStr.replace(/"/g, '""')}"`;
        }
        return valorStr;
      }).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archivos_normalizados_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✓ Exportados ${archivosNormalizados.length} archivo(s) con ${datosCombinados.length} filas en total`);
  };

  const normalizarArchivo = async (archivo: ArchivoSubido) => {
    if (!archivo.tipoArchivo) {
      alert("No se puede normalizar: no hay mapeo definido para este archivo");
      return;
    }

    setCargando(true);

    try {
      console.log("=== DATOS ANTES DE NORMALIZAR ===");
      console.log("Tipo de archivo:", archivo.tipoArchivo);
      console.log("Primera fila:", archivo.datos[0]);
      console.log("Tienda Mapeos disponibles:", tiendaMapeos);
      
      // 1. Buscar y cambiar nombres de tiendas en TODAS las celdas
      let datosNormalizados = mapearNombresTiendasEnTodasLasCeldas(
        archivo.datos,
        tiendaMapeos,
        archivo.tipoArchivo
      );
      
      console.log("=== DATOS DESPUÉS DE MAPEAR TIENDAS ===");
      console.log("Primera fila:", datosNormalizados[0]);
      
      // 2. Eliminar columnas especificadas
      if (archivo.columnasEliminar && archivo.columnasEliminar.length > 0) {
        console.log(`Eliminando columnas:`, archivo.columnasEliminar);
        datosNormalizados = eliminarColumnasPorNombre(
          datosNormalizados,
          archivo.columnasEliminar
        );
      }
      
      // 3. Obtener columnas finales
      let columnasFinales = obtenerColumnasRestantes(
        archivo.columnas,
        archivo.columnasEliminar || []
      );

      // 4. Actualizar archivo
      const archivoNormalizado: ArchivoSubido = {
        ...archivo,
        datos: datosNormalizados,
        columnas: columnasFinales,
        normalizado: true
      };

      setArchivos((prev) =>
        prev.map((a) => (a.nombre === archivo.nombre ? archivoNormalizado : a))
      );
      
      setArchivoSeleccionado(archivoNormalizado);
      
      const columnasEliminadas = archivo.columnasEliminar?.length || 0;
      const tiendasMapeadas = tiendaMapeos.filter(
        t => t.archivoOrigen.toLowerCase() === archivo.tipoArchivo?.toLowerCase()
      ).length;
      
      alert(`✓ Archivo normalizado\n- ${tiendasMapeadas} tiendas configuradas para mapeo\n- ${columnasEliminadas} columnas eliminadas`);
    } catch (error) {
      console.error("Error al normalizar:", error);
      alert("Error al normalizar el archivo");
    } finally {
      setCargando(false);
    }
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "number") return valor.toLocaleString();
    return String(valor);
  };

  /**
   * Exporta todos los archivos normalizados en un solo CSV
   */

  // Mostrar loader mientras cargan los mapeos
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
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "transparent" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "#1a2a3a" }}>
        Pruebas - Comparación de Archivos
      </Typography>

      {/* Alerta de error si falla la carga de mapeos */}
      {errorMapeos && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={cargarDatosMapeo}>
              Reintentar
            </Button>
          }
        >
          {errorMapeos}
        </Alert>
      )}


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

        {/* <Button
          variant="contained"
          startIcon={<CompareArrowsIcon />}
          onClick={handleComparacion}
          disabled={archivos.length < 2}
          sx={{ 
            backgroundColor: "#017ce1", 
            boxShadow: 'none', 
            color: '#ffffff',
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#006fc9"
            }
          }}
        >
          Comparación
        </Button>  */}

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportarArchivosNormalizados}
          disabled={!archivos.some(a => a.normalizado)}
          sx={{ 
            backgroundColor: "#017ce1", 
            boxShadow: 'none', 
            color: '#ffffff',
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#006fc9"
            }
          }}
        >
          Exportar
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            if (archivoSeleccionado) {
              normalizarArchivo(archivoSeleccionado);
            } else {
              alert("Selecciona un archivo primero");
            }
          }}
          disabled={!archivoSeleccionado || archivoSeleccionado.normalizado || cargando}
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
          {cargando ? "Procesando..." : "Normalizar Archivo"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Panel izquierdo - Lista de archivos */}
        <Card sx={{ width: 335, height: "fit-content", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
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
                            label={`${archivo.datos.length} filas`}
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
                              color="warning"
                              sx={{ fontSize: "0.7rem", height: 20 }}
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Vista Previa
            </Typography>

            {!archivoSeleccionado ? (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
                Selecciona un archivo para ver su contenido
              </Typography>
            ) : (
              <>
                <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip label={`Archivo: ${archivoSeleccionado.nombre}`} color="primary" />
                  <Chip label={`Filas: ${archivoSeleccionado.datos.length}`} variant="outlined" />
                  <Chip label={`Columnas: ${archivoSeleccionado.columnas.length}`} variant="outlined" />
                  {archivoSeleccionado.tipoArchivo && (
                    <Chip 
                      label={`Tipo: ${archivoSeleccionado.tipoArchivo}`} 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: "auto", boxShadow: "none" }}>
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
                      {archivoSeleccionado.datos.slice(0, 50).map((fila, indexFila) => (
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

                {archivoSeleccionado.datos.length > 50 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, textAlign: "center" }}
                  >
                    Mostrando 50 de {archivoSeleccionado.datos.length} filas
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Home;