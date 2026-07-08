import React from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ArchivoSubido } from "../types/mapeo.types";

interface HomeHeaderProps {
  archivos: ArchivoSubido[];
  cargando: boolean;
  cargandoMapeos: boolean;
  refrescando: boolean;
  refrescarMapeosYProcesar: () => void;
  errorMapeos: string | null;
  mostrarAgrupado: boolean;
  setMostrarAgrupado: (val: boolean) => void;
  handleSubirArchivos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  normalizarTodosArchivos: () => void;
  exportarArchivosNormalizados: (tiendaFiltrada?: string | null) => void;
  busqueda: string;
  setBusqueda: (val: string) => void;
  valorSeleccionado: string | null;
  setValorSeleccionado: (val: string | null) => void;
  tiendasDisponibles: string[];
  procesarArchivosRaw: (files: FileList | File[]) => Promise<void>;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  archivos,
  cargando,
  cargandoMapeos,
  refrescando,
  refrescarMapeosYProcesar,
  errorMapeos,
  mostrarAgrupado,
  setMostrarAgrupado,
  handleSubirArchivos,
  normalizarTodosArchivos,
  exportarArchivosNormalizados,
  busqueda,
  setBusqueda,
  valorSeleccionado,
  setValorSeleccionado,
  tiendasDisponibles,
  procesarArchivosRaw,
}) => {
  const [busquedaLocal, setBusquedaLocal] = React.useState(busqueda);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaLocal);
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaLocal, setBusqueda]);

  React.useEffect(() => {
    setBusquedaLocal(busqueda);
  }, [busqueda]);

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a2a3a" }}>
          Comparación de Archivos
        </Typography>
      </Box>

      {/* Barra de Acciones Sticky */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          backgroundColor: "rgba(240, 244, 248, 0.9)",
          backdropFilter: "blur(10px)",
          py: 2,
          px: 3,
          mx: -3,
          mb: 3,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          transition: "all 0.2s ease",
        }}
      >
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
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              color: "#004680",
              border: "1px solid #e2e8f0",
              height: "40px",
              fontWeight: 600,
              "&:hover": {
                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                backgroundColor: "#f8fafc",
              },
            }}
          >
            Subir Archivos
          </Button>
        </label>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => exportarArchivosNormalizados(valorSeleccionado)}
          disabled={!archivos.some((a) => a.normalizado)}
          sx={{
            backgroundColor: "#017ce1",
            boxShadow: "0 2px 4px rgba(1, 124, 225, 0.2)",
            color: "#ffffff",
            height: "40px",
            fontWeight: 600,
            "&:hover": {
              boxShadow: "0 4px 8px rgba(1, 124, 225, 0.3)",
              backgroundColor: "#006fc9",
            },
          }}
        >
          Exportar
        </Button>

        <Button
          variant="contained"
          onClick={normalizarTodosArchivos}
          disabled={
            archivos.length === 0 ||
            !archivos.some((a) => !a.normalizado && a.tipoArchivo) ||
            cargando
          }
          sx={{
            backgroundColor: "#10b981",
            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
            color: "#ffffff",
            height: "40px",
            fontWeight: 600,
            "&:hover": {
              boxShadow: "0 4px 8px rgba(16, 185, 129, 0.3)",
              backgroundColor: "#059669",
            },
          }}
        >
          {cargando ? "Procesando..." : "Normalizar Todo"}
        </Button>

        <Button
          variant="contained"
          onClick={refrescarMapeosYProcesar}
          disabled={cargando || refrescando || archivos.length === 0}
          startIcon={
            <RefreshIcon
              sx={{
                animation: refrescando ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          }
          sx={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            color: "#475569",
            border: "1px solid #cbd5e1",
            height: "40px",
            fontWeight: 600,
            "&:hover": {
              boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              backgroundColor: "#f8fafc",
            },
          }}
        >
          {refrescando ? "Cargando..." : "Refrescar Mapeos"}
        </Button>

        {archivos.some((a) => a.normalizado) && (
          <Button
            variant="outlined"
            onClick={() => setMostrarAgrupado(!mostrarAgrupado)}
            startIcon={
              mostrarAgrupado ? <InsertDriveFileIcon /> : <CompareArrowsIcon />
            }
            sx={{
              borderColor: "#017ce1",
              color: "#017ce1",
              height: "40px",
              fontWeight: 600,
              backgroundColor: "white",
              "&:hover": {
                borderColor: "#006fc9",
                backgroundColor: "#f0f9ff",
              },
            }}
          >
            {mostrarAgrupado ? "Vista de Archivos" : "Agrupar por Tienda"}
          </Button>
        )}

        {/* Filtro de Tiendas con Autocomplete - Integrado en la línea */}
        {mostrarAgrupado && (
          <Box
            sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}
          >
            <Autocomplete
              freeSolo
              options={tiendasDisponibles}
              value={valorSeleccionado}
              onChange={(_, newValue) => setValorSeleccionado(newValue)}
              inputValue={busquedaLocal}
              onInputChange={(_, newInputValue) =>
                setBusquedaLocal(newInputValue)
              }
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Buscar tienda..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "40px",
                      backgroundColor: "#ffffff",
                      borderRadius: 2,
                      fieldset: { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#017ce1" },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          fontSize="small"
                          sx={{ color: "#64748b" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default HomeHeader;
