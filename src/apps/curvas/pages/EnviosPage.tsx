/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Alert,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  Dashboard as DashboardIcon,
  CheckCircle,
  Send as SendIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useCurvas } from "../contexts/CurvasContext";
import { useAuth } from "@/auth/hooks/useAuth";
import directus from "@/services/directus/directus";
import {
  getLogCurvas,
  getEnviosCurvas,
  getResumenFechasCurvas,
} from "../api/directus/read";
import { saveEnviosBatch, deleteEnvioDrafts } from "../api/directus/create";
import {
  type LogCurvas,
  type FilaMatrizGeneral,
  type FilaDetalleProducto,
} from "../types";

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";

import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.locale("es");

// Imports de archivos separados
import {
  MONO_FONT,
  CATEGORY_CONFIG,
  type ConfirmedEntry,
  type SheetCategory,
} from "./EnviosPage.utils";
import {
  DebouncedSearchInput,
  MemoizedTableRow,
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
    userRole,
    lastLogsUpdate,
    extractRef,
    bloqueosActivos,
    intentarBloquear,
    desmarcarTienda,
    validationData,
    setValidationData,
    tiendasDict,
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
  const [logCurvasData, setLogCurvasData] = useState<LogCurvas[]>([]);
  const [enviosCurvasData, setEnviosCurvasData] = useState<any[]>([]);
  const [loadingLogCurvas, setLoadingLogCurvas] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState<
    Record<string, "pendiente" | "enviado">
  >({});
  const [activeCell, setActiveCell] = useState<{
    filaId: string;
    col: string;
    sheetId: string;
  } | null>(null);
  const [sentEntryKeys, setSentEntryKeys] = useState<Set<string>>(new Set());
  const hydratedSheetsRef = useRef<Set<string>>(new Set());
  const refTableRef = useRef<HTMLDivElement>(null);
  /**
   * Rastrea qué tienda_id (filaId) escaneó ESTE usuario en esta sesión.
   * Se usa al guardar para evitar persistir tiendas escaneadas por otros.
   * Estructura: { [sheetId]: Set<filaId> }
   */
  const myScannedTiendasRef = useRef<Record<string, Set<string>>>({});

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
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Sincronización WebSockets y Data Fetch ─────────────────────
  const [wsTrigger, setWsTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let unsubLog: (() => void) | undefined;
    let unsubEnvios: (() => void) | undefined;

    const setupWebSockets = async () => {
      try {
        try {
          await directus.connect();
        } catch (e: any) {
          if (
            !e?.message?.includes('state is "open"') &&
            !e?.message?.includes('state is "connecting"')
          ) {
            throw e;
          }
        }

        const logRes = await directus.subscribe("log_curve_scans");
        unsubLog = logRes.unsubscribe;
        const enviosRes = await directus.subscribe("envios_curvas");
        unsubEnvios = enviosRes.unsubscribe;

        (async () => {
          try {
            for await (const msg of logRes.subscription) {
              if (!isMounted) break;
              if (
                msg.type === "subscription" &&
                ["create", "update", "delete"].includes(msg.event)
              ) {
                setWsTrigger((t) => t + 1);
              }
            }
          } catch (e) {}
        })();

        (async () => {
          try {
            for await (const msg of enviosRes.subscription) {
              if (!isMounted) break;
              if (
                msg.type === "subscription" &&
                ["create", "update", "delete"].includes(msg.event)
              ) {
                setWsTrigger((t) => t + 1);
              }
            }
          } catch (e) {}
        })();
      } catch (err) {
        console.error("Error setting up websockets:", err);
      }
    };

    setupWebSockets();

    return () => {
      isMounted = false;
      if (unsubLog) unsubLog();
      if (unsubEnvios) unsubEnvios();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLogCurvasYTiendas = async () => {
      if (!isMounted) return;
      setLoadingLogCurvas(true);
      try {
        const [logs, envios] = await Promise.all([
          getLogCurvas(
            filtroFecha ? filtroFecha.format("YYYY-MM-DD") : undefined,
            filtroReferencia || undefined,
          ),
          getEnviosCurvas(
            filtroFecha ? filtroFecha.format("YYYY-MM-DD") : undefined,
            filtroReferencia || undefined,
          ),
        ]);
        if (isMounted) {
          setLogCurvasData(logs || []);
          setEnviosCurvasData(envios || []);
        }
      } catch (error) {
        console.error("Error fetching logs in EnviosPage:", error);
      } finally {
        if (isMounted) setLoadingLogCurvas(false);
      }
    };

    fetchLogCurvasYTiendas();

    return () => {
      isMounted = false;
    };
  }, [filtroFecha, filtroReferencia, userRole, lastLogsUpdate, wsTrigger]);

  // ── Build confirmed entries ──────────────
  // Defined here to avoid "columnas" property errors on official types
  type InternalCell = {
    talla: string;
    cantidad: number;
    esCero: boolean;
    esMayorQueCero: boolean;
  };
  type InternalFila = (FilaMatrizGeneral | FilaDetalleProducto) & {
    columnas: InternalCell[];
    total: number;
    validationValues: any;
  };

  const confirmedEntries = useMemo<ConfirmedEntry[]>(() => {
    const entries: ConfirmedEntry[] = [];
    if (logCurvasData && logCurvasData.length > 0) {
      const groupedLogs: Record<string, any[]> = {};
      logCurvasData.forEach((log: LogCurvas) => {
        let rawRef = log.referencia || "SIN REF";
        let colorParsed = "";
        let ref = rawRef.replace(/^REF:\s*/i, "").trim();
        if (ref.includes(" | ")) {
          const parts = ref.split(" | ");
          ref = parts[0].trim();
          colorParsed = parts[1].trim();
        }
        const groupKey = `${log.plantilla}|${rawRef}|${colorParsed}`;
        if (!groupedLogs[groupKey]) groupedLogs[groupKey] = [];
        (log as any)._color_extraido = colorParsed;
        groupedLogs[groupKey].push(log);
      });

      Object.entries(groupedLogs).forEach(([key, logs]) => {
        const [plantilla, refKey, colorFinal] = key.split("|");
        const isTextil =
          plantilla === "matriz_general" ||
          plantilla === "textil" ||
          plantilla.toLowerCase().includes("textil");
        const typeCategory = isTextil ? "general" : "producto_a";
        const entryKey = `${typeCategory}|${refKey}|${colorFinal}`;

        if (sentEntryKeys.has(entryKey)) return;

        const lastLog = logs[0];

        const uniqueColumns = Array.from(
          new Set(
            logs.flatMap((l) => {
              const tallasRaw = l.cantidad_talla || "[]";
              const parsed =
                typeof tallasRaw === "string"
                  ? JSON.parse(tallasRaw)
                  : tallasRaw;
              const items = Array.isArray(parsed) ? parsed : [];
              return items.map((p: any) =>
                String(p.talla || p.numero || "").padStart(2, "0"),
              );
            }),
          ),
        )
          .filter((c) => c && c !== "00")
          .sort();

        // Add deduplication logic to align with CurvasContext/Dashboard
        const tiendasProcesadas = new Set<string>();
        const logsDeduplicados = logs.filter((l: any) => {
          const tId = String(l.tienda_id);
          if (tiendasProcesadas.has(tId)) return false; // Already have latest for this store
          tiendasProcesadas.add(tId);
          return true;
        });

        // Agrupación por Tienda para evitar duplicados en la visualización
        const logsCategorizados = logsDeduplicados.reduce(
          (acc: any, l: any) => {
            const tId = String(l.tienda_id);
            const tNombre =
              tiendasDict[tId] || l.tienda_nombre || `Tienda ${tId}`;

            if (!acc[tId]) {
              acc[tId] = {
                id: tId,
                tienda: {
                  id: tId,
                  nombre: tNombre,
                  codigo: tId,
                },
                columnasMap: {} as Record<string, number>,
                rowData: {} as Record<string, any>,
                total: 0,
                validationValues: validationData[entryKey]?.[tId] || {},
              };
            }

            const tallasRaw = l.cantidad_talla || "[]";
            const parsed =
              typeof tallasRaw === "string" ? JSON.parse(tallasRaw) : tallasRaw;
            const items = Array.isArray(parsed) ? parsed : [];

            items.forEach((ct: any) => {
              const colName = String(ct.talla || ct.numero || "").padStart(
                2,
                "0",
              );
              if (!colName || colName === "00") return;

              const qty = Number(ct.cantidad) || 0;
              acc[tId].columnasMap[colName] =
                (acc[tId].columnasMap[colName] || 0) + qty;
              acc[tId].total += qty;
            });

            return acc;
          },
          {},
        );

        const aggregatedFilas: InternalFila[] = Object.keys(
          logsCategorizados,
        ).map((tId) => {
          const columnsArray: InternalCell[] = uniqueColumns.map((col) => {
            const qty = logsCategorizados[tId].columnasMap[col] || 0;
            return {
              talla: col,
              cantidad: qty,
              esCero: qty === 0,
              esMayorQueCero: qty > 0,
            };
          });

          const base = {
            id: tId,
            tienda: logsCategorizados[tId].tienda,
            columnas: columnsArray,
            total: logsCategorizados[tId].total,
            validationValues: logsCategorizados[tId].validationValues || {},
          };

          if (isTextil) {
            const curvas: any = {};
            columnsArray.forEach(
              (c) =>
                (curvas[c.talla] = {
                  valor: c.cantidad,
                  id: `${tId}-${c.talla}`,
                  esCero: c.esCero,
                  esMayorQueCero: c.esMayorQueCero,
                }),
            );
            return { ...base, curvas } as InternalFila;
          } else {
            const tallas: any = {};
            columnsArray.forEach(
              (c) =>
                (tallas[c.talla] = {
                  valor: c.cantidad,
                  id: `${tId}-${c.talla}`,
                  esCero: c.esCero,
                  esMayorQueCero: c.esMayorQueCero,
                }),
            );
            return { ...base, tallas } as InternalFila;
          }
        });

        // Totales de referencia por columna para el footer
        const referenceTotals: Record<string, number> = {};
        uniqueColumns.forEach((col) => {
          referenceTotals[col] = Object.values(logsCategorizados).reduce(
            (acc: number, t: any) => {
              return acc + (Number(t.columnasMap[col]) || 0);
            },
            0,
          );
        });

        const config =
          CATEGORY_CONFIG[typeCategory as SheetCategory] ||
          CATEGORY_CONFIG["producto_a"];

        entries.push({
          id: entryKey,
          ref: refKey,
          label: `REF: ${refKey} | ${colorFinal}`,
          category: typeCategory as SheetCategory,
          icon: config.icon as React.ReactElement,
          accent: config.accent,
          sheet: {
            id: entryKey,
            logId: logs.map((l) => String(l.id)).join(","),
            nombreHoja: lastLog.archivo || "Sin nombre",
            referencia: refKey,
            filas: aggregatedFilas as any[],
            totalGeneral: aggregatedFilas.reduce(
              (acc: number, f) => acc + (f.total || 0),
              0,
            ),
          },
          columns: uniqueColumns,
          columnTotals: referenceTotals,
          getRowColumns: (fila: any) => {
            const res: Record<string, number> = {};
            (fila.columnas || []).forEach((c: any) => {
              res[c.talla] = c.cantidad;
            });
            return res;
          },
        });
      });
    }
    return entries;
  }, [logCurvasData, sentEntryKeys, validationData, tiendasDict]);

  const visibleEntries = useMemo(() => {
    if (!filtroReferencia) return confirmedEntries;
    const lower = filtroReferencia.toLowerCase();
    return confirmedEntries.filter((e) =>
      e.label.toLowerCase().includes(lower),
    );
  }, [confirmedEntries, filtroReferencia]);

  const current = visibleEntries[selectedEntry] || null;

  // ── Wrapper que registra escaneos propios antes de actualizar validationData ──
  // Esto implementa el concepto "Vista Compartida, Guardado Personal":
  // la vista muestra todo (de todos los usuarios), pero al guardar solo
  // se persisten las tiendas que el usuario atual escaneó en esta sesión.
  const handleActualizarValorValidacion = useCallback(
    (
      sheetId: string,
      filaId: string,
      columna: string,
      valor: number,
      codigoBarra?: string | null,
    ) => {
      // Registrar que este usuario escaneó esta fila en esta sesión
      if (!myScannedTiendasRef.current[sheetId]) {
        myScannedTiendasRef.current[sheetId] = new Set<string>();
      }
      myScannedTiendasRef.current[sheetId].add(filaId);
      // Delegar al original del contexto
      actualizarValorValidacion(sheetId, filaId, columna, valor, codigoBarra);
    },
    [actualizarValorValidacion],
  );

  // ── Keyboard management ─────────────
  useEnviosKeyboard({
    current,
    activeCell,
    actualizarValorValidacion: handleActualizarValorValidacion,
    setActiveCell,
    validationData,
    bloqueosActivos,
    user,
    confirmedEntries,
    safeIndex: selectedEntry,
    setSelectedEntry,
    setSnackbar,
    extractRef,
    intentarBloquear,
  });

  // ── Hydration from envios_curvas (carga inicial, una vez por hoja) ──────────
  useEffect(() => {
    if (!current || !enviosCurvasData || enviosCurvasData.length === 0) return;

    const currentRef = extractRef(current.sheet);
    const sheetId = String(current.sheet.id);

    // Solo hidratar una vez por hoja en esta sesión.
    // Marcar inmediatamente para evitar doble ejecución concurrente.
    if (hydratedSheetsRef.current.has(sheetId)) return;
    hydratedSheetsRef.current.add(sheetId);

    const enviosParaRef = enviosCurvasData.filter((log: any) => {
      const logRef = extractRef({
        referencia: log.referencia || log.referenciaBase,
      });
      return logRef === currentRef;
    });

    if (enviosParaRef.length === 0) return;

    const nuevoValidation: Record<string, any> = {};
    enviosParaRef.forEach((log: any) => {
      const tiendaId =
        typeof log.tienda_id === "object" && log.tienda_id !== null
          ? String(log.tienda_id.id || log.tienda_id.codigo)
          : String(log.tienda_id);
      let parsedTallas: any[] = [];
      try {
        parsedTallas =
          typeof log.cantidad_talla === "string"
            ? JSON.parse(log.cantidad_talla)
            : log.cantidad_talla;
      } catch (e) {
        return;
      }

      if (!Array.isArray(parsedTallas)) return;

      const rowData: Record<string, { cantidad: number; barcodes: string[] }> =
        {};
      parsedTallas.forEach((item: any) => {
        const col = String(item.tanda || item.talla).padStart(2, "0");
        if (!rowData[col]) rowData[col] = { cantidad: 0, barcodes: [] };

        const cantidad = Number(item.cantidad) || 0;
        const barcodes = Array.isArray(item.barcodes)
          ? item.barcodes
          : item.codigo_barra
            ? [item.codigo_barra]
            : [];

        rowData[col].cantidad += cantidad;
        if (barcodes.length > 0) {
          for (let i = 0; i < cantidad; i++) {
            rowData[col].barcodes.push(...barcodes);
          }
        }
      });
      nuevoValidation[tiendaId] = rowData;
    });

    // Siempre actualizamos para esta hoja, incluso si es un objeto vacío (borrado total)
    setValidationData((prev) => ({
      ...prev,
      [sheetId]: nuevoValidation,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.sheet?.id, enviosCurvasData, extractRef, setValidationData]);
  // Nota: validationData excluido de deps a propósito — la hidratación es una sola vez.

  // ── Sync en tiempo real: datos de otros usuarios ──────────────────────────
  // Se ejecuta en cada actualización del polling (cada 5s), DESPUÉS de la
  // hidratación inicial. NUNCA sobreescribe las tiendas que el usuario actual
  // escaneó en esta sesión (protegidas por myScannedTiendasRef).
  useEffect(() => {
    if (!current || !enviosCurvasData) return;

    const sheetId = String(current.sheet.id);

    // Solo correr después de que la hidratación inicial ya terminó
    if (!hydratedSheetsRef.current.has(sheetId)) return;

    const currentRef = extractRef(current.sheet);
    const myTiendas = myScannedTiendasRef.current[sheetId] || new Set<string>();

    const enviosParaRef = enviosCurvasData.filter((log: any) => {
      const logRef = extractRef({
        referencia: log.referencia || log.referenciaBase,
      });
      return logRef === currentRef;
    });

    setValidationData((prev) => {
      const prevSheet = { ...(prev[sheetId] || {}) };
      let changed = false;

      // 1. Identificar qué tiendas vienen de la DB y procesarlas
      const dbTiendaData: Record<string, any> = {};
      const dbTiendaIds = new Set<string>();

      enviosParaRef.forEach((log: any) => {
        const tiendaId =
          typeof log.tienda_id === "object" && log.tienda_id !== null
            ? String(log.tienda_id.id || log.tienda_id.codigo)
            : String(log.tienda_id);

        dbTiendaIds.add(tiendaId);

        // NUNCA sobreescribir lo que el usuario actual escaneó en esta sesión
        if (myTiendas.has(tiendaId)) return;

        let parsedTallas: any[] = [];
        try {
          parsedTallas =
            typeof log.cantidad_talla === "string"
              ? JSON.parse(log.cantidad_talla)
              : log.cantidad_talla;
        } catch {
          return;
        }

        if (!Array.isArray(parsedTallas)) return;

        const rowData: Record<
          string,
          { cantidad: number; barcodes: string[] }
        > = {};
        parsedTallas.forEach((item: any) => {
          const col = String(item.tanda || item.talla).padStart(2, "0");
          if (!rowData[col]) rowData[col] = { cantidad: 0, barcodes: [] };

          const cantidad = Number(item.cantidad) || 0;
          const barcodes = Array.isArray(item.barcodes)
            ? item.barcodes
            : item.codigo_barra
              ? [item.codigo_barra]
              : [];

          rowData[col].cantidad += cantidad;
          if (barcodes.length > 0) {
            for (let i = 0; i < cantidad; i++) {
              rowData[col].barcodes.push(...barcodes);
            }
          }
        });
        dbTiendaData[tiendaId] = rowData;
      });

      // 2. Eliminar de prevSheet las tiendas que YA NO están en la DB (y no son mías)
      Object.keys(prevSheet).forEach((tiendaId) => {
        if (!myTiendas.has(tiendaId) && !dbTiendaIds.has(tiendaId)) {
          delete prevSheet[tiendaId];
          changed = true;
        }
      });

      // 3. Aplicar actualizaciones desde la DB
      Object.entries(dbTiendaData).forEach(([tiendaId, rowData]) => {
        const newStr = JSON.stringify(rowData);
        const existingStr = JSON.stringify(prevSheet[tiendaId]);
        if (newStr !== existingStr) {
          prevSheet[tiendaId] = rowData;
          changed = true;
        }
      });

      // Sin cambios → devolver la misma referencia para no disparar re-render
      if (!changed) return prev;
      return { ...prev, [sheetId]: prevSheet };
    });
  }, [enviosCurvasData, current?.sheet?.id, extractRef, setValidationData]);

  const _validationResults = useEnviosValidation({ current, validationData });
  const {
    mirrorColumnTotals: validationMirrorTotals,
    mirrorGrandTotal: validationMirrorGrandTotal,
    stats: validationStats,
    isEverythingValid,
  } = _validationResults;

  // ── Handlers ─────────────────────────────
  const getTabLabel = (entry: ConfirmedEntry, index: number) => {
    let ref = (entry.label || "")
      .replace("REF: ", "")
      .replace("Plantilla de Producto\nREF: ", "")
      .trim();
    if (!ref || ref.toUpperCase() === "SIN REF") {
      return `Lote ${index + 1} (${entry.category === "general" ? "Textil" : "Calzado"})`;
    }
    const catName = CATEGORY_CONFIG[entry.category]?.label || "General";
    return `${ref} - ${catName}`;
  };

  const handleEnviarADespacho = async (
    type: "save" | "send" | "auto" = "save",
  ) => {
    if (!current || !user) return;

    if (type === "send") setIsSending(true);
    if (type === "save") setIsSaving(true);

    try {
      const currentRef = extractRef(current.sheet);
      const sheetKey = String(current.sheet.id!);
      const sheetLogId = current.sheet.logId || sheetKey;
      const currentSheetValidation = validationData[sheetKey] || {};

      // Si es auto-guardado, no validamos si hay datos (permitimos que limpie si es necesario)
      if (type !== "auto") {
        const hasData = Object.values(currentSheetValidation).some((row: any) =>
          Object.values(row).some(
            (cell: any) =>
              (typeof cell === "object" ? cell.cantidad : cell) > 0,
          ),
        );

        const myTiendas = myScannedTiendasRef.current[sheetKey];
        const hasSomethingToClear = myTiendas && myTiendas.size > 0;

        if (!hasData && !hasSomethingToClear) {
          setSnackbar({
            open: true,
            message: "No hay datos para enviar",
            severity: "warning",
          });
          setIsSending(false);
          setIsSaving(false);
          return;
        }
      }

      const template: any = [
        ...(datosCurvas?.matrizGeneral || []),
        ...(datosCurvas?.productos || []),
      ].find((s) => String(s.id) === sheetKey);

      const logsBatch: any[] = [];
      const fechaActual = dayjs().format("YYYY-MM-DD");

      // ── Vista Compartida, Guardado Personal ──────────────────────────────────
      // myScannedTiendasRef registra SOLO las tiendas que este usuario escaneó
      // en esta sesión. currentSheetValidation puede tener filas de otros usuarios
      // (hidratadas desde envios_curvas al abrir la página). Solo guardamos las nuestras.
      const myTiendas =
        myScannedTiendasRef.current[sheetKey] ?? new Set<string>();

      if (myTiendas.size === 0) {
        setSnackbar({
          open: true,
          message:
            "⚠️ No escaneaste ninguna tienda en esta sesión. No hay nada propio que guardar.",
          severity: "warning",
        });
        setIsSaving(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────────

      for (const [filaId, tallas] of Object.entries(currentSheetValidation)) {
        // Saltar filas que no escaneó este usuario en esta sesión
        if (!myTiendas.has(filaId)) continue;

        const filaIdStr =
          typeof filaId === "object" ? JSON.stringify(filaId) : String(filaId);

        const fila = template?.filas?.find(
          (f: any) =>
            String(f.id) === filaIdStr ||
            String(f.tienda?.id) === filaIdStr ||
            String(f.tienda?.codigo) === filaIdStr,
        );

        const tiendaIdFinal =
          fila?.tienda?.id || (tiendasDict[filaIdStr] ? filaIdStr : null);

        if (!tiendaIdFinal) continue;

        const cantidadTalla: {
          talla: number;
          cantidad: number;
          codigo_barra: string;
        }[] = [];

        for (const [col, data] of Object.entries(tallas)) {
          const cellData =
            typeof data === "object" ? data : { cantidad: data, barcodes: [] };
          if (cellData.cantidad > 0) {
            if (cellData.barcodes.length > 0) {
              const barcodeCount: Record<string, number> = {};
              cellData.barcodes.forEach(
                (bc: string) =>
                  (barcodeCount[bc] = (barcodeCount[bc] || 0) + 1),
              );
              Object.entries(barcodeCount).forEach(([bc, qty]) => {
                cantidadTalla.push({
                  talla: parseFloat(col),
                  cantidad: qty,
                  codigo_barra: bc,
                });
              });
            } else {
              cantidadTalla.push({
                talla: parseFloat(col),
                cantidad: cellData.cantidad,
                codigo_barra: "",
              });
            }
          }
        }

        if (cantidadTalla.length > 0) {
          const fila = current.sheet.filas.find((f: any) => f.id === filaId);
          if (fila?.tienda) {
            // Find the log_curvas ID for this tienda to use as foreign key
            const matchingLog = logCurvasData.find((l) => {
              const logRef = extractRef({ referencia: l.referencia });
              return (
                String(l.tienda_id) === String(fila.tienda.id) &&
                logRef === currentRef
              );
            });

            logsBatch.push({
              tienda_id: fila.tienda.id,
              tienda_nombre: fila.tienda.nombre,
              plantilla: matchingLog ? String(matchingLog.id) : sheetLogId,
              fecha: fechaActual,
              cantidad_talla: cantidadTalla, // Pass array directly for Directus Repeater/JSON
              referencia: currentRef || "SIN REF",
              estado: "borrador",
              usuario_id: user.id,
            });
          }
        }
      }

      // Primero limpiamos los borradores anteriores de este usuario para esta referencia
      await deleteEnvioDrafts(currentRef || "SIN REF", String(user.id));

      if (logsBatch.length > 0) {
        // Luego guardamos el nuevo lote de progreso en envios_curvas
        const ok = await saveEnviosBatch(logsBatch);
        if (ok) {
          if (type !== "auto") {
            setSnackbar({
              open: true,
              message: `✅ Proceso guardado: ${validationMirrorGrandTotal} unidades`,
              severity: "success",
            });
          }
        } else if (type !== "auto") {
          setSnackbar({
            open: true,
            message: "No se pudo guardar",
            severity: "error",
          });
        }
      } else {
        // Si no hay datos (0 unidades), y era manual, avisar que se limpió el progreso
        if (type !== "auto") {
          setSnackbar({
            open: true,
            message: "Progreso limpiado (0 unidades)",
            severity: "info",
          });
        }
        // Limpiamos nuestra referencia local para esta hoja ya que no hay nada pendiente
        if (myScannedTiendasRef.current[sheetKey]) {
          myScannedTiendasRef.current[sheetKey].clear();
        }
      }
    } catch (error) {
      console.error(error);
      if (type !== "auto") {
        setSnackbar({
          open: true,
          message: "Error al guardar",
          severity: "error",
        });
      }
    } finally {
      setIsSending(false);
      setIsSaving(false);
    }
  };

  // ── Auto-guardado para Envios (Escaneo) ─────────────────────
  useEffect(() => {
    if (!current || !user || isSending || isSaving) return;

    const sheetKey = String(current.sheet.id);
    const myTiendas = myScannedTiendasRef.current[sheetKey];

    // Solo auto-guardar si este usuario ha escaneado algo en esta sesión para esta hoja
    if (!myTiendas || myTiendas.size === 0) return;

    const timer = setTimeout(() => {
      handleEnviarADespacho("auto");
    }, 7000);

    return () => clearTimeout(timer);
  }, [validationData, current, user]);

  // ── Render ────────────────────────────
  const headerContent = (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      sx={{ py: 0.5, justifyContent: "flex-end", width: "100%", gap: 1.5 }}
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
        sx={{ height: 16, bgcolor: "rgba(255,255,255,0.25)" }}
      />
      <TextField
        select
        value={filtroFecha?.format("YYYY-MM-DD") || ""}
        onChange={(e) =>
          setFiltroFecha(e.target.value ? dayjs(e.target.value) : null)
        }
        size="small"
        slotProps={{
          select: { native: true },
          input: {
            sx: {
              color: "white",
              fontSize: "0.85rem",
              fontWeight: 700,
              height: 16,
            },
          },
        }}
        sx={{
          width: 170,
          "& .MuiOutlinedInput-root": {
            height: 40,
            color: "white",
            bgcolor: "rgba(255,255,255,0.15)",
            borderRadius: 1.5,
          },
        }}
      >
        {Object.keys(fechasConDatos)
          .sort((a, b) => b.localeCompare(a))
          .map((fecha) => (
            <option
              key={fecha}
              value={fecha}
              style={{ backgroundColor: "#ffffff", color: "#1e293b" }}
            >
              {fecha ? dayjs(fecha).format("DD MMM YYYY") : "Seleccionar"}
            </option>
          ))}
      </TextField>
      <DebouncedSearchInput
        value={filtroReferencia}
        onChange={setFiltroReferencia}
        placeholder="Buscar..."
        sx={{
          minWidth: 180,
          "& .MuiOutlinedInput-root": {
            color: "white",
            bgcolor: "rgba(255,255,255,0.15)",
            borderRadius: 1.5,
          },
        }}
      />
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          alignItems: "center",
          gap: 0.75,
        }}
      >
        <Chip
          label={`${validationStats.matched}/${validationStats.total} (${validationStats.percent}%)`}
          color={validationStats.percent === 100 ? "success" : "warning"}
          size="small"
          icon={<CheckCircle sx={{ fontSize: "14px !important" }} />}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          disabled={isSending || isSaving}
          startIcon={<SaveIcon />}
          onClick={() => handleEnviarADespacho("save")}
          sx={{
            fontWeight: 700,
            px: 2.5,
            borderRadius: 2,
            height: 40,
            bgcolor: "#64748b",
            "&:hover": { bgcolor: "#475569" },
          }}
        >
          {isSaving ? "GUARDANDO..." : "GUARDAR"}
        </Button>
        <Button
          variant="contained"
          disabled={!isEverythingValid || isSending || isSaving}
          startIcon={<SendIcon />}
          onClick={() => handleEnviarADespacho("send")}
          sx={{
            fontWeight: 800,
            px: 2.5,
            borderRadius: 2,
            height: 40,
            bgcolor: "#22c55e",
            "&:hover": { bgcolor: "#16a34a" },
          }}
        >
          {isSending ? "ENVIANDO..." : "ENVIAR"}
        </Button>
      </Box>
    </Stack>
  );

  if (loadingLogCurvas && logCurvasData.length === 0) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (visibleEntries.length === 0) {
    return (
      <>
        {portalTarget ? createPortal(headerContent, portalTarget) : null}
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
              Sin lotes para enviar
              {filtroFecha
                ? ` del día ${filtroFecha.format("DD MMM YYYY")}`
                : ""}
            </Typography>
            <Typography variant="body1" color="#64748b" sx={{ mb: 4 }}>
              Puede que tengas envíos correspondientes a otras fechas. Usa el
              selector que se encuentra en la parte superior para revisar los
              datos de otros días.
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
      </>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <>
        {portalTarget ? createPortal(headerContent, portalTarget) : null}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              height: "calc(100vh - 74px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              py: 0.5,
              px: { xs: 0.5, md: 1 },
              gap: 1,
            }}
          >
            <Stack sx={{ flex: 1, overflow: "hidden" }} spacing={1.5}>
              <Paper
                elevation={0}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  bgcolor: "white",
                  px: 1,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Tabs
                  value={selectedEntry}
                  onChange={(_, v) => setSelectedEntry(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 48,
                    "& .MuiTab-root": {
                      minHeight: 56,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                    },
                  }}
                >
                  {visibleEntries.map((entry, idx) => (
                    <Tab key={entry.id} label={getTabLabel(entry, idx)} />
                  ))}
                </Tabs>
              </Paper>

              {current && (
                <Paper
                  ref={refTableRef}
                  className="tour-curvas-tiendas"
                  elevation={0}
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "white",
                  }}
                >
                  <TableContainer className="tour-curvas-scan" sx={{ flex: 1, overflow: "auto" }}>
                    <Table stickyHeader size="small">
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
                              borderBottom: "1px solid #e2e8f0",
                              p: 0,
                            }}
                          />
                          <TableCell
                            sx={{
                              fontWeight: 800,
                              bgcolor: "#f8fafc",
                              width: 150,
                              position: "sticky",
                              left: 44,
                              zIndex: 4,
                              borderRight: "1px solid #e2e8f0",
                              borderBottom: "1px solid #e2e8f0",
                              fontSize: "0.8rem",
                              color: "#64748b",
                              textTransform: "uppercase",
                              py: 0.5,
                            }}
                          >
                            ESTABLECIMIENTO
                          </TableCell>
                          {current.columns.map((col: string) => (
                            <TableCell
                              key={col}
                              align="center"
                              sx={{
                                fontFamily: MONO_FONT,
                                fontWeight: 900,
                                bgcolor: "#f8fafc",
                                fontSize: "1rem",
                                borderBottom: "1px solid #e2e8f0",
                                px: 1,
                                minWidth: 70,
                              }}
                            >
                              {col}
                              <Typography
                                sx={{
                                  fontSize: "0.6rem",
                                  color: "#94a3b8",
                                  fontWeight: 700,
                                  mt: -0.2,
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
                              borderLeft: "1px solid #e2e8f0",
                              borderBottom: "1px solid #e2e8f0",
                              fontSize: "0.8rem",
                              color: "#64748b",
                            }}
                          >
                            TOTAL
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {current.sheet.filas.map((fila: any) => {
                          const sheetId = String(current.sheet.id);
                          const columns = current.columns;
                          const rowCols: any = {};
                          (fila.columnas || []).forEach(
                            (c: any) => (rowCols[c.talla] = c.cantidad),
                          );

                          const sheetValidation = validationData[sheetId] || {};
                          const rowValidation =
                            sheetValidation[fila.id] ||
                            sheetValidation[String(fila.tienda?.id)] ||
                            {};

                          return (
                            <MemoizedTableRow
                              key={`${sheetId}-${fila.id}`}
                              fila={fila}
                              currentSheetId={sheetId}
                              currentRef={current.ref}
                              rowCols={rowCols}
                              rowValidation={rowValidation}
                              activeCell={activeCell}
                              columns={columns}
                              bloqueosActivos={bloqueosActivos}
                              user={user}
                              desmarcarTienda={desmarcarTienda}
                              intentarBloquear={intentarBloquear}
                              setSnackbar={setSnackbar}
                              setActiveCell={setActiveCell}
                            />
                          );
                        })}

                        {/* Fila de Totales */}
                        <TableRow
                          sx={{
                            bgcolor: "#f8fafc",
                            "& .MuiTableCell-root": {
                              fontWeight: 900,
                              py: 0.5,
                              borderTop: "2px solid #e2e8f0",
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              position: "sticky",
                              left: 0,
                              bgcolor: "#f8fafc",
                              zIndex: 5,
                              borderRight: "1px solid #e2e8f0",
                            }}
                          />
                          <TableCell
                            sx={{
                              position: "sticky",
                              left: 44,
                              bgcolor: "#f8fafc",
                              zIndex: 4,
                              borderRight: "1px solid #e2e8f0",
                              color: "#475569",
                              fontSize: "0.9rem",
                              textTransform: "uppercase",
                            }}
                          >
                            TOTALES:
                          </TableCell>
                          {current.columns.map((col: string) => {
                            const refVal = current.columnTotals[col] || 0;
                            const scanVal = validationMirrorTotals[col] || 0;
                            const isComplete = refVal > 0 && scanVal === refVal;
                            const isOver = refVal > 0 && scanVal > refVal;

                            return (
                              <TableCell
                                key={col}
                                align="center"
                                sx={{
                                  borderLeft: "1px solid #f1f5f9",
                                  bgcolor: isComplete
                                    ? "#f0fdf4"
                                    : "transparent",
                                  transition: "background-color 0.3s ease",
                                }}
                              >
                                <Stack spacing={0}>
                                  <Typography
                                    sx={{
                                      fontSize: "15px",
                                      color: isComplete ? "#16a34a" : "#3b82f6",
                                      fontWeight: 700,
                                      mb: 0.5,
                                    }}
                                  >
                                    {refVal}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: "25px",
                                      color: isOver
                                        ? "#ef4444"
                                        : isComplete
                                          ? "#15803d"
                                          : scanVal > 0
                                            ? "#475569"
                                            : "#cbd5e1",
                                    }}
                                  >
                                    {scanVal || "—"}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            );
                          })}
                          <TableCell
                            align="center"
                            sx={{
                              borderLeft: "1px solid #e2e8f0",
                              bgcolor:
                                validationMirrorGrandTotal ===
                                  current.sheet.totalGeneral &&
                                current.sheet.totalGeneral > 0
                                  ? "#f0fdf4"
                                  : "transparent",
                            }}
                          >
                            <Stack spacing={0}>
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  color:
                                    validationMirrorGrandTotal ===
                                      current.sheet.totalGeneral &&
                                    current.sheet.totalGeneral > 0
                                      ? "#16a34a"
                                      : "#3b82f6",
                                  fontWeight: 800,
                                  mb: 0.2,
                                }}
                              >
                                {current.sheet.totalGeneral}
                              </Typography>
                              <Typography
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "20px",
                                  color:
                                    validationMirrorGrandTotal >
                                    current.sheet.totalGeneral
                                      ? "#ef4444"
                                      : validationMirrorGrandTotal ===
                                            current.sheet.totalGeneral &&
                                          current.sheet.totalGeneral > 0
                                        ? "#15803d"
                                        : validationMirrorGrandTotal > 0
                                          ? "#1e293b"
                                          : "#cbd5e1",
                                }}
                              >
                                {validationMirrorGrandTotal > 0
                                  ? validationMirrorGrandTotal
                                  : "—"}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Stack>
          </Container>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity={snackbar.severity}
              variant="filled"
              sx={{ fontWeight: 700, borderRadius: "10px" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </>
    </LocalizationProvider>
  );
};

export default EnviosPage;
