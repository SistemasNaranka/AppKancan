// src/apps/gestion_proyectos/hooks/useCurvasEditor.ts
import { useEffect, useCallback } from "react";
import { saveLogsBatch, saveLogCurvas } from "../api/directus/create";
import { extractRef } from "../utils/curvasHelpers";
import { procesarMatrizGeneral as procesarExcelMatriz, procesarDetalleProducto as procesarExcelDetalle } from "../utils/excelProcessor";
import type {
  DatosCurvas, ArchivoSubido, CeldaEditada, RolePermissions,
  MatrizGeneralCurvas, DetalleProducto
} from "../types";

interface EditorProps {
  datosCurvas: DatosCurvas | null;
  setDatosCurvas: React.Dispatch<React.SetStateAction<DatosCurvas | null>>;
  setArchivos: React.Dispatch<React.SetStateAction<ArchivoSubido[]>>;
  celdasEditadas: CeldaEditada[];
  setCeldasEditadas: React.Dispatch<React.SetStateAction<CeldaEditada[]>>;
  hasChanges: boolean;
  setHasChanges: (val: boolean) => void;
  permissions: RolePermissions;
  userRole: string;
  setNotificacionCambios: (val: any) => void;
  refreshLogs: () => void;
  cargarDatosGuardados: (fecha?: string | null) => Promise<void>;
  user: any;
}

