import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, updateItem, deleteItem } from "@directus/sdk";
import type {
  Contrato,
  CreateContrato,
  UpdateContrato,
  Prorroga,
  CreateProrroga,
  UpdateProrroga,
  Documento,
  CreateDocumento,
} from "../types/types";
import { addMonths, getProrrogaDuration, toLocalDateStr } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo contrato en Directus.
 * El request_status se inicializa en "pendiente" si no se provee.
 */
export async function crearContrato(data: CreateContrato): Promise<Contrato | null> {
  try {
    const payload: CreateContrato = {
      ...data,
      request_status: data.request_status ?? "pendiente",
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("contratos", payload))
    );

    return result as Contrato;
  } catch (error) {
    console.error("❌ Error al crear contrato:", error);
    return null;
  }
}

/**
 * Actualiza un contrato existente por su ID.
 */
export async function actualizarContrato(
  id: number,
  updates: UpdateContrato
): Promise<Contrato | null> {
  try {
    const result = await withAutoRefresh(() =>
      directus.request(updateItem("contratos", id, updates))
    );

    return result as Contrato;
  } catch (error) {
    console.error(`❌ Error al actualizar contrato ${id}:`, error);
    return null;
  }
}

/**
 * Elimina un contrato por su ID.
 */
export async function eliminarContrato(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("contratos", id))
    );
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar contrato ${id}:`, error);
    return false;
  }
}

/**
 * Cambia solo el request_status de un contrato.
 */
export async function cambiarRequestStatus(
  id: number,
  request_status: Contrato["request_status"]
): Promise<Contrato | null> {
  return actualizarContrato(id, { request_status });
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÓRROGAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea una nueva prórroga para un contrato.
 *
 * Aplica la regla de negocio automáticamente:
 *   - Prórrogas 0 a 3  → 4 meses
 *   - Prórroga 4 en adelante → 12 meses
 */
export async function crearProrroga(
  data: {
    contrato_id: number;
    numero: number;
    fecha_inicio: string;
    descripcion?: string;
  }
): Promise<Prorroga | null> {
  try {
    // Regla de duración: prórrogas 0-3 →  4 meses, prórrogas 4+ → 12 meses
    const duracion_meses = getProrrogaDuration(data.numero);

    // Regla de fecha fin: fecha_inicio + N meses - 1 día
    // Ej: inicio 02/02 + 4 meses = 02/06, pero fecha_final real = 01/06
    // NOTA: addMonths() ya aplica la resta de 1 día internamente
    const fecha_final = addMonths(data.fecha_inicio, duracion_meses);

    const payload: CreateProrroga = {
      contrato: data.contrato_id,
      numero:         data.numero,
      label:          data.numero === 0 ? "Contrato Inicial" : `Prórroga ${data.numero}`,
      descripcion:    data.descripcion ?? (data.numero >= 4
                        ? "Renovación anual — planta."
                        : "Nueva extensión contractual."),
      fecha_ingreso:   data.fecha_inicio,
      fecha_final,
      duracion: duracion_meses,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("prorrogas", payload))
    );

    return result as Prorroga;
  } catch (error) {
    console.error("❌ Error al crear prórga:", error);
    return null;
  }
}

/**
 * Actualiza los campos editables de una prorrogga existente.
 * Si se actualiza fecha_ingreso, recalcula fecha_final y duracion_meses.
 * También actualiza la fecha_final del contrato asociado.
 */
export async function actualizarProrroga(
  id: number,
  updates: UpdateProrroga & { numero?: number }
): Promise<Prorroga | null> {
  try {
    let payload: UpdateProrroga = { ...updates };

    if (updates.fecha_ingreso && updates.numero !== undefined) {
      const duracion_meses = getProrrogaDuration(updates.numero);
      const fechaInicioStr = updates.fecha_ingreso instanceof Date
        ? toLocalDateStr(updates.fecha_ingreso)
        : updates.fecha_ingreso;
      payload = {
        ...payload,
        duracion: duracion_meses,
        fecha_final: addMonths(fechaInicioStr, duracion_meses),
      };
    }

    const result = await withAutoRefresh(() =>
      directus.request(updateItem("prorrogas", id, payload))
    );

    // Si se actualizó la fecha_final, actualizar la fecha_final del contrato
    if (payload.fecha_final) {
      const prorroga = result as Prorroga;
      if (prorroga && prorroga.contrato) {
        await withAutoRefresh(() =>
          directus.request(updateItem("contratos", prorroga.contrato, { fecha_final: payload.fecha_final }))
        );
      }
    }

    return result as Prorroga;
  } catch (error) {
    console.error(`❌ Error al actualizar prorrogga ${id}:`, error);
    return null;
  }
}

/**
 * Elimina una prorrogga por su ID.
 */
export async function eliminarProrroga(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("prorrogas", id))
    );
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar prorrogga ${id}:`, error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adjunta un nuevo documento a un contrato.
 */
export async function crearDocumento(data: CreateDocumento): Promise<Documento | null> {
  try {
    const payload: CreateDocumento = {
      ...data,
      fecha: data.fecha ?? new Date().toISOString().split("T")[0],
      firmado: data.firmado ?? false,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("documentos", payload))
    );

    return result as Documento;
  } catch (error) {
    console.error("❌ Error al crear documento:", error);
    return null;
  }
}

/**
 * Elimina un documento por su ID.
 */
export async function eliminarDocumento(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("documentos", id))
    );
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar documento ${id}:`, error);
    return false;
  }
}