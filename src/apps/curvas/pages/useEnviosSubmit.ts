import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { saveEnviosBatch, deleteEnvioDrafts } from "../api/directus/create";
import type { ConfirmedEntry } from "./EnviosPage.utils";

interface UseEnviosSubmitProps {
  current: ConfirmedEntry | null;
  user: any;
  validationData: Record<string, any>;
  myScannedTiendasRef: React.MutableRefObject<Record<string, Set<string>>>;
  datosCurvas: any;
  tiendasDict: Record<string, string>;
  logCurvasData: any[];
  extractRef: (item: any) => string;
  setSnackbar: React.Dispatch<React.SetStateAction<any>>;
}

export const useEnviosSubmit = ({
  current, user, validationData, myScannedTiendasRef, datosCurvas,
  tiendasDict, logCurvasData, extractRef, setSnackbar
}: UseEnviosSubmitProps) => {
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEnviarADespacho = async (type: "save" | "send" | "auto" = "save") => {
    if (!current || !user) return;

    if (type === "send") setIsSending(true);
    if (type === "save") setIsSaving(true);

    try {
      const currentRef = extractRef(current.sheet);
      const sheetKey = String(current.sheet.id!);
      const sheetLogId = current.sheet.logId || sheetKey;
      const currentSheetValidation = validationData[sheetKey] || {};

      if (type !== "auto") {
        const hasData = Object.values(currentSheetValidation).some((row: any) =>
          Object.values(row).some((cell: any) => (typeof cell === "object" ? cell.cantidad : cell) > 0)
        );
        const myTiendas = myScannedTiendasRef.current[sheetKey];
        const hasSomethingToClear = myTiendas && myTiendas.size > 0;

        if (!hasData && !hasSomethingToClear) {
          setSnackbar({ open: true, message: "No hay datos para enviar", severity: "warning" });
          setIsSending(false);
          setIsSaving(false);
          return;
        }
      }

      const template: any = [...(datosCurvas?.matrizGeneral || []), ...(datosCurvas?.productos || [])].find((s) => String(s.id) === sheetKey);
      const logsBatch: any[] = [];
      const fechaActual = dayjs().format("YYYY-MM-DD");
      const myTiendas = myScannedTiendasRef.current[sheetKey] ?? new Set<string>();

      if (myTiendas.size === 0) {
        if (type !== "auto") setSnackbar({ open: true, message: "⚠️ No escaneaste ninguna tienda en esta sesión. No hay nada propio que guardar.", severity: "warning" });
        setIsSaving(false);
        return;
      }

      for (const [filaId, tallas] of Object.entries(currentSheetValidation)) {
        if (!myTiendas.has(filaId)) continue;
        const filaIdStr = typeof filaId === "object" ? JSON.stringify(filaId) : String(filaId);
        const fila = template?.filas?.find((f: any) => String(f.id) === filaIdStr || String(f.tienda?.id) === filaIdStr || String(f.tienda?.codigo) === filaIdStr);
        const tiendaIdFinal = fila?.tienda?.id || (tiendasDict[filaIdStr] ? filaIdStr : null);

        if (!tiendaIdFinal) continue;

        const cantidadTalla: any[] = [];
        for (const [col, data] of Object.entries(tallas as any)) {
          const cellData: any = (data && typeof data === "object") ? data : { cantidad: data || 0, barcodes: [] };
          if (cellData?.cantidad > 0) {
            if (cellData.barcodes.length > 0) {
              const barcodeCount: Record<string, number> = {};
              cellData.barcodes.forEach((bc: string) => (barcodeCount[bc] = (barcodeCount[bc] || 0) + 1));
              Object.entries(barcodeCount).forEach(([bc, qty]) => cantidadTalla.push({ talla: parseFloat(col), cantidad: qty, codigo_barra: bc }));
            } else {
              cantidadTalla.push({ talla: parseFloat(col), cantidad: cellData.cantidad, codigo_barra: "" });
            }
          }
        }

        if (cantidadTalla.length > 0) {
          const matchingLog = logCurvasData.find((l) => String(l.tienda_id) === String(fila?.tienda?.id) && extractRef({ referencia: l.referencia }) === currentRef);
          logsBatch.push({
            tienda_id: fila?.tienda?.id,
            tienda_nombre: fila?.tienda?.nombre,
            plantilla: matchingLog ? String(matchingLog.id) : sheetLogId,
            fecha: fechaActual,
            cantidad_talla: cantidadTalla,
            referencia: currentRef || "SIN REF",
            estado: "borrador",
            usuario_id: user.id,
          });
        }
      }

      await deleteEnvioDrafts(currentRef || "SIN REF", String(user.id));

      if (logsBatch.length > 0) {
        const ok = await saveEnviosBatch(logsBatch);
        if (ok && type !== "auto") {
          setSnackbar({ open: true, message: "✅ Proceso guardado", severity: "success" });
        } else if (!ok && type !== "auto") {
          setSnackbar({ open: true, message: "No se pudo guardar", severity: "error" });
        }
      } else {
        if (type !== "auto") setSnackbar({ open: true, message: "Progreso limpiado (0 unidades)", severity: "info" });
        if (myScannedTiendasRef.current[sheetKey]) myScannedTiendasRef.current[sheetKey].clear();
      }
    } catch (error) {
      console.error(error);
      if (type !== "auto") setSnackbar({ open: true, message: "Error al guardar", severity: "error" });
    } finally {
      setIsSending(false);
      setIsSaving(false);
    }
  };

  // Autoguardado
  useEffect(() => {
    if (!current || !user || isSending || isSaving) return;
    const sheetKey = String(current.sheet.id);
    const myTiendas = myScannedTiendasRef.current[sheetKey];

    if (!myTiendas || myTiendas.size === 0) return;

    const timer = setTimeout(() => { handleEnviarADespacho("auto"); }, 7000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationData, current, user]);

  return { isSending, isSaving, handleEnviarADespacho };
};