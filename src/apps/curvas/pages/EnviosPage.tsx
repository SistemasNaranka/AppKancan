/** @jsxImportSource react */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, Tabs, Tab, Snackbar, Alert, LinearProgress, Stack } from "@mui/material";
import { useCurvas } from "../contexts/CurvasContext";
import { useAuth } from "@/auth/hooks/useAuth";
import dayjs, { type Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

// Configuración y Utils
import { CATEGORY_CONFIG, type ConfirmedEntry } from "./EnviosPage.utils";
import { useEnviosKeyboard, useEnviosValidation } from "./useEnviosLogic";

// Módulos Extraídos
import { EnviosPageHeader } from "./EnviosPageHeader";
import { EnviosPageEmptyState } from "./EnviosPageEmptyState";
import { EnviosDataTable } from "./EnviosDataTable";
import { useEnviosDataSync } from "./useEnviosDataSync";
import { useConfirmedEntries } from "./useConfirmedEntries";
import { useEnviosHydration } from "./useEnviosHydration";
import { useEnviosSubmit } from "./useEnviosSubmit";

import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/900.css";
import "@fontsource/roboto-mono/700.css";

dayjs.locale("es");

const EnviosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    datosCurvas, actualizarValorValidacion, userRole, lastLogsUpdate,
    extractRef, bloqueosActivos, intentarBloquear, desmarcarTienda,
    validationData, setValidationData, tiendasDict,
  } = useCurvas();

  const [selectedEntry, setSelectedEntry] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "warning" | "info" | "error" }>({ open: false, message: "", severity: "info" });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<Dayjs | null>(dayjs());
  const [filtroReferencia, setFiltroReferencia] = useState<string>("");
  const [activeCell, setActiveCell] = useState<{ filaId: string; col: string; sheetId: string; } | null>(null);
  const [sentEntryKeys, setSentEntryKeys] = useState<Set<string>>(new Set());
  
  const myScannedTiendasRef = useRef<Record<string, Set<string>>>({});
  const refTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById("envios-page-header-portal");
    if (el) setPortalTarget(el);
  }, []);

  // 1. Hook de Sincronización (WebSockets y API)
  const { logCurvasData, enviosCurvasData, loadingLogCurvas, fechasConDatos } = useEnviosDataSync({
    filtroFecha, filtroReferencia, userRole, lastLogsUpdate
  });

  // 2. Hook de Transformación de Datos
  const { confirmedEntries, visibleEntries } = useConfirmedEntries({
    logCurvasData, sentEntryKeys, validationData, tiendasDict, filtroReferencia
  });

  const current = visibleEntries[selectedEntry] || null;

  // 3. Hook de Hidratación y Sincronización Cruzada
  useEnviosHydration({
    current, enviosCurvasData, extractRef, setValidationData, myScannedTiendasRef
  });

  const _validationResults = useEnviosValidation({ current, validationData });

  // 4. Hook de Lógica de Guardado
  const { isSending, isSaving, handleEnviarADespacho } = useEnviosSubmit({
    current, user, validationData, myScannedTiendasRef, datosCurvas,
    tiendasDict, logCurvasData, extractRef, setSnackbar
  });

  const handleActualizarValorValidacion = useCallback((sheetId: string, filaId: string, columna: string, valor: number, codigoBarra?: string | null) => {
    if (!myScannedTiendasRef.current[sheetId]) myScannedTiendasRef.current[sheetId] = new Set<string>();
    myScannedTiendasRef.current[sheetId].add(filaId);
    actualizarValorValidacion(sheetId, filaId, columna, valor, codigoBarra);
  }, [actualizarValorValidacion]);

  useEnviosKeyboard({
    current, activeCell, actualizarValorValidacion: handleActualizarValorValidacion,
    setActiveCell, validationData, bloqueosActivos, user, confirmedEntries,
    safeIndex: selectedEntry, setSelectedEntry, setSnackbar, extractRef, intentarBloquear,
  });

  const getTabLabel = (entry: ConfirmedEntry, index: number) => {
    let ref = (entry.label || "").replace("REF: ", "").replace("Plantilla de Producto\nREF: ", "").trim();
    if (!ref || ref.toUpperCase() === "SIN REF") return `Lote ${index + 1} (${entry.category === "general" ? "Textil" : "Calzado"})`;
    const catName = CATEGORY_CONFIG[entry.category]?.label || "General";
    return `${ref} - ${catName}`;
  };

  const renderHeader = () => (
    <EnviosPageHeader
      filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha} fechasConDatos={fechasConDatos}
      filtroReferencia={filtroReferencia} setFiltroReferencia={setFiltroReferencia}
      validationStats={_validationResults.stats} isEverythingValid={_validationResults.isEverythingValid}
      isSending={isSending} isSaving={isSaving} handleEnviarADespacho={handleEnviarADespacho}
    />
  );

  if (loadingLogCurvas && logCurvasData.length === 0) return <Box sx={{ width: "100%", mt: 4 }}><LinearProgress /></Box>;

  if (visibleEntries.length === 0) {
    return (
      <>
        {portalTarget ? createPortal(renderHeader(), portalTarget) : null}
        <EnviosPageEmptyState filtroFecha={filtroFecha} onNavigateDashboard={() => navigate("/curvas/dashboard")} />
      </>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <>
        {portalTarget ? createPortal(renderHeader(), portalTarget) : null}
        <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Container maxWidth="xl" sx={{ height: "calc(100vh - 74px)", display: "flex", flexDirection: "column", py: 0.5, px: { xs: 0.5, md: 1 }, gap: 1 }}>
            <Stack sx={{ flex: 1, overflow: "hidden" }} spacing={1.5}>
              <Paper elevation={0} sx={{ minHeight: 48, borderRadius: 2, bgcolor: "white", px: 1, border: "1px solid #e2e8f0", display: "flex", alignItems: "center" }}>
                <Tabs value={selectedEntry} onChange={(_, v) => setSelectedEntry(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 48, "& .MuiTab-root": { minHeight: 56, fontWeight: 700, fontSize: "0.9rem", textTransform: "none" } }}>
                  {visibleEntries.map((entry, idx) => <Tab key={entry.id} label={getTabLabel(entry, idx)} />)}
                </Tabs>
              </Paper>
              {current && (
                <Paper ref={refTableRef} className="tour-curvas-tiendas" elevation={0} sx={{ flex: 1, overflow: "hidden", borderRadius: 3, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", bgcolor: "white" }}>
                  <EnviosDataTable
                    current={current} validationData={validationData}
                    validationMirrorTotals={_validationResults.mirrorColumnTotals}
                    validationMirrorGrandTotal={_validationResults.mirrorGrandTotal}
                    activeCell={activeCell} bloqueosActivos={bloqueosActivos} user={user}
                    desmarcarTienda={desmarcarTienda} intentarBloquear={intentarBloquear}
                    setSnackbar={setSnackbar} setActiveCell={setActiveCell}
                  />
                </Paper>
              )}
            </Stack>
          </Container>
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 700, borderRadius: "10px" }}>{snackbar.message}</Alert>
          </Snackbar>
        </Box>
      </>
    </LocalizationProvider>
  );
};

export default EnviosPage;