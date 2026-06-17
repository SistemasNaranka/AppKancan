import {
  memo,
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
  Paper,
  Snackbar,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";

import { useCurvas } from "../contexts/CurvasContext";
import DynamicLoadMatrix from "../components/DynamicLoadMatrix";
import type { DynamicLoadMatrixHandle } from "../components/DynamicLoadMatrix";

import { MAIN_FONT } from "./uploadPage/upload.constants";
import { UploadHeader } from "./uploadPage/UploadHeader";
import { LoadTypeAndRefBar } from "./uploadPage/LoadTypeAndRefBar";
import { ConfirmActionDialog } from "./uploadPage/ConfirmActionDialog";
import { useUploadActions } from "./uploadPage/useUploadActions";

type LoadType = "general" | "producto_a" | "producto_b";

const UploadPage = () => {
  const {
    datosCurvas,
    cargarDatosManuales,
    confirmarLoteConDatos,
    cambiarTalla,
    hasChanges,
    setHasChanges,
    celdasEditadas,
  } = useCurvas();

  const [loadType, setLoadType] = useState<LoadType>("general");
  const [showSuccess, setShowSuccess] = useState(false);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: "save",
  });
  const [pendingMatrixData, setPendingMatrixData] = useState<any>(null);
  const [dispatchStats, setDispatchStats] = useState<{
    tiendas: number;
    totalUnidades: number;
    columnas: number;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "warning" | "info" | "error";
  }>({ open: false, message: "", severity: "info" });
  const navigate = useNavigate();
  const matrixRef = useRef<DynamicLoadMatrixHandle>(null);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = document.getElementById("upload-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  const currentSheetId = useMemo(() => {
    if (!datosCurvas) return null;
    if (loadType === "general") return datosCurvas.matrizGeneral[0]?.id;
    return datosCurvas.productos[0]?.id;
  }, [datosCurvas, loadType]);

  const isConfirmed = useMemo(() => {
    if (!datosCurvas || !currentSheetId) return false;
    const sheet = [
      ...datosCurvas.matrizGeneral,
      ...datosCurvas.productos,
    ].find((s) => s.id === currentSheetId);
    return (sheet as any)?.estado === "confirmado";
  }, [datosCurvas, currentSheetId]);

  const currentData = useMemo(() => {
    if (!datosCurvas) return null;
    if (loadType === "general") return datosCurvas.matrizGeneral[0] || null;
    return datosCurvas.productos[0] || null;
  }, [datosCurvas, loadType]);

  const [matrixState, setMatrixState] = useState({ ref: "", total: 0 });
  const [, setMatrixReady] = useState(false);

  const handleMatrixChange = useCallback(
    (data: any) => {
      setPendingMatrixData(data);
      setMatrixState({
        ref: data.referencia || "",
        total: data.totalGeneral || 0,
      });
      if (data?.totalGeneral > 0) setHasChanges(true);
      setMatrixReady(true);
    },
    [setHasChanges],
  );

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextType: LoadType | null,
  ) => {
    if (nextType !== null) {
      setLoadType(nextType);
      setShowSuccess(false);
    }
  };

  const { summaryStats, handleSave, handleSendToDispatch } = useUploadActions({
    loadType,
    currentSheetId,
    currentData,
    pendingMatrixData,
    setPendingMatrixData,
    matrixState,
    hasChanges,
    setHasChanges,
    setSaving,
    setShowSuccess,
    setSnackbar,
    confirmDialog,
    setConfirmDialog,
    dispatchStats,
    setDispatchStats,
    cargarDatosManuales,
    confirmarLoteConDatos,
    navigate,
  });

  const hasValidRef = !!(
    pendingMatrixData?.referenciaBase?.trim() ||
    pendingMatrixData?.referencia?.trim() ||
    pendingMatrixData?.metadatos?.referencia?.trim() ||
    currentSheetId
  );
  const hasDataInTable = !!(
    (pendingMatrixData?.totalGeneral || 0) > 0 ||
    (currentData && (currentData as any).totalGeneral > 0)
  );
  const canEnableButtons = hasValidRef && hasDataInTable;

  const headerContent = (
    <UploadHeader
      matrixRef={matrixRef}
      loadType={loadType}
      isConfirmed={isConfirmed}
      hasChanges={hasChanges}
      saving={saving}
      canEnableButtons={canEnableButtons}
      onOpenSaveDialog={() =>
        setConfirmDialog({ open: true, action: "save" })
      }
      onOpenSendDialog={() =>
        setConfirmDialog({ open: true, action: "confirm_dispatch" })
      }
    />
  );

  return (
    <>
      {portalTarget && createPortal(headerContent, portalTarget)}
      <Box sx={{ pb: 4, fontFamily: MAIN_FONT }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Stack spacing={2.5}>
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
              <LoadTypeAndRefBar
                loadType={loadType}
                onLoadTypeChange={handleTypeChange}
                matrixRef={matrixRef}
              />

              <Box className="tour-curvas-matrix">
                <DynamicLoadMatrix
                  key={loadType}
                  ref={matrixRef}
                  type={loadType}
                  onChange={handleMatrixChange}
                  onCancel={() => {}}
                  onTallaChange={(oldTalla, newTalla) => {
                    if (currentData?.id) {
                      cambiarTalla(currentData.id, oldTalla, newTalla);
                    }
                  }}
                  setSnackbar={(s) => {
                    setShowSuccess(false);
                    setSnackbarState({
                      open: s.open,
                      message: s.message,
                      severity: s.severity,
                    });
                  }}
                />
              </Box>
            </Box>
          </Stack>

          <Snackbar
            open={showSuccess || !!snackbarState?.open}
            autoHideDuration={
              snackbarState?.severity === "error"
                ? 8000
                : snackbarState?.severity === "warning"
                  ? 3000
                  : 4000
            }
            onClose={() => {
              setShowSuccess(false);
              setSnackbarState({
                open: false,
                message: "",
                severity: "success",
              });
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => {
                setShowSuccess(false);
                setSnackbarState({
                  open: false,
                  message: "",
                  severity: "success",
                });
              }}
              severity={snackbarState?.severity || "success"}
              variant="filled"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                minWidth: 400,
              }}
            >
              <strong>
                {snackbarState?.open ? "AVISO:" : "OPERACIÓN EXITOSA:"}
              </strong>{" "}
              {snackbarState?.message ||
                "Los datos se han sincronizado correctamente."}
            </Alert>
          </Snackbar>

          <ConfirmActionDialog
            open={confirmDialog.open}
            action={confirmDialog.action}
            saving={saving}
            celdasEditadas={celdasEditadas}
            summaryStats={summaryStats}
            onClose={() =>
              setConfirmDialog({ ...confirmDialog, open: false })
            }
            onConfirmSave={handleSave}
            onConfirmSend={handleSendToDispatch}
          />

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
