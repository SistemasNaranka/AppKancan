import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, updateItem, readItems } from "@directus/sdk";
import type {
  Prorroga,
  Contrato,
  CreateContrato,
  RequestStatus,
} from "../types/types";
import { addMonths, getProrrogaDuration } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads internos (lo que realmente se envía a Directus)
// ─────────────────────────────────────────────────────────────────────────────

interface CreateProrrogaDirectus {
  contract_id:      number;
  extension_number: number;
  label:            string;
  description:      string;
  start_date:       string;  // YYYY-MM-DD — día de inicio de la prórroga
  end_date:         string;  // YYYY-MM-DD — calculado: start_date + duration
  duration:         number;  // ← nombre real del campo en la BD
}

// ─────────────────────────────────────────────────────────────────────────────
// Prórrogas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un registro en la colección `adm_extensions` de Directus.
 *
 * Regla de negocio (aplicada aquí, no en el formulario):
 *   numero 0–3  → duracion = 4  meses
 *   numero ≥ 4  → duracion = 12 meses
 */
export async function crearProrroga(params: {
  contrato_id:  number;
  numero:       number;
  fecha_ingreso: string;
  descripcion?: string;
}): Promise<Prorroga | null> {
  try {
    const { contrato_id, numero, fecha_ingreso, descripcion = '' } = params;

    // Calcular duración y fecha de fin según regla de negocio
    //   numero 0–3  → 4 meses
    //   numero ≥ 4  → 12 meses
    const duracion    = getProrrogaDuration(numero);
    const fecha_final = addMonths(fecha_ingreso, duracion);
    const label       = numero === 0 ? 'Contrato Inicial' : `Prórroga ${numero}`;

    const payload: CreateProrrogaDirectus = {
      contract_id:      contrato_id,
      extension_number: numero,
      label,
      description:      descripcion,
      start_date:       fecha_ingreso,
      end_date:         fecha_final,
      duration:         duracion,
    };

    const created = await withAutoRefresh(() =>
      directus.request(createItem("adm_extensions", payload))
    );

    return created as Prorroga;
  } catch (error) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo registro en la colección `adm_contracts`.
 */
export async function crearContrato(
  payload: CreateContrato
): Promise<Contrato | null> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(createItem("adm_contracts", payload as any))
    );

    return created as Contrato;
  } catch (error) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza el campo `status` de un contrato.
 * Útil para mover un contrato por el flujo de aprobación
 * (pendiente → en_revision → aprobada / rechazada → completada).
 */
export async function cambiarRequestStatus(
  contratoId: number,
  nuevoStatus: RequestStatus
): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(
        updateItem("adm_contracts", contratoId, { status: nuevoStatus })
      )
    );
    return true;
  } catch (error) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cambio de Cargo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza los campos `position` y opcionalmente `department` en `adm_contracts`.
 *
 * Debe llamarse siempre junto con `crearHistorialCargo` para mantener
 * el contrato sincronizado con el historial de movimientos. El WebSocket
 * del ContractContext detectará el UPDATE y hará UPSERT_CONTRATO
 * automáticamente, reflejando el cambio en toda la app sin recargar.
 */
export async function actualizarCargoEnContrato(
  contratoId: number,
  nuevoCargo: string,
  nuevaArea?: string
): Promise<boolean> {
  try {
    // adm_contracts.position es FK a core_positions. Resolver nombre → id.
    const cargos: any = await withAutoRefresh(() =>
      directus.request(
        readItems("core_positions", {
          fields: ["id"],
          filter: { name: { _eq: nuevoCargo } },
          limit: 1,
        })
      )
    );
    const cargoId = (cargos as any[])?.[0]?.id;
    if (!cargoId) {
      throw new Error(`core_positions no encontrado para name="${nuevoCargo}"`);
    }

    const payload: Record<string, any> = { position: cargoId };
    if (nuevaArea) payload.department = nuevaArea;

    await withAutoRefresh(() =>
      directus.request(updateItem("adm_contracts", contratoId, payload))
    );
    return true;
  } catch (error) {
    return false;
  }
}
