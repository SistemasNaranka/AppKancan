/** @jsxImportSource react */
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  Chip,
  Fade,
  Skeleton,
  Tooltip,
  InputAdornment,
  Alert,
  Badge,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterList';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import {
  getEnviosAnalisis,
  getResumenFechasCurvas,
} from "../api/directus/read";
import { useCurvas } from "../contexts/CurvasContext";
import CustomSelectionModal, {
  SelectionItem,
} from "../../../shared/components/selectionmodal/CustomSelectionModal";

dayjs.locale("es");

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const BRAND = {
  primary: "#006ACC",
  dark: "#004680",
  light: "#B8DCFF",
  bg: "#E6F4FF",
};
const MAIN_FONT = "'Inter', sans-serif";
const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";

// Heat-map color scale por cantidad (semáforo: amarillo-falta, verde-bien, rojo-sobra)
const getHeatColor = (val: number, max: number) => {
  if (val === 0) return { bg: "#e2e8f0", text: "#94a3b8", fw: 500 }; // Gris para cero (falta)
  if (val < 2) return { bg: "#fef3c7", text: "#92400e", fw: 600 }; // Amarillo poco (falta)
  if (val <= 5) return { bg: "#dcfce7", text: "#166534", fw: 700 }; // Verde bien
  if (val <= 10) return { bg: "#fca5a5", text: "#dc2626", fw: 800 }; // Rojo claro sobra
  return { bg: "#ef4444", text: "#7f1d1d", fw: 900 }; // Rojo intenso mucho sobra
};

// Paleta de colores azules para el gráfico de usuarios
const getUserBarColor = (index: number) => {
  const colors = [
    "#006ACC", // BRAND.primary
    "#0284c7",
    "#0369a1",
    "#075985",
    "#0c4a6e",
    "#082f49",
    "#1e3a8a",
    "#1e40af",
    "#2563eb",
    "#3b82f6",
  ];
  return colors[index % colors.length];
};

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────
interface UsuarioData {
  id: string;
  nombreCompleto: string;
}

interface FilaAnalisis {
  tiendaId: string;
  tiendaNombre: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha?: string;
  referencia?: string;
  tallas: Record<string, number>;
  total: number;
}

interface MatrixDataTransformada {
  tallas: string[];
  filas: FilaAnalisis[];
  columnTotals: Record<string, number>;
  grandTotal: number;
  tiendasUnicas: number;
  usuariosUnicos: number;
  maxCellValue: number;
  unidadesPorUsuario: Record<string, { nombre: string; total: number }>;
}