export const useCurvasEditor = ({
  datosCurvas, setDatosCurvas, setArchivos, celdasEditadas, setCeldasEditadas,
  hasChanges, setHasChanges, permissions, userRole, setNotificacionCambios,
  refreshLogs, cargarDatosGuardados, user
}: EditorProps) => {

  const procesarArchivo = useCallback(
    async (file: File, tipo: ArchivoSubido["tipo"]) => {
      const archivoId = Date.now().toString();
      const nuevoArchivo: ArchivoSubido = { id: archivoId, nombre: file.name, tipo, estado: "cargando", progreso: 10, errores: [], fechaSubida: new Date() };

      setArchivos((prev) => {
        const existe = prev.find((a) => a.tipo === tipo);
        if (existe) return prev.map((a) => (a.tipo === tipo ? nuevoArchivo : a));
        return [...prev, nuevoArchivo];
      });

      try {
        setArchivos((prev) => prev.map((a) => a.id === archivoId ? { ...a, estado: "procesando", progreso: 50 } : a));

        let datosProcesados: MatrizGeneralCurvas[] | DetalleProducto[] | undefined;
        if (tipo === "matriz_general") datosProcesados = await procesarExcelMatriz(file);
        else datosProcesados = await procesarExcelDetalle(file, tipo);

        setArchivos((prev) => prev.map((a) => a.id === archivoId ? { ...a, estado: "exito", progreso: 100, datos: datosProcesados } : a));

        setDatosCurvas((prev) => {
          const nuevosDatos: DatosCurvas = prev || { matrizGeneral: [], productos: [], fechaCarga: new Date() };
          if (tipo === "matriz_general" && datosProcesados) {
            return { ...nuevosDatos, matrizGeneral: datosProcesados as MatrizGeneralCurvas[], fechaCarga: new Date() };
          } else if ((tipo === "detalle_producto_a" || tipo === "detalle_producto_b") && datosProcesados) {
            return { ...nuevosDatos, productos: [...nuevosDatos.productos, ...(datosProcesados as DetalleProducto[])], fechaCarga: new Date() };
          }
          return nuevosDatos;
        });
      } catch (error) {
        setArchivos((prev) => prev.map((a) => a.id === archivoId ? { ...a, estado: "error", errores: [{ fila: 0, columna: "general", valor: file.name, mensaje: error instanceof Error ? error.message : "Error desconocido", severidad: "error" }] } : a));
      }
    },
    [setArchivos, setDatosCurvas]
  );

  const cargarDatosManuales = useCallback(
    (data: MatrizGeneralCurvas | DetalleProducto, tipo: ArchivoSubido["tipo"]) => {
      const archivoId = `manual - ${Date.now()}`;
      const nuevoArchivo: ArchivoSubido = { id: archivoId, nombre: `Ingreso Manual - ${data.nombreHoja}`, tipo, estado: "exito", progreso: 100, errores: [], fechaSubida: new Date(), datos: [data] as any };

      setArchivos((prev) => {
        const existe = prev.find((a) => a.tipo === tipo);
        if (existe) return prev.map((a) => (a.tipo === tipo ? nuevoArchivo : a));
        return [...prev, nuevoArchivo];
      });

      setDatosCurvas((prev) => {
        const nuevosDatos: DatosCurvas = prev || { matrizGeneral: [], productos: [], fechaCarga: new Date() };
        if (tipo === "matriz_general") {
          const id = data.id || `manual-${Date.now()}`;
          const existingIndex = nuevosDatos.matrizGeneral.findIndex((m) => m.id === id);
          const updatedList = [...nuevosDatos.matrizGeneral];
          if (existingIndex >= 0) updatedList[existingIndex] = { ...data, id } as MatrizGeneralCurvas;
          else updatedList.push({ ...data, id } as MatrizGeneralCurvas);
          return { ...nuevosDatos, matrizGeneral: updatedList, fechaCarga: new Date() };
        } else {
          const id = data.id || `manual-${Date.now()}`;
          const existingIndex = nuevosDatos.productos.findIndex((p) => p.id === id);
          const updatedList = [...nuevosDatos.productos];
          if (existingIndex >= 0) updatedList[existingIndex] = { ...data, id } as DetalleProducto;
          else updatedList.push({ ...data, id } as DetalleProducto);
          return { ...nuevosDatos, productos: updatedList, fechaCarga: new Date() };
        }
      });
      setHasChanges(true);
    },
    [setArchivos, setDatosCurvas, setHasChanges]
  );

  const editarCelda = useCallback(
    (sheetId: string, filaId: string, columna: string, valorNuevo: number | string) => {
      if (!permissions.canEdit) return;

      setDatosCurvas((prev) => {
        if (!prev) return prev;
        const isGeneral = prev.matrizGeneral.some((s) => s.id === sheetId);

        if (isGeneral) {
          const updatedData = prev.matrizGeneral.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;
            const nuevasFilas = sheet.filas.map((fila) => {
              if (fila.id !== filaId) return fila;
              const nuevasCurvas = { ...fila.curvas };
              if (typeof valorNuevo === "number") {
                nuevasCurvas[columna] = { ...(nuevasCurvas[columna] || { valor: 0, id: `${filaId}-${columna}` }), valor: valorNuevo, esCero: valorNuevo === 0, esMayorQueCero: valorNuevo > 0 };
              }
              return { ...fila, curvas: nuevasCurvas, total: Object.values(nuevasCurvas).reduce((sum, c) => sum + c.valor, 0) };
            });

            const nuevosTotalesPorCurva = { ...sheet.totalesPorCurva };
            sheet.curvas.forEach((c) => { nuevosTotalesPorCurva[c] = nuevasFilas.reduce((sum, f) => sum + (f.curvas[c]?.valor || 0), 0); });

            return { ...sheet, filas: nuevasFilas, totalesPorCurva: nuevosTotalesPorCurva, totalGeneral: nuevasFilas.reduce((acc, f) => acc + f.total, 0) };
          });
          return { ...prev, matrizGeneral: updatedData };
        } else {
          const updatedData = prev.productos.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;
            if (columna === "marca" && typeof valorNuevo === "string") {
              return { ...sheet, metadatos: { ...sheet.metadatos, marca: valorNuevo } };
            }
            const nuevasFilas = sheet.filas.map((fila) => {
              if (fila.id !== filaId) return fila;
              const nuevasTallas = { ...fila.tallas };
              if (typeof valorNuevo === "number") {
                nuevasTallas[columna] = { ...(nuevasTallas[columna] || { valor: 0, id: `${filaId}-${columna}` }), valor: valorNuevo, esCero: valorNuevo === 0, esMayorQueCero: valorNuevo > 0 };
              }
              return { ...fila, tallas: nuevasTallas, total: Object.values(nuevasTallas).reduce((sum, c) => sum + c.valor, 0) };
            });

            const nuevosTotalesPorTalla = { ...sheet.totalesPorTalla };
            sheet.tallas.forEach((t) => { nuevosTotalesPorTalla[t] = nuevasFilas.reduce((sum, f) => sum + (f.tallas[t]?.valor || 0), 0); });

            return { ...sheet, filas: nuevasFilas, totalesPorTalla: nuevosTotalesPorTalla, totalGeneral: nuevasFilas.reduce((acc, f) => acc + f.total, 0) };
          });
          return { ...prev, productos: updatedData };
        }
      });

      setCeldasEditadas((prev) => [...prev, { sheetId, filaId, columna, valorAnterior: 0, valorNuevo: typeof valorNuevo === "number" ? valorNuevo : 0, fechaEdicion: new Date(), usuarioEdicion: userRole }]);
      setHasChanges(true);
    },
    [permissions.canEdit, userRole, setDatosCurvas, setCeldasEditadas, setHasChanges]
  );

  const cambiarTalla = useCallback(
    (sheetId: string, tallaActual: string, tallaNueva: string) => {
      if (!permissions.canEdit || !tallaNueva.trim()) return;
      setDatosCurvas((prev) => {
        if (!prev) return prev;
        const isGeneral = prev.matrizGeneral.some((s) => s.id === sheetId);
        const tallaNuevaPadded = tallaNueva.padStart(2, "0");

        if (isGeneral) {
          const updatedData = prev.matrizGeneral.map((sheet) => {
            if (sheet.id !== sheetId || sheet.curvas.includes(tallaNuevaPadded)) return sheet;
            const nuevasCurvas = sheet.curvas.map((c) => c === tallaActual ? tallaNuevaPadded : c);
            const nuevasFilas = sheet.filas.map((fila) => {
              const nuevasCurvasFila = { ...fila.curvas };
              if (nuevasCurvasFila[tallaActual]) { nuevasCurvasFila[tallaNuevaPadded] = nuevasCurvasFila[tallaActual]; delete nuevasCurvasFila[tallaActual]; }
              return { ...fila, curvas: nuevasCurvasFila };
            });
            const nuevosTotalesPorCurva = { ...sheet.totalesPorCurva };
            delete nuevosTotalesPorCurva[tallaActual];
            nuevosTotalesPorCurva[tallaNuevaPadded] = nuevasFilas.reduce((sum, f) => sum + (f.curvas[tallaNuevaPadded]?.valor || 0), 0);
            return { ...sheet, curvas: nuevasCurvas, filas: nuevasFilas, totalesPorCurva: nuevosTotalesPorCurva };
          });
          return { ...prev, matrizGeneral: updatedData };
        } else {
          const updatedData = prev.productos.map((sheet) => {
            if (sheet.id !== sheetId || sheet.tallas.includes(tallaNuevaPadded)) return sheet;
            const nuevasTallas = sheet.tallas.map((t) => t === tallaActual ? tallaNuevaPadded : t);
            const nuevasFilas = sheet.filas.map((fila) => {
              const nuevasTallasFila = { ...fila.tallas };
              if (nuevasTallasFila[tallaActual]) { nuevasTallasFila[tallaNuevaPadded] = nuevasTallasFila[tallaActual]; delete nuevasTallasFila[tallaActual]; }
              return { ...fila, tallas: nuevasTallasFila };
            });
            return { ...sheet, tallas: nuevasTallas, filas: nuevasFilas };
          });
          return { ...prev, productos: updatedData };
        }
      });
    },
    [permissions.canEdit, setDatosCurvas]
  );

  const guardarCambios = useCallback(
    async (datosLog?: any[], isAutoSave: boolean = false): Promise<boolean> => {
      let logsToSave: any[] = [];
      const fechaActual = new Date().toISOString();
      const logIdMap: Record<string, string> = {}; 

      if (datosLog && datosLog.length > 0) {
        logsToSave = datosLog.map((log) => ({
          tienda_id: log.tiendaId, tienda_nombre: log.tiendaNombre, plantilla: log.plantilla,
          fecha: fechaActual, cantidad_talla: JSON.stringify(log.cantidadTalla),
          referencia: log.referencia || "SIN REF", estado: log.estado || "borrador",
        }));
      } else if (celdasEditadas.length > 0 && datosCurvas) {
        const affectedSheets = new Set(celdasEditadas.map((e) => e.sheetId));
        affectedSheets.forEach((sheetId) => {
          const sheet = datosCurvas.matrizGeneral.find((s) => s.id === sheetId) || datosCurvas.productos.find((s) => s.id === sheetId);
          if (!sheet) return;

          const isMatriz = "curvas" in sheet;
          const dataKey = isMatriz ? "curvas" : "tallas";
          const cols = isMatriz ? (sheet as any).curvas : (sheet as any).tallas;
          const plantilla = isMatriz ? "matriz_general" : "productos";
          const refFinal = extractRef(sheet);

          const affectedFilaIds = new Set(celdasEditadas.filter((e) => e.sheetId === sheetId).map((e) => e.filaId));
          affectedFilaIds.forEach((filaId) => {
            const fila = sheet.filas.find((f) => f.id === filaId);
            if (!fila) return;

            const cantidadTalla: { talla: number; cantidad: number }[] = [];
            const datosFila = (fila as any)[dataKey] || {};

            cols.forEach((c: string) => {
              const celda = datosFila[c];
              if (celda && celda.valor > 0) cantidadTalla.push({ talla: parseFloat(c), cantidad: celda.valor });
            });

            if (cantidadTalla.length > 0) {
              logsToSave.push({
                tienda_id: fila.tienda.id, tienda_nombre: fila.tienda.nombre, plantilla,
                fecha: fechaActual, cantidad_talla: JSON.stringify(cantidadTalla),
                referencia: refFinal, estado: (sheet as any).estado || "borrador",
              });
            }
          });
        });
      }

      try {
        let logIds: { tienda_id: string; id: string }[] = [];
        if (logsToSave.length > 0) {
          const convertedLogs = logsToSave.map((log) => ({
            ...log, plantilla: log.plantilla === "matriz_general" ? "textil" : log.plantilla === "productos" ? "calzado_bolso" : log.plantilla,
          }));
          logIds = await saveLogsBatch(convertedLogs);
          if (logIds.length === 0) throw new Error("Error en saveLogsBatch");

          logIds.forEach((result) => {
            if (result.id && result.id !== "undefined" && result.id !== "null") logIdMap[result.tienda_id] = result.id;
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
        const isActuallyAdmin = userRole.toLowerCase().includes("admin") || userRole.toLowerCase().includes("gerente") || userRole.toLowerCase().includes("director");

        if (isActuallyAdmin && datosLog && datosLog.length > 0 && !isAutoSave) {
          const tiendasAgrupadas = datosLog.reduce((acc, log) => {
            if (!acc[log.tiendaNombre]) acc[log.tiendaNombre] = [];
            log.cantidadTalla.forEach((ct: any) => { acc[log.tiendaNombre].push(`${ct.talla}(${ct.cantidad})`); });
            return acc;
          }, {} as Record<string, string[]>);

          const tiendasLista = Object.entries(tiendasAgrupadas).map(([tienda, cambios]) => `${tienda}: ${(cambios as string[]).join(", ")}`).join(" | ");
          setNotificacionCambios({ open: true, mensaje: `El administrador ha guardado cambios en ${datosLog[0]?.referencia || "el lote"}`, ubicacion: tiendasLista, timestamp: Date.now() });
        }

        if (Object.keys(logIdMap).length > 0) {
          setDatosCurvas((prev) => {
            if (!prev) return prev;
            const updatedMatrizGeneral = prev.matrizGeneral.map((sheet) => {
              const sheetTiendas = new Set(sheet.filas.map((f: any) => f.tienda?.id).filter(Boolean));
              const logIdsForSheet = Object.entries(logIdMap).filter(([tiendaId]) => sheetTiendas.has(tiendaId)).map(([, logId]) => logId);
              if (logIdsForSheet.length > 0) return { ...sheet, logId: logIdsForSheet[0] };
              return sheet;
            });
            const updatedProductos = prev.productos.map((sheet) => {
              const sheetTiendas = new Set(sheet.filas.map((f: any) => f.tienda?.id).filter(Boolean));
              const logIdsForSheet = Object.entries(logIdMap).filter(([tiendaId]) => sheetTiendas.has(tiendaId)).map(([, logId]) => logId);
              if (logIdsForSheet.length > 0) return { ...sheet, logId: logIdsForSheet[0] };
              return sheet;
            });
            return { ...prev, matrizGeneral: updatedMatrizGeneral, productos: updatedProductos };
          });
        }

        setHasChanges(false);
        setCeldasEditadas([]);
        refreshLogs();
        return true;
      } catch (error) {
        console.error("Error crítico al guardar cambios:", error);
        return false;
      }
    },
    [celdasEditadas, datosCurvas, userRole, refreshLogs, setDatosCurvas, setHasChanges, setCeldasEditadas, setNotificacionCambios]
  );

  useEffect(() => {
    if (!hasChanges || celdasEditadas.length === 0) return;
    const timer = setTimeout(() => { guardarCambios(undefined, true); }, 7000);
    return () => clearTimeout(timer);
  }, [celdasEditadas, hasChanges, guardarCambios]);

  const confirmarLote = useCallback(
    async (tipo: "general" | "producto_a" | "producto_b", sheetId: string): Promise<boolean> => {
      if (!datosCurvas) return false;
      let logIds: { tienda_id: string; id: string }[] = []; 
      const isAlreadyConfirmed = (tipo === "general" ? datosCurvas.matrizGeneral : datosCurvas.productos).some((s: any) => s.id === sheetId && s.estado === "confirmado");
      if (isAlreadyConfirmed) return true;

      try {
        let sheetToPersist: any = null;
        const cleanSheetId = String(sheetId).replace(/^sheet-/, "").trim();

        const findSheet = (sheets: any[]) => {
          let found = sheets.find((s) => s.id === sheetId) || sheets.find((s) => s.id === cleanSheetId) || sheets.find((s) => String(s.id).includes(cleanSheetId)) || sheets.find((s) => s.referencia === sheetId) || sheets.find((s) => s.referenciaBase === sheetId || s.referenciaBase === cleanSheetId) || sheets.find((s) => (s.nombreHoja && s.nombreHoja === sheetId));
          return found || null;
        };

        if (tipo === "general") sheetToPersist = findSheet(datosCurvas.matrizGeneral) || datosCurvas.matrizGeneral[0];
        else sheetToPersist = findSheet(datosCurvas.productos) || datosCurvas.productos[0];

        if (!sheetToPersist) return false;

        const isMatriz = tipo === "general";
        const dataKey = isMatriz ? "curvas" : "tallas";
        const columnas = sheetToPersist[dataKey] || [];
        const plantilla = isMatriz ? "textil" : "calzado_bolso";

        const baseRef = extractRef(sheetToPersist);
        let ref = typeof baseRef === "string" ? baseRef.trim() : "SIN REF";
        let color = sheetToPersist.metadatos?.color || "—";
        if (ref.includes(" | ")) {
          const parts = ref.split(" | ");
          ref = parts[0].trim();
          if (color === "—" || !color) color = parts[1].trim();
        }
        const refFinal = color !== "—" && !ref.includes("|") ? `${ref} | ${color}` : ref;

        const logsBatch: any[] = [];
        const fechaActual = new Date().toISOString();

        for (const fila of sheetToPersist.filas) {
          if (!fila.tienda || !fila.tienda.id || fila.id === "row-total-final") continue;
          const cantidadTalla: { talla: number; cantidad: number }[] = [];
          const datosFila = fila[dataKey] || {};

          columnas.forEach((col: string) => {
            const celda = datosFila[col];
            if (celda && celda.valor > 0) cantidadTalla.push({ talla: parseFloat(col), cantidad: celda.valor });
          });

          if (cantidadTalla.length > 0) {
            logsBatch.push({ tienda_id: fila.tienda.id, tienda_nombre: fila.tienda?.nombre || "", plantilla, fecha: fechaActual, cantidad_talla: JSON.stringify(cantidadTalla), referencia: refFinal || "SIN REF", estado: "confirmado" });
          }
        }

        if (logsBatch.length > 0) {
          const convertedLogs = logsBatch.map((log) => ({ ...log, plantilla: log.plantilla === "matriz_general" ? "textil" : log.plantilla === "productos" ? "calzado_bolso" : log.plantilla }));
          logIds = await saveLogsBatch(convertedLogs);
          if (logIds.length === 0) throw new Error("Error al guardar el lote confirmado");
        }

        setDatosCurvas((prev) => {
          if (!prev) return prev;
          if (tipo === "general") return { ...prev, matrizGeneral: prev.matrizGeneral.map((s) => s.id === sheetId ? { ...s, estado: "confirmado", logId: logIds[0] } : s) };
          return { ...prev, productos: prev.productos.map((s) => s.id === sheetId ? { ...s, estado: "confirmado", logId: logIds[0] } : s) };
        });

        refreshLogs();
        return true;
      } catch (error) {
        console.error("Error persistiendo lote confirmado:", error);
        return false;
      }
    },
    [datosCurvas, refreshLogs, setDatosCurvas]
  );

  const confirmarLoteConDatos = useCallback(
    async (tipo: "general" | "producto_a" | "producto_b", sheetId: string, sheetDataOverride?: MatrizGeneralCurvas | DetalleProducto | null): Promise<boolean> => {
      return confirmarLote(tipo, sheetId); 
    },
    [confirmarLote]
  );

  const descartarCambios = useCallback(() => {
    setCeldasEditadas([]);
    setHasChanges(false);
    cargarDatosGuardados();
  }, [cargarDatosGuardados, setCeldasEditadas, setHasChanges]);

  const reutilizarLote = useCallback(
    async (sheetId: string): Promise<boolean> => {
      if (!datosCurvas || !user) return false;
      try {
        const sheet: any = datosCurvas.matrizGeneral.find((s) => s.id === sheetId) || datosCurvas.productos.find((s) => s.id === sheetId);
        if (!sheet) return false;

        const isMatriz = "curvas" in sheet;
        const dataKey = isMatriz ? "curvas" : "tallas";
        const columnas: string[] = sheet[dataKey] || [];
        const baseRef = extractRef(sheet);
        const fechaActual = new Date().toISOString();
        const logsBatch: any[] = [];

        for (const fila of sheet.filas) {
          if (!fila.tienda || !fila.tienda.id || fila.id === "row-total-final") continue;
          const cantidadTalla: { talla: number; cantidad: number }[] = [];
          const datosFila = fila[dataKey] || {};

          columnas.forEach((col: string) => {
            const celda = datosFila[col];
            if (celda && celda.valor > 0) cantidadTalla.push({ talla: parseFloat(col), cantidad: celda.valor });
          });

          if (cantidadTalla.length === 0) continue;
          logsBatch.push({ tienda_id: fila.tienda.id, tienda_nombre: fila.tienda.nombre || "", plantilla: isMatriz ? "textil" : "calzado_bolso", fecha: fechaActual, cantidad_talla: JSON.stringify(cantidadTalla), referencia: baseRef, estado: "borrador" });
        }

        if (logsBatch.length === 0) return false;
        const logIds = await saveLogsBatch(logsBatch);
        if (logIds.length === 0) throw new Error("Error guardando reutilización");

        refreshLogs();
        return true;
      } catch (error) {
        console.error("Error en reutilizarLote:", error);
        return false;
      }
    },
    [datosCurvas, user, refreshLogs]
  );

  const guardarLogCurvas = useCallback(
    async (data: { tiendaId: string; tiendaNombre: string; plantilla: "matriz_general" | "productos"; cantidadTalla: { talla: number; cantidad: number }[]; referencia?: string; estado?: "borrador" | "confirmado"; }): Promise<boolean> => {
      try {
        return await saveLogCurvas({
          tienda_id: data.tiendaId, tienda_nombre: data.tiendaNombre,
          plantilla: data.plantilla === "matriz_general" ? "textil" : data.plantilla === "productos" ? "calzado_bolso" : data.plantilla,
          fecha: new Date().toISOString(), cantidad_talla: JSON.stringify(data.cantidadTalla),
          referencia: data.referencia || "", estado: data.estado || "borrador",
        });
      } catch (error) {
        console.error("Error al guardar log curvas:", error);
        return false;
      }
    },
    []
  );

  return {
    procesarArchivo, cargarDatosManuales, editarCelda, cambiarTalla,
    guardarCambios, guardarLogCurvas, confirmarLote, confirmarLoteConDatos,
    descartarCambios, reutilizarLote
  };
};