import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, updateItem, deleteItem } from "@directus/sdk";
import type { Contrato, CreateContrato, UpdateContrato } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo contrato en Directus.
 */
export async function crearContrato(
  data: CreateContrato,
): Promise<Contrato | null> {
  try {
    const payload: CreateContrato = {
      ...data,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("contratos", payload)),
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
  updates: UpdateContrato,
): Promise<Contrato | null> {
  try {
    const result = await withAutoRefresh(() =>
      directus.request(updateItem("contratos", id, updates)),
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
    await withAutoRefresh(() => directus.request(deleteItem("contratos", id)));
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar contrato ${id}:`, error);
    return false;
  }
}
