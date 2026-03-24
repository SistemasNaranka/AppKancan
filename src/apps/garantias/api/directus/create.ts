import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, updateItem, deleteItem } from "@directus/sdk";
import type {
  Garantia,
  CreateGarantia,
  UpdateGarantia,
  Cliente,
  CreateCliente,
} from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// GARANTÍAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea una nueva garantía en Directus.
 * La fecha_solicitud se setea automáticamente a hoy si no se provee.
 */
export async function crearGarantia(data: CreateGarantia): Promise<Garantia> {
  const payload: CreateGarantia = {
    ...data,
    estado: data.estado ?? "pendiente",
    fecha_solicitud:
      data.fecha_solicitud ?? new Date().toISOString().split("T")[0],
  };

  const result = await withAutoRefresh(() =>
    directus.request(createItem("garantias", payload))
  );

  return result as Garantia;
}

/**
 * Actualiza una garantía existente por su ID.
 */
export async function actualizarGarantia(
  id: number,
  updates: UpdateGarantia
): Promise<Garantia> {
  const result = await withAutoRefresh(() =>
    directus.request(updateItem("garantias", id, updates))
  );

  return result as Garantia;
}

/**
 * Elimina una garantía por su ID.
 */
export async function eliminarGarantia(id: number): Promise<void> {
  await withAutoRefresh(() =>
    directus.request(deleteItem("garantias", id))
  );
}

/**
 * Cambia solo el estado de una garantía.
 * Shorthand para actualizarGarantia cuando solo cambia el estado.
 */
export async function cambiarEstadoGarantia(
  id: number,
  estado: Garantia["estado"],
  resolucion?: string
): Promise<Garantia> {
  return actualizarGarantia(id, {
    estado,
    ...(resolucion ? { resolucion } : {}),
    ...(estado === "completada" || estado === "rechazada" || estado === "aprobada"
      ? { fecha_resolucion: new Date().toISOString().split("T")[0] }
      : {}),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo cliente en la tabla "clientes".
 */
export async function crearCliente(data: CreateCliente): Promise<Cliente> {
  const result = await withAutoRefresh(() =>
    directus.request(createItem("clientes", data))
  );

  return result as Cliente;
}

/**
 * Actualiza un cliente existente.
 */
export async function actualizarCliente(
  id: number,
  updates: Partial<CreateCliente>
): Promise<Cliente> {
  const result = await withAutoRefresh(() =>
    directus.request(updateItem("clientes", id, updates))
  );

  return result as Cliente;
}