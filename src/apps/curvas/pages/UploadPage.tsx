import {
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
  useLayoutEffect,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Button,
  Stack,
  Chip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  Zoom,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import { useCurvas } from "../contexts/CurvasContext";
import DynamicLoadMatrix from "../components/DynamicLoadMatrix";
import type { DynamicLoadMatrixHandle } from "../components/DynamicLoadMatrix";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";

import { useNavigate } from "react-router-dom";

const MAIN_FONT = "'Inter', sans-serif";

// ─────────────────────────────────────────────
// Custom Components for Performance
// ─────────────────────────────────────────────
const LocalControlledInput = ({
  value,
  onChange,
  placeholder,
  sx,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  sx?: any;
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  // Sync prop changes that come from outside
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      sx={sx}
    />
  );
};

/**
 * Página de Carga de Datos - Versión de Matriz Directa
 * Permite la carga mediante copia/pega directo de Excel.
 */
const UploadPage = () => {
  const {
    datosCurvas,
    cargarDatosManuales,
    guardarCambios,
    confirmarLote,
    hasChanges,
    setHasChanges,
    celdasEditadas,
  } = useCurvas();

  // Tipo de carga seleccionado (Default: Matriz General)
  const [loadType, setLoadType] = useState<
    "general" | "producto_a" | "producto_b"
  >("general");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: "save",
  });
  const [pendingMatrixData, setPendingMatrixData] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "warning" | "info" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const navigate = useNavigate();
  const matrixRef = useRef<DynamicLoadMatrixHandle>(null);

  // Estado para el portal del layout global
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = document.getElementById("upload-page-header-portal");
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  // Determinar si hay datos cargados para la vista actual
  const currentSheetId = useMemo(() => {
    if (!datosCurvas) return null;
    if (loadType === "general") return datosCurvas.matrizGeneral[0]?.id;
    return datosCurvas.productos[0]?.id;
  }, [datosCurvas, loadType]);

  const isConfirmed = useMemo(() => {
    if (!datosCurvas || !currentSheetId) return false;
    const sheet = [...datosCurvas.matrizGeneral, ...datosCurvas.productos].find(
      (s) => s.id === currentSheetId,
    );
    return (sheet as any)?.estado === "confirmado";
  }, [datosCurvas, currentSheetId]);

  const currentData = useMemo(() => {
    if (!datosCurvas) return null;
    if (loadType === "general") return datosCurvas.matrizGeneral[0] || null;
    return datosCurvas.productos[0] || null;
  }, [datosCurvas, loadType]);

  const summaryStats = useMemo(() => {
    // Prioridad: Usar datos pendientes (locales en la matriz) si existen, de lo contrario usar datos del contexto
    const data = pendingMatrixData || currentData;
    if (!data) return { tiendas: 0, totalUnidades: 0, columnas: 0 };

    const filas = data.filas || [];
    const totalUnidades =
      typeof data.totalGeneral === "number"
        ? data.totalGeneral
        : filas.reduce((acc: number, f: any) => acc + (f.total || 0), 0);

    return {
      tiendas: filas.length,
      totalUnidades: totalUnidades,
      columnas:
        (data as any).curvas?.length || (data as any).tallas?.length || 0,
    };
  }, [currentData, pendingMatrixData]);

  const handleSave = async (silent: boolean | any = false) => {
    const isSilent = silent === true;

    // Ya no cerramos inmediatamente para permitir ver la animación de carga (Bug 1 Re-fix)
    setSaving(true);

    try {
      if (!pendingMatrixData) {
        setSaving(false);
        if (!isSilent) setConfirmDialog({ open: false, action: "save" });
        return false;
      }

      // Validación de Referencia para TODOS los tipos (Bug Fix: Era solo para productos)
      const refActual =
        pendingMatrixData.referencia?.trim() ||
        pendingMatrixData.referenciaBase?.trim() ||
        pendingMatrixData.metadatos?.referencia?.trim();

      if (!refActual || refActual === "SIN REF") {
        setSnackbar({
          open: true,
          message: "La REFERENCIA PRINCIPAL es obligatoria para guardar",
          severity: "warning",
        });
        setSaving(false);
        if (!isSilent) setConfirmDialog({ open: false, action: "save" });
        return false;
      }

      // Usar la referencia validada directamente (Bug Fix: Evitar fallos de extractRef en datos nuevos)
      let refFinal = refActual;

      // Asegurar que si hay color, se incluya en la referencia del log para que sea recuperable (Bug 2 Fix para Borradores)
      const colorInput =
        pendingMatrixData.color || pendingMatrixData.metadatos?.color;
      if (
        colorInput &&
        colorInput !== "—" &&
        !refFinal.includes("|") &&
        refFinal !== "SIN REF"
      ) {
        refFinal = `${refFinal} | ${colorInput}`;
      }

      // Preparar datos de log para cada tienda ANTES de cargar los datos
      let datosLog: any[] = [];

      if (pendingMatrixData.filas && pendingMatrixData.filas.length > 0) {
        const plantilla: "matriz_general" | "productos" =
          loadType === "general" ? "matriz_general" : "productos";
        const dataKey = loadType === "general" ? "curvas" : "tallas";
        const columnas =
          loadType === "general"
            ? pendingMatrixData.curvas || []
            : pendingMatrixData.tallas || [];

        const now = Date.now();
        datosLog = pendingMatrixData.filas
          .filter((fila: any) => fila.tienda && fila.tienda.id)
          .map((fila: any, index: number) => {
            const cantidadTalla: any[] = [];
            const datosTienda = fila[dataKey] || {};

            columnas.forEach((col: string) => {
              const celda = datosTienda[col];
              if (celda && celda.valor > 0) {
                cantidadTalla.push({
                  talla: parseFloat(col),
                  cantidad: celda.valor,
                });
              }
            });

            return {
              tiendaId: fila.tienda.id,
              tiendaNombre: fila.tienda.nombre,
              plantilla,
              cantidadTalla,
              referencia: refFinal, // EL LOG DEBE TENER LA REFERENCIA REAL
              fecha: new Date(now + index).toISOString(),
            };
          });
      }

      // Clonar y asegurar que la referencia esté en el lugar correcto para el contexto
      const dataToSave = {
        ...pendingMatrixData,
        referencia: refFinal,
        referenciaBase: refFinal,
        nombreHoja: refFinal,
      };

      if (loadType !== "general") {
        if (!dataToSave.metadatos)
          dataToSave.metadatos = { referencia: refFinal };
        else dataToSave.metadatos.referencia = refFinal;
      }

      const tipoArchivo =
        loadType === "general" ? "matriz_general" : "detalle_producto_a";

      cargarDatosManuales(dataToSave, tipoArchivo);
      setPendingMatrixData(null);

      // Guardar cambios con los datos de log
      const ok = await guardarCambios(datosLog);

      if (ok) {
        if (!isSilent) {
          setConfirmDialog({ open: false, action: "save" }); // Cerrar SOLO tras éxito para que se vea la animación
          setShowSuccess(true);
          setSnackbar({
            open: true,
            message: "Datos guardados correctamente como Borrador",
            severity: "success",
          });
        }
        setHasChanges(false); // Limpiar cambios tras guardar con éxito
      } else {
        if (!isSilent) {
          setConfirmDialog({ open: false, action: "save" });
          setSnackbar({
            open: true,
            message: "ERROR CRÍTICO: No se pudo guardar en la base de datos",
            severity: "error",
          });
        }
      }

      return ok ? dataToSave.id : false;
    } catch (err) {
      console.error("Error en handleSave:", err);
      if (!isSilent) {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSnackbar({
          open: true,
          message: `Error inesperado: ${err instanceof Error ? err.message : "Consulte la consola"}`,
          severity: "error",
        });
      }
      return false;
    } finally {
      if (!isSilent) setSaving(false);
    }
  };

  const handleSendToDispatch = async () => {
    // Validación 1: Verificar que haya referencia
    const refActual =
      matrixState.ref?.trim() ||
      pendingMatrixData?.referenciaBase?.trim() ||
      pendingMatrixData?.referencia?.trim() ||
      pendingMatrixData?.metadatos?.referencia?.trim();

    if (!refActual && !currentSheetId) {
      setSnackbar({
        open: true,
        message: "⚠️ Debes ingresar una REFERENCIA antes de enviar a despacho",
        severity: "warning",
      });
      return;
    }

    // Validación 2: Verificar que haya datos en la tabla
    const totalActual =
      matrixState.total ||
      pendingMatrixData?.totalGeneral ||
      0 ||
      (currentData && (currentData as any).totalGeneral > 0
        ? (currentData as any).totalGeneral
        : 0);

    if (totalActual <= 0) {
      setSnackbar({
        open: true,
        message:
          "⚠️ Debes ingresar al menos un valor en las celdas de las tiendas",
        severity: "warning",
      });
      return;
    }

    setSaving(true);

    try {
      let ok = true;
      let targetId = currentSheetId;

      // Si hay cambios pendientes o es una matriz nueva (pendingMatrixData),
      // DEBEMOS guardar los logs antes de confirmar para que aparezcan en Despacho
      if (hasChanges || pendingMatrixData) {
        const successSaveId = await handleSave(true); // Modo silencioso para no cerrar el diálogo prematuramente
        if (!successSaveId) {
          // Si el guardado falló, handleSave ya habrá hecho setSaving(false) en su finally
          setSnackbar({
            open: true,
            message:
              "❌ Error al guardar los datos. No se puede enviar a despacho",
            severity: "error",
          });
          return; // Detener si el guardado falló
        }
        // Usar el ID dinámico fresco para evitar el race condition del context! (Bug Fix)
        targetId =
          typeof successSaveId === "string"
            ? successSaveId
            : `sheet-${pendingMatrixData?.referenciaBase || pendingMatrixData?.referencia || pendingMatrixData?.metadatos?.referencia || refActual || "NUEVA"}`;

        // NO desactivamos saving aquí, permitimos que handleSendToDispatch continúe
        // La animación debe persistir hasta el final del flujo de envío
        setSaving(true);
      } else {
        targetId =
          currentSheetId ||
          `sheet-${pendingMatrixData?.referenciaBase || pendingMatrixData?.referencia || pendingMatrixData?.metadatos?.referencia || refActual || "NUEVA"}`;
      }

      if (!targetId) {
        setSnackbar({
          open: true,
          message: "❌ No se pudo generar el Lote de Despacho",
          severity: "error",
        });
        return;
      }

      ok = await confirmarLote(loadType, targetId);

      setConfirmDialog({ open: false, action: "confirm_dispatch" });

      if (ok) {
        setShowSuccess(true);
        setSnackbar({
          open: true,
          message: `✅ Despacho enviado exitosamente para ${refActual || targetId}`,
          severity: "success",
        });
        // Redirigir a envíos después de éxito
        setTimeout(() => navigate("/curvas/envios"), 2500);
      } else {
        setSnackbar({
          open: true,
          message: "❌ Error al confirmar el lote de despacho",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error en handleSendToDispatch:", err);
      setConfirmDialog({ open: false, action: "confirm_dispatch" });
      setSnackbar({
        open: true,
        message: `❌ Error inesperado: ${err instanceof Error ? err.message : "Consulte la consola"}`,
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextType: "general" | "producto_a" | "producto_b" | null,
  ) => {
    if (nextType !== null) {
      setLoadType(nextType);
      setShowSuccess(false);
      // Resetear estado de validación al cambiar de tipo
      setMatrixState({ ref: "", total: 0 });
      setMatrixReady(false);
      setPendingMatrixData(null);
    }
  };

  const handleMatrixChange = useCallback((data: any) => {
    setPendingMatrixData(data);
    if (data?.totalGeneral > 0) {
      setHasChanges(true);
    }
  }, []);

  // Estado para forzar re-render cuando cambie la referencia en el hijo
  const [matrixState, setMatrixState] = useState({ ref: "", total: 0 });
  const [matrixReady, setMatrixReady] = useState(false);

  // Sincronizar estado del ref para validaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const currentRef = matrixRef.current;
      if (currentRef) {
        const ref = (currentRef as any).referencia || "";
        const total = (currentRef as any).grandTotal || 0;
        setMatrixState((prev) => {
          if (prev.ref === ref && prev.total === total) return prev;
          return { ref, total };
        });
        setMatrixReady(true);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Lógica de habilitación de botones: referencia presente + datos con valores
  // IMPORTANTE: currentSheetId NO debe habilitar botones si no hay datos reales
  const currentDataTotal = (currentData as any)?.totalGeneral || 0;

  const hasValidRef = !!(
    matrixState.ref?.trim() ||
    pendingMatrixData?.referenciaBase?.trim() ||
    pendingMatrixData?.referencia?.trim() ||
    pendingMatrixData?.metadatos?.referencia?.trim()
  );

  const hasDataInTable =
    matrixState.total > 0 ||
    (pendingMatrixData?.totalGeneral || 0) > 0 ||
    currentDataTotal > 0;

  const canEnableButtons = hasValidRef && hasDataInTable;

  // Contenido insertado en el Header Global (fondo principal #004680)
  const headerContent = (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{ height: "100%" }}
    >
      <Divider
        orientation="vertical"
        flexItem
        sx={{ bgcolor: "rgba(255,255,255,0.15)", my: 1 }}
      />

      {/* ── Controles de Matriz ── */}
      <Button
        variant="text"
        size="small"
        startIcon={<PlaylistAddIcon sx={{ color: "#6ee7b7" }} />}
        onClick={() => matrixRef.current?.addRow()}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          textTransform: "none",
          px: 1.75,
          color: "white",
          height: 32,
          fontSize: "0.75rem",
          bgcolor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.18)",
            borderColor: "rgba(255,255,255,0.3)",
          },
        }}
      >
        + Tienda
      </Button>

      <Button
        variant="text"
        size="small"
        startIcon={<AddCircleOutlineIcon sx={{ color: "#93c5fd" }} />}
        onClick={() => matrixRef.current?.addColumn()}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          textTransform: "none",
          px: 1.75,
          color: "white",
          height: 32,
          fontSize: "0.75rem",
          bgcolor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.18)",
            borderColor: "rgba(255,255,255,0.3)",
          },
        }}
      >
        + {loadType === "general" ? "Curva" : "Talla"}
      </Button>

      <Tooltip title="Vacía todos los valores numéricos">
        <Button
          variant="text"
          size="small"
          startIcon={<DeleteIcon sx={{ color: "#fca5a5" }} />}
          onClick={() => matrixRef.current?.clearMatrix()}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            textTransform: "none",
            px: 1.75,
            color: "rgba(255,255,255,0.8)",
            height: 32,
            fontSize: "0.75rem",
            bgcolor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            "&:hover": {
              bgcolor: "rgba(239,68,68,0.2)",
              borderColor: "rgba(252,165,165,0.4)",
              color: "white",
            },
          }}
        >
          Vaciar
        </Button>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ bgcolor: "rgba(255,255,255,0.15)", my: 1 }}
      />

      {/* ── Estado + Acciones finales ── */}
      {(matrixRef.current?.grandTotal || 0) > 0 && (
        <Chip
          label={`${(matrixRef.current?.grandTotal || 0).toLocaleString()} uds`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.68rem",
            height: 24,
            bgcolor: "rgba(110,231,183,0.2)",
            color: "#6ee7b7",
            border: "1px solid rgba(110,231,183,0.35)",
          }}
        />
      )}

      {isConfirmed ? (
        <Chip
          label="CONFIRMADO"
          size="small"
          icon={<CheckCircleIcon />}
          sx={{
            height: 24,
            fontSize: "0.65rem",
            bgcolor: "rgba(74,222,128,0.15)",
            color: "#4ade80",
            fontWeight: 800,
            border: "1px solid rgba(74,222,128,0.3)",
            "& .MuiChip-icon": { color: "#4ade80", fontSize: "0.9rem" },
          }}
        />
      ) : (
        <Chip
          label={hasChanges ? "PENDIENTE" : "BORRADOR"}
          size="small"
          icon={hasChanges ? <WarningAmberIcon /> : undefined}
          sx={{
            height: 24,
            fontSize: "0.65rem",
            bgcolor: hasChanges
              ? "rgba(251,191,36,0.2)"
              : "rgba(255,255,255,0.08)",
            color: hasChanges ? "#fbbf24" : "rgba(255,255,255,0.6)",
            fontWeight: 800,
            border: `1px solid ${hasChanges ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.15)"}`,
            "& .MuiChip-icon": { color: "#fbbf24", fontSize: "0.85rem" },
          }}
        />
      )}

      {/* Guardar — outlined fantasma */}
      <Tooltip
        title={
          isConfirmed
            ? "Ya está confirmado"
            : !hasValidRef && !hasDataInTable
              ? "Ingresa referencia y datos para habilitar"
              : !hasValidRef
                ? "Ingresa una referencia para habilitar"
                : !hasDataInTable
                  ? "Ingresa datos en las celdas para habilitar"
                  : ""
        }
      >
        <span>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              saving ? (
                <HistoryIcon
                  sx={{
                    animation: "spin 1s linear infinite",
                    color: "#fbbf24",
                  }}
                />
              ) : (
                <SaveIcon sx={{ color: "#fbbf24" }} />
              )
            }
            onClick={() => setConfirmDialog({ open: true, action: "save" })}
            disabled={saving || !canEnableButtons || isConfirmed}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              textTransform: "none",
              px: 2,
              height: 32,
              fontSize: "0.75rem",
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.6)",
                bgcolor: "rgba(255,255,255,0.16)",
                color: "white",
              },
              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.25)",
                borderColor: "rgba(255,255,255,0.12)",
                bgcolor: "transparent",
              },
            }}
          >
            Guardar
          </Button>
        </span>
      </Tooltip>

      {/* Enviar — CTA principal (blanco sólido = máxima jerarquía) */}
      <Tooltip
        title={
          isConfirmed
            ? "Ya está confirmado"
            : !hasValidRef && !hasDataInTable
              ? "Ingresa referencia y datos para habilitar"
              : !hasValidRef
                ? "Ingresa una referencia para habilitar"
                : !hasDataInTable
                  ? "Ingresa datos en las celdas para habilitar"
                  : ""
        }
      >
        <span>
          <Button
            variant="contained"
            size="small"
            startIcon={
              saving ? (
                <HistoryIcon
                  sx={{
                    animation: "spin 1s linear infinite",
                    color: "#004680",
                  }}
                />
              ) : (
                <SendIcon sx={{ color: "#004680" }} />
              )
            }
            onClick={() =>
              setConfirmDialog({ open: true, action: "confirm_dispatch" })
            }
            disabled={saving || !canEnableButtons || isConfirmed}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              textTransform: "none",
              px: 2.5,
              height: 32,
              fontSize: "0.75rem",
              bgcolor: "white",
              color: "#004680",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              "&:hover": {
                bgcolor: "#e6f4ff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.35)",
              },
            }}
          >
            Enviar a Despacho
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );

  return (
    <>
      {portalTarget && createPortal(headerContent, portalTarget)}
      <Box sx={{ pb: 4, fontFamily: MAIN_FONT }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Stack spacing={2.5}>
            {/* Renderiza local si no existe el portal */}
            {!portalTarget && (
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 3,
                  p: 1,
                  background:
                    "linear-gradient(135deg, #017ce1 0%, #0262b0 100%)",
                  position: "sticky",
                  top: 0,
                  zIndex: 1100,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                  overflowX: "auto",
                }}
              >
                {headerContent}
              </Paper>
            )}

            <Box
              sx={{
                flexGrow: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {/* Controles de Tipo de Carga y Referencia */}
              <Paper
                elevation={0}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 2.5,
                  bgcolor: "white",
                  border: "1px solid rgba(0,106,204,0.15)",
                  borderRadius: 3,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
                  mb: 1,
                }}
              >
                <ToggleButtonGroup
                  value={loadType}
                  exclusive
                  onChange={handleTypeChange}
                  size="small"
                  sx={{
                    bgcolor: "rgba(0,106,204,0.06)",
                    p: 0.5,
                    borderRadius: 2.5,
                    "& .MuiToggleButton-root": {
                      px: 3,
                      py: 0.75,
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      border: "none",
                      borderRadius: 2,
                      color: "#006ACC",
                      transition: "all 0.2s ease-in-out",
                      "&.Mui-selected": {
                        bgcolor: "white",
                        color: "#006ACC",
                        boxShadow: "0 2px 8px rgba(0,106,204,0.15)",
                      },
                      "&:hover:not(.Mui-selected)": {
                        bgcolor: "rgba(0,106,204,0.1)",
                      },
                    },
                  }}
                >
                  <ToggleButton value="general">GENERAL</ToggleButton>
                  <ToggleButton value="producto_a">PRODUCTOS</ToggleButton>
                </ToggleButtonGroup>

                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: "rgba(0,106,204,0.1)",
                    mx: 0.5,
                    height: 32,
                    alignSelf: "center",
                  }}
                />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={900}
                    sx={{
                      color: "#006ACC",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    REF:
                  </Typography>
                  <LocalControlledInput
                    value={matrixRef.current?.referencia || ""}
                    onChange={(val) =>
                      matrixRef.current?.setReferencia(val.toUpperCase())
                    }
                    placeholder="EJ: REF-78124"
                    sx={{
                      width: 180,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        height: 38,
                        transition: "all 0.2s ease",
                        "& fieldset": {
                          borderColor: "#94a3b8",
                          borderWidth: 1.5,
                        },
                        "&:hover": { bgcolor: "#ffffff" },
                        "&:hover fieldset": {
                          borderColor: "#64748b",
                          borderWidth: 1.5,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#006ACC",
                          borderWidth: 2,
                        },
                        "&.Mui-focused": {
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 8px rgba(0,106,204,0.15)",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        padding: "8px 14px",
                        color: "#1e293b",
                        "&::placeholder": {
                          color: "#94a3b8",
                          fontWeight: 500,
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Box>

                {loadType !== "general" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      sx={{
                        color: "#006ACC",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      COLOR:
                    </Typography>
                    <LocalControlledInput
                      value={matrixRef.current?.color || ""}
                      onChange={(val) => matrixRef.current?.setColor(val)}
                      placeholder="NEGRO MATE"
                      sx={{
                        width: 160,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          height: 38,
                          transition: "all 0.2s ease",
                          "& fieldset": {
                            borderColor: "#94a3b8",
                            borderWidth: 1.5,
                          },
                          "&:hover": { bgcolor: "#ffffff" },
                          "&:hover fieldset": {
                            borderColor: "#64748b",
                            borderWidth: 1.5,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#006ACC",
                            borderWidth: 2,
                          },
                          "&.Mui-focused": {
                            bgcolor: "#ffffff",
                            boxShadow: "0 2px 8px rgba(0,106,204,0.15)",
                          },
                        },
                        "& .MuiOutlinedInput-input": {
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          padding: "8px 14px",
                          color: "#1e293b",
                          "&::placeholder": {
                            color: "#94a3b8",
                            fontWeight: 500,
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </Box>
                ) : null}
              </Paper>

              <DynamicLoadMatrix
                key={loadType}
                ref={matrixRef}
                type={loadType}
                onChange={handleMatrixChange}
                onCancel={() => {}}
              />
            </Box>
          </Stack>

          {/* ── SNACKBAR Y DIALOGS ── */}
          <Snackbar
            open={showSuccess}
            autoHideDuration={4000}
            onClose={() => setShowSuccess(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setShowSuccess(false)}
              severity="success"
              variant="filled"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                minWidth: 400,
              }}
            >
              <strong>OPERACIÓN EXITOSA:</strong> Los datos se han sincronizado
              correctamente.
            </Alert>
          </Snackbar>

          {/* DIÁLOGO DE CONFIRMACIÓN AVANZADO (Dashboard Migration) */}
          <Dialog
            open={confirmDialog.open}
            onClose={() =>
              !saving && setConfirmDialog({ ...confirmDialog, open: false })
            }
            maxWidth="sm"
            fullWidth
            TransitionComponent={Zoom}
            PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
          >
            <Box
              sx={{
                p: 3,
                background:
                  confirmDialog.action === "confirm_dispatch"
                    ? "linear-gradient(135deg, #065f46, #059669)"
                    : "linear-gradient(135deg, #1e3a8a, #2563eb)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {confirmDialog.action === "confirm_dispatch" ? (
                  <LocalShippingIcon sx={{ fontSize: 28 }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 28 }} />
                )}
                <Typography variant="h6" fontWeight={900}>
                  {confirmDialog.action === "confirm_dispatch"
                    ? "CONFIRMAR ENVÍO A DESPACHO"
                    : "APLICAR CAMBIOS"}
                </Typography>
              </Stack>
              {!saving ? (
                <IconButton
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, open: false })
                  }
                  sx={{ color: "white" }}
                >
                  <CloseIcon />
                </IconButton>
              ) : null}
            </Box>

            <DialogContent sx={{ py: 3 }}>
              {confirmDialog.action === "confirm_dispatch" ? (
                <Stack spacing={3}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Estás a punto de enviar estos datos al Sistema de Despacho.
                    Verifica el resumen:
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h4" fontWeight={900} color="#15803d">
                        {summaryStats.tiendas}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#166534"
                        fontWeight={800}
                      >
                        TIENDAS
                      </Typography>
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h4" fontWeight={900} color="#1d4ed8">
                        {summaryStats.totalUnidades.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#1e40af"
                        fontWeight={800}
                      >
                        UNIDADES
                      </Typography>
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#faf5ff",
                        border: "1px solid #e9d5ff",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h4" fontWeight={900} color="#7c3aed">
                        {summaryStats.columnas}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#6d28d9"
                        fontWeight={800}
                      >
                        TALLAS
                      </Typography>
                    </Paper>
                  </Stack>
                  <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Esta acción informará al equipo de despacho y no se puede
                    deshacer.
                  </Alert>
                </Stack>
              ) : (
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ textAlign: "center" }}
                >
                  {celdasEditadas.length > 0
                    ? `¿Deseas guardar los ${celdasEditadas.length} cambios realizados en la matriz?`
                    : "¿Deseas confirmar y guardar la información ingresada en la matriz?"}
                </Typography>
              )}
            </DialogContent>

            {saving && <LinearProgress />}

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, open: false })
                }
                disabled={saving}
                sx={{ fontWeight: 800 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={
                  confirmDialog.action === "confirm_dispatch"
                    ? handleSendToDispatch
                    : handleSave
                }
                disabled={saving}
                startIcon={
                  saving ? (
                    <HistoryIcon
                      sx={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : confirmDialog.action === "confirm_dispatch" ? (
                    <SendIcon />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
                sx={{
                  borderRadius: 1.5,
                  px: 4,
                  fontWeight: 900,
                  textTransform: "none",
                  bgcolor:
                    confirmDialog.action === "confirm_dispatch"
                      ? "#059669"
                      : "#2563eb",
                }}
              >
                {saving ? "PROCESANDO..." : "CONFIRMAR"}
              </Button>
            </DialogActions>
          </Dialog>
          <style>
            {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
          </style>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: "100%", borderRadius: 2, fontWeight: 700 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </>
  );
};

export default memo(UploadPage);
