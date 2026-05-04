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
  contrato:  number;
  numero:       number;
  label:        string;
  descripcion:  string;
  fecha_ingreso: string;  // YYYY-MM-DD — día de inicio de la prórroga
  fecha_final:  string;   // YYYY-MM-DD — calculado: fecha_ingreso + duracion
  duracion:     number;   // ← nombre real del campo en la BD (types.ts: Prorroga.duracion)
}

// ─────────────────────────────────────────────────────────────────────────────
// Prórrogas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un registro en la colección `prorrogas` de Directus.
 *
 * Regla de negocio (aplicada aquí, no en el formulario):
 *   numero 0–3  → duracion = 4  meses
 *   numero ≥ 4  → duracion = 12 meses
 *
 * @param contratoId  ID del contrato al que pertenece la prórroga
 * @param numero      Número de prórroga calculado por el contexto
 * @param fechaIngreso Fecha de inicio en formato YYYY-MM-DD
 * @param descripcion  Descripción opcional
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
      contrato: contrato_id,
      numero,
      label,
      descripcion,
      fecha_ingreso,
      fecha_final,
      duracion,   // ← campo correcto en Directus
    };

    const created = await withAutoRefresh(() =>
      directus.request(createItem("prorrogas", payload))
    );

    return created as Prorroga;
  } catch (error) {
    console.error("❌ Error al crear prórroga:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo registro en la colección `contratos`.
 */
export async function crearContrato(
  payload: CreateContrato
): Promise<Contrato | null> {
  try {
    const created = await withAutoRefresh(() =>
      directus.request(createItem("contratos", payload as any))
    );

    return created as Contrato;
  } catch (error) {
    console.error("❌ Error al crear contrato:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza el campo `request_status` de un contrato.
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
        updateItem("contratos", contratoId, { request_status: nuevoStatus })
      )
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error al cambiar request_status del contrato ${contratoId}:`,
      error
    );
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cambio de Cargo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza los campos `cargo` y opcionalmente `area` en la tabla `contratos`.
 *
 * Debe llamarse siempre junto con `crearHistorialCargo` para mantener
 * el contrato sincronizado con el historial de movimientos. El WebSocket
 * del ContractContext detectará el UPDATE y hará UPSERT_CONTRATO
 * automáticamente, reflejando el cambio en toda la app sin recargar.
 *
 * @param contratoId  ID del contrato a actualizar
 * @param nuevoCargo  Nombre del nuevo cargo (string)
 * @param nuevaArea   Área correspondiente al nuevo cargo (opcional)
 */
export async function actualizarCargoEnContrato(
  contratoId: number,
  nuevoCargo: string,
  nuevaArea?: string
): Promise<boolean> {
  try {
    // contratos.cargo es FK a util_cargo. Resolver nombre → id.
    const cargos: any = await withAutoRefresh(() =>
      directus.request(
        readItems("util_cargo", {
          fields: ["id"],
          filter: { nombre: { _eq: nuevoCargo } },
          limit: 1,
        })
      )
    );
    const cargoId = (cargos as any[])?.[0]?.id;
    if (!cargoId) {
      throw new Error(`util_cargo no encontrado para nombre="${nuevoCargo}"`);
    }

    const payload: Record<string, any> = { cargo: cargoId };
    if (nuevaArea) payload.area = nuevaArea;

    await withAutoRefresh(() =>
      directus.request(updateItem("contratos", contratoId, payload))
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error al actualizar cargo del contrato ${contratoId}:`,
      error
    );
    return false;
  }
}