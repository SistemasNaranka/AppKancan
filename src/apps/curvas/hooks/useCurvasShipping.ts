// src/apps/gestion_proyectos/hooks/useCurvasShipping.ts
import { useState, useCallback } from "react";
import { saveEnviosBatch } from "../api/directus/create";
import { getLogCurvas } from "../api/directus/read";
import { obtenerBloqueosActivos, liberarTodosLosBloqueosDeUsuario } from "../api/directus/bloqueos";
import type { EnvioTienda, ArticuloEscaneado, ComparacionEnvio, ReporteDiscrepancias, DatosCurvas, RolePermissions } from "../types";

type ValidationCellValue = number | { cantidad: number; barcodes: string[] };

interface UseCurvasShippingProps {
  user: any;
  userRole: string;
  permissions: RolePermissions;
  datosCurvas: DatosCurvas | null;
  tiendasDict: Record<string, string>;
  setBloqueosActivos: (bloqueos: any) => void;
}

export const useCurvasShipping = ({
  user, userRole, permissions, datosCurvas, tiendasDict, setBloqueosActivos,
}: UseCurvasShippingProps) => {
  const [envios, setEnvios] = useState<EnvioTienda[]>([]);
  const [articulosEscaneados, setArticulosEscaneados] = useState<ArticuloEscaneado[]>([]);
  const [validationData, setValidationData] = useState<Record<string, Record<string, Record<string, ValidationCellValue>>>>({});

  const agregarArticuloEscaneado = useCallback(
    (articulo: Omit<ArticuloEscaneado, "id" | "fechaEscaneo">) => {
      if (!permissions.canScan) return;
      const nuevoArticulo: ArticuloEscaneado = {
        ...articulo,
        id: Date.now().toString(),
        fechaEscaneo: new Date(),
      };
      setArticulosEscaneados((prev) => [...prev, nuevoArticulo]);
    },
    [permissions.canScan],
  );

  const crearEnvio = useCallback(
    (tiendaId: string): EnvioTienda | null => {
      if (!permissions.canManageShipments) return null;
      const articulosTienda = articulosEscaneados.filter((a) => a.tiendaDestino.id === tiendaId);
      if (articulosTienda.length === 0) return null;

      const nuevoEnvio: EnvioTienda = {
        id: Date.now().toString(),
        tienda: articulosTienda[0].tiendaDestino,
        articulos: articulosTienda,
        totalArticulos: articulosTienda.reduce((sum, a) => sum + a.cantidad, 0),
        estado: "pendiente",
        fechaCreacion: new Date(),
        usuarioCreacion: userRole,
      };

      setEnvios((prev) => [...prev, nuevoEnvio]);
      setArticulosEscaneados((prev) => prev.filter((a) => a.tiendaDestino.id !== tiendaId));
      return nuevoEnvio;
    },
    [permissions.canManageShipments, articulosEscaneados, userRole],
  );

  const actualizarEstadoEnvio = useCallback(
    (envioId: string, estado: EnvioTienda["estado"]) => {
      if (!permissions.canManageShipments) return;
      setEnvios((prev) =>
        prev.map((e) =>
          e.id === envioId
            ? { ...e, estado, fechaDespacho: estado === "despachado" ? new Date() : e.fechaDespacho, usuarioDespacho: estado === "despachado" ? userRole : e.usuarioDespacho }
            : e,
        ),
      );
    },
    [permissions.canManageShipments, userRole],
  );

  const actualizarValorValidacion = useCallback(
    (sheetId: string, filaId: string, col: string, valor: number, codigoBarra?: string | null) => {
      setValidationData((prev) => {
        const sId = String(sheetId);
        const fId = String(filaId);
        const c = String(col);

        const existingData = prev[sId]?.[fId]?.[c];
        const currentCantidad = typeof existingData === "object" ? (existingData as any).cantidad || 0 : typeof existingData === "number" ? existingData : 0;
        const existingBarcodes: string[] = typeof existingData === "object" ? (existingData as any).barcodes || [] : [];

        const newCantidad = typeof existingData === "number" ? existingData + valor : currentCantidad + valor;

        let newBarcodes: string[];
        if (codigoBarra === null && newCantidad >= 0) {
          newBarcodes = existingBarcodes.slice(0, -1);
        } else if (codigoBarra && codigoBarra.length > 0) {
          newBarcodes = [...existingBarcodes, codigoBarra];
        } else {
          newBarcodes = existingBarcodes;
        }

        return {
          ...prev,
          [sId]: {
            ...(prev[sId] || {}),
            [fId]: {
              ...(prev[sId]?.[fId] || {}),
              [c]: { cantidad: newCantidad, barcodes: newBarcodes },
            },
          },
        } as Record<string, Record<string, Record<string, ValidationCellValue>>>;
      });
    },
    [],
  );

  const limpiarValidacion = useCallback(
    (sheetId?: string) => {
      if (user) {
        liberarTodosLosBloqueosDeUsuario(user.id).then(() => {
          obtenerBloqueosActivos().then(setBloqueosActivos);
        });
      }
      if (sheetId) {
        setValidationData((prev) => {
          const next = { ...prev };
          delete next[String(sheetId)];
          return next;
        });
      } else {
        setValidationData({});
      }
    },
    [user, setBloqueosActivos],
  );

  const guardarEnvioDespacho = useCallback(
    async (
      sheetLogId: string,
      overrideData?: Record<string, Record<string, any>>,
      overridePlantilla?: "matriz_general" | "productos",
      overrideRef?: string,
    ): Promise<{ success: boolean; logIds?: string[] }> => {
      if (!user) return { success: false };

      let currentSheetValidation = overrideData || validationData[sheetLogId] || {};

      if (Object.keys(currentSheetValidation).length === 0) {
        return { success: false };
      }

      try {
        const fechaActual = new Date().toISOString().split("T")[0];
        const logs = await getLogCurvas(fechaActual);
        const logMap: Record<string, string> = {}; 

        logs.forEach((log) => {
          if (log.referencia === overrideRef || log.referencia === sheetLogId.split("|")[1]) {
            logMap[String(log.tienda_id)] = String(log.id);
          }
        });

        const enviosBatch: any[] = [];
        const fechaEnvio = new Date().toISOString().split("T")[0];

        for (const [filaId, tallas] of Object.entries(currentSheetValidation)) {
          const filaIdStr = typeof filaId === "object" ? JSON.stringify(filaId) : String(filaId);
          const tiendaIdFinal = tiendasDict[filaIdStr] || filaIdStr;
          const logIdForTienda = logMap[tiendaIdFinal];

          if (!tiendaIdFinal || !logIdForTienda) continue;

          const cantidadTalla: { talla: number; cantidad: number; codigo_barra: string }[] = [];

          for (const [col, data] of Object.entries(tallas as any)) {
            const cellData = typeof data === "object" ? data : { cantidad: data, barcodes: [] };
            const cantidad = (cellData as any).cantidad || 0;
            const barcodes = (cellData as any).barcodes || [];

            if (cantidad > 0) {
              if (barcodes.length > 0) {
                const barcodeCount: Record<string, number> = {};
                barcodes.forEach((bc: string) => { barcodeCount[bc] = (barcodeCount[bc] || 0) + 1; });
                Object.entries(barcodeCount).forEach(([codigoBarra, qty]) => {
                  cantidadTalla.push({ talla: parseFloat(col), cantidad: qty as number, codigo_barra: codigoBarra });
                });
              } else {
                cantidadTalla.push({ talla: parseFloat(col), cantidad: cantidad, codigo_barra: "" });
              }
            }
          }

          if (cantidadTalla.length > 0) {
            enviosBatch.push({
              tienda_id: String(tiendaIdFinal), plantilla: logIdForTienda, fecha: fechaEnvio,
              cantidad_talla: JSON.stringify(cantidadTalla), referencia: overrideRef || "SIN_REF", usuario_id: user?.id,
            });
          }
        }

        if (enviosBatch.length === 0) return { success: true, logIds: [] };

        const saveResult = await saveEnviosBatch(enviosBatch);
        if (saveResult) {
          return { success: true, logIds: enviosBatch.map((e) => e.plantilla) };
        } else {
          return { success: false, logIds: [] };
        }
      } catch (error) {
        console.error("❌ Error en guardarEnvioDespacho:", error);
        return { success: false };
      }
    },
    [user, validationData, tiendasDict],
  );

  const generarComparacion = useCallback(
    (envioId: string): ComparacionEnvio[] => {
      const envio = envios.find((e) => e.id === envioId);
      if (!envio || !datosCurvas) return [];

      const comparaciones: ComparacionEnvio[] = [];

      envio.articulos.forEach((articulo) => {
        let cantidadPlanificada = 0;
        if (datosCurvas.matrizGeneral && datosCurvas.matrizGeneral.length > 0) {
          for (const sheet of datosCurvas.matrizGeneral) {
            const fila = sheet.filas.find((f) => f.tienda.id.includes(envio.tienda.id) || f.tienda.nombre === envio.tienda.nombre);
            if (fila && fila.curvas[articulo.talla]) {
              cantidadPlanificada = fila.curvas[articulo.talla].valor;
              break;
            }
          }
        }

        const diferencia = articulo.cantidad - cantidadPlanificada;
        comparaciones.push({
          id: `${envioId}-${articulo.id}`, tienda: envio.tienda, referencia: articulo.referencia, talla: articulo.talla,
          cantidadPlanificada, cantidadEscaneada: articulo.cantidad, diferencia,
          estado: diferencia === 0 ? "coincide" : diferencia > 0 ? "sobrante" : "faltante",
        });
      });

      return comparaciones;
    },
    [envios, datosCurvas],
  );

  const generarReporteDiscrepancias = useCallback(
    (envioId: string): ReporteDiscrepancias | null => {
      const envio = envios.find((e) => e.id === envioId);
      if (!envio) return null;

      const comparaciones = generarComparacion(envioId);
      const totalCoincidencias = comparaciones.filter((c) => c.estado === "coincide").length;
      const totalSobrantes = comparaciones.filter((c) => c.estado === "sobrante").length;
      const totalFaltantes = comparaciones.filter((c) => c.estado === "faltante").length;

      return {
        id: `reporte-${envioId}`, fechaGeneracion: new Date(), envio, comparaciones,
        totalCoincidencias, totalSobrantes, totalFaltantes,
        resumen: `Total: ${comparaciones.length} artículos | Coincidencias: ${totalCoincidencias} | Sobrantes: ${totalSobrantes} | Faltantes: ${totalFaltantes}`,
      };
    },
    [envios, generarComparacion],
  );

  return {
    envios, setEnvios, articulosEscaneados, setArticulosEscaneados, validationData, setValidationData,
    agregarArticuloEscaneado, crearEnvio, actualizarEstadoEnvio, actualizarValorValidacion,
    limpiarValidacion, guardarEnvioDespacho, generarComparacion, generarReporteDiscrepancias,
  };
};