/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  Sync as SyncIcon,
  Verified as VerifiedIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  ShoppingBag as ShoppingBagIcon,
  DoNotStep as DoNotStepIcon,
} from "@mui/icons-material";
import { useCurvas } from "../contexts/CurvasContext";
import { useAuth } from "@/auth/hooks/useAuth";
import { getLogCurvas, getResumenFechasCurvas } from "../api/directus/read";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.locale("es");

// Imports de archivos separados
import {
  MAIN_FONT,
  MONO_FONT,
  CATEGORY_CONFIG,
  getValidationStyles,
  type ConfirmedEntry,
} from "./EnviosPage.utils";
import {
  DebouncedSearchInput,
  MemoizedTableRow,
  CustomDay,
} from "./EnviosPage.components";
import { useEnviosKeyboard, useEnviosValidation } from "./useEnviosLogic";

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const EnviosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    datosCurvas,
    actualizarValorValidacion,
    limpiarValidacion,
    userRole,
    lastLogsUpdate,
    tiendasDict,
    extractRef,
    guardarEnvioDespacho,
    notificacionCambios,
    setNotificacionCambios,
    bloqueosActivos,
    intentarBloquear,
    desmarcarTienda,
    validationData,
  } = useCurvas();

  // ── State ─────────────────────────────────
  const [selectedEntry, setSelectedEntry] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "warning" | "info" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<Dayjs | null>(dayjs());
  const [filtroReferencia, setFiltroReferencia] = useState<string>("");
  const [logCurvasData, setLogCurvasData] = useState<any[]>([]);
  const [loadingLogCurvas, setLoadingLogCurvas] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState<
    Record<string, "pendiente" | "enviado">
  >({});
  const [activeCell, setActiveCell] = useState<{
    filaId: string;
    col: string;
    sheetId: string;
  } | null>(null);

  const refTableRef = useRef<HTMLDivElement>(null);
  const initDateChecked = useRef(false);

  // ── Portal target effect ─────────────────
  useEffect(() => {
    const el = document.getElementById("envios-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  // ── Fetch fechas con datos ───────────────
  useEffect(() => {
    let isMounted = true;
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      if (!isMounted) return;
      setFechasConDatos(resumen);

      if (!initDateChecked.current) {
        initDateChecked.current = true;
        const todayStr = dayjs().format("YYYY-MM-DD");
        if (!resumen[todayStr]) {
          const fechasOrd = Object.keys(resumen).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime(),
          );
          if (fechasOrd.length > 0) setFiltroFecha(dayjs(fechasOrd[0]));
        }
      }
    };

    fetchFechas();
    const interval = setInterval(fetchFechas, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── Fetch log curvas ─────────────────────
  useEffect(() => {
    let interval: any;
    const fetchLogCurvasYTiendas = async () => {
      setLoadingLogCurvas(true);
      try {
        const data = await getLogCurvas(
          filtroFecha ? filtroFecha.format("YYYY-MM-DD") : undefined,
          filtroReferencia || undefined,
        );
        setLogCurvasData(data || []);
      } catch (error) {
        console.error("Error fetching logs in EnviosPage:", error);
      } finally {
        setLoadingLogCurvas(false);
      }
    };

    fetchLogCurvasYTiendas();
    interval = setInterval(fetchLogCurvasYTiendas, 15000);
    return () => clearInterval(interval);
  }, [filtroFecha, filtroReferencia, userRole, lastLogsUpdate]);

  // ── Build confirmed entries ──────────────
  const confirmedEntries = useMemo<any[]>(() => {
    const entries: ConfirmedEntry[] = [];
    const seenRefs = new Set<string>();

    // 1. Registros de BD (prioridad)
    if (logCurvasData && logCurvasData.length > 0) {
      const allLogs = logCurvasData;
      const groupedLogs: Record<string, any[]> = {};

      allLogs.forEach((log: any) => {
        let rawRef = log.referencia || "SIN REF";
        let colorParsed = "";
        let ref = rawRef.replace(/^REF:\s*/i, "").trim();

        if (ref.includes(" | ")) {
          const parts = ref.split(" | ");
          ref = parts[0].trim();
          colorParsed = parts[1].trim();
        }

        const groupKey = `${log.plantilla}|${ref}`;
        if (!groupedLogs[groupKey]) groupedLogs[groupKey] = [];
        log._color_extraido = colorParsed;
        groupedLogs[groupKey].push(log);
      });

      Object.entries(groupedLogs).forEach(([key, logs]) => {
        const [plantilla, refKey] = key.split("|");
        const sortedLogs = [...logs].sort((a, b) => {
          const timeA = new Date(a.fecha).getTime();
          const timeB = new Date(b.fecha).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return Number(a.id) - Number(b.id);
        });
        const lastLog = sortedLogs[sortedLogs.length - 1];
        const colorFinal = lastLog._color_extraido || "—";
        const refBase = refKey.split(" | ")[0].trim();

        const entryKey = `${plantilla === "matriz_general" ? "general" : "producto_a"}|${refBase}`;
        if (refBase !== "SIN REF") seenRefs.add(entryKey);

        const filasMap = new Map<string, any>();
        const allColumnsSet = new Set<string>();
        const logsAUsarMap = new Map<string, any>();
        sortedLogs.forEach((log: any) =>
          logsAUsarMap.set(String(log.tienda_id), log),
        );
        const logsAUsar = Array.from(logsAUsarMap.values());

        logsAUsar.forEach((log: any) => {
          let parsedTallas: any[] = [];
          try {
            parsedTallas =
              typeof log.cantidad_talla === "string"
                ? JSON.parse(log.cantidad_talla)
                : log.cantidad_talla;
          } catch (e) {}

          const columnsData: Record<string, any> = {};
          let rowTotal = 0;

          if (Array.isArray(parsedTallas)) {
            parsedTallas.forEach((item: any) => {
              const colStr =
                plantilla === "matriz_general"
                  ? String(item.talla).padStart(2, "0")
                  : String(item.talla);
              columnsData[colStr] = {
                valor: item.cantidad || 0,
                esCero: (item.cantidad || 0) === 0,
                esMayorQueCero: (item.cantidad || 0) > 0,
              };
              rowTotal += item.cantidad || 0;
              allColumnsSet.add(colStr);
            });
          }

          const storeIdStr = String(log.tienda_id);
          filasMap.set(storeIdStr, {
            id: storeIdStr,
            tienda: {
              id: log.tienda_id,
              codigo: log.tienda_codigo || "",
              nombre:
                tiendasDict[log.tienda_id] ||
                log.tienda_nombre ||
                `Tienda ${log.tienda_id}`,
            },
            total: rowTotal,
            ...(plantilla === "matriz_general"
              ? { curvas: columnsData }
              : { tallas: columnsData }),
          });
        });

        const filas = Array.from(filasMap.values()).sort((a, b) =>
          (a.tienda.nombre || "").localeCompare(b.tienda.nombre || ""),
        );
        const sortedColumns = Array.from(allColumnsSet).sort(
          (a, b) => Number(a) - Number(b),
        );

        const columnTotals: Record<string, number> = {};
        sortedColumns.forEach((c) => {
          columnTotals[c] = filas.reduce(
            (sum: number, f: any) =>
              sum + (f.curvas?.[c]?.valor || f.tallas?.[c]?.valor || 0),
            0,
          );
        });

        const category =
          plantilla === "matriz_general" ? "general" : "producto_a";

        entries.push({
          category,
          label: `REF: ${refBase}`,
          icon:
            category === "general" ? (
              <AnalyticsIcon sx={{ fontSize: 16 }} />
            ) : (
              <ShoppingBagIcon sx={{ fontSize: 16 }} />
            ),
          accent: category === "general" ? "#4f46e5" : "#0891b2",
          sheet: {
            id: refBase,
            nombreHoja: refBase,
            estado: "confirmado",
            filas,
            totalGeneral: filas.reduce(
              (sum: number, f: any) => sum + f.total,
              0,
            ),
            ...(plantilla === "matriz_general"
              ? {
                  curvas: sortedColumns,
                  totalesPorCurva: columnTotals,
                  referencia: refBase,
                  metadatos: { color: colorFinal },
                }
              : {
                  tallas: sortedColumns,
                  metadatos: { referencia: refBase, color: colorFinal },
                  totalesPorTalla: columnTotals,
                }),
          } as any,
          columns: sortedColumns,
          getRowColumns: (fila: any) =>
            Object.fromEntries(
              sortedColumns.map((c: string) => [
                c,
                (fila.curvas || fila.tallas || {})[c]?.valor || 0,
              ]),
            ),
          columnTotals,
        });
      });
    }

    // 2. Matriz en memoria
    if (datosCurvas) {
      (datosCurvas.matrizGeneral || [])
        .filter((s) => s.estado === "confirmado")
        .forEach((sheet) => {
          const ref = extractRef(sheet);
          const entryKey = `general|${ref}`;
          if (seenRefs.has(entryKey)) return;
          if (ref !== "SIN REF") seenRefs.add(entryKey);

          const color = (sheet as any).metadatos?.color || "—";
          entries.push({
            category: "general",
            label: `REF: ${ref}`,
            icon: <AnalyticsIcon sx={{ fontSize: 16 }} />,
            accent: "#4f46e5",
            sheet: {
              ...sheet,
              referencia: ref,
              metadatos: { ...(sheet as any).metadatos, color },
            } as any,
            columns: sheet.curvas || [],
            getRowColumns: (fila: any) =>
              Object.fromEntries(
                (sheet.curvas || []).map((c: string) => [
                  c,
                  (fila.curvas || {})[c]?.valor || 0,
                ]),
              ),
            columnTotals: sheet.totalesPorCurva || {},
          });
        });

      (datosCurvas.productos || [])
        .filter((s) => s.estado === "confirmado")
        .forEach((sheet) => {
          const ref = extractRef(sheet);
          const category =
            (sheet as any).tipo === "detalle_producto_b"
              ? "producto_b"
              : "producto_a";
          const entryKey = `${category}|${ref}`;
          if (seenRefs.has(entryKey)) return;
          if (ref !== "SIN REF") seenRefs.add(entryKey);

          const color = sheet.metadatos?.color || "—";
          entries.push({
            category,
            label: `REF: ${ref}`,
            icon:
              category === "producto_a" ? (
                <ShoppingBagIcon sx={{ fontSize: 16 }} />
              ) : (
                <DoNotStepIcon sx={{ fontSize: 16 }} />
              ),
            accent: category === "producto_a" ? "#0891b2" : "#7c3aed",
            sheet: {
              ...sheet,
              metadatos: { ...sheet.metadatos, referencia: ref, color },
            } as any,
            columns: sheet.tallas || [],
            getRowColumns: (fila: any) =>
              Object.fromEntries(
                (sheet.tallas || []).map((t: string) => [
                  t,
                  (fila.tallas || {})[t]?.valor || 0,
                ]),
              ),
            columnTotals: sheet.totalesPorTalla || {},
          });
        });
    }

    return entries;
  }, [datosCurvas, logCurvasData, tiendasDict, extractRef]);

  const safeIndex = Math.min(
    selectedEntry,
    Math.max(0, confirmedEntries.length - 1),
  );
  const current = confirmedEntries[safeIndex] as ConfirmedEntry | undefined;

  // ── Custom hooks ─────────────────────────
  useEnviosKeyboard({
    current,
    activeCell,
    setActiveCell,
    validationData,
    actualizarValorValidacion,
    bloqueosActivos,
    user,
    confirmedEntries,
    safeIndex,
    setSelectedEntry,
    setSnackbar,
    extractRef,
    intentarBloquear,
  });

  const { mirrorColumnTotals, mirrorGrandTotal, stats, isEverythingValid } =
    useEnviosValidation({ current, validationData });

  // ── Tab label helper ─────────────────────
  const getTabLabel = (entry: ConfirmedEntry, index: number) => {
    let ref = (entry.label || "")
      .replace("REF: ", "")
      .replace("Plantilla de Producto\nREF: ", "")
      .trim();

    if (!ref || ref.toUpperCase() === "SIN REF") {
      const s = entry.sheet as any;
      const fallback =
        s.nombreHoja ||
        s.referencia ||
        s.referenciaBase ||
        s.metadatos?.referencia ||
        "";
      const cleanFallback = fallback
        .replace("Ingreso Manual - ", "")
        .replace("Manual - ", "")
        .trim();
      if (cleanFallback && cleanFallback.toUpperCase() !== "SIN REF") {
        return `${cleanFallback} - ${CATEGORY_CONFIG[entry.category]?.label || "General"}`;
      }
      return `Lote ${index + 1} (${entry.category === "general" ? "Gral" : "Prod"})`;
    }

    const catName = CATEGORY_CONFIG[entry.category]?.label || "General";
    return `${ref} - ${catName}`;
  };

  // ── Handle enviar a despacho ─────────────
  const handleEnviarADespacho = async () => {
    if (!current || !user) return;

    setIsSending(true);
    try {
      const currentRef = extractRef(current.sheet);
      const currentSheetValidation =
        validationData[String(current.sheet.id!)] || {};

      // Verificar si hay datos para enviar
      const hasData = Object.values(currentSheetValidation).some(
        (rowValidation: any) => {
          const rowTotal = Object.values(rowValidation).reduce(
            (a: number, b: any) => a + Number(b),
            0,
          ) as number;
          return rowTotal > 0;
        },
      );

      if (!hasData) {
        setSnackbar({
          open: true,
          message: "No hay datos para enviar",
          severity: "warning",
        });
        setIsSending(false);
        return;
      }

      const success = await guardarEnvioDespacho(
        String(current.sheet.id!),
        undefined,
        current.category === "general" ? "matriz_general" : "productos",
        currentRef,
      );

      if (success) {
        setSnackbar({
          open: true,
          message: "Envío registrado exitosamente",
          severity: "success",
        });
        setSelectedEntry((prev) => Math.max(0, prev - 1));
      } else {
        setSnackbar({
          open: true,
          message: "No se pudo registrar el envío",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error en handleEnviarADespacho:", error);
      setSnackbar({
        open: true,
        message: "Error al registrar envío",
        severity: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  // ── Conditional renders ──────────────────
  const hayDatosEnBD = (logCurvasData?.length ?? 0) > 0;
  const hayLotesConfirmados = confirmedEntries.length > 0;

  if (!datosCurvas && !hayDatosEnBD) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 4,
              bgcolor: "#f8fafc",
              border: "2px dashed #cbd5e1",
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
            <Typography
              variant="h5"
              fontWeight={900}
              color="#475569"
              gutterBottom
            >
              Sin lotes confirmados
            </Typography>
            <Typography variant="body1" color="#64748b" sx={{ mb: 4 }}>
              No hay lotes confirmados disponibles para enviar. Por favor,
              confirme un lote en el Dashboard.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DashboardIcon />}
              onClick={() => navigate("/curvas/dashboard")}
              sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 800 }}
            >
              IR AL DASHBOARD
            </Button>
          </Paper>
        </Container>
      </LocalizationProvider>
    );
  }

  if (!hayLotesConfirmados && hayDatosEnBD) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <LocalShippingIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h5" fontWeight={900}>
                Datos guardados en Base de Datos
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} mb={3}>
              <DatePicker
                label="Fecha"
                value={filtroFecha}
                onChange={(v: any) => setFiltroFecha(v as Dayjs | null)}
                slots={{
                  day: (props: any) => (
                    <CustomDay {...props} fechasConDatos={fechasConDatos} />
                  ),
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      width: 200,
                      bgcolor: "#ffffff",
                      borderRadius: 2,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    },
                  },
                }}
              />
              <DebouncedSearchInput
                value={filtroReferencia}
                onChange={(val) => setFiltroReferencia(val)}
                placeholder="Buscar referencia..."
                sx={{ width: 250 }}
              />
            </Stack>

            {loadingLogCurvas ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Tienda
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Plantilla
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Fecha
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Referencia
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Cantidad/Talla
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logCurvasData
                      .filter(
                        (item) =>
                          item.referencia &&
                          item.referencia.trim() !== "" &&
                          item.referencia.toUpperCase() !== "SIN REF",
                      )
                      .map((item: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell>{item.tienda_nombre}</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                item.plantilla === "matriz_general"
                                  ? "Matriz General"
                                  : "Productos"
                              }
                              size="small"
                              color={
                                item.plantilla === "matriz_general"
                                  ? "primary"
                                  : "secondary"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(item.fecha).toLocaleString()}
                          </TableCell>
                          <TableCell>{item.referencia || "-"}</TableCell>
                          <TableCell>
                            <Tooltip
                              title={
                                <pre
                                  style={{
                                    margin: 0,
                                    padding: "4px",
                                    fontSize: "0.75rem",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {typeof item.cantidad_talla === "object"
                                    ? JSON.stringify(
                                        item.cantidad_talla,
                                        null,
                                        2,
                                      )
                                    : String(item.cantidad_talla)}
                                </pre>
                              }
                            >
                              <Chip
                                label="Ver JSON"
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {logCurvasData.length === 0 && !loadingLogCurvas && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No hay registros en la base de datos.
              </Typography>
            )}
          </Paper>
        </Container>
      </LocalizationProvider>
    );
  }

  // ── Header content for portal ────────────
  const headerContent = (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      sx={{
        py: { xs: 0.5, md: 0 },
        justifyContent: { xs: "center", sm: "flex-end" },
        width: "100%",
        gap: { xs: 1, md: 1.5 },
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <LocalShippingIcon sx={{ fontSize: 18, color: "white" }} />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "0.75rem",
            letterSpacing: 0.8,
            color: "white",
            textTransform: "uppercase",
          }}
        >
          DESPACHO
        </Typography>
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          height: 16,
          alignSelf: "center",
          bgcolor: "rgba(255,255,255,0.25)",
        }}
      />

      <TextField
        select
        label="Fecha"
        value={filtroFecha?.format("YYYY-MM-DD") || ""}
        onChange={(e) =>
          setFiltroFecha(e.target.value ? dayjs(e.target.value) : null)
        }
        SelectProps={{ native: true }}
        size="small"
        sx={{
          minWidth: 140,
          bgcolor: "rgba(255,255,255,0.15)",
          borderRadius: 2,
          "& .MuiOutlinedInput-root": {
            color: "white",
            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "white" },
          },
          "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
          "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
        }}
      >
        {Object.keys(fechasConDatos)
          .sort((a, b) => b.localeCompare(a))
          .map((fecha) => (
            <option key={fecha} value={fecha}>
              {dayjs(fecha).format("DD MMM YYYY")}{" "}
              {fechasConDatos[fecha] === "enviado" ? "✓" : "⏳"}
            </option>
          ))}
      </TextField>

      <DebouncedSearchInput
        value={filtroReferencia}
        onChange={(val) => setFiltroReferencia(val)}
        placeholder="Buscar referencia..."
        sx={{
          minWidth: 180,
          "& .MuiOutlinedInput-root": {
            color: "white",
            bgcolor: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "white" },
          },
          "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
        }}
      />

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          height: 16,
          alignSelf: "center",
          bgcolor: "rgba(255,255,255,0.25)",
        }}
      />

      <Chip
        label={`${stats.matched}/${stats.total} listas (${stats.percent}%)`}
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: "0.7rem",
          bgcolor: stats.percent === 100 ? "#22c55e" : "#fff",
          color: stats.percent === 100 ? "#fff" : "#334155",
        }}
      />

      <Button
        variant="contained"
        disabled={!isEverythingValid || isSending}
        startIcon={isEverythingValid ? <VerifiedIcon /> : <SyncIcon />}
        onClick={handleEnviarADespacho}
        sx={{
          fontWeight: 800,
          fontSize: "0.75rem",
          textTransform: "none",
          borderRadius: 1.5,
          height: 32,
          bgcolor: isEverythingValid
            ? "#22c55e"
            : mirrorGrandTotal > 0
              ? "#ffffff"
              : "rgba(255,255,255,0.08)",
          color: isEverythingValid
            ? "#fff"
            : mirrorGrandTotal > 0
              ? "#004680"
              : "rgba(255,255,255,0.35)",
          px: 1.5,
          boxShadow: isEverythingValid
            ? "0 2px 8px rgba(34,197,94,0.35)"
            : mirrorGrandTotal > 0
              ? "0 2px 8px rgba(0,0,0,0.2)"
              : "none",
          "&:hover": {
            bgcolor: isEverythingValid
              ? "#16a34a"
              : mirrorGrandTotal > 0
                ? "#e6f4ff"
                : undefined,
          },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.2)",
            bgcolor: "rgba(255,255,255,0.04)",
          },
        }}
      >
        {isSending
          ? "..."
          : mirrorGrandTotal > 0
            ? `ENVIAR (${mirrorGrandTotal})`
            : "ENVIAR"}
      </Button>
    </Stack>
  );

  // ── Main render ──────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ fontFamily: MAIN_FONT }}>
        {portalTarget ? createPortal(headerContent, portalTarget) : null}

        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Stack spacing={2} sx={{ mt: 2.5 }}>
            {/* Consolidated Bar */}
            <Box
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.5,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                {confirmedEntries.length > 1 ? (
                  <Tabs
                    value={safeIndex}
                    onChange={(_, v) => setSelectedEntry(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      minHeight: 32,
                      "& .MuiTab-root": {
                        fontWeight: 700,
                        textTransform: "none",
                        minHeight: 32,
                        fontSize: "0.72rem",
                        py: 0,
                        px: 1.2,
                      },
                      "& .Mui-selected": { color: "#4338ca" },
                      "& .MuiTabs-indicator": {
                        bgcolor: "#4338ca",
                        height: 2.5,
                        borderRadius: 2,
                      },
                    }}
                  >
                    {confirmedEntries.map((entry, i) => (
                      <Tab
                        key={i}
                        icon={entry.icon}
                        iconPosition="start"
                        label={getTabLabel(entry, i)}
                      />
                    ))}
                  </Tabs>
                ) : (
                  <Chip
                    icon={current?.icon as any}
                    label={
                      current
                        ? getTabLabel(
                            current,
                            confirmedEntries.indexOf(current),
                          )
                        : ""
                    }
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      bgcolor: "#eef2ff",
                      color: "#4338ca",
                      height: 26,
                    }}
                  />
                )}

                {current && (
                  <>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ height: 18, alignSelf: "center" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        color: "#64748b",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {current.sheet.filas.length} Establecimientos ·{" "}
                      {current.columns.length}{" "}
                      {current.category === "general" ? "Curvas" : "Tallas"}
                    </Typography>
                  </>
                )}
              </Stack>

              <Stack direction="row" spacing={1.2} alignItems="center">
                {[
                  {
                    label: "Exacto",
                    bg: "#f0fdf4",
                    border: "#86efac",
                    color: "#15803d",
                  },
                  {
                    label: "Menor",
                    bg: "#fffbeb",
                    border: "#fcd34d",
                    color: "#92400e",
                  },
                  {
                    label: "Excede",
                    bg: "#fef2f2",
                    border: "#fca5a5",
                    color: "#991b1b",
                  },
                ].map((l) => (
                  <Stack
                    key={l.label}
                    direction="row"
                    spacing={0.3}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "2px",
                        bgcolor: l.bg,
                        border: `1px solid ${l.border}`,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: l.color,
                      }}
                    >
                      {l.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Table */}
            {current && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 0.6,
                    bgcolor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <SyncIcon sx={{ color: "#6366f1", fontSize: 15 }} />
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: "0.75rem",
                        color: "#334155",
                      }}
                    >
                      TABLA UNIFICADA — REF & INGRESO
                    </Typography>
                    <Chip
                      label="EDITABLE"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.5rem",
                        height: 16,
                        bgcolor: "#ede9fe",
                        color: "#7c3aed",
                        letterSpacing: 0.3,
                      }}
                    />
                  </Stack>
                  {isEverythingValid && (
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize: 13 }} />}
                      label="VERIFICADO"
                      size="small"
                      color="success"
                      sx={{ fontWeight: 800, fontSize: "0.6rem", height: 22 }}
                    />
                  )}
                </Box>

                <TableContainer
                  ref={refTableRef}
                  sx={{ height: 650, maxHeight: 650, position: "relative" }}
                >
                  <Table stickyHeader size="small" sx={{ tableLayout: "auto" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            width: 44,
                            position: "sticky",
                            left: 0,
                            zIndex: 5,
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "2px solid #e2e8f0",
                            p: 0,
                          }}
                        />
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            width: 180,
                            position: "sticky",
                            left: 44,
                            zIndex: 4,
                            borderRight: "2px solid #e2e8f0",
                            borderBottom: "2px solid #e2e8f0",
                            fontSize: "0.65rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            py: 0.8,
                          }}
                        >
                          ESTABLECIMIENTO
                        </TableCell>
                        {current.columns.map((col) => (
                          <TableCell
                            key={col}
                            align="center"
                            sx={{
                              fontFamily: MONO_FONT,
                              fontWeight: 900,
                              bgcolor: "#f8fafc",
                              fontSize: "0.85rem",
                              color: "#1e293b",
                              py: 0.5,
                              px: 2,
                              borderBottom: "2px solid #e2e8f0",
                              borderLeft: "1px solid #f1f5f9",
                              minWidth: 85,
                            }}
                          >
                            {col}
                            <Typography
                              sx={{
                                fontSize: "0.48rem",
                                color: "#94a3b8",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.3,
                                lineHeight: 1,
                                mt: 0.1,
                              }}
                            >
                              REF / ING
                            </Typography>
                          </TableCell>
                        ))}
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 800,
                            bgcolor: "#f8fafc",
                            width: 60,
                            borderLeft: "2px solid #e2e8f0",
                            borderBottom: "2px solid #e2e8f0",
                            fontSize: "0.65rem",
                            color: "#64748b",
                          }}
                        >
                          TOTAL
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {current.sheet.filas.map((fila: any) => {
                        const currentId = current?.sheet?.id
                          ? String(current.sheet.id)
                          : "";
                        const currentSheetValidation =
                          validationData[currentId] || {};
                        const rowCols = current.getRowColumns(fila);
                        const rowValidation =
                          currentSheetValidation[fila.id] || {};
                        const currentRef = current
                          ? extractRef(current.sheet)
                          : "";

                        return (
                          <MemoizedTableRow
                            key={fila.id}
                            fila={fila}
                            currentSheetId={currentId}
                            currentRef={currentRef}
                            rowCols={rowCols}
                            rowValidation={rowValidation}
                            activeCell={activeCell}
                            columns={current.columns}
                            bloqueosActivos={bloqueosActivos}
                            user={user}
                            desmarcarTienda={desmarcarTienda}
                            intentarBloquear={intentarBloquear}
                            setSnackbar={setSnackbar}
                            setActiveCell={setActiveCell}
                          />
                        );
                      })}

                      {/* Totals */}
                      <TableRow
                        sx={{ "& td": { borderTop: "2px solid #e2e8f0" } }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 900,
                            fontSize: "0.72rem",
                            position: "sticky",
                            left: 0,
                            bgcolor: "#f1f5f9",
                            zIndex: 1,
                            borderRight: "2px solid #e2e8f0",
                            color: "#475569",
                            textTransform: "uppercase",
                            py: 0.4,
                          }}
                        >
                          TOTALES
                        </TableCell>
                        {current.columns.map((col) => {
                          const refTotal = current.columnTotals[col] || 0;
                          const mirrorTotal = mirrorColumnTotals[col] || 0;
                          const vs = getValidationStyles(refTotal, mirrorTotal);
                          return (
                            <TableCell
                              key={`t-${col}`}
                              align="center"
                              sx={{
                                bgcolor:
                                  mirrorTotal > 0 ? vs.bgcolor : "#f8fafc",
                                borderLeft: "1px solid #f1f5f9",
                                py: 0.4,
                                px: 0.5,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: MONO_FONT,
                                  fontSize: "16px",
                                  color: "#6366f1",
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                }}
                              >
                                {refTotal}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: MONO_FONT,
                                  fontSize: "24px",
                                  fontWeight: 900,
                                  lineHeight: 1.2,
                                  mt: -0.1,
                                  color: mirrorTotal > 0 ? vs.color : "#94a3b8",
                                }}
                              >
                                {mirrorTotal || "—"}
                              </Typography>
                            </TableCell>
                          );
                        })}
                        <TableCell
                          align="center"
                          sx={{
                            borderLeft: "2px solid #e2e8f0",
                            bgcolor: "#f1f5f9",
                            py: 0.4,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: MONO_FONT,
                              fontSize: "16px",
                              color: "#6366f1",
                              fontWeight: 700,
                              lineHeight: 1.2,
                            }}
                          >
                            {current.sheet.totalGeneral}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: MONO_FONT,
                              fontSize: "24px",
                              fontWeight: 900,
                              lineHeight: 1.2,
                              mt: -0.1,
                              color:
                                mirrorGrandTotal === 0
                                  ? "#94a3b8"
                                  : mirrorGrandTotal ===
                                      current.sheet.totalGeneral
                                    ? "#15803d"
                                    : "#dc2626",
                            }}
                          >
                            {mirrorGrandTotal > 0 ? mirrorGrandTotal : "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Stack>

          {/* Snacks */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            sx={{ "& .MuiSnackbarContent-root": { minWidth: "400px" } }}
          >
            <Alert
              onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              severity={snackbar.severity}
              variant="filled"
              sx={{ fontWeight: 700, borderRadius: "10px" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          <Snackbar
            open={notificacionCambios?.open || false}
            autoHideDuration={5000}
            onClose={() => setNotificacionCambios(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            sx={{
              "& .MuiSnackbarContent-root": {
                minWidth: "500px",
                bgcolor: "#1e3a8a",
                color: "white",
              },
            }}
          >
            <Alert
              onClose={() => setNotificacionCambios(null)}
              severity="info"
              variant="filled"
              sx={{
                fontWeight: 700,
                borderRadius: "10px",
                bgcolor: "#1e3a8a",
                color: "white",
                "& .MuiAlert-icon": { color: "#93c5fd" },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={900}>
                  {notificacionCambios?.mensaje || ""}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {notificacionCambios?.ubicacion || ""}
                </Typography>
              </Box>
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default EnviosPage;
