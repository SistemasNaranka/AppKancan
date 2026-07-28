import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { getStores } from "@/apps/comisiones/api/directus/read";
import { DirectusTienda } from "@/apps/comisiones/types";
import {
  parseExcelBudgetFile,
  ExcelParseResult,
} from "@/apps/comisiones/lib/excelBudgetParser";
import { guardarPresupuestosTiendaMasivo } from "@/apps/comisiones/api/directus/create";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ExcelBudgetTesterModal: React.FC<Props> = ({ open, onClose }) => {
  const [stores, setStores] = useState<DirectusTienda[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>("");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() =>
    dayjs().format("YYYY-MM")
  );
  const [fileName, setFileName] = useState<string>("");
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>("TODAS");

  useEffect(() => {
    if (open) {
      setLoadingStores(true);
      getStores()
        .then((data) => setStores(data))
        .catch((err) => console.error("Error al cargar tiendas:", err))
        .finally(() => setLoadingStores(false));
    }
  }, [open]);

  const availableSheets = useMemo(() => {
    if (!parseResult) return [];
    const set = new Set<string>();
    parseResult.rows.forEach((r) => set.add(r.originalSheet));
    return Array.from(set);
  }, [parseResult]);

  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    if (selectedSheetFilter === "TODAS") return parseResult.rows;
    return parseResult.rows.filter((r) => r.originalSheet === selectedSheetFilter);
  }, [parseResult, selectedSheetFilter]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    setSelectedSheetFilter("TODAS");

    try {
      const res = await parseExcelBudgetFile(file, selectedMonthYear, stores);
      setParseResult(res);
    } catch (err) {
      console.error("Error al procesar Excel:", err);
      alert("Error al leer el archivo Excel. Verifica que sea un archivo .xlsx válido.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCSVPreview = () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    const headers = ["date", "budget", "store_id", "store_name", "originalSheet"];
    const csvLines = [headers.join(",")];

    parseResult.rows.forEach((r) => {
      csvLines.push(`${r.date},${r.budget},${r.store_id},"${r.store_name}","${r.originalSheet}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvLines.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `presupuestos_directus_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGuardarEnDirectus = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    const validRows = parseResult.rows.filter((r) => r.matched && r.store_id > 0);

    if (validRows.length === 0) {
      alert("No hay registros con tiendas emparejadas para guardar en Directus.");
      return;
    }

    setUploading(true);
    setUploadSuccess("");

    try {
      const payload = validRows.map((r) => ({
        store_id: r.store_id,
        date: r.date,
        budget: r.budget,
      }));

      const res = await guardarPresupuestosTiendaMasivo(payload);
      setUploadSuccess(`¡Éxito! Se sincronizaron los presupuestos en Directus: ${res.creados} creados, ${res.actualizados} actualizados.`);
    } catch (err) {
      console.error("Error al subir a Directus:", err);
      alert("Ocurrió un error al intentar guardar los presupuestos en Directus.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ bgcolor: "#004680", color: "#fff", p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <UploadFileIcon fontSize="large" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Probador de Carga de Excel de Presupuestos (Pruebas Directus)
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: "0.82rem" }}>
            Valida la lectura y transformación de hojas multitienda a formato com_store_daily_budgets
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Aviso de recordatorio para el usuario */}
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
          <strong>Aviso importante:</strong> Verifica que el <strong>Mes y Año de Destino</strong> seleccionado sea el correcto antes de subir o procesar el archivo Excel. Todos los presupuestos diarios se registrarán bajo este período en Directus.
        </Alert>

        {/* Fila de configuración / Carga */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DatePicker
              label="Año - Mes de Destino"
              views={["year", "month"]}
              format="MMMM YYYY"
              value={dayjs(selectedMonthYear, "YYYY-MM")}
              onChange={(newValue: any) => {
                if (newValue) {
                  const d = dayjs(newValue);
                  if (d.isValid()) {
                    setSelectedMonthYear(d.format("YYYY-MM"));
                  }
                }
              }}
              disabled={processing || uploading}
              slotProps={{ textField: { size: "small", sx: { width: 220 } } }}
            />
          </LocalizationProvider>

          <Button
            variant="contained"
            component="label"
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
            disabled={processing || uploading || loadingStores}
            sx={{ bgcolor: "#004680", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#003360" } }}
          >
            {processing ? "Procesando Excel..." : "Seleccionar Archivo Excel (.xlsx)"}
            <input type="file" accept=".xlsx, .xls" hidden onChange={handleFileUpload} />
          </Button>

          {fileName && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>
              Archivo cargado: <span style={{ color: "#10b981" }}>{fileName}</span>
            </Typography>
          )}
        </Box>

        {loadingStores && (
          <Alert severity="info">Cargando catálogo de tiendas desde Directus...</Alert>
        )}

        {uploadSuccess && (
          <Alert severity="success" onClose={() => setUploadSuccess("")}>
            {uploadSuccess}
          </Alert>
        )}

        {/* Resumen de Resultados de Parsing */}
        {parseResult && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 2, flex: 1 }}>
                <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 700 }}>Total Pestañas Leídas</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0284c7" }}>{parseResult.totalSheets}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 2, flex: 1 }}>
                <Typography variant="caption" sx={{ color: "#047857", fontWeight: 700 }}>Tiendas Emparejadas (core_stores)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669" }}>{parseResult.matchedStoresCount}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 2, flex: 1 }}>
                <Typography variant="caption" sx={{ color: "#7e22ce", fontWeight: 700 }}>Total Registros Formateados</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#9333ea" }}>{parseResult.totalRowsParsed}</Typography>
              </Paper>
            </Box>

            {parseResult.unmatchedSheets.length > 0 && (
              <Alert severity="warning" icon={<WarningAmberIcon />}>
                Pestañas sin coincidencia de tienda ({parseResult.unmatchedSheets.length}):{" "}
                <strong>{parseResult.unmatchedSheets.join(", ")}</strong>
              </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, flexWrap: "wrap", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  Previsualización de Datos ({filteredRows.length} de {parseResult.rows.length} filas):
                </Typography>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="sheet-filter-label">Filtrar por Pestaña / Tienda</InputLabel>
                  <Select
                    labelId="sheet-filter-label"
                    label="Filtrar por Pestaña / Tienda"
                    value={selectedSheetFilter}
                    onChange={(e) => setSelectedSheetFilter(e.target.value)}
                  >
                    <MenuItem value="TODAS">Ver todas las pestañas ({parseResult.totalSheets})</MenuItem>
                    {availableSheets.map((sh) => (
                      <MenuItem key={sh} value={sh}>
                        {sh}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="outlined"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadCSVPreview}
                size="small"
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Descargar CSV de Prueba (Directus)
              </Button>
            </Box>

            {/* Tabla de Previsualización */}
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", maxHeight: 400, borderRadius: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, color: "#475569" } }}>
                    <TableCell>Pestaña Excel</TableCell>
                    <TableCell>Fecha Orig.</TableCell>
                    <TableCell>Valor Orig.</TableCell>
                    <TableCell sx={{ bgcolor: "#eff6ff !important" }}>➡️ date (ISO)</TableCell>
                    <TableCell sx={{ bgcolor: "#eff6ff !important" }}>➡️ budget (Num)</TableCell>
                    <TableCell sx={{ bgcolor: "#eff6ff !important" }}>➡️ store_id</TableCell>
                    <TableCell>Tienda Emparejada</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#f8fafc" } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{row.originalSheet}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{row.originalFecha}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "#64748b" }}>{row.originalValor}</TableCell>
                      
                      <TableCell sx={{ fontWeight: 700, color: "#1d4ed8", bgcolor: "#eff6ff" }}>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#15803d", bgcolor: "#eff6ff" }}>
                        ${row.budget.toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#b45309", bgcolor: "#eff6ff" }}>{row.store_id || "—"}</TableCell>
                      
                      <TableCell sx={{ fontSize: "0.8rem" }}>{row.store_name}</TableCell>
                      <TableCell>
                        {row.matched ? (
                          <Chip icon={<CheckCircleOutlineIcon />} label="OK" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip icon={<WarningAmberIcon />} label="Sin Tienda" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: "#64748b", borderColor: "#cbd5e1", textTransform: "none", fontWeight: 700 }}>
          Cerrar
        </Button>

        {parseResult && (
          <Button
            onClick={handleGuardarEnDirectus}
            variant="contained"
            disabled={uploading || parseResult.rows.filter((r) => r.matched).length === 0}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            sx={{ bgcolor: "#16a34a", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#15803d" } }}
          >
            {uploading ? "Sincronizando a Directus..." : "Subir Presupuestos a Directus"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
export default ExcelBudgetTesterModal;