// ─────────────────────────────────────────────
// Pequeño pill de estadística para el AppBar
// ─────────────────────────────────────────────
const StatPill = ({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 0.5,
      px: 1,
      py: 0.35,
      borderRadius: 99,
      bgcolor: "rgba(255,255,255,0.13)",
      border: "1px solid rgba(255,255,255,0.18)",
      flexShrink: 0,
    }}
  >
    <Typography
      sx={{
        fontFamily: MONO_FONT,
        fontWeight: 900,
        fontSize: "0.82rem",
        color: "#B8DCFF",
        lineHeight: 1,
      }}
    >
      {typeof value === "number" ? value.toLocaleString("es-CO") : value}
    </Typography>
    <Typography
      sx={{
        fontFamily: MAIN_FONT,
        fontWeight: 700,
        fontSize: "0.58rem",
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {label}
    </Typography>
  </Box>
);

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────
const AnalisisPage = () => {
  const { tiendasDict } = useCurvas();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Dayjs | null>(dayjs());
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");
  const [filtroTienda, setFiltroTienda] = useState<string>("");
  const [showRefModal, setShowRefModal] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState<
    Record<string, "pendiente" | "enviado">
  >({
    [dayjs().format("YYYY-MM-DD")]: "pendiente" as "pendiente" | "enviado"
  });

  // Portal into main AppBar
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = document.getElementById("analisis-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  // ── Fetch logs by date ──────────────────────────────────
  const fetchLogsByDate = useCallback(async () => {
    const isGlobal = selectedRef === "ALL_HISTORICAL";
    if (!fecha && !isGlobal) return;
    setLoading(true);
    try {
      const data = await getEnviosAnalisis(
        isGlobal || !fecha ? undefined : fecha.startOf("day").toISOString(),
        isGlobal || !fecha ? undefined : fecha.endOf("day").toISOString(),
      );
      setLogs(data || []);
      // Auto-select first reference if nothing selected yet
      if (!selectedRef && !isGlobal && data.length > 0) {
        const refs = Array.from(
          new Set(data.map((l: any) => l.referencia)),
        ).filter(Boolean) as string[];
        if (refs.length > 0) setSelectedRef(refs.sort()[0]);
      } else if (
        selectedRef && !isGlobal &&
        !data.some((l: any) => l.referencia === selectedRef)
      ) {
        setSelectedRef(null);
      }
    } catch (err) {
      console.error("Error fetching analysis logs:", err);
    } finally {
      setLoading(false);
    }
  }, [fecha, selectedRef]);

  useEffect(() => {
    fetchLogsByDate();
  }, [fetchLogsByDate]);

  // ── Fetch fechas con datos ────────────────────────────────
  useEffect(() => {
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      setFechasConDatos(resumen);
      if (Object.keys(resumen).length > 0 && !fecha) {
        const sortedFechas = Object.keys(resumen).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        );
        setFecha(dayjs(sortedFechas[0]));
      }
    };
    fetchFechas();
  }, []);

  // ── Unique references ───────────────────────────────────

  const uniqueReferences = useMemo(() => {
    const refs = Array.from(new Set(logs.map((l) => l.referencia))).filter(
      Boolean,
    );
    return (refs as string[]).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  // Reference summary (for modal items)
  const refSummaryItems = useMemo((): SelectionItem[] => {
    return uniqueReferences.map((ref, idx) => {
      const refLogs = logs.filter((l) => l.referencia === ref);
      const tiendas = new Set(
        refLogs.map((l) =>
          typeof l.tienda_id === "object"
            ? String(l.tienda_id?.id)
            : String(l.tienda_id),
        ),
      ).size;
      const usuarios = new Set(
        refLogs.map((l) => {
          const u = l.usuario_id;
          return typeof u === "object" ? u?.id : String(u);
        }),
      ).size;
      let total = 0;
      refLogs.forEach((log) => {
        try {
          const ct =
            typeof log.cantidad_talla === "string"
              ? JSON.parse(log.cantidad_talla)
              : log.cantidad_talla;
          if (Array.isArray(ct))
            ct.forEach((item: any) => {
              total += item.cantidad || 0;
            });
        } catch {}
      });
      return {
        id: idx,
        label: ref,
        description: `${tiendas} tienda${tiendas !== 1 ? "s" : ""} · ${usuarios} usuario${usuarios !== 1 ? "s" : ""} · ${total.toLocaleString("es-CO")} uds`,
      };
    });
  }, [uniqueReferences, logs]);

  // ── Unique users ────────────────────────────────────────
  const uniqueUsuarios = useMemo((): UsuarioData[] => {
    if (!selectedRef) return [];
    const map = new Map<string, UsuarioData>();
    logs
      .filter((l) => l.referencia === selectedRef)
      .forEach((log) => {
        const uid = log.usuario_id;
        if (!uid) return;
        const id = typeof uid === "object" ? uid?.id : String(uid);
        const nombre =
          typeof uid === "object"
            ? `${uid?.first_name || ""} ${uid?.last_name || ""}`.trim()
            : `Usuario ${uid}`;
        map.set(id, { id, nombreCompleto: nombre || `Usuario ${id}` });
      });
    return Array.from(map.values()).sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto),
    );
  }, [logs, selectedRef]);

  // ── Matrix transform ────────────────────────────────────
  const matrixData = useMemo<MatrixDataTransformada | null>(() => {
    if (!selectedRef || !logs || logs.length === 0) return null;
    
    const isGlobal = selectedRef === "ALL_HISTORICAL";
    const filteredLogs = isGlobal ? logs : logs.filter((l) => l.referencia === selectedRef);
    
    const allTallasSet = new Set<string>();
    const filasMap = new Map<string, FilaAnalisis>();

    for (const log of filteredLogs) {
      let ct: any[] = [];
      try {
        ct = typeof log.cantidad_talla === "string"
          ? JSON.parse(log.cantidad_talla)
          : log.cantidad_talla;
      } catch { continue; }

      const tiendaId = log.tienda_id?.id || String(log.tienda_id || "BODEGA");
      const tiendaNombre = log.tienda_id?.nombre || tiendasDict[tiendaId] || log.tienda_nombre || `Tienda ${tiendaId}`;

      const u = log.usuario_id;
      const usuarioId = u?.id || String(u || "desconocido");
      const usuarioNombre = u?.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : `Usuario ${usuarioId}`;

      const dateKey = log.fecha ? dayjs(log.fecha).format("DD/MM/YYYY") : "—";
      // Clave de agrupamiento: en global incluimos fecha y ref; en normal solo tienda+usuario
      const filaKey = isGlobal 
        ? `${tiendaId}|${usuarioId}|${log.fecha?.slice(0, 10)}|${log.referencia}` 
        : `${tiendaId}|${usuarioId}`;

      if (!filasMap.has(filaKey)) {
        filasMap.set(filaKey, {
          tiendaId,
          tiendaNombre,
          usuarioId,
          usuarioNombre: usuarioNombre || `Usuario ${usuarioId}`,
          fecha: isGlobal ? dateKey : undefined,
          referencia: isGlobal ? log.referencia : undefined,
          tallas: {},
          total: 0,
        });
      }

      const fila = filasMap.get(filaKey)!;
      if (Array.isArray(ct)) {
        for (const item of ct) {
          const tKey = String(item.talla || item.numero || "").padStart(2, "0");
          if (!tKey || tKey === "00") continue;
          allTallasSet.add(tKey);
          const cant = Number(item.cantidad) || 0;
          fila.tallas[tKey] = (fila.tallas[tKey] || 0) + cant;
          fila.total += cant;
        }
      }
    }

    const sortedTallas = Array.from(allTallasSet).sort((a, b) => {
      const nA = parseFloat(a), nB = parseFloat(b);
      return isNaN(nA) || isNaN(nB) ? a.localeCompare(b) : nA - nB;
    });

    const columnTotals: Record<string, number> = {};
    sortedTallas.forEach(t => {
      columnTotals[t] = Array.from(filasMap.values()).reduce((s, f) => s + (f.tallas[t] || 0), 0);
    });

    let filasList = Array.from(filasMap.values());
    if (filtroUsuario) filasList = filasList.filter(f => f.usuarioId === filtroUsuario);
    if (filtroTienda) filasList = filasList.filter(f => f.tiendaNombre.toLowerCase().includes(filtroTienda.toLowerCase()));
    
    filasList.sort((a, b) => a.tiendaNombre.localeCompare(b.tiendaNombre) || a.usuarioNombre.localeCompare(b.usuarioNombre));

    const maxCellValue = Math.max(...filasList.flatMap(f => sortedTallas.map(t => f.tallas[t] || 0)), 1);

    const unidadesPorUsuario: Record<string, { nombre: string; total: number }> = {};
    filasList.forEach(f => {
      if (!unidadesPorUsuario[f.usuarioId]) unidadesPorUsuario[f.usuarioId] = { nombre: f.usuarioNombre, total: 0 };
      unidadesPorUsuario[f.usuarioId].total += f.total;
    });

    return {
      tallas: sortedTallas,
      filas: filasList,
      columnTotals,
      grandTotal: Object.values(columnTotals).reduce((s, v) => s + v, 0),
      tiendasUnicas: new Set(filasList.map(f => f.tiendaId)).size,
      usuariosUnicos: new Set(filasList.map(f => f.usuarioId)).size,
      maxCellValue,
      unidadesPorUsuario,
    };
  }, [logs, selectedRef, tiendasDict, filtroUsuario, filtroTienda]);

  // ── Export ──────────────────────────────────────────────
  const handleExportar = useCallback(async () => {
    if (!matrixData || !selectedRef) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Análisis Curvas");

      const isGlobal = selectedRef === "ALL_HISTORICAL";
      const headers = [
        "Establecimiento",
        "Usuario",
        ...(isGlobal ? ["Fecha", "Referencia"] : []),
        ...matrixData.tallas,
        "TOTAL",
      ];
      const headerRow = worksheet.addRow(headers);

      // Style header row
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF006ACC" }, // BRAND.primary
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
          size: 11,
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      matrixData.filas.forEach((f, idx) => {
        const rowData = [
          f.tiendaNombre,
          f.usuarioNombre,
          ...(isGlobal ? [f.fecha, f.referencia] : []),
          ...matrixData.tallas.map((t) => f.tallas[t] || 0),
          f.total,
        ];
        const row = worksheet.addRow(rowData);

        // Zebra striping
        if (idx % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          });
        }

        row.eachCell((cell, colIndex) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: colIndex > 2 ? "center" : "left",
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      // Adjust column widths
      worksheet.columns = headers.map((h, i) => ({
        header: h,
        key: h,
        width: i === 0 ? 30 : i === 1 ? 25 : 8,
      }));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `analisis_${selectedRef.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD")}.xlsx`,
      );
    } catch (error) {
      console.error("Error generating Excel:", error);
    }
  }, [matrixData, selectedRef]);

  // ── Portal content ──────────────────────────────────────
  const portalContent = (
    <Stack
      direction="row"
      spacing={0.8}
      alignItems="center"
      sx={{ overflow: "hidden" }}
    >
      {/* KPI pills */}
      {matrixData && (
        <Stack
          direction="row"
          spacing={0.8}
          sx={{ display: { xs: "none", lg: "flex" }, mr: 1 }}
        >
          <StatPill value={matrixData.tiendasUnicas} label="Tiendas" />
          <StatPill value={matrixData.usuariosUnicos} label="Usuarios" />
          <StatPill value={matrixData.grandTotal} label="Total Uds" />
        </Stack>
      )}

      {/* Date select - solo fechas con datos */}
      <FormControl
        className="tour-curvas-analisis-rango"
        size="small"
        sx={{ minWidth: { xs: 120, sm: 140, md: 150 } }}
      >
        <InputLabel
          sx={{
            color: "#b8dcff",
            fontWeight: 600,
            fontSize: "0.7rem",
            bgcolor: "transparent",
            px: 0.5,
            "&.Mui-focused": { color: "#99ccff" },
          }}
        >
          Fecha
        </InputLabel>
        <Select
          value={fecha?.format("YYYY-MM-DD") || ""}
          onChange={(e) => {
            setFecha(e.target.value ? dayjs(e.target.value) : null);
            setSelectedRef(null);
          }}
          sx={{
            bgcolor: "#0052a3",
            borderRadius: 2,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            color: "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 700,
            height: 36,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#4da6ff",
              borderWidth: "2px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#66b3ff",
              borderWidth: "2px",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#99ccff",
              borderWidth: "2px",
            },
          }}
          IconComponent={() => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#b8dcff",
              }}
            >
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 300,
                "& .MuiMenuItem-root": {
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  padding: "8px 12px",
                },
              },
            },
          }}
        >
          {Object.keys(fechasConDatos).length > 0 ? (
            Object.keys(fechasConDatos)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((f) => (
                <MenuItem key={f} value={f}>
                  {dayjs(f).format("DD MMM YYYY")}
                </MenuItem>
              ))
          ) : (
            <MenuItem value="" disabled>
              Sin fechas disponibles
            </MenuItem>
          )}
        </Select>
      </FormControl>

      {/* Reference button - mejorado con más visibilidad */}
      <Tooltip title="Ver todo el historial acumulado">
        <Button
          variant={selectedRef === "ALL_HISTORICAL" ? "contained" : "outlined"}
          size="small"
          onClick={() => {
            if (selectedRef === "ALL_HISTORICAL") {
              setSelectedRef(null);
            } else {
              setSelectedRef("ALL_HISTORICAL");
            }
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            fontSize: "0.78rem",
            height: 36,
            px: 2,
            flexShrink: 0,
            bgcolor: selectedRef === "ALL_HISTORICAL" ? "#f59e0b" : "transparent",
            border: "2px solid",
            borderColor: selectedRef === "ALL_HISTORICAL" ? "#d97706" : "#f59e0b",
            color: selectedRef === "ALL_HISTORICAL" ? "#ffffff" : "#f59e0b",
            "&:hover": {
              bgcolor: selectedRef === "ALL_HISTORICAL" ? "#d97706" : "rgba(245, 158, 11, 0.1)",
            },
          }}
        >
          {selectedRef === "ALL_HISTORICAL" ? "Histórico Global" : "Históricos"}
        </Button>
      </Tooltip>

      <Tooltip title="Ver y cambiar referencia">
        <Badge
          badgeContent={uniqueReferences.length}
          color="info"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.65rem",
              height: 18,
              minWidth: 18,
              bgcolor: "#f59e0b",
              color: "white",
              top: 8,
              right: 6,
              border: "2px solid #006ACC",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            },
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<LibraryBooksIcon sx={{ fontSize: 15 }} />}
            onClick={() => setShowRefModal(true)}
            disabled={uniqueReferences.length === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              height: 36,
              px: 2,
              flexShrink: 0,
              bgcolor: "#0052a3",
              border: "2px solid #4da6ff",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              "&:hover": {
                bgcolor: "#0066cc",
                borderColor: "#66b3ff",
                boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(0,60,120,0.4)",
                color: "rgba(255,255,255,0.4)",
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "none",
              },
            }}
          >
            <Box
              component="span"
              sx={{
                maxWidth: { xs: 60, sm: 100, md: 130 },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedRef === "ALL_HISTORICAL" ? "Histórico Global" : (selectedRef ?? "Referencia")}
            </Box>
          </Button>
        </Badge>
      </Tooltip>

      {/* Store search on md+ - mejorado con más visibilidad */}
      <TextField
        size="small"
        placeholder="Tienda…"
        value={filtroTienda}
        onChange={(e) => setFiltroTienda(e.target.value)}
        sx={{
          width: { xs: 0, md: 130 },
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          bgcolor: "#0052a3",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          "& .MuiOutlinedInput-root": {
            color: "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 700,
            height: 36,
            borderRadius: 2,
            bgcolor: "transparent",
            "& fieldset": { borderColor: "#4da6ff", borderWidth: "2px" },
            "&:hover fieldset": { borderColor: "#66b3ff", borderWidth: "2px" },
            "&.Mui-focused fieldset": {
              borderColor: "#99ccff",
              borderWidth: "2px",
            },
          },
          "& input::placeholder": {
            color: "#b8dcff",
            opacity: 1,
            fontSize: "0.78rem",
            fontWeight: 600,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <StoreIcon sx={{ fontSize: 16, color: "#b8dcff" }} />
            </InputAdornment>
          ),
          endAdornment: filtroTienda ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setFiltroTienda("")}
                sx={{ color: "#b8dcff", p: 0.2 }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {/* User filter on md+ - mejorado con más visibilidad */}
      <TextField
        select
        size="small"
        value={filtroUsuario}
        onChange={(e) => setFiltroUsuario(e.target.value)}
        sx={{
          width: { xs: 0, md: 150 },
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          bgcolor: "#0052a3",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          "& .MuiOutlinedInput-root": {
            color: "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 700,
            height: 36,
            borderRadius: 2,
            bgcolor: "transparent",
            "& fieldset": { borderColor: "#4da6ff", borderWidth: "2px" },
            "&:hover fieldset": { borderColor: "#66b3ff", borderWidth: "2px" },
            "&.Mui-focused fieldset": {
              borderColor: "#99ccff",
              borderWidth: "2px",
            },
            "& .MuiSelect-icon": { color: "#b8dcff" },
          },
          "& .MuiInputLabel-root": {
            color: "#b8dcff",
            fontSize: "0.7rem",
            fontWeight: 600,
            top: -2,
            "&.Mui-focused": { color: "#99ccff" },
          },
        }}
        slotProps={{
          select: {
            displayEmpty: true,
            renderValue: (selected: any) => {
              if (!selected)
                return (
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      color: "#b8dcff",
                      fontWeight: 600,
                    }}
                  >
                    Usuario…
                  </Typography>
                );
              const u = uniqueUsuarios.find((u) => u.id === selected);
              return u?.nombreCompleto || selected;
            },
            MenuProps: { PaperProps: { sx: { maxHeight: 300 } } },
          },
        }}
      >
        <MenuItem value="" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
          Todos los usuarios
        </MenuItem>
        {uniqueUsuarios.map((u) => (
          <MenuItem
            key={u.id}
            value={u.id}
            sx={{ fontSize: "0.8rem", fontWeight: 600 }}
          >
            {u.nombreCompleto}
          </MenuItem>
        ))}
      </TextField>

      {/* Refresh - mejorado con más visibilidad */}
      <Tooltip title="Actualizar">
        <IconButton
          size="small"
          onClick={fetchLogsByDate}
          disabled={loading}
          sx={{
            color: "#ffffff",
            flexShrink: 0,
            bgcolor: "#0052a3",
            border: "2px solid #4da6ff",
            width: 36,
            height: 36,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            animation: loading ? "spin 1s linear infinite" : "none",
            "&:hover": { bgcolor: "#0066cc", borderColor: "#66b3ff" },
          }}
        >
          <RefreshIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {/* Export Excel - mejorado con más visibilidad */}
      <Tooltip
        title={
          !selectedRef
            ? "Selecciona una referencia"
            : "Descargar análisis en Excel (.xlsx)"
        }
      >
        <span>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={handleExportar}
            disabled={!selectedRef || !matrixData}
            sx={{
              flexShrink: 0,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              height: 36,
              bgcolor: "#0052a3",
              border: "2px solid #4da6ff",
              color: "#ffffff",
              px: { xs: 1, sm: 2 },
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              "&:hover": {
                bgcolor: "#0066cc",
                borderColor: "#66b3ff",
                boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(0,60,120,0.4)",
                color: "rgba(255,255,255,0.4)",
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "none",
              },
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              Exportar
            </Box>
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <>
        {portalTarget && createPortal(portalContent, portalTarget)}

        {/* Reference selector modal */}
        <CustomSelectionModal
          open={showRefModal}
          onClose={() => setShowRefModal(false)}
          onConfirm={(selected) => {
            if (selected.length > 0) {
              const idx = Number(selected[0]);
              setSelectedRef(uniqueReferences[idx] ?? null);
              setShowRefModal(false);
            }
          }}
          items={refSummaryItems}
          title="Seleccionar Referencia"
          initialSelected={
            selectedRef ? [uniqueReferences.indexOf(selectedRef)] : []
          }
          labelKey="label"
        />

        <Container maxWidth="xl" sx={{ py: 2, fontFamily: MAIN_FONT }}>
          {/* Mobile secondary filters */}
          <Paper
            elevation={0}
            sx={{
              display: { xs: "flex", md: "none" },
              gap: 1,
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar tienda…"
              value={filtroTienda}
              onChange={(e) => setFiltroTienda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {/* ── State: no ref selected ── */}
          {!selectedRef ? (
            <Fade in={true}>
              <Box sx={{ py: 12, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 2.5,
                    bgcolor: BRAND.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnalyticsIcon
                    sx={{ fontSize: 42, color: BRAND.primary, opacity: 0.5 }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ color: "#475569", fontFamily: MAIN_FONT }}
                >
                  Selecciona una referencia
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", mt: 0.5, mb: 2 }}
                >
                  {uniqueReferences.length > 0
                    ? `${uniqueReferences.length} referencia(s) disponibles para ${fecha?.format("DD/MM/YYYY")}`
                    : `Sin datos para ${fecha?.format("DD/MM/YYYY")}`}
                </Typography>
                {uniqueReferences.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<LibraryBooksIcon />}
                    onClick={() => setShowRefModal(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: BRAND.primary,
                    }}
                  >
                    Ver referencias del día
                  </Button>
                )}
              </Box>
            </Fade>
          ) : loading ? (
            <Stack spacing={1.5}>
              <Skeleton
                variant="rounded"
                height={40}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rounded"
                height={380}
                sx={{ borderRadius: 3 }}
              />
            </Stack>
          ) : matrixData && matrixData.filas.length > 0 ? (
            <Fade in={true}>
              <Box>
                {/* Info bar */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.8 }}
                >
                  {/* Ref switcher chips */}
                  {uniqueReferences.length > 1 && (
                    <Stack
                      direction="row"
                      spacing={0.6}
                      sx={{ flexWrap: "wrap", gap: 0.5, mr: 1 }}
                    >
                      {uniqueReferences.map((ref) => (
                        <Chip
                          key={ref}
                          label={ref}
                          size="small"
                          onClick={() => setSelectedRef(ref)}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            borderRadius: 1.5,
                            cursor: "pointer",
                            bgcolor:
                              ref === selectedRef ? BRAND.primary : "#f1f5f9",
                            color: ref === selectedRef ? "white" : "#475569",
                            border:
                              ref === selectedRef
                                ? `1px solid ${BRAND.primary}`
                                : "1px solid #e2e8f0",
                            "&:hover": {
                              bgcolor:
                                ref === selectedRef ? BRAND.dark : "#e2e8f0",
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  <Chip
                    icon={<StoreIcon sx={{ fontSize: 13 }} />}
                    label={`${matrixData.tiendasUnicas} tiendas`}
                    size="small"
                    sx={{
                      bgcolor: BRAND.bg,
                      color: BRAND.dark,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                    }}
                  />
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: 13 }} />}
                    label={`${matrixData.usuariosUnicos} usuarios`}
                    size="small"
                    sx={{
                      bgcolor: "#f3e8ff",
                      color: "#6b21a8",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                    }}
                  />
                  <Chip
                    label={`${matrixData.grandTotal.toLocaleString("es-CO")} unidades despachadas`}
                    size="small"
                    sx={{
                      bgcolor: "#f0fdf4",
                      color: "#15803d",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                    }}
                  />
                  {matrixData.tallas.length > 0 && (
                    <Chip
                      icon={<FilterIcon sx={{ fontSize: 12 }} />}
                      label={`${matrixData.tallas.length} tallas`}
                      size="small"
                      sx={{
                        bgcolor: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        borderRadius: 1.5,
                      }}
                    />
                  )}

                  <Box sx={{ flexGrow: 1 }} />

                  {/* Legend */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {[
                      { bg: "#e2e8f0", label: "Falta" },
                      { bg: "#fef3c7", label: "Poco" },
                      { bg: "#dcfce7", label: "Bien" },
                      { bg: "#fca5a5", label: "Sobra" },
                    ].map((l) => (
                      <Stack
                        key={l.label}
                        direction="row"
                        spacing={0.3}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            bgcolor: l.bg,
                            borderRadius: 0.5,
                            border: "1px solid rgba(0,0,0,0.05)",
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          {l.label}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "#94a3b8",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  >
                    <CalendarIcon
                      sx={{ fontSize: 11, verticalAlign: "middle", mr: 0.3 }}
                    />
                    {fecha?.format("DD MMM YYYY")}
                  </Typography>
                </Stack>

                {/* Matrix Table */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,106,204,0.06)",
                  }}
                >
                  <TableContainer
                    sx={{ maxHeight: "calc(100vh - 240px)", overflowX: "auto" }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {/* Establishment header */}
                          <TableCell
                            sx={{
                              bgcolor: "#f1f5f9",
                              color: "#334155",
                              fontWeight: 800,
                              zIndex: 101,
                              minWidth: { xs: 140, md: 210 },
                              position: "sticky",
                              left: 0,
                              fontFamily: MAIN_FONT,
                              fontSize: "0.75rem",
                              letterSpacing: 0.5,
                              py: 1.5,
                              px: { xs: 1.5, md: 2 },
                              borderRight: "1px solid #e2e8f0",
                              borderBottom: "2px solid #cbd5e1",
                            }}
                          >
                            ESTABLECIMIENTO
                          </TableCell>

                          {/* User header */}
                          <TableCell
                            sx={{
                              bgcolor: "#f8fafc",
                              color: "#475569",
                              fontWeight: 800,
                              zIndex: 101,
                              minWidth: { xs: 100, md: 160 },
                              position: "sticky",
                              left: { xs: 140, md: 210 },
                              fontFamily: MAIN_FONT,
                              fontSize: "0.75rem",
                              letterSpacing: 0.5,
                              py: 1.5,
                              px: { xs: 1, md: 2 },
                              borderRight: "1px solid #e2e8f0",
                              borderBottom: "2px solid #cbd5e1",
                            }}
                          >
                            USUARIO
                          </TableCell>

                          {selectedRef === "ALL_HISTORICAL" && (
                            <>
                              <TableCell
                                align="center"
                                sx={{
                                  bgcolor: "#f8fafc",
                                  color: "#1e293b",
                                  fontWeight: 800,
                                  minWidth: 100,
                                  fontFamily: MAIN_FONT,
                                  fontSize: "0.75rem",
                                  py: 1.5,
                                  borderRight: "1px solid #e2e8f0",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                FECHA
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  bgcolor: "#f8fafc",
                                  color: "#1e293b",
                                  fontWeight: 800,
                                  minWidth: 160,
                                  fontFamily: MAIN_FONT,
                                  fontSize: "0.75rem",
                                  py: 1.5,
                                  borderRight: "1px solid #e2e8f0",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                REFERENCIA
                              </TableCell>
                            </>
                          )}

                          {/* Size headers */}
                          {matrixData.tallas.map((t, idx) => (
                            <TableCell
                              key={t}
                              align="center"
                              sx={{
                                bgcolor: idx % 2 === 0 ? "#fafafa" : "#ffffff",
                                color: "#475569",
                                fontWeight: 800,
                                minWidth: { xs: 56, md: 66 },
                                fontFamily: MONO_FONT,
                                fontSize: "0.85rem",
                                py: 1.3,
                                px: 0.4,
                                borderRight: "1px solid #f1f5f9",
                                borderBottom: "2px solid #cbd5e1",
                              }}
                            >
                              Talla {t}
                            </TableCell>
                          ))}

                          {/* Total header */}
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: "#e2e8f0",
                              color: "#1e293b",
                              fontWeight: 900,
                              minWidth: 86,
                              fontFamily: MAIN_FONT,
                              fontSize: "0.75rem",
                              letterSpacing: 0.5,
                              py: 1.5,
                              borderLeft: "1px solid #cbd5e1",
                              borderBottom: "2px solid #cbd5e1",
                            }}
                          >
                            TOTAL UNIDADES
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {matrixData.filas.map((f, i) => {
                          const isEven = i % 2 === 0;
                          const rowBg = isEven ? "white" : "#f8fafc";
                          return (
                            <TableRow
                              key={`${f.tiendaId}-${f.usuarioId}-${i}`}
                              sx={{
                                "&:hover": {
                                  border: "2px solid #3b82f6",
                                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
                                },
                                transition: "border-color 0.1s, box-shadow 0.1s",
                              }}
                            >
                              {/* Establishment */}
                              <TableCell
                                sx={{
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 5,
                                  bgcolor: rowBg,
                                  borderRight: "1px solid #e2e8f0",
                                  py: 1.2,
                                  px: { xs: 1.2, md: 2 },
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={0.8}
                                  alignItems="center"
                                >
                                  <Box
                                    sx={{
                                      width: 4,
                                      height: 28,
                                      borderRadius: 1,
                                      bgcolor: BRAND.primary,
                                      opacity: 0.5,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{
                                      fontFamily: MAIN_FONT,
                                      color: "#0f172a",
                                      fontSize: { xs: "0.75rem", md: "0.8rem" },
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {f.tiendaNombre}
                                  </Typography>
                                </Stack>
                              </TableCell>

                              {/* User */}
                              <TableCell
                                sx={{
                                  position: "sticky",
                                  left: { xs: 140, md: 210 },
                                  zIndex: 5,
                                  bgcolor: rowBg,
                                  borderRight: "2px solid #e2e8f0",
                                  py: 1.2,
                                  px: { xs: 0.8, md: 1.5 },
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={0.7}
                                  alignItems="center"
                                >
                                  <Avatar
                                    sx={{
                                      width: 26,
                                      height: 26,
                                      fontSize: "0.62rem",
                                      bgcolor: BRAND.primary,
                                      color: "white",
                                      fontWeight: 900,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {f.usuarioNombre
                                      .split(" ")
                                      .map((p) => p[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </Avatar>
                                  <Typography
                                    sx={{
                                      fontFamily: MAIN_FONT,
                                      color: "#334155",
                                      fontSize: {
                                        xs: "0.72rem",
                                        md: "0.78rem",
                                      },
                                      fontWeight: 600,
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {f.usuarioNombre}
                                  </Typography>
                                </Stack>
                              </TableCell>

                              {selectedRef === "ALL_HISTORICAL" && (
                                <>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      bgcolor: rowBg,
                                      borderRight: "1px solid #e2e8f0",
                                      color: "#64748b",
                                      fontWeight: 600,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {f.fecha}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      bgcolor: rowBg,
                                      borderRight: "1px solid #e2e8f0",
                                      color: "#475569",
                                      fontWeight: 700,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {f.referencia}
                                  </TableCell>
                                </>
                              )}

                              {/* Size cells — heat-map */}
                              {matrixData.tallas.map((talla, tIdx) => {
                                const val = f.tallas[talla] || 0;
                                const { bg, text, fw } = getHeatColor(
                                  val,
                                  matrixData.maxCellValue,
                                );
                                return (
                                  <Tooltip
                                    key={talla}
                                    title={`${f.usuarioNombre} escaneó ${val} unidades de Talla ${talla} en ${f.tiendaNombre}`}
                                    arrow
                                  >
                                    <TableCell
                                      align="center"
                                      sx={{
                                        py: 0.5,
                                        px: 0.3,
                                        bgcolor:
                                          val > 0
                                            ? bg
                                            : tIdx % 2 === 0
                                              ? "#fafafa"
                                              : "white",
                                        borderRight: "1px solid #f1f5f9",
                                        transition: "none",
                                        cursor: val > 0 ? "pointer" : "default",
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: MONO_FONT,
                                          fontSize: "0.9rem",
                                          fontWeight: fw,
                                          color: text,
                                          lineHeight: 2.5,
                                        }}
                                      >
                                        {val > 0 ? val : ""}
                                      </Typography>
                                    </TableCell>
                                  </Tooltip>
                                );
                              })}

                              {/* Row total */}
                              <Tooltip
                                title={`${f.usuarioNombre} escaneó ${f.total} unidades totales en ${f.tiendaNombre}`}
                                arrow
                              >
                                <TableCell
                                  align="center"
                                  sx={{
                                    borderLeft: "1px solid #e2e8f0",
                                    bgcolor:
                                      f.total > 0
                                        ? isEven
                                          ? "#f1f5f9"
                                          : "#e2e8f0"
                                        : isEven
                                          ? "#f8fafc"
                                          : "#f1f5f9",
                                    py: 1.2,
                                    cursor: f.total > 0 ? "pointer" : "default",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontFamily: MONO_FONT,
                                      fontSize: "0.95rem",
                                      fontWeight: 800,
                                      color: f.total > 0 ? "#1e293b" : "#94a3b8",
                                    }}
                                  >
                                    {f.total > 0
                                      ? f.total.toLocaleString("es-CO")
                                      : "—"}
                                  </Typography>
                                </TableCell>
                              </Tooltip>
                            </TableRow>
                          );
                        })}
                      </TableBody>

                      {/* Footer totals */}
                      <TableHead
                        sx={{ position: "sticky", bottom: 0, zIndex: 10 }}
                      >
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            sx={{
                              bgcolor: "#f1f5f9",
                              color: "#334155",
                              fontFamily: MAIN_FONT,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              letterSpacing: 0.5,
                              py: 1.5,
                              px: 2,
                              borderTop: `2px solid #cbd5e1`,
                              position: "sticky",
                              left: 0,
                              zIndex: 11,
                            }}
                          >
                            ∑ TOTALES
                          </TableCell>
                          {matrixData.tallas.map((t, idx) => (
                            <TableCell
                              key={t}
                              align="center"
                              sx={{
                                bgcolor: idx % 2 === 0 ? "#fafafa" : "#ffffff",
                                color:
                                  matrixData.columnTotals[t] > 0
                                    ? "#0f172a"
                                    : "#94a3b8",
                                fontFamily: MONO_FONT,
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                borderTop: `2px solid #cbd5e1`,
                                py: 1.5,
                                borderRight: "1px solid #f1f5f9",
                              }}
                            >
                              {matrixData.columnTotals[t] || "—"}
                            </TableCell>
                          ))}
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: "#e2e8f0",
                              color: "#0f172a",
                              fontFamily: MONO_FONT,
                              fontWeight: 900,
                              fontSize: "1.1rem",
                              borderTop: `2px solid #cbd5e1`,
                              borderLeft: "1px solid #cbd5e1",
                            }}
                          >
                            {matrixData.grandTotal.toLocaleString("es-CO")}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Gráfico de unidades por usuario */}
                {Object.keys(matrixData.unidadesPorUsuario).length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mt: 2,
                      borderRadius: 3,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 16px rgba(0,106,204,0.06)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: MAIN_FONT,
                        fontWeight: 800,
                        color: BRAND.dark,
                        mb: 3,
                        textAlign: "center",
                      }}
                    >
                      Unidades Escaneadas por Usuario
                    </Typography>
                    <Stack spacing={1.5}>
                      {Object.entries(matrixData.unidadesPorUsuario)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([userId, data], index) => {
                          const maxTotal = Math.max(...Object.values(matrixData.unidadesPorUsuario).map(d => d.total));
                          const widthPercent = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
                          const rank = index + 1;
                          return (
                            <Box key={userId} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Typography
                                sx={{
                                  fontFamily: MONO_FONT,
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  color: "#64748b",
                                  minWidth: 30,
                                  textAlign: "center",
                                }}
                              >
                                #{rank}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: MAIN_FONT,
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  color: "#334155",
                                  minWidth: 140,
                                  flexShrink: 0,
                                }}
                              >
                                {data.nombre}
                              </Typography>
                              <Box
                                sx={{
                                  flexGrow: 1,
                                  height: 32,
                                  bgcolor: "#e2e8f0",
                                  borderRadius: 3,
                                  position: "relative",
                                  overflow: "hidden",
                                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    width: `${widthPercent}%`,
                                    bgcolor: BRAND.primary,
                                    borderRadius: 3,
                                    transition: "width 0.4s ease",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                  }}
                                />
                                <Typography
                                  sx={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontFamily: MONO_FONT,
                                    fontWeight: 900,
                                    fontSize: "0.85rem",
                                    color: "white",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                  }}
                                >
                                  {data.total.toLocaleString("es-CO")} uds
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                    </Stack>
                  </Paper>
                )}
              </Box>
            </Fade>
          ) : (
            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                fontFamily: MAIN_FONT,
                fontWeight: 600,
                bgcolor: BRAND.bg,
                color: BRAND.dark,
                border: `1px solid ${BRAND.light}`,
              }}
            >
              No hay datos para <strong>{selectedRef}</strong> en esta fecha.
            </Alert>
          )}
        </Container>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </>
    </LocalizationProvider>
  );
};

export default AnalisisPage;
