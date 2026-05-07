// src/apps/gestion_proyectos/hooks/useCurvasDataFetcher.ts
import { useEffect, useCallback } from "react";
import { getTiendas, getLogCurvas } from "../api/directus/read";
import { extractRef } from "../utils/curvasHelpers";
import type { DatosCurvas, MatrizGeneralCurvas, DetalleProducto, FilaMatrizGeneral, FilaDetalleProducto } from "../types";

interface FetcherProps {
  setTiendasDict: (dict: Record<string, string>) => void;
  tiendasDict: Record<string, string>;
  setDatosCurvas: React.Dispatch<React.SetStateAction<DatosCurvas | null>>;
  currentDate: string | null;
  setCurrentDate: (date: string | null) => void;
  lastLogsUpdate: number;
}

export const useCurvasDataFetcher = ({
  setTiendasDict, tiendasDict, setDatosCurvas, currentDate, setCurrentDate, lastLogsUpdate
}: FetcherProps) => {

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const tiendas = await getTiendas();
        const dict: Record<string, string> = {};
        tiendas.forEach((t) => { dict[t.id] = t.nombre; });
        setTiendasDict(dict);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };
    fetchStores();
  }, [setTiendasDict]);

  const cargarDatosGuardados = useCallback(
    async (fechaOverride?: string | null) => {
      try {
        const fecha = fechaOverride === null ? undefined : fechaOverride || currentDate || undefined;
        const logs = await getLogCurvas(fecha);

        const emptyState: DatosCurvas = { matrizGeneral: [], productos: [], fechaCarga: new Date() };

        if (!logs || logs.length === 0) {
          setDatosCurvas(emptyState);
          return;
        }

        const groups: Record<string, any> = {};

        logs.forEach((log) => {
          const rawRef = log.referencia || "SIN REF";
          let normalizedRef = rawRef.replace(/^REF:\s*/i, "").trim();
          if (normalizedRef.includes(" | ")) normalizedRef = normalizedRef.split(" | ")[0].trim();
          normalizedRef = normalizedRef.toUpperCase();

          const groupKey = `${log.plantilla}|${normalizedRef}`;

          if (!groups[groupKey]) {
            groups[groupKey] = { referencia: rawRef, normalizedRef, plantilla: log.plantilla, logs: [], lastUpdate: 0 };
          }

          const logTime = new Date(log.fecha).getTime();
          if (logTime > groups[groupKey].lastUpdate) {
            groups[groupKey].lastUpdate = logTime;
            if (rawRef.includes("|") || !groups[groupKey].referencia.includes("|")) {
              groups[groupKey].referencia = rawRef;
            }
          }

          const logExistente = groups[groupKey].logs.find((l: any) => l.tienda_id === log.tienda_id);
          if (!logExistente) groups[groupKey].logs.push(log);
        });

        const matrizGeneral: MatrizGeneralCurvas[] = [];
        const productos: DetalleProducto[] = [];

        Object.values(groups).forEach((group) => {
          const allColumns = new Set<string>();
          const filas: any[] = [];

          group.logs.forEach((log: any) => {
            let cantidadTalla: any[] = [];
            try { cantidadTalla = typeof log.cantidad_talla === "string" ? JSON.parse(log.cantidad_talla) : log.cantidad_talla; } 
            catch (e) { return; }

            if (!Array.isArray(cantidadTalla)) return;

            const rowData: Record<string, any> = {};
            let rowTotal = 0;

            cantidadTalla.forEach((ct) => {
              const col = String(ct.talla || ct.numero || "");
              if (!col) return;
              allColumns.add(col);
              rowData[col] = { valor: ct.cantidad, esCero: ct.cantidad === 0, esMayorQueCero: ct.cantidad > 0, id: `${log.tienda_id}-${col}` };
              rowTotal += ct.cantidad;
            });

            filas.push({
              id: `${String(log.tienda_id)}-${group.normalizedRef}`,
              tienda: { id: log.tienda_id, nombre: tiendasDict[log.tienda_id] || log.tienda_nombre || "Tienda " + log.tienda_id, codigo: "" },
              [group.plantilla === "textil" ? "curvas" : "tallas"]: rowData,
              total: rowTotal,
            });
          });

          filas.sort((a, b) => (a.tienda.nombre || "").localeCompare(b.tienda.nombre || ""));
          const sortedColumns = Array.from(allColumns).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });

          const colTotals: Record<string, number> = {};
          sortedColumns.forEach((col) => {
            colTotals[col] = filas.reduce((sum, f) => {
              const data = group.plantilla === "textil" ? f.curvas : f.tallas;
              return sum + (data[col]?.valor || 0);
            }, 0);
          });

          const totalGeneral = Object.values(colTotals).reduce((a, b) => a + b, 0);

          if (group.plantilla === "textil") {
            matrizGeneral.push({
              id: String(group.normalizedRef || group.referencia), nombreHoja: group.referencia, referencia: group.referencia,
              filas: filas as FilaMatrizGeneral[], curvas: sortedColumns, totalesPorCurva: colTotals, totalGeneral,
              estado: group.logs[0]?.estado || "borrador", fechaCarga: group.logs[0]?.fecha ? new Date(group.logs[0].fecha) : undefined,
            });
          } else {
            productos.push({
              id: String(group.normalizedRef || group.referencia), nombreHoja: group.referencia,
              metadatos: {
                referencia: group.referencia.includes("|") ? group.referencia.split("|")[0].trim() : group.referencia,
                imagen: "", color: group.referencia.includes("|") ? group.referencia.split("|")[1].trim() : "",
                proveedor: group.logs[0]?.proveedor || "RECUPERADO", precio: group.logs[0]?.precio || 0,
                linea: group.plantilla === "calzado_bolso" ? group.referencia.includes("|") ? "CALZADO" : "PRODUCIDO" : "GENERAL",
              },
              filas: filas as FilaDetalleProducto[], tallas: sortedColumns, totalesPorTalla: colTotals, totalGeneral,
              estado: group.logs[0]?.estado || "borrador", fechaCarga: group.logs[0]?.fecha ? new Date(group.logs[0].fecha) : undefined,
            });
          }
        });

        setDatosCurvas((prev) => {
          const nuevosDatos: DatosCurvas = { matrizGeneral: [...matrizGeneral], productos: [...productos], fechaCarga: new Date() };
          if (!prev) return nuevosDatos;

          prev.matrizGeneral.forEach((oldSheet) => {
            const oldRef = extractRef(oldSheet).toUpperCase();
            const existsInDB = matrizGeneral.some((dbSheet) => extractRef(dbSheet).toUpperCase() === oldRef);
            if (!existsInDB && oldRef !== "SIN REF") nuevosDatos.matrizGeneral.push(oldSheet);
          });

          prev.productos.forEach((oldSheet) => {
            const oldRef = extractRef(oldSheet).toUpperCase();
            const existsInDB = productos.some((dbSheet) => extractRef(dbSheet).toUpperCase() === oldRef);
            if (!existsInDB && oldRef !== "SIN REF") nuevosDatos.productos.push(oldSheet);
          });

          nuevosDatos.matrizGeneral.sort((a, b) => extractRef(a).localeCompare(extractRef(b)));
          nuevosDatos.productos.sort((a, b) => extractRef(a).localeCompare(extractRef(b)));

          return nuevosDatos;
        });
      } catch (error) {
        console.error("Error en hidratación de Dashboard:", error);
      }
    },
    [tiendasDict, currentDate, setDatosCurvas]
  );

  const cargarDatosPorFecha = useCallback(
    async (fecha?: string) => {
      setCurrentDate(fecha || null);
      await cargarDatosGuardados(fecha);
    },
    [setCurrentDate, cargarDatosGuardados]
  );

  useEffect(() => {
    if (!currentDate) return;
    cargarDatosGuardados(currentDate);
  }, [cargarDatosGuardados, lastLogsUpdate, currentDate]);

  return { cargarDatosGuardados, cargarDatosPorFecha };
};