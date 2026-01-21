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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { auto } from "@popperjs/core";

interface ArchivoSubido {
  nombre: string;
  tipo: string;
  datos: any[];
  columnas: string[];
}

const Home: React.FC = () => {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSubido | null>(null);

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

    for (let i = 0; i < files.length; i++) {
      try {
        const nuevoArchivo = await leerArchivo(files[i]);
        setArchivos((prev) => [...prev, nuevoArchivo]);
        if (i === 0) {
          setArchivoSeleccionado(nuevoArchivo);
        }
      } catch (error) {
        console.error(`Error al leer ${files[i].name}:`, error);
      }
    }
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
    // TODO: Implementar lógica de comparación
    alert("Función de comparación en desarrollo...\n\nArchivos a comparar:\n" + archivos.map(a => `- ${a.nombre}`).join("\n"));
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "number") return valor.toLocaleString();
    return String(valor);
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", backgroundColor: "transparent" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "#1a2a3a" }}>
        Pruebas - Comparación de Archivos
      </Typography>

      {/* Botones principales */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, }}>
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
            sx={{ backgroundColor: "#ffffff63", boxShadow: 'none', color: '#004680', border: 'solid 1px',
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
          startIcon={<CompareArrowsIcon />}
          onClick={handleComparacion}
          disabled={archivos.length < 2}
          sx={{ backgroundColor: "#017ce1",  boxShadow: 'none', color: '#ffffff',
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#006fc9"
            }
           }}
        >
          Comparación
        </Button> 
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Panel izquierdo - Lista de archivos */}
        <Card sx={{ width: 335, height: "fit-content", borderRadius: 2, }}>
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
                        <Box sx={{ display: "flex", gap: 1.0 }}>
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
        <Card sx={{ flex: 1, borderRadius: 2,}}>
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