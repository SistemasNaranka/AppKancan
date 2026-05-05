import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import { getEnviosAnalisis, getResumenFechasCurvas } from "../api/directus/read";
import { useCurvas } from "../contexts/CurvasContext";
import { MatrixDataTransformada, UsuarioData, FilaAnalisis } from "../utils/analisis.types";
import type { SelectionItem } from "../shared/components/selectionmodal/CustomSelectionModal";

export const useAnalisisData = () => {
  const { tiendasDict } = useCurvas();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Dayjs | null>(dayjs());
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");
  const [filtroTienda, setFiltroTienda] = useState<string>("");
  const [showRefModal, setShowRefModal] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState<Record<string, "pendiente" | "enviado">>({
    [dayjs().format("YYYY-MM-DD")]: "pendiente" as "pendiente" | "enviado"
  });

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
      if (!selectedRef && !isGlobal && data.length > 0) {
        const refs = Array.from(new Set(data.map((l: any) => l.referencia))).filter(Boolean) as string[];
        if (refs.length > 0) setSelectedRef(refs.sort()[0]);
      } else if (selectedRef && !isGlobal && !data.some((l: any) => l.referencia === selectedRef)) {
        setSelectedRef(null);
      }
    } catch (err) {
      console.error("Error fetching analysis logs:", err);
    } finally {
      setLoading(false);
    }
  }, [fecha, selectedRef]);

  useEffect(() => { fetchLogsByDate(); }, [fetchLogsByDate]);

  useEffect(() => {
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      setFechasConDatos(resumen);
      if (Object.keys(resumen).length > 0 && !fecha) {
        const sortedFechas = Object.keys(resumen).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setFecha(dayjs(sortedFechas[0]));
      }
    };
    fetchFechas();
  }, []);

  const uniqueReferences = useMemo(() => {
    return (Array.from(new Set(logs.map((l) => l.referencia))).filter(Boolean) as string[]).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const refSummaryItems = useMemo((): SelectionItem[] => {
    return uniqueReferences.map((ref, idx) => {
      const refLogs = logs.filter((l) => l.referencia === ref);
      const tiendas = new Set(refLogs.map((l) => typeof l.tienda_id === "object" ? String(l.tienda_id?.id) : String(l.tienda_id))).size;
      const usuarios = new Set(refLogs.map((l) => typeof l.usuario_id === "object" ? l.usuario_id?.id : String(l.usuario_id))).size;
      let total = 0;
      refLogs.forEach((log) => {
        try {
          const ct = typeof log.cantidad_talla === "string" ? JSON.parse(log.cantidad_talla) : log.cantidad_talla;
          if (Array.isArray(ct)) ct.forEach((item: any) => { total += item.cantidad || 0; });
        } catch {}
      });
      return {
        id: idx,
        label: ref,
        description: `${tiendas} tienda${tiendas !== 1 ? "s" : ""} · ${usuarios} usuario${usuarios !== 1 ? "s" : ""} · ${total.toLocaleString("es-CO")} uds`,
      };
    });
  }, [uniqueReferences, logs]);

  const uniqueUsuarios = useMemo((): UsuarioData[] => {
    if (!selectedRef) return [];
    const map = new Map<string, UsuarioData>();
    logs.filter((l) => l.referencia === selectedRef).forEach((log) => {
      const uid = log.usuario_id;
      if (!uid) return;
      const id = typeof uid === "object" ? uid?.id : String(uid);
      const nombre = typeof uid === "object" ? `${uid?.first_name || ""} ${uid?.last_name || ""}`.trim() : `Usuario ${uid}`;
      map.set(id, { id, nombreCompleto: nombre || `Usuario ${id}` });
    });
    return Array.from(map.values()).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  }, [logs, selectedRef]);

  const matrixData = useMemo<MatrixDataTransformada | null>(() => {
    if (!selectedRef || !logs || logs.length === 0) return null;
    
    const isGlobal = selectedRef === "ALL_HISTORICAL";
    const filteredLogs = isGlobal ? logs : logs.filter((l) => l.referencia === selectedRef);
    const allTallasSet = new Set<string>();
    const filasMap = new Map<string, FilaAnalisis>();

    for (const log of filteredLogs) {
      let ct: any[] = [];
      try { ct = typeof log.cantidad_talla === "string" ? JSON.parse(log.cantidad_talla) : log.cantidad_talla; } catch { continue; }

      const tiendaId = log.tienda_id?.id || String(log.tienda_id || "BODEGA");
      const tiendaNombre = log.tienda_id?.nombre || tiendasDict[tiendaId] || log.tienda_nombre || `Tienda ${tiendaId}`;
      const u = log.usuario_id;
      const usuarioId = u?.id || String(u || "desconocido");
      const usuarioNombre = u?.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : `Usuario ${usuarioId}`;
      const dateKey = log.fecha ? dayjs(log.fecha).format("DD/MM/YYYY") : "—";
      const filaKey = isGlobal ? `${tiendaId}|${usuarioId}|${log.fecha?.slice(0, 10)}|${log.referencia}` : `${tiendaId}|${usuarioId}`;

      if (!filasMap.has(filaKey)) {
        filasMap.set(filaKey, {
          tiendaId, tiendaNombre, usuarioId, usuarioNombre: usuarioNombre || `Usuario ${usuarioId}`,
          fecha: isGlobal ? dateKey : undefined,
          referencia: isGlobal ? log.referencia : undefined,
          tallas: {}, total: 0,
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
    sortedTallas.forEach(t => { columnTotals[t] = Array.from(filasMap.values()).reduce((s, f) => s + (f.tallas[t] || 0), 0); });

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
      tallas: sortedTallas, filas: filasList, columnTotals,
      grandTotal: Object.values(columnTotals).reduce((s, v) => s + v, 0),
      tiendasUnicas: new Set(filasList.map(f => f.tiendaId)).size,
      usuariosUnicos: new Set(filasList.map(f => f.usuarioId)).size,
      maxCellValue, unidadesPorUsuario,
    };
  }, [logs, selectedRef, tiendasDict, filtroUsuario, filtroTienda]);

  return {
    loading, selectedRef, setSelectedRef, fecha, setFecha, filtroUsuario, setFiltroUsuario,
    filtroTienda, setFiltroTienda, showRefModal, setShowRefModal, fechasConDatos,
    fetchLogsByDate, uniqueReferences, refSummaryItems, uniqueUsuarios, matrixData
  };
};