import { useMemo } from "react";
import { CATEGORY_CONFIG, type ConfirmedEntry, type SheetCategory } from "./EnviosPage.utils";
import type { LogCurvas, FilaMatrizGeneral, FilaDetalleProducto } from "../types";

type InternalCell = { talla: string; cantidad: number; esCero: boolean; esMayorQueCero: boolean; };
type InternalFila = (FilaMatrizGeneral | FilaDetalleProducto) & { columnas: InternalCell[]; total: number; validationValues: any; };

interface UseConfirmedEntriesProps {
  logCurvasData: LogCurvas[];
  sentEntryKeys: Set<string>;
  validationData: Record<string, any>;
  tiendasDict: Record<string, string>;
  filtroReferencia: string;
}

export const useConfirmedEntries = ({ logCurvasData, sentEntryKeys, validationData, tiendasDict, filtroReferencia }: UseConfirmedEntriesProps) => {
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
        const isTextil = plantilla === "matriz_general" || plantilla === "textil" || plantilla.toLowerCase().includes("textil");
        const typeCategory = isTextil ? "general" : "producto_a";
        const entryKey = `${typeCategory}|${refKey}|${colorFinal}`;

        if (sentEntryKeys.has(entryKey)) return;

        const lastLog = logs[0];
        const uniqueColumns = Array.from(new Set(logs.flatMap((l) => {
          const tallasRaw = l.cantidad_talla || "[]";
          const parsed = typeof tallasRaw === "string" ? JSON.parse(tallasRaw) : tallasRaw;
          const items = Array.isArray(parsed) ? parsed : [];
          return items.map((p: any) => String(p.talla || p.numero || "").padStart(2, "0"));
        }))).filter((c) => c && c !== "00").sort();

        const tiendasProcesadas = new Set<string>();
        const logsDeduplicados = logs.filter((l: any) => {
          const tId = String(l.tienda_id);
          if (tiendasProcesadas.has(tId)) return false;
          tiendasProcesadas.add(tId);
          return true;
        });

        const logsCategorizados = logsDeduplicados.reduce((acc: any, l: any) => {
          const tId = String(l.tienda_id);
          const tNombre = tiendasDict[tId] || l.tienda_nombre || `Tienda ${tId}`;

          if (!acc[tId]) {
            acc[tId] = {
              id: tId,
              tienda: { id: tId, nombre: tNombre, codigo: tId },
              columnasMap: {} as Record<string, number>,
              rowData: {} as Record<string, any>,
              total: 0,
              validationValues: validationData[entryKey]?.[tId] || {},
            };
          }

          const tallasRaw = l.cantidad_talla || "[]";
          const parsed = typeof tallasRaw === "string" ? JSON.parse(tallasRaw) : tallasRaw;
          const items = Array.isArray(parsed) ? parsed : [];

          items.forEach((ct: any) => {
            const colName = String(ct.talla || ct.numero || "").padStart(2, "0");
            if (!colName || colName === "00") return;
            const qty = Number(ct.cantidad) || 0;
            acc[tId].columnasMap[colName] = (acc[tId].columnasMap[colName] || 0) + qty;
            acc[tId].total += qty;
          });

          return acc;
        }, {});

        const aggregatedFilas: InternalFila[] = Object.keys(logsCategorizados).map((tId) => {
          const columnsArray: InternalCell[] = uniqueColumns.map((col) => {
            const qty = logsCategorizados[tId].columnasMap[col] || 0;
            return { talla: col, cantidad: qty, esCero: qty === 0, esMayorQueCero: qty > 0 };
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
            columnsArray.forEach((c) => (curvas[c.talla] = { valor: c.cantidad, id: `${tId}-${c.talla}`, esCero: c.esCero, esMayorQueCero: c.esMayorQueCero }));
            return { ...base, curvas } as InternalFila;
          } else {
            const tallas: any = {};
            columnsArray.forEach((c) => (tallas[c.talla] = { valor: c.cantidad, id: `${tId}-${c.talla}`, esCero: c.esCero, esMayorQueCero: c.esMayorQueCero }));
            return { ...base, tallas } as InternalFila;
          }
        });

        const referenceTotals: Record<string, number> = {};
        uniqueColumns.forEach((col) => {
          referenceTotals[col] = Object.values(logsCategorizados).reduce((acc: number, t: any) => acc + (Number(t.columnasMap[col]) || 0), 0);
        });

        const config = CATEGORY_CONFIG[typeCategory as SheetCategory] || CATEGORY_CONFIG["producto_a"];

        entries.push({
          id: entryKey, ref: refKey, label: `REF: ${refKey} | ${colorFinal}`,
          category: typeCategory as SheetCategory, icon: config.icon as React.ReactElement, accent: config.accent,
          sheet: {
            id: entryKey, logId: logs.map((l) => String(l.id)).join(","), nombreHoja: lastLog.archivo || "Sin nombre",
            referencia: refKey, filas: aggregatedFilas as any[],
            totalGeneral: aggregatedFilas.reduce((acc: number, f) => acc + (f.total || 0), 0),
          },
          columns: uniqueColumns, columnTotals: referenceTotals,
          getRowColumns: (fila: any) => {
            const res: Record<string, number> = {};
            (fila.columnas || []).forEach((c: any) => { res[c.talla] = c.cantidad; });
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
    return confirmedEntries.filter((e) => e.label.toLowerCase().includes(lower));
  }, [confirmedEntries, filtroReferencia]);

  return { confirmedEntries, visibleEntries };
};