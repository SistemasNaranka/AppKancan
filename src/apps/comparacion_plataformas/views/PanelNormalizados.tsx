import React from "react";
import { Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ArchivoSubido } from "../types/mapeo.types";

interface Props {
  archivos: ArchivoSubido[];
  exportarArchivosNormalizados: () => void;
  setViewMode: (mode: "preview" | "normalized") => void;
  obtenerNombreTabla: (nombre: string) => string;
  filtrarFilasVacias: (datos: any[]) => any[];
  formatearValor: (valor: any) => string;
}

const PanelNormalizados: React.FC<Props> = ({
  archivos, exportarArchivosNormalizados, setViewMode, obtenerNombreTabla, filtrarFilasVacias, formatearValor
}) => {
  const archivosNormalizados = archivos.filter(a => a.normalizado);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportarArchivosNormalizados}
          sx={{
            backgroundColor: "#004680", boxShadow: 'none', color: '#ffffff',
            "&:hover": { boxShadow: "none", backgroundColor: "#0f5fa1" }
          }}
        >
          Exportar
        </Button>

        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
          Archivos Normalizados
        </Typography>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setViewMode("preview")}
          sx={{
            borderColor: "#1976d200", color: "#ffffff", backgroundColor: "#004680",
            "&:hover": { boxShadow: "none", backgroundColor: "#0f5fa1" }
          }}
        >
          Volver
        </Button>
      </Box>

      {archivosNormalizados.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
          No hay archivos normalizados para mostrar
        </Typography>
      ) : (
        <Box sx={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3,
          "@media (max-width: 1200px)": { gridTemplateColumns: "repeat(2, 1fr)" },
          "@media (max-width: 900px)": { gridTemplateColumns: "1fr" }
        }}>
          {archivosNormalizados.map((archivo) => (
            <Card key={archivo.nombre} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}>
                  {obtenerNombreTabla(archivo.nombre)}
                </Typography>

                <TableContainer component={Paper} sx={{
                  maxHeight: 400, overflow: "auto", boxShadow: "none",
                  "&::-webkit-scrollbar": { display: "none" }
                }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", backgroundColor: "#1976d2", color: "white", minWidth: 50 }}>#</TableCell>
                        {archivo.columnas.map((columna, index) => (
                          <TableCell key={index} sx={{ fontWeight: "bold", backgroundColor: "#1976d2", color: "white", minWidth: 120, whiteSpace: "nowrap" }}>
                            {columna}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtrarFilasVacias(archivo.datos).map((fila, indexFila) => (
                        <TableRow key={indexFila} hover sx={{ backgroundColor: indexFila % 2 === 0 ? "#ffffff" : "#f5f5f5" }}>
                          <TableCell sx={{ color: "#666", fontWeight: "bold" }}>{indexFila + 1}</TableCell>
                          {archivo.columnas.map((columna, indexCol) => (
                            <TableCell key={indexCol} sx={{ whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
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
      )}
    </Box>
  );
};

export default PanelNormalizados;