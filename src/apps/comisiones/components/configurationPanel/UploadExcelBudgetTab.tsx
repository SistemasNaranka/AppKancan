import React, { useState, useEffect, useMemo } from "react";
import {
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
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { getStores } from "../../api/directus/read";
import { DirectusTienda } from "../../types";
import {
  parseExcelBudgetFile,
  ExcelParseResult,
} from "../../lib/excelBudgetParser";
import { guardarPresupuestosTiendaMasivo } from "../../api/directus/create";

export const UploadExcelBudgetTab: React.FC = () => {
  const { showSnackbar } = useGlobalSnackbar();
  const [stores, setStores] = useState<DirectusTienda[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() =>
    dayjs().format("YYYY-MM")
  );
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>("TODAS");
  const [fileName, setFileName] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const data = await getStores();
        setStores(data || []);
      } catch (err) {
        console.error("Error al obtener catálogo de tiendas:", err);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);

    try {
      const res = await parseExcelBudgetFile(file, selectedMonthYear, stores);
      setParseResult(res);
      setSelectedSheetFilter("TODAS");
    } catch (err) {
      console.error("Error al procesar archivo Excel:", err);
      showSnackbar("Ocurrió un error al procesar el archivo Excel. Revisa el formato de la plantilla.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const sheetsList = useMemo(() => {
    if (!parseResult) return [];
    const setSheets = new Set<string>();
    parseResult.rows.forEach((r) => setSheets.add(r.originalSheet));
    return Array.from(setSheets);
  }, [parseResult]);

  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    if (selectedSheetFilter === "TODAS") return parseResult.rows;
    return parseResult.rows.filter((r) => r.originalSheet === selectedSheetFilter);
  }, [parseResult, selectedSheetFilter]);

  const rowsToUpload = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((r) => r.matched);
  }, [parseResult]);

  const handleExportCSV = () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    const headers = [
      "Pestaña Excel",
      "Tienda ID",
      "Tienda Nombre",
      "Fecha Original",
      "Fecha ISO (Directus)",
      "Valor Original",
      "Presupuesto Limpio",
      "Emparejado",
    ];

    const csvLines = [headers.join(",")];

    parseResult.rows.forEach((r) => {
      csvLines.push(
        [
          `"${r.originalSheet}"`,
          r.store_id,
          `"${r.store_name}"`,
          `"${r.originalFecha}"`,
          `"${r.date}"`,
          `"${r.originalValor}"`,
          r.budget,
          r.matched ? "SI" : "NO",
        ].join(",")
      );
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `presupuestos_procesados_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenConfirmModal = () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    if (rowsToUpload.length === 0) {
      showSnackbar("No hay registros válidos emparejados con tiendas para subir a Directus.", "warning");
      return;
    }

    setConfirmModalOpen(true);
  };

  const executeDirectusUpload = async () => {
    if (rowsToUpload.length === 0) return;

    setUploading(true);

    try {
      const payload = rowsToUpload.map((r) => ({
        store_id: r.store_id,
        date: r.date,
        budget: r.budget,
      }));

      const res = await guardarPresupuestosTiendaMasivo(payload);
      setConfirmModalOpen(false);
      const successMsg = `¡Éxito! Se sincronizaron los presupuestos en Directus: ${res.creados} creados, ${res.actualizados} actualizados.`;
      showSnackbar(successMsg, "success");
    } catch (err) {
      console.error("Error al subir a Directus:", err);
      showSnackbar("Ocurrió un error al intentar guardar los presupuestos en Directus.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
      {/* Controles de selección de fecha y botón de archivo */}
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>
            Archivo cargado: <span style={{ color: "#004680", fontWeight: 700 }}>{fileName}</span>
          </Typography>
        )}
      </Box>

      {loadingStores && (
        <Alert severity="info">Cargando catálogo de tiendas desde Directus...</Alert>
      )}

      {/* Resumen de Resultados de Parsing */}
      {parseResult && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
              Resumen de la Lectura del Archivo
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={`Hojas en Excel: ${parseResult.totalSheets}`} color="default" variant="outlined" size="small" />
              <Chip
                label={`Tiendas Emparejadas: ${parseResult.matchedStoresCount}`}
                color={parseResult.matchedStoresCount > 0 ? "success" : "warning"}
                icon={<CheckCircleOutlineIcon />}
                size="small"
              />
              <Chip
                label={`Registros Procesados: ${parseResult.totalRowsParsed}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              {parseResult.unmatchedSheets.length > 0 && (
                <Chip
                  label={`Hojas Sin Emparejar: ${parseResult.unmatchedSheets.length}`}
                  color="error"
                  icon={<WarningAmberIcon />}
                  size="small"
                />
              )}
            </Box>

            {parseResult.unmatchedSheets.length > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#fef2f2", borderRadius: 1.5, border: "1px solid #fecaca" }}>
                <Typography variant="caption" sx={{ color: "#991b1b", fontWeight: 600, display: "block" }}>
                  Las siguientes pestañas no coincidieron con ninguna tienda activa en Directus:
                </Typography>
                <Typography variant="caption" sx={{ color: "#b91c1c" }}>
                  {parseResult.unmatchedSheets.join(", ")}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Filtros de Tabla y Acciones */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Filtrar por Pestaña</InputLabel>
                <Select
                  value={selectedSheetFilter}
                  label="Filtrar por Pestaña"
                  onChange={(e) => setSelectedSheetFilter(e.target.value)}
                >
                  <MenuItem value="TODAS">Ver todas las pestañas</MenuItem>
                  {sheetsList.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Mostrando {filteredRows.length} de {parseResult.rows.length} filas
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<FullscreenIcon />}
                onClick={() => setIsExpanded(true)}
                size="small"
                sx={{ textTransform: "none", fontWeight: 600, borderColor: "#004680", color: "#004680" }}
              >
                Expandir Vista
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                size="small"
                sx={{ textTransform: "none", fontWeight: 600, borderColor: "#cbd5e1", color: "#334155" }}
              >
                Exportar Auditoría (CSV)
              </Button>

              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleOpenConfirmModal}
                disabled={uploading || rowsToUpload.length === 0}
                size="small"
                sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#004680", "&:hover": { bgcolor: "#003360" } }}
              >
                {uploading ? "Sincronizando..." : "Sincronizar Presupuestos en Directus"}
              </Button>
            </Box>
          </Box>

          {/* Tabla Previa de Datos */}
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380, borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Pestaña Excel</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ID Tienda (Directus)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre Tienda</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Original</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha ISO (`date`)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Valor Original
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Presupuesto (`budget`)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Estado
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row, idx) => (
                  <TableRow key={idx} hover sx={{ bgcolor: row.matched ? "inherit" : "#fff1f2" }}>
                    <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{row.originalSheet}</TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }}>
                      {row.matched ? <Chip label={row.store_id} size="small" color="primary" variant="outlined" /> : "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }}>{row.store_name}</TableCell>
                    <TableCell sx={{ fontSize: "0.82rem", color: "text.secondary" }}>{row.originalFecha}</TableCell>
                    <TableCell sx={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: 600 }}>
                      {row.date}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                      {row.originalValor}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                      ${row.budget.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell align="center">
                      {row.matched ? (
                        <Chip label="Listo" color="success" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                      ) : (
                        <Chip label="Sin Tienda" color="error" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Modal de Vista Expandida / Pantalla Completa */}
          <Dialog
            open={isExpanded}
            onClose={() => setIsExpanded(false)}
            maxWidth="xl"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: "92vh" } }}
          >
            <DialogTitle
              component="div"
              sx={{
                bgcolor: "#004680",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2,
                px: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FullscreenIcon />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Vista Expandida - Presupuestos Procesados ({filteredRows.length} filas)
                </Typography>
              </Box>
              <IconButton onClick={() => setIsExpanded(false)} sx={{ color: "#fff" }} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Filtrar por Pestaña</InputLabel>
                  <Select
                    value={selectedSheetFilter}
                    label="Filtrar por Pestaña"
                    onChange={(e) => setSelectedSheetFilter(e.target.value)}
                  >
                    <MenuItem value="TODAS">Ver todas las pestañas</MenuItem>
                    {sheetsList.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    size="small"
                    sx={{ textTransform: "none", fontWeight: 600, borderColor: "#cbd5e1", color: "#334155" }}
                  >
                    Exportar Auditoría (CSV)
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleOpenConfirmModal}
                    disabled={uploading || rowsToUpload.length === 0}
                    size="small"
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#004680", "&:hover": { bgcolor: "#003360" } }}
                  >
                    {uploading ? "Sincronizando..." : "Sincronizar Presupuestos en Directus"}
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, maxHeight: "calc(92vh - 160px)", borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Pestaña Excel</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ID Tienda (Directus)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nombre Tienda</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha Original</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha ISO (`date`)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Valor Original
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Presupuesto (`budget`)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Estado
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row, idx) => (
                      <TableRow key={idx} hover sx={{ bgcolor: row.matched ? "inherit" : "#fff1f2" }}>
                        <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{row.originalSheet}</TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          {row.matched ? <Chip label={row.store_id} size="small" color="primary" variant="outlined" /> : "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>{row.store_name}</TableCell>
                        <TableCell sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{row.originalFecha}</TableCell>
                        <TableCell sx={{ fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 600 }}>
                          {row.date}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                          {row.originalValor}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                          ${row.budget.toLocaleString("es-CO")}
                        </TableCell>
                        <TableCell align="center">
                          {row.matched ? (
                            <Chip label="Listo" color="success" size="small" sx={{ height: 22, fontSize: "0.75rem" }} />
                          ) : (
                            <Chip label="Sin Tienda" color="error" size="small" sx={{ height: 22, fontSize: "0.75rem" }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmación Estilizado (Reemplaza a window.confirm) */}
          <Dialog
            open={confirmModalOpen}
            onClose={() => !uploading && setConfirmModalOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
          >
            <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
              <CloudUploadIcon sx={{ color: "#004680", fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1.1rem" }}>
                Confirmar Sincronización
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
                ¿Estás seguro de sincronizar los presupuestos diarios con Directus?
              </Typography>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Período Destino:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    {selectedMonthYear}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Registros Válidos:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#004680" }}>
                    {rowsToUpload.length} filas
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Tiendas Emparejadas:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>
                    {parseResult?.matchedStoresCount || 0} tiendas
                  </Typography>
                </Box>
              </Paper>

              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 1.5, textAlign: "center" }}>
                Si ya existen presupuestos para este período en Directus, se actualizará su monto.
              </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button
                onClick={() => setConfirmModalOpen(false)}
                disabled={uploading}
                variant="outlined"
                color="inherit"
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Cancelar
              </Button>

              <Button
                onClick={executeDirectusUpload}
                disabled={uploading}
                variant="contained"
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                sx={{ bgcolor: "#004680", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#003360" } }}
              >
                {uploading ? "Subiendo..." : "Confirmar y Subir"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};
