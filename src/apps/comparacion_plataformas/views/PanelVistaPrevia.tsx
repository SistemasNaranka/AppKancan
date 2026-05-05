import React from "react";
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import { ArchivoSubido } from "../types/mapeo.types";

interface Props {
  archivos: ArchivoSubido[];
  archivoSeleccionado: ArchivoSubido | null;
  setArchivoSeleccionado: (archivo: ArchivoSubido | null) => void;
  cargandoMapeos: boolean;
  errorMapeos: string | null;
  cargando: boolean;
  handleSubirArchivos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  normalizarTodosLosArchivos: () => void;
  limpiarTodosLosArchivos: () => void;
  exportarArchivosNormalizados: () => void;
  setViewMode: (mode: "preview" | "normalized") => void;
  handleEliminarArchivo: (nombre: string) => void;
  filtrarFilasVacias: (datos: any[]) => any[];
  formatearValor: (valor: any) => string;
}

const PanelVistaPrevia: React.FC<Props> = ({
  archivos, archivoSeleccionado, setArchivoSeleccionado, cargandoMapeos, errorMapeos,
  cargando, handleSubirArchivos, normalizarTodosLosArchivos, limpiarTodosLosArchivos,
  exportarArchivosNormalizados, setViewMode, handleEliminarArchivo, filtrarFilasVacias, formatearValor
}) => {
  return (
    <Box>
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
              backgroundColor: "#ffffff63", boxShadow: 'none', color: '#004680', border: 'solid 1px',
              "&:hover": { boxShadow: "none", backgroundColor: "#0c4c810e" }
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
            backgroundColor: "#28a745", boxShadow: 'none', color: '#ffffff',
            "&:hover": { boxShadow: "none", backgroundColor: "#218838" }
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
            backgroundColor: "#dc3545", boxShadow: 'none', color: '#ffffff',
            "&:hover": { boxShadow: "none", backgroundColor: "#c82333" }
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
            backgroundColor: "#004680", boxShadow: 'none', color: '#ffffff',
            "&:hover": { boxShadow: "none", backgroundColor: "#0f5fa1" }
          }}
        >
          Exportar
        </Button>

        {archivos.some(a => a.normalizado) && (
          <Button
            variant="outlined"
            onClick={() => setViewMode("normalized")}
            sx={{
              marginLeft: "auto", borderColor: "#00468000", backgroundColor: "#004680", color: "#ffffff",
              "&:hover": { boxShadow: "none", backgroundColor: "#0f5fa1" }
            }}
          >
            Ver Normalizados
          </Button>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Panel izquierdo */}
        <Card sx={{ width: 335, height: "fit-content", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
              Archivos Subidos ({archivos.length})
            </Typography>

            {archivos.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>No hay archivos subidos</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {archivos.map((archivo) => (
                  <Box
                    key={archivo.nombre}
                    onClick={() => setArchivoSeleccionado(archivo)}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderRadius: 2, cursor: "pointer",
                      backgroundColor: archivoSeleccionado?.nombre === archivo.nombre ? "#e3f2fd" : "#f5f5f5",
                      border: archivoSeleccionado?.nombre === archivo.nombre ? "2px solid #1976d2" : "2px solid transparent",
                      "&:hover": { backgroundColor: "#e3f2fd" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InsertDriveFileIcon sx={{ color: "#1976d2" }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {archivo.nombre}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          <Chip label={archivo.tipo} size="small" color="primary" sx={{ fontSize: "0.7rem", height: 20 }} />
                          <Chip label={`${filtrarFilasVacias(archivo.datos).length} filas`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
                          {archivo.normalizado && <Chip label="Normalizado" size="small" color="success" sx={{ fontSize: "0.7rem", height: 20 }} />}
                          {!archivo.tipoArchivo && <Chip label="Sin mapeo" size="small" sx={{ fontSize: "0.7rem", height: 20, backgroundColor: "#d63e3e", color: "#fff" }} />}
                        </Box>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEliminarArchivo(archivo.nombre); }} sx={{ color: "#d63e3e" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Panel derecho */}
        <Card sx={{ flex: 1, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>Vista Previa</Typography>

            {!archivoSeleccionado ? (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>Selecciona un archivo para ver su contenido</Typography>
            ) : (
              <>
                <TableContainer component={Paper} sx={{
                  maxHeight: 500, overflow: "auto", boxShadow: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                  "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "4px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#c1c1c1", borderRadius: "4px", "&:hover": { backgroundColor: "#a1a1a1" } },
                }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", backgroundColor: "#1976d2", color: "white", minWidth: 50 }}>#</TableCell>
                        {archivoSeleccionado.columnas.map((columna, index) => (
                          <TableCell key={index} sx={{ fontWeight: "bold", backgroundColor: "#1976d2", color: "white", minWidth: 120, whiteSpace: "nowrap" }}>
                            {columna}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtrarFilasVacias(archivoSeleccionado.datos).map((fila, indexFila) => (
                        <TableRow key={indexFila} hover sx={{ backgroundColor: indexFila % 2 === 0 ? "#ffffff" : "#f5f5f5" }}>
                          <TableCell sx={{ color: "#666", fontWeight: "bold" }}>{indexFila + 1}</TableCell>
                          {archivoSeleccionado.columnas.map((columna, indexCol) => (
                            <TableCell key={indexCol} sx={{ whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {formatearValor(fila[columna])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
                  Total filas: {filtrarFilasVacias(archivoSeleccionado.datos).length}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default PanelVistaPrevia;