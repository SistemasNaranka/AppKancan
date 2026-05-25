import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItems, readItems, updateItems, deleteItems } from "@directus/sdk";
import type {
  MatrizGeneralCurvas,
  DetalleProducto,
  LogCurvas,
  EnvioCurva,
} from "../../types";

/**
 * API para crear datos de curvas en Directus
 *
 * Funciones disponibles:
 * - saveMatrizGeneral: Guarda la matriz general de curvas
 * - saveDetalleProducto: Guarda el detalle de un producto
 * - saveHistorialCarga: Guarda el historial de carga
 */

/**
 * Guarda la matriz general de curvas en Directus
 */
export const saveMatrizGeneral = async (
  matriz: MatrizGeneralCurvas,
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems("matriz_curvas", [
          {
            referencia: matriz.referencia,
            curvas: JSON.stringify(matriz.curvas),
            filas: JSON.stringify(matriz.filas),
            totales_por_curva: JSON.stringify(matriz.totalesPorCurva),
            total_general: matriz.totalGeneral,
            fecha_creacion: new Date().toISOString(),
          },
        ]),
      ),
    );

    return true;
  } catch (error) {
    console.error("Error saving matriz general:", error);
    return false;
  }
};

/**
 * Guarda el detalle de un producto en Directus
 */
export const saveDetalleProducto = async (
  producto: DetalleProducto,
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems("detalle_productos", [
          {
            referencia: producto.metadatos.referencia,
            imagen: producto.metadatos.imagen,
            color: producto.metadatos.color,
            proveedor: producto.metadatos.proveedor,
            precio: producto.metadatos.precio,
            linea: producto.metadatos.linea,
            categoria: producto.metadatos.categoria,
            subcategoria: producto.metadatos.subcategoria,
            tallas: JSON.stringify(producto.tallas),
            filas: JSON.stringify(producto.filas),
            totales_por_talla: JSON.stringify(producto.totalesPorTalla),
            total_general: producto.totalGeneral,
            fecha_creacion: new Date().toISOString(),
          },
        ]),
      ),
    );

    return true;
  } catch (error) {
    console.error("Error saving detalle producto:", error);
    return false;
  }
};

/**
 * Guarda el historial de carga de archivos
 */
export const saveHistorialCarga = async (datos: {
  tipo_archivo: string;
  nombre_archivo: string;
  referencia?: string;
  registros_procesados: number;
  errores: number;
  estado: "exitoso" | "fallido";
}): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems("historial_curvas", [
          {
            tipo_archivo: datos.tipo_archivo,
            nombre_archivo: datos.nombre_archivo,
            referencia: datos.referencia,
            registros_procesados: datos.registros_procesados,
            errores: datos.errores,
            estado: datos.estado,
            fecha_carga: new Date().toISOString(),
          },
        ]),
      ),
    );

    return true;
  } catch (error) {
    console.error("Error saving historial:", error);
    return false;
  }
};

/**
 * Guarda múltiples curvas de distribución en batch
 */
export const saveBatchCurvas = async (
  curvas: MatrizGeneralCurvas[],
): Promise<boolean> => {
  try {
    const items = curvas.map((matriz) => ({
      referencia: matriz.referencia,
      curvas: JSON.stringify(matriz.curvas),
      filas: JSON.stringify(matriz.filas),
      totales_por_curva: JSON.stringify(matriz.totalesPorCurva),
      total_general: matriz.totalGeneral,
      fecha_creacion: new Date().toISOString(),
    }));

    await withAutoRefresh(() =>
      directus.request(createItems("matriz_curvas", items)),
    );

    return true;
  } catch (error) {
    console.error("Error saving batch curvas:", error);
    return false;
  }
};

/**
 * Guarda un registro de log de curvas en Directus
 */
export const saveLogCurvas = async (
  logData: Omit<LogCurvas, "id" | "date_created">,
): Promise<boolean> => {
  const ids = await saveLogsBatch([logData]);
  return ids.length > 0;
};

/**
 * Guarda múltiples registros de log de curvas en Directus (Batch)
 * Devuelve los IDs generados para usar como referencia en envios_curvas
 */
export const saveLogsBatch = async (
  logsData: Omit<LogCurvas, "id" | "date_created">[],
): Promise<{ store_id: string; id: string }[]> => {
  if (!logsData || logsData.length === 0) return [];

  try {
    const results: { store_id: string; id: string }[] = [];

    for (const log of logsData) {
      // SIEMPRE crear nuevo registro para envíos (no actualizar existentes)
      const item = {
        store_id: log.store_id,
        store_name: log.store_name || "",
        template: log.template,
        log_date: log.log_date,
        size_quantity: log.size_quantity,
        reference: log.reference || "",
        status: log.status || "borrador",
      };

      const response = (await withAutoRefresh(() =>
        directus.request(createItems("log_curve", [item])),
      )) as any[];

      const newId = response[0]?.id;
      results.push({ store_id: log.store_id, id: String(newId) });
    }

    return results;
  } catch (error) {
    console.error("Error saving logs batch:", error);
    return [];
  }
};

/**
 * Guarda un registro de envío a despacho en Directus (tabla envios_curvas)
 */
export const saveEnvioCurva = async (
  envioData: Omit<EnvioCurva, "id" | "date_created">,
): Promise<boolean> => {
  return saveEnviosBatch([envioData]);
};

/**
 * Guarda múltiples registros de envío a despacho en Directus (Batch)
 */
export const saveEnviosBatch = async (
  enviosData: Omit<EnvioCurva, "id" | "date_created">[],
): Promise<boolean> => {
  if (!enviosData || enviosData.length === 0) return true;

  try {
    const items = enviosData.map((envio: any) => {
      return {
        store_id: envio.store_id,
        template: envio.template,
        shipment_date: envio.shipment_date,
        size_quantity: envio.size_quantity,
        reference: envio.reference,
        user_id: envio.user_id,
      };
    });

    await withAutoRefresh(() =>
      directus.request(createItems("log_curve_shipments", items)),
    );

    return true;
  } catch (error) {
    console.error("Error saving envios batch:", error);
    return false;
  }
};

/**
 * Elimina borradores de escaneo físico previos para evitar duplicados al guardar nuevo progreso
 */
export const deleteEnvioDrafts = async (
  referencia: string,
  usuarioId: string,
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        deleteItems("log_curve_shipments", {
          filter: {
            _and: [
              { reference: { _eq: referencia } },
              { user_id: { _eq: usuarioId } },
              { shipment_date: { _gte: new Date().toISOString().split("T")[0] } }, // Solo los de hoy
            ],
          },
        }),
      ),
    );
    return true;
  } catch (error) {
    // Es posible que no haya nada que borrar, no lo tratamos como error crítico
    return true;
  }
};

/**
 * Elimina registros de log_curvas previos para evitar duplicados
 */
export const deleteLogCurvasByRef = async (
  referencia: string,
  plantilla: string,
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        deleteItems("log_curve", {
          filter: {
            _and: [
              { reference: { _eq: referencia } },
              { template: { _eq: plantilla } },
            ],
          },
        }),
      ),
    );
    return true;
  } catch (error) {
    return true;
  }
};

export default {
  saveMatrizGeneral,
  saveDetalleProducto,
  saveHistorialCarga,
  saveBatchCurvas,
  saveLogCurvas,
  saveLogsBatch,
  saveEnvioCurva,
  saveEnviosBatch,
  deleteEnvioDrafts,
  deleteLogCurvasByRef,
};
