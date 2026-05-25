import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, updateItem, deleteItem, readItems } from "@directus/sdk";
import type {
  Contrato,
  CreateContrato,
  UpdateContrato,
  Prorroga,
  CreateProrroga,
  UpdateProrroga,
} from "../types/types";
import { addMonths, getProrrogaDuration, toLocalDateStr } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo contrato en Directus.
 * El status se inicializa en "pendiente" si no se provee.
 */
export async function crearContrato(data: CreateContrato): Promise<Contrato | null> {
  try {
    // adm_contracts.position es FK a core_positions. Resolver nombre → id si llega como string.
    let cargoFk: any = data.position;
    if (typeof data.position === "string") {
      const cargos: any = await withAutoRefresh(() =>
        directus.request(
          readItems("core_positions", {
            fields: ["id"],
            filter: { name: { _eq: data.position } },
            limit: 1,
          })
        )
      );
      const found = (cargos as any[])?.[0]?.id;
      if (!found) throw new Error(`core_positions no encontrado para name="${data.position}"`);
      cargoFk = found;
    }

    const payload: any = {
      ...data,
      position: cargoFk,
      status: data.status ?? "pendiente",
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("adm_contracts", payload))
    );

    return result as Contrato;
  } catch (error) {
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
    // Si position viene como string nombre, resolver a FK core_positions.
    let payload: any = { ...updates };
    if (typeof updates.position === "string") {
      const cargos: any = await withAutoRefresh(() =>
        directus.request(
          readItems("core_positions", {
            fields: ["id"],
            filter: { name: { _eq: updates.position } },
            limit: 1,
          })
        )
      );
      const found = (cargos as any[])?.[0]?.id;
      if (!found) throw new Error(`core_positions no encontrado para name="${updates.position}"`);
      payload.position = found;
    }

    const result = await withAutoRefresh(() =>
      directus.request(updateItem("adm_contracts", id, payload))
    );

    return result as Contrato;
  } catch (error) {
    return null;
  }
}

/**
 * Elimina un contrato por su ID.
 */
export async function eliminarContrato(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("adm_contracts", id))
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Cambia solo el status de un contrato.
 */
export async function cambiarRequestStatus(
  id: number,
  status: Contrato["status"]
): Promise<Contrato | null> {
  return actualizarContrato(id, { status });
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
    const fecha_final = addMonths(data.fecha_inicio, duracion_meses);

    const payload: CreateProrroga = {
      contract_id:      data.contrato_id,
      extension_number: data.numero,
      label:            data.numero === 0 ? "Contrato Inicial" : `Prórroga ${data.numero}`,
      description:      data.descripcion ?? (data.numero >= 4
                          ? "Renovación anual"
                          : "Nueva extensión contractual."),
      start_date:       data.fecha_inicio,
      end_date:         fecha_final,
      duration:         duracion_meses,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("adm_extensions", payload))
    );

    return result as Prorroga;
  } catch (error) {
    return null;
  }
}

/**
 * Actualiza los campos editables de una prórroga existente.
 * Si se actualiza start_date, recalcula end_date y duration.
 * También actualiza el end_date del contrato asociado.
 */
export async function actualizarProrroga(
  id: number,
  updates: UpdateProrroga & { extension_number?: number; contract_id?: number }
): Promise<Prorroga | null> {
  try {
    let payload: UpdateProrroga = { ...updates };

    if (updates.start_date && updates.extension_number !== undefined) {
      const duracion_meses = getProrrogaDuration(updates.extension_number);
      const fechaInicioStr = updates.start_date instanceof Date
        ? toLocalDateStr(updates.start_date)
        : updates.start_date;
      payload = {
        ...payload,
        duration: duracion_meses,
        end_date: addMonths(fechaInicioStr, duracion_meses),
      };
    }

    // 1. Actualizamos SOLO la prórroga
    const result = await withAutoRefresh(() =>
      directus.request(updateItem("adm_extensions", id, payload))
    );

    // 2. Si se actualizó end_date Y sabemos a qué contrato pertenece,
    // hacemos una llamada separada y segura para actualizar el contrato.
    if (payload.end_date) {
       const contratoId = updates.contract_id || (result as Prorroga).contract_id;

       if (contratoId) {
          await withAutoRefresh(() =>
             directus.request(updateItem("adm_contracts", contratoId, { end_date: payload.end_date }))
          );
       }
    }

    return result as Prorroga;
  } catch (error) {
    return null;
  }
}

/**
 * Elimina una prórroga por su ID.
 */
export async function eliminarProrroga(id: number): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("adm_extensions", id))
    );
    return true;
  } catch (error) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAL DE CARGOS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearHistorialCargo(data: {
  contrato_id: number;
  cargo_anterior: string | number;
  cargo_nuevo: string | number;
  fecha_efectividad: string;
  nueva_area?: string;
}): Promise<boolean> {
  const { nueva_area, contrato_id, cargo_anterior, cargo_nuevo, fecha_efectividad } = data;
  let historialId: number | string | null = null;
  try {
    // 1. Crear historial
    const historialData = {
      contract_id:       contrato_id,
      previous_position: cargo_anterior,
      new_position:      cargo_nuevo,
      effective_date:    fecha_efectividad,
    };
    const created: any = await withAutoRefresh(() =>
      directus.request(createItem("adm_position_history", historialData))
    );
    historialId = created?.id ?? null;

    // 2. Resolver nombre del cargo → id de core_positions (FK en adm_contracts.position)
    let cargoFk: number | string = cargo_nuevo;
    if (typeof cargo_nuevo === "string") {
      const cargos: any = await withAutoRefresh(() =>
        directus.request(
          readItems("core_positions", {
            fields: ["id"],
            filter: { name: { _eq: cargo_nuevo } },
            limit: 1,
          })
        )
      );
      const found = (cargos as any[])?.[0]?.id;
      if (!found) throw new Error(`core_positions no encontrado para name="${cargo_nuevo}"`);
      cargoFk = found;
    }

    // 3. Actualizar contrato (position + department). Si falla, rollback historial.
    const updates: any = { position: cargoFk };
    if (nueva_area) updates.department = nueva_area;

    const updated = await actualizarContrato(contrato_id, updates);
    if (!updated) throw new Error("actualizarContrato devolvió null");

    return true;
  } catch (error) {
    if (historialId !== null) {
      try {
        await withAutoRefresh(() =>
          directus.request(deleteItem("adm_position_history", historialId as any))
        );
      } catch (rbErr) {
      }
    }
    return false;
  }
}
