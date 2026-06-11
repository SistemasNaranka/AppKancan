// Hook con la lógica de Guardar y Enviar a Despacho de la página de carga.

import { useMemo } from "react";

type LoadType = "general" | "producto_a" | "producto_b";

type Severity = "success" | "warning" | "info" | "error";

interface SnackbarSetter {
  (s: { open: boolean; message: string; severity: Severity }): void;
}

interface ConfirmDialogState {
  open: boolean;
  action: string;
}

interface DispatchStats {
  tiendas: number;
  totalUnidades: number;
  columnas: number;
}

interface UseUploadActionsParams {
  loadType: LoadType;
  currentSheetId: string | number | null | undefined;
  currentData: any | null;
  pendingMatrixData: any;
  setPendingMatrixData: (v: any) => void;
  matrixState: { ref: string; total: number };
  hasChanges: boolean;
  setHasChanges: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setShowSuccess: (v: boolean) => void;
  setSnackbar: SnackbarSetter;
  confirmDialog: ConfirmDialogState;
  setConfirmDialog: (s: ConfirmDialogState) => void;
  dispatchStats: DispatchStats | null;
  setDispatchStats: (s: DispatchStats | null) => void;
  cargarDatosManuales: (
    data: any,
    tipo: "matriz_general" | "detalle_producto_a" | "detalle_producto_b",
  ) => void;
  confirmarLoteConDatos: (
    loadType: LoadType,
    id: any,
    hojaData: any,
  ) => Promise<boolean>;
  navigate: (path: string) => void;
}

export function useUploadActions(params: UseUploadActionsParams) {
  const {
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
  } = params;

  const summaryStats = useMemo<DispatchStats>(() => {
    if (dispatchStats && confirmDialog.action === "confirm_dispatch") {
      return dispatchStats;
    }

    const data = pendingMatrixData || currentData;
    if (!data) return { tiendas: 0, totalUnidades: 0, columnas: 0 };

    const filas = data.filas || [];
    const filasConDatos = filas.filter((f: any) => (f.total || 0) > 0);
    const totalUnidades =
      typeof data.totalGeneral === "number"
        ? data.totalGeneral
        : filas.reduce((acc: number, f: any) => acc + (f.total || 0), 0);

    const columnasData = (data as any).curvas || (data as any).tallas || [];
    const tallasConDatos = new Set<number>();
    filasConDatos.forEach((fila: any) => {
      const datosFila = (data as any).curvas ? fila.curvas : fila.tallas;
      if (datosFila) {
        Object.entries(datosFila).forEach(([talla, celda]: [string, any]) => {
          if (celda?.valor > 0) tallasConDatos.add(parseFloat(talla));
        });
      }
    });

    return {
      tiendas: filasConDatos.length,
      totalUnidades,
      columnas: tallasConDatos.size || columnasData.length || 0,
    };
  }, [currentData, pendingMatrixData, dispatchStats, confirmDialog.action]);

  const handleSave = async (silent: boolean | any = false) => {
    const isSilent = silent === true;
    setSaving(true);

    try {
      if (!pendingMatrixData) {
        setSaving(false);
        if (!isSilent) setConfirmDialog({ open: false, action: "save" });
        return false;
      }

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

      let refFinal = refActual;

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

      const ok = true;
      if (!isSilent) {
        setConfirmDialog({ open: false, action: "save" });
        setShowSuccess(true);
      }
      setHasChanges(false);

      return ok ? dataToSave.id : false;
    } catch (err) {
      console.error("Error en handleSave:", err);
      if (!isSilent) {
        setConfirmDialog({ ...confirmDialog, open: false });
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

    let refFinal = refActual;
    const colorInput =
      pendingMatrixData?.color || pendingMatrixData?.metadatos?.color;
    if (
      colorInput &&
      colorInput !== "—" &&
      !refFinal?.includes("|") &&
      refFinal !== "SIN REF"
    ) {
      refFinal = `${refFinal} | ${colorInput}`;
    }

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

    const dataForStats = pendingMatrixData || currentData;
    if (dataForStats) {
      const filas = dataForStats.filas || [];
      const totalUnidades =
        typeof dataForStats.totalGeneral === "number"
          ? dataForStats.totalGeneral
          : filas.reduce((acc: number, f: any) => acc + (f.total || 0), 0);
      setDispatchStats({
        tiendas: filas.length,
        totalUnidades,
        columnas:
          (dataForStats as any).curvas?.length ||
          (dataForStats as any).tallas?.length ||
          0,
      });
    }

    setSaving(true);

    try {
      let ok = true;
      let targetId = currentSheetId;

      let hojaData: any = null;
      if (pendingMatrixData) hojaData = pendingMatrixData;
      else if (currentData) hojaData = currentData;

      const hojaIdAntes = hojaData?.id;

      if (hasChanges || pendingMatrixData) {
        const successSaveId = await handleSave(true);
        if (!successSaveId) {
          setSnackbar({
            open: true,
            message:
              "❌ Error al guardar los datos. No se puede enviar a despacho",
            severity: "error",
          });
          return;
        }
        targetId =
          hojaIdAntes || successSaveId || `${refFinal || refActual || "NUEVA"}`;
        setSaving(true);
      } else {
        targetId = currentSheetId || `${refFinal || refActual || "NUEVA"}`;
      }

      if (!targetId) {
        setSnackbar({
          open: true,
          message: "No se pudo generar el Lote de Despacho",
          severity: "error",
        });
        return;
      }

      ok = await confirmarLoteConDatos(loadType, targetId, hojaData);

      if (ok) {
        setShowSuccess(true);
        setConfirmDialog({ open: false, action: "confirm_dispatch" });
        setDispatchStats(null);
        setTimeout(() => navigate("/curvas/envios"), 2500);
      } else {
        setConfirmDialog({ open: false, action: "confirm_dispatch" });
        setDispatchStats(null);
        setSnackbar({
          open: true,
          message: "❌ Error al confirmar el lote de despacho",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error en handleSendToDispatch:", err);
      setConfirmDialog({ open: false, action: "confirm_dispatch" });
      setDispatchStats(null);
      setSnackbar({
        open: true,
        message: `❌ Error inesperado: ${err instanceof Error ? err.message : "Consulte la consola"}`,
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return { summaryStats, handleSave, handleSendToDispatch };
}
