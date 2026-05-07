import { useEffect, useRef } from "react";
import type { ConfirmedEntry } from "./EnviosPage.utils";

interface UseEnviosHydrationProps {
  current: ConfirmedEntry | null;
  enviosCurvasData: any[];
  extractRef: (item: any) => string;
  setValidationData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  myScannedTiendasRef: React.MutableRefObject<Record<string, Set<string>>>;
}

export const useEnviosHydration = ({ current, enviosCurvasData, extractRef, setValidationData, myScannedTiendasRef }: UseEnviosHydrationProps) => {
  const hydratedSheetsRef = useRef<Set<string>>(new Set());

  // Hidratación inicial (Carga una vez por hoja)
  useEffect(() => {
    if (!current || !enviosCurvasData || enviosCurvasData.length === 0) return;

    const currentRef = extractRef(current.sheet);
    const sheetId = String(current.sheet.id);

    if (hydratedSheetsRef.current.has(sheetId)) return;
    hydratedSheetsRef.current.add(sheetId);

    const enviosParaRef = enviosCurvasData.filter((log: any) => extractRef({ referencia: log.referencia || log.referenciaBase }) === currentRef);
    if (enviosParaRef.length === 0) return;

    const nuevoValidation: Record<string, any> = {};
    enviosParaRef.forEach((log: any) => {
      const tiendaId = typeof log.tienda_id === "object" && log.tienda_id !== null ? String(log.tienda_id.id || log.tienda_id.codigo) : String(log.tienda_id);
      let parsedTallas: any[] = [];
      try {
        parsedTallas = typeof log.cantidad_talla === "string" ? JSON.parse(log.cantidad_talla) : log.cantidad_talla;
      } catch (e) { return; }

      if (!Array.isArray(parsedTallas)) return;

      const rowData: Record<string, { cantidad: number; barcodes: string[] }> = {};
      parsedTallas.forEach((item: any) => {
        const col = String(item.tanda || item.talla).padStart(2, "0");
        if (!rowData[col]) rowData[col] = { cantidad: 0, barcodes: [] };
        const cantidad = Number(item.cantidad) || 0;
        const barcodes = Array.isArray(item.barcodes) ? item.barcodes : item.codigo_barra ? [item.codigo_barra] : [];
        rowData[col].cantidad += cantidad;
        if (barcodes.length > 0) {
          for (let i = 0; i < cantidad; i++) rowData[col].barcodes.push(...barcodes);
        }
      });
      nuevoValidation[tiendaId] = rowData;
    });

    setValidationData((prev) => ({ ...prev, [sheetId]: nuevoValidation }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.sheet?.id, enviosCurvasData, extractRef, setValidationData]);

  // Sincronización en tiempo real (respeta mi myScannedTiendasRef)
  useEffect(() => {
    if (!current || !enviosCurvasData) return;

    const sheetId = String(current.sheet.id);
    if (!hydratedSheetsRef.current.has(sheetId)) return;

    const currentRef = extractRef(current.sheet);
    const myTiendas = myScannedTiendasRef.current[sheetId] || new Set<string>();

    const enviosParaRef = enviosCurvasData.filter((log: any) => extractRef({ referencia: log.referencia || log.referenciaBase }) === currentRef);

    setValidationData((prev) => {
      const prevSheet = { ...(prev[sheetId] || {}) };
      let changed = false;
      const dbTiendaData: Record<string, any> = {};
      const dbTiendaIds = new Set<string>();

      enviosParaRef.forEach((log: any) => {
        const tiendaId = typeof log.tienda_id === "object" && log.tienda_id !== null ? String(log.tienda_id.id || log.tienda_id.codigo) : String(log.tienda_id);
        dbTiendaIds.add(tiendaId);

        if (myTiendas.has(tiendaId)) return;

        let parsedTallas: any[] = [];
        try { parsedTallas = typeof log.cantidad_talla === "string" ? JSON.parse(log.cantidad_talla) : log.cantidad_talla; } 
        catch { return; }

        if (!Array.isArray(parsedTallas)) return;

        const rowData: Record<string, { cantidad: number; barcodes: string[] }> = {};
        parsedTallas.forEach((item: any) => {
          const col = String(item.tanda || item.talla).padStart(2, "0");
          if (!rowData[col]) rowData[col] = { cantidad: 0, barcodes: [] };
          const cantidad = Number(item.cantidad) || 0;
          const barcodes = Array.isArray(item.barcodes) ? item.barcodes : item.codigo_barra ? [item.codigo_barra] : [];
          rowData[col].cantidad += cantidad;
          if (barcodes.length > 0) {
            for (let i = 0; i < cantidad; i++) rowData[col].barcodes.push(...barcodes);
          }
        });
        dbTiendaData[tiendaId] = rowData;
      });

      Object.keys(prevSheet).forEach((tiendaId) => {
        if (!myTiendas.has(tiendaId) && !dbTiendaIds.has(tiendaId)) {
          delete prevSheet[tiendaId];
          changed = true;
        }
      });

      Object.entries(dbTiendaData).forEach(([tiendaId, rowData]) => {
        if (JSON.stringify(rowData) !== JSON.stringify(prevSheet[tiendaId])) {
          prevSheet[tiendaId] = rowData;
          changed = true;
        }
      });

      if (!changed) return prev;
      return { ...prev, [sheetId]: prevSheet };
    });
  }, [enviosCurvasData, current?.sheet?.id, extractRef, setValidationData]);
};