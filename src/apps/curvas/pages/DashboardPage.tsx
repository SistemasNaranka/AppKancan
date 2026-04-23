import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  LinearProgress,
  useTheme,
  alpha,
  InputAdornment,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  Toolbar,
  QuickFilter,
  FilterPanelTrigger,
} from "@mui/x-data-grid";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { Badge } from "@mui/material";
import { useCurvas } from "../contexts/CurvasContext";
import { getResumenFechasCurvas } from "../api/directus/read";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PickersActionBar } from "@mui/x-date-pickers/PickersActionBar";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InventoryIcon from "@mui/icons-material/Inventory";
import SearchIcon from "@mui/icons-material/Search";
import FilterIcon from "@mui/icons-material/FilterList";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

dayjs.locale("es");

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";
import CustomSelectionModal, {
  SelectionItem,
} from "../../../shared/components/selectionmodal/CustomSelectionModal";

const MAIN_FONT = "'Inter', sans-serif";
const MONO_FONT = "'Roboto Mono', 'Consolas', monospace";
const BRAND = {
  primary: "#006ACC",
  dark: "#004680",
  light: "#B8DCFF",
  bg: "#E6F4FF",
  text: "#1e293b",
  textLight: "#64748b",
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

/**
 * Toolbar para DataGrid - Diseño limpio y minimalista
 */
const CustomToolbar = (props: any) => {
  const { currentRef, onOpenSelector } = props || {};
  return (
    <Box
      sx={{
        p: 1,
        px: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderBottom: "1px solid #e5e7eb",
        bgcolor: "#fafafa",
      }}
    >
      <QuickFilter
        placeholder="Buscar establecimiento..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
              </InputAdornment>
            ),
            sx: {
              height: 34,
              borderRadius: 2,
              fontSize: "0.82rem",
              bgcolor: "white",
              width: 280,
              "& fieldset": { borderColor: "#e5e7eb" },
              "&:hover fieldset": { borderColor: "#d1d5db" },
              "&.Mui-focused fieldset": { borderColor: BRAND.primary },
            },
          },
        }}
      />

      <Box sx={{ flexGrow: 1 }}></Box>

      <Toolbar
        render={
          <Stack direction="row" spacing={1}>
            {currentRef && (
              <Button
                size="small"
                onClick={onOpenSelector}
                startIcon={<LibraryBooksIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  color: BRAND.primary,
                  px: 1.5,
                  bgcolor: "white",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.8rem",
                  height: 34,
                  "&:hover": { bgcolor: "#f9fafb", borderColor: "#d1d5db" },
                }}
              >
                {currentRef}
              </Button>
            )}
            <FilterPanelTrigger
              render={
                <Button
                  size="small"
                  startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    color: "#6b7280",
                    px: 1.5,
                    bgcolor: "white",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.8rem",
                    height: 34,
                    "&:hover": { bgcolor: "#f9fafb", borderColor: "#d1d5db" },
                  }}
                >
                  Filtros
                </Button>
              }
            />
          </Stack>
        }
      />
    </Box>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    datosCurvas,
    permissions,
    editarCelda,
    cambiarTalla,
    guardarCambios,
    confirmarLote,

    cargarDatosGuardados,
    hasChanges,
    extractRef,
  } = useCurvas();

  const [sheetIndex, setSheetIndex] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });

  const [filtroFecha, setFiltroFecha] = useState<string>(getTodayStr());
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [filtroReferencia, setFiltroReferencia] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{
    rowId: string;
    field: string;
  } | null>(null);

  const [resumenFechas, setResumenFechas] = useState<Record<string, 'pendiente' | 'enviado'>>({});

  const initDateChecked = useRef(false);

  useLayoutEffect(() => {
    const el = document.getElementById("dashboard-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  useEffect(() => {
    const checkDefaultDate = async () => {
      try {
        const resumen = await getResumenFechasCurvas();
        setResumenFechas(resumen);

        if (!initDateChecked.current) {
          initDateChecked.current = true;
          if (!resumen[getTodayStr()]) {
            const fechasOrd = Object.keys(resumen).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );
            if (fechasOrd.length > 0) setFiltroFecha(fechasOrd[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching resumen:", error);
      }
    };
    checkDefaultDate();
  }, []);

  const isToday = useMemo(() => filtroFecha === getTodayStr(), [filtroFecha]);
  const isPastDate = useMemo(() => filtroFecha < getTodayStr(), [filtroFecha]);

  useEffect(() => {
    setLoadingDate(true);
    setSheetIndex(0);
    // null = modo histórico (sin filtro de fecha → trae todas las referencias)
    // filtroFecha = modo normal (filtra por la fecha seleccionada)
    const fechaParam: string | null = isHistoricalMode ? null : filtroFecha;
    cargarDatosGuardados(fechaParam).finally(() => setLoadingDate(false));
  }, [filtroFecha, isHistoricalMode]);

  const allSheets = useMemo(() => {
    if (!datosCurvas) return [];
    const combined = [
      ...(datosCurvas.matrizGeneral || []).map((s) => ({
        ...s,
        _tipo: "matriz_general",
      })),
      ...(datosCurvas.productos || []).map((s) => ({
        ...s,
        _tipo: "productos",
      })),
    ];
    return combined.filter((s) => {
      let refFull = "";
      try {
        refFull = extractRef(s).toUpperCase();
      } catch {
        return false;
      }
      if (filtroReferencia && !refFull.includes(filtroReferencia.toUpperCase()))
        return false;
      return true;
    });
  }, [datosCurvas, extractRef, filtroReferencia]);

  const datosActuales = useMemo(
    () => allSheets[sheetIndex] || null,
    [allSheets, sheetIndex],
  );
  const totalSheets = allSheets.length;
  const sheetNames = useMemo(
    () => allSheets.map((s) => extractRef(s)),
    [allSheets, extractRef],
  );
  const selectionItems = useMemo(
    (): SelectionItem[] =>
      allSheets.map((s, idx) => ({
        id: idx,
        label: extractRef(s),
        description: `${s.filas.length} Establecimientos · ${"curvas" in s ? (s as any).curvas.length : (s as any).tallas.length} Tallas`,
        category: "curvas" in s ? "Matriz" : "Producto",
      })),
    [allSheets, extractRef],
  );

  const columnas = useMemo((): GridColDef[] => {
    if (!datosActuales) return [];
    const isMatriz = "curvas" in datosActuales;
    const items: string[] = isMatriz
      ? (datosActuales as any).curvas
      : (datosActuales as any).tallas;

    const cols: GridColDef[] = [
      {
        field: "tienda",
        headerName: "ESTABLECIMIENTO",
        minWidth: 280,
        flex: 2,
        editable: false,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => {
          const isTotalRow = params.row.id === "row-total-final";
          return (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                bgcolor: isTotalRow ? BRAND.primary : "transparent",
                color: isTotalRow ? "white" : BRAND.text,
                px: 2.5,
                fontWeight: isTotalRow ? 800 : 600,
                gap: 1.5,
                boxSizing: "border-box",
              }}
            >
              <StorefrontIcon
                sx={{
                  fontSize: 17,
                  opacity: isTotalRow ? 0.9 : 0.7,
                  color: isTotalRow ? "white" : BRAND.primary,
                  flexShrink: 0,
                }}
              />
              <Typography
                noWrap
                sx={{
                  fontWeight: "inherit",
                  fontSize: "0.82rem",
                  letterSpacing: -0.3,
                }}
              >
                {params.row.tienda?.nombre || ""}
              </Typography>
            </Box>
          );
        },
        valueGetter: (_val, row) => row.tienda?.nombre || "",
      },
    ];

    items.forEach((item) => {
      cols.push({
        field: `val_${item}`,
        renderHeader: () => (
          <Box sx={{ textAlign: "center", lineHeight: 1.1, py: 0.5 }}>
            {isToday && permissions.canEdit ? (
              <TextField
                size="small"
                defaultValue={item.length === 1 && !isNaN(Number(item)) ? `0${item}` : item}
                onBlur={(e) => {
                  const newValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                  if (newValue && newValue !== item && datosActuales?.id) {
                    cambiarTalla(datosActuales.id, item, newValue);
                  }
                }}
                inputProps={{
                  style: {
                    textAlign: 'center',
                    fontFamily: MONO_FONT,
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    color: BRAND.text,
                    letterSpacing: 0.5,
                    padding: '2px 4px',
                    height: 'auto',
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: '1px solid rgba(0,0,0,0.1)' },
                    '&.Mui-focused fieldset': { border: '1px solid #1976d2' },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '2px 4px',
                  },
                  minWidth: 40,
                  maxWidth: 50,
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  color: BRAND.text,
                  letterSpacing: 0.5,
                }}
              >
                {item.length === 1 && !isNaN(Number(item)) ? `0${item}` : item}
              </Typography>
            )}
          </Box>
        ),
        minWidth: 65,
        flex: 0.8,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        editable: false,
        renderCell: (params: GridRenderCellParams) => {
          const valor = Number(params.value || 0);
          const isTotalRow = params.row.id === "row-total-final";
          if (isTotalRow) {
            return (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "white",
                  fontSize: "1rem",
                  fontFamily: MONO_FONT,
                  bgcolor: alpha(BRAND.primary, 0.25),
                  boxSizing: "border-box",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO_FONT,
                    fontWeight: 900,
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  {valor || "—"}
                </Typography>
              </Box>
            );
          }
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: "0.88rem",
                  fontWeight: valor > 0 ? 700 : 500,
                  color: valor > 0 ? BRAND.text : "#cbd5e1",
                }}
              >
                {valor}
              </Typography>
            </Box>
          );
        },
      });
    });

    cols.push({
      field: "total",
      headerName: "TOTAL",
      minWidth: 110,
      flex: 1,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const isTotalRow = params.row.id === "row-total-final";
        return (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isTotalRow ? BRAND.primary : alpha(BRAND.primary, 0.06),
              boxSizing: "border-box",
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontFamily: MONO_FONT,
                color: isTotalRow ? "white" : BRAND.primary,
                fontSize: isTotalRow ? "0.95rem" : "0.88rem",
              }}
            >
              {Number(params.value || 0).toLocaleString()}
            </Typography>
          </Box>
        );
      },
    });

    return cols;
  }, [datosActuales, permissions.canEdit, isToday]);

  const filas = useMemo(() => {
    if (!datosActuales) return [];
    const isMatriz = "curvas" in datosActuales;
    const itemsKey = isMatriz ? "curvas" : "tallas";
    const baseRows = datosActuales.filas.map((fila: any) => {
      const row: any = { id: fila.id, tienda: fila.tienda, total: fila.total };
      const items = fila[itemsKey] || {};
      Object.entries(items).forEach(([k, v]: any) => {
        row[`val_${k}`] = v.valor;
      });
      return row;
    });
    const totalRow: any = {
      id: "row-total-final",
      tienda: { nombre: "TOTAL GENERAL" },
      total: baseRows.reduce((sum, r) => sum + (r.total || 0), 0),
    };
    const columns = isMatriz
      ? (datosActuales as any).curvas
      : (datosActuales as any).tallas;
    columns.forEach((c: string) => {
      totalRow[`val_${c}`] = baseRows.reduce(
        (sum, r) => sum + (r[`val_${c}`] || 0),
        0,
      );
    });
    return [...baseRows, totalRow];
  }, [datosActuales]);

  const handleCellEdit = useCallback(
    (rowId: string, field: string, newValue: any) => {
      if (
        !permissions.canEdit ||
        rowId === "row-total-final" ||
        !datosActuales?.id ||
        !isToday
      )
        return;
      const itemKey = field.replace("val_", "");
      editarCelda(datosActuales.id, rowId, itemKey, Number(newValue) || 0);
    },
    [permissions.canEdit, editarCelda, datosActuales, isToday],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (!isToday || !permissions.canEdit || !focusedCell || !datosActuales)
        return;
      const text = event.clipboardData.getData("text");
      if (!text) return;
      const rows = text.split(/\r?\n/).filter((r) => r.trim() !== "");
      if (rows.length === 0) return;
      const data = rows.map((r) => r.split("\t"));
      const startRowId = focusedCell.rowId;
      const startField = focusedCell.field;
      if (!startField.startsWith("val_")) return;
      const editColumns = columnas
        .filter((c) => c.field.startsWith("val_"))
        .map((c) => c.field);
      const startColIdx = editColumns.indexOf(startField);
      if (startColIdx === -1) return;
      const gridRows = filas.filter((r) => r.id !== "row-total-final");
      const startRowIdx = gridRows.findIndex(
        (r) => String(r.id) === String(startRowId),
      );
      if (startRowIdx === -1) return;
      data.forEach((pastedRow, rOffset) => {
        const targetRow = gridRows[startRowIdx + rOffset];
        if (!targetRow) return;
        pastedRow.forEach((value, cOffset) => {
          const targetField = editColumns[startColIdx + cOffset];
          if (!targetField) return;
          const val = Number(value.trim().replace(/[^0-9.-]+/g, "")) || 0;
          const itemKey = targetField.replace("val_", "");
          editarCelda(datosActuales.id!, String(targetRow.id), itemKey, val);
        });
      });
      setSnackbar({
        open: true,
        message: "📋 Datos pegados correctamente",
        severity: "success",
      });
    },
    [
      isToday,
      permissions.canEdit,
      focusedCell,
      datosActuales,
      columnas,
      filas,
      editarCelda,
    ],
  );

  // Removida la lógica de guardar en Dashboard ya que es de solo lectura.
  const handleSave = () => {
    setSnackbar({
      open: true,
      message: "Vista de solo lectura. Edita desde la página de Carga si es necesario.",
      severity: "info",
    });
  };

  const handleSend = async () => {
    if (!datosActuales?.id || saving) return;
    setSaving(true);
    const isMatriz = "curvas" in datosActuales;
    const ok = await confirmarLote(
      isMatriz ? "general" : "producto_a",
      datosActuales.id,
    );
    if (ok) {
      setSnackbar({
        open: true,
        message: "Enviado a despacho",
        severity: "success",
      });
      navigate("/curvas/envios");
    } else {
      setSnackbar({
        open: true,
        message: "Error al enviar",
        severity: "error",
      });
    }
    setSaving(false);
  };



  const isConfirmed = (datosActuales as any)?.estado === "confirmado";

  const headerFiltersContent = (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        py: 0.6,
        px: 1,
        justifyContent: { xs: "center", sm: "flex-end" },
        width: "100%",
        flexWrap: "nowrap",
      }}
    >
      {/* ── Status: MODO LECTURA ── */}
      {isPastDate && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            height: 40,
            borderRadius: "6px",
            bgcolor: "rgba(156, 163, 175, 0.12)",
            border: "1.5px solid rgba(156, 163, 175, 0.5)",
            backdropFilter: "blur(4px)",
            color: "#6b7280",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 900 }}>
            📖 SOLO LECTURA - HISTORIAL
          </Typography>
        </Box>
      )}

      {/* ── Status: REFERENCIA ── */}
      {datosActuales && (
        <Box
          onClick={() => setShowSelector(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            px: 2,
            height: 40,
            borderRadius: "6px",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.35)",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontWeight: 800,
              fontSize: "0.58rem",
              letterSpacing: 1,
            }}
          >
            REF
          </Typography>
          <Typography
            sx={{
              color: "white",
              fontWeight: 900,
              fontFamily: MONO_FONT,
              fontSize: "0.85rem",
              letterSpacing: -0.2,
            }}
          >
            {extractRef(datosActuales).toUpperCase()}
          </Typography>
        </Box>
      )}

       {/* ── Control: Fecha ── */}
       <Box
         sx={{
           bgcolor: "white",
           borderRadius: "6px",
           display: "flex",
           alignItems: "center",
           boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
           flexShrink: 0,
         }}
       >
{!isHistoricalMode && (
            <DatePicker
              value={dayjs(filtroFecha)}
              onChange={(v: any) => {
                if (v && v.format) setFiltroFecha(v.format("YYYY-MM-DD") || getTodayStr());
              }}
              maxDate={dayjs()}
              localeText={{
                todayButtonLabel: 'Hoy'
              }}
              slots={{
                day: (props: PickersDayProps) => {
                  const dateStr = dayjs(props.day).format("YYYY-MM-DD");
                  const hasData = !!resumenFechas[dateStr];
                  const isEnviado = resumenFechas[dateStr] === "enviado";

                  return (
                    <Badge
                      key={props.day.toString()}
                      overlap="circular"
                      badgeContent={
                        hasData ? (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: isEnviado ? "#10b981" : "#f59e0b",
                              border: "1px solid white",
                            }}
                          />
                        ) : undefined
                      }
                      sx={{
                        "& .MuiBadge-badge": {
                          right: 8,
                          top: 8,
                        },
                      }}
                    >
                      <PickersDay {...props} />
                    </Badge>
                  );
                },
                actionBar: (props) => (
                  <PickersActionBar
                    {...props}
                    actions={['today']}
                    sx={{
                      '& .MuiButton-root': {
                        fontSize: '0.8rem',
                        py: 0.5,
                        px: 2,
                        minHeight: 32,
                      },
                      p: 0.5,
                      gap: 0.5,
                    }}
                  />
                ),
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: { xs: 150, sm: 180 },
                    "& .MuiInputBase-root": {
                      height: 40,
                      bgcolor: "transparent !important",
                      "& fieldset": { border: "none" },
                      "& .MuiInputBase-input": {
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: BRAND.text,
                        pl: 2,
                      },
                      "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                        color: BRAND.primary,
                        fontSize: 18,
                      },
                    },
                  },
                },
              }}
            />
          )}
         {isHistoricalMode && (
           <Button
             onClick={() => setIsHistoricalMode(false)}
             sx={{
               height: 40,
               px: 2,
               fontSize: "0.85rem",
               fontWeight: 800,
               color: BRAND.primary,
               textTransform: "none",
             }}
           >
             Volver a Fecha
           </Button>
         )}
       </Box>


       {/* ── Control: Buscador ── */}
       <TextField
         size="small"
         placeholder="Filtrar lote..."
         value={filtroReferencia}
         onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
           setFiltroReferencia(e.target.value)
         }
         slotProps={{
           input: {
             sx: {
               height: 40,
               fontWeight: 800,
               bgcolor: "white !important",
               color: BRAND.text,
               borderRadius: "6px",
               fontSize: "0.85rem",
               boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
               "& fieldset": { border: "none" },
               pl: 1,
             },
           },
         }}
         sx={{ width: { xs: 130, sm: 160 }, flexShrink: 0 }}
       />
       <Button
         onClick={() => setIsHistoricalMode(!isHistoricalMode)}
         startIcon={<LibraryBooksIcon sx={{ fontSize: 16 }} />}
         sx={{
           fontWeight: 900,
           borderRadius: "6px",
           textTransform: "none",
           color: "white",
           px: 2,
           height: 40,
           fontSize: "0.8rem",
           bgcolor: isHistoricalMode ? BRAND.primary : "#64748b",
           boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
           "&:hover": {
             bgcolor: isHistoricalMode ? BRAND.dark : "#475569",
           },
         }}
       >
         {isHistoricalMode ? "MODO HISTÓRICO" : "HISTÓRICO"}
       </Button>


      {/* ── Botones de acción ── */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        {isToday && hasChanges && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 900,
              borderRadius: "6px",
              background: "#d97706",
              color: "white",
              px: 2,
              height: 40,
              textTransform: "none",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              "&:hover": { background: "#b45309" },
            }}
          >
            Guardar
          </Button>
        )}
        {isToday && !isConfirmed && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            onClick={handleSend}
            disabled={saving || hasChanges}
            sx={{
              fontWeight: 900,
              borderRadius: "6px",
              background: BRAND.primary,
              color: "white",
              px: 2,
              height: 40,
              textTransform: "none",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,106,204,0.3)",
              "&:hover": { bgcolor: BRAND.dark },
              /* Botón de Guardar removido - Dashboard es ahora SOLO LECTURA */
            }}
          >
            Enviar
          </Button>
        )}

      </Stack>
    </Stack>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ pb: 4, fontFamily: MAIN_FONT }}>
        <>
          {portalTarget && createPortal(headerFiltersContent, portalTarget)}
          {loadingDate && (
            <LinearProgress
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
              }}
            />
          )}
          <Container maxWidth="xl" sx={{ mt: 3 }}>
            {!datosCurvas ? (
              <Paper sx={{ p: 10, textAlign: "center", borderRadius: 4 }}>
                <InventoryIcon
                  sx={{ fontSize: 72, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Cargando...
                </Typography>
              </Paper>
            ) : totalSheets === 0 ? (
              <Paper
                sx={{
                  p: 10,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: "#f8fafc",
                }}
              >
                <CalendarTodayIcon
                  sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Sin referencias hoy
                </Typography>
              </Paper>
            ) : (
              <Paper
                elevation={4}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                }}
              >
                <Tabs
                  value={sheetIndex}
                  onChange={(_, v) => setSheetIndex(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: "#fafafa",
                    borderBottom: "1px solid #e5e7eb",
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTabs-flexContainer": { gap: 0.5 },
                  }}
                >
                  {allSheets.map((sheet, i) => {
                    const tabFecha = (sheet as any).fechaCarga
                      ? dayjs((sheet as any).fechaCarga).format("DD/MM/YY")
                      : null;
                    return (
                      <Tab
                        key={i}
                        label={
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, lineHeight: 1 }}>
                            <Typography
                              sx={{
                                fontFamily: MONO_FONT,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                lineHeight: 1.2,
                                color: "inherit",
                              }}
                            >
                              {extractRef(sheet)}
                            </Typography>
                            {tabFecha && (
                              <Typography
                                sx={{
                                  fontSize: "0.6rem",
                                  fontWeight: 600,
                                  lineHeight: 1.1,
                                  color: sheetIndex === i ? BRAND.primary : "#9ca3af",
                                  letterSpacing: 0.2,
                                }}
                              >
                                {tabFecha}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          minHeight: tabFecha ? 48 : 36,
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          px: 2,
                          fontFamily: MONO_FONT,
                          transition: "all 0.2s ease",
                          color: sheetIndex === i ? BRAND.primary : "#6b7280",
                          bgcolor: sheetIndex === i ? "white" : "transparent",
                          border:
                            sheetIndex === i
                              ? "1px solid #e5e7eb"
                              : "1px solid transparent",
                          boxShadow:
                            sheetIndex === i
                              ? "0 1px 3px rgba(0,0,0,0.05)"
                              : "none",
                          "&.Mui-selected": {
                            color: BRAND.primary,
                            bgcolor: "white",
                            border: "1px solid #e5e7eb",
                          },
                          "&:hover": {
                            bgcolor: sheetIndex === i ? "white" : "#f3f4f6",
                          },
                        }}
                      />
                    );
                  })}
                </Tabs>
                {isPastDate && (
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      background:
                        "linear-gradient(90deg, #fffbeb 0%, #fff 100%)",
                      borderBottom: "1px solid #fde68a",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        bgcolor: "#fef3c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CalendarTodayIcon
                        sx={{ fontSize: 16, color: "#92400e" }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#92400e",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        letterSpacing: -0.1,
                      }}
                    >
                      Visualizando archivo histórico. Las modificaciones están
                      deshabilitadas.
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    height: "calc(100vh - 280px)",
                    minHeight: 400,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onPaste={handlePaste}
                >
                  <DataGrid
                    rows={filas}
                    columns={columnas}
                    slots={{
                      toolbar: () => (
                        <CustomToolbar
                          currentRef={
                            datosActuales
                              ? extractRef(datosActuales)
                              : undefined
                          }
                          onOpenSelector={() => setShowSelector(true)}
                        />
                      ),
                    }}
                    onCellClick={(params) =>
                      setFocusedCell({
                        rowId: String(params.id),
                        field: params.field,
                      })
                    }
                    processRowUpdate={(newRow: any) => {
                      if (!isToday) return newRow;
                      const oldRow = filas.find((r) => r.id === newRow.id);
                      if (oldRow) {
                        Object.keys(newRow).forEach((key) => {
                          if (
                            key.startsWith("val_") &&
                            newRow[key] !== oldRow[key]
                          )
                            handleCellEdit(String(newRow.id), key, newRow[key]);
                        });
                      }
                      return newRow;
                    }}
                    autoHeight={false}
                    sx={{
                      border: "none",
                      width: "100%",
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: "#fafafa",
                        borderTop: "1px solid #e5e7eb",
                        borderBottom: "2px solid #e5e7eb",
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 800,
                          color: "#6b7280",
                          fontSize: "0.7rem",
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                        },
                        "& .MuiDataGrid-columnSeparator": {
                          display: "none",
                        },
                      },
                      "& .MuiDataGrid-row": {
                        borderBottom: "none",
                        transition: "background-color 0.15s ease",
                        "&:hover": { bgcolor: alpha(BRAND.primary, 0.03) },
                      },
                      "& .MuiDataGrid-row:last-child": {
                        bgcolor: "transparent",
                        fontWeight: 800,
                        position: "sticky",
                        bottom: 0,
                        zIndex: 2,
                        "& .MuiDataGrid-cell": {
                          color: BRAND.primary,
                          fontSize: "0.9rem",
                        },
                      },
                      "& .MuiDataGrid-cell": {
                        borderColor: "#f3f4f6",
                        borderBottom: "1px solid #f3f4f6",
                        "&:focus": {
                          outline: `2px solid ${BRAND.primary}`,
                          outlineOffset: -2,
                        },
                        "&:focus-within": {
                          outline: `2px solid ${BRAND.primary}`,
                          outlineOffset: -2,
                        },
                      },
                      "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": {
                        borderBottom: "none",
                      },
                      "& .MuiDataGrid-withBorder": {
                        border: "none",
                      },
                      "& .MuiDataGrid-filler": {
                        borderTop: "none",
                      },
                      "& .MuiTablePagination-toolbar": {
                        borderBottom: "1px solid #f3f4f6",
                      },
                    }}
                  />
                </Box>
              </Paper>
            )}
          </Container>
          <CustomSelectionModal
            open={showSelector}
            onClose={() => setShowSelector(false)}
            onConfirm={(s) => {
              if (s.length > 0) {
                setSheetIndex(Number(s[0]));
                setShowSelector(false);
              }
            }}
            items={selectionItems}
            title="Lote"
            initialSelected={[sheetIndex]}
            labelKey="label"
          />
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </>
      </Box>
    </LocalizationProvider>
  );
};

export default DashboardPage;
