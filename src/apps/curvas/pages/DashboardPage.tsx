// Dashboard de curvas: vista paginada por hojas/lotes con DataGrid editable, filtros y modo histórico.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Container,
  LinearProgress,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InventoryIcon from "@mui/icons-material/Inventory";
import dayjs from "dayjs";
import "dayjs/locale/es";

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";

import { useCurvas } from "../contexts/CurvasContext";
import { getResumenFechasCurvas } from "../api/directus/read";
import CustomSelectionModal, {
  SelectionItem,
} from "../../../shared/components/selectionmodal/CustomSelectionModal";

import { BRAND, MAIN_FONT, getTodayStr } from "./dashboardPage/dashboard.constants";
import { buildDashboardColumns } from "./dashboardPage/buildDashboardColumns";
import { useDashboardRows } from "./dashboardPage/useDashboardRows";
import { useDashboardPaste } from "./dashboardPage/useDashboardPaste";
import { DashboardHeaderFilters } from "./dashboardPage/DashboardHeaderFilters";
import { SheetTabs } from "./dashboardPage/SheetTabs";
import { DashboardDataGrid } from "./dashboardPage/DashboardDataGrid";

dayjs.locale("es");

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    datosCurvas,
    permissions,
    editarCelda,
    cambiarTalla,
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

  const [resumenFechas, setResumenFechas] = useState<
    Record<string, "pendiente" | "enviado">
  >({});

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
              (a, b) => new Date(b).getTime() - new Date(a).getTime(),
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
  const isPastDate = useMemo(
    () => filtroFecha < getTodayStr(),
    [filtroFecha],
  );

  useEffect(() => {
    setLoadingDate(true);
    setSheetIndex(0);
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
      if (
        filtroReferencia &&
        !refFull.includes(filtroReferencia.toUpperCase())
      )
        return false;
      return true;
    });
  }, [datosCurvas, extractRef, filtroReferencia]);

  const datosActuales = useMemo(
    () => allSheets[sheetIndex] || null,
    [allSheets, sheetIndex],
  );
  const totalSheets = allSheets.length;
  const selectionItems = useMemo(
    (): SelectionItem[] =>
      allSheets.map((s, idx) => ({
        id: idx,
        label: extractRef(s),
        description: `${s.filas.length} Establecimientos · ${
          "curvas" in s
            ? (s as any).curvas.length
            : (s as any).tallas.length
        } Tallas`,
        category: "curvas" in s ? "Matriz" : "Producto",
      })),
    [allSheets, extractRef],
  );

  const columnas = useMemo(
    () =>
      buildDashboardColumns({
        datosActuales,
        canEdit: permissions.canEdit,
        isToday,
        cambiarTalla,
      }),
    [datosActuales, permissions.canEdit, isToday, cambiarTalla],
  );

  const filas = useDashboardRows(datosActuales);

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

  const handlePaste = useDashboardPaste({
    isToday,
    canEdit: permissions.canEdit,
    focusedCell,
    datosActuales,
    columnas,
    filas,
    editarCelda,
    setSnackbar,
  });

  const handleSave = () => {
    setSnackbar({
      open: true,
      message:
        "Vista de solo lectura. Edita desde la página de Carga si es necesario.",
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ pb: 4, fontFamily: MAIN_FONT }}>
        <>
          {portalTarget &&
            createPortal(
              <DashboardHeaderFilters
                isPastDate={isPastDate}
                datosActuales={datosActuales}
                extractRef={extractRef}
                setShowSelector={setShowSelector}
                isHistoricalMode={isHistoricalMode}
                setIsHistoricalMode={setIsHistoricalMode}
                filtroFecha={filtroFecha}
                setFiltroFecha={setFiltroFecha}
                resumenFechas={resumenFechas}
                filtroReferencia={filtroReferencia}
                setFiltroReferencia={setFiltroReferencia}
                isToday={isToday}
                hasChanges={hasChanges}
                saving={saving}
                isConfirmed={isConfirmed}
                handleSave={handleSave}
                handleSend={handleSend}
              />,
              portalTarget,
            )}
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
                className="tour-curvas-datagrid"
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
                <SheetTabs
                  allSheets={allSheets}
                  sheetIndex={sheetIndex}
                  setSheetIndex={setSheetIndex}
                  extractRef={extractRef}
                />
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
                <DashboardDataGrid
                  filas={filas}
                  columnas={columnas}
                  isToday={isToday}
                  currentRef={
                    datosActuales ? extractRef(datosActuales) : undefined
                  }
                  onOpenSelector={() => setShowSelector(true)}
                  onCellClick={(rowId, field) =>
                    setFocusedCell({ rowId, field })
                  }
                  onCellEdit={handleCellEdit}
                  onPaste={handlePaste}
                />
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
