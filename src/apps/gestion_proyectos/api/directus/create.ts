import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, createItems, deleteItem, updateItem } from "@directus/sdk";
import type {
  CreateProyectoInput,
  CreateProcesoInput,
  CreateBeneficioInput,
} from "../../types";

/**
 * Crea un nuevo proyecto
 */
export async function createProyecto(
  data: CreateProyectoInput,
): Promise<string | null> {
  try {
    const payload: any = {
      nombre: data.nombre,
      area_beneficiada: data.area_beneficiada,
      descripcion: data.descripcion || null,
      fecha_inicio: data.fecha_inicio,
      fecha_estimada: data.fecha_estimada || null,
      fecha_entrega: data.fecha_entrega || null,
      estado: data.estado,
      tipo_proyecto: data.tipo_proyecto,
    };

    // Solo agregar encargados si tiene datos
    if (data.encargados && data.encargados.length > 0) {
      payload.encargados = data.encargados;
    }

    const result = await withAutoRefresh(() =>
      directus.request(createItem("gp_proyectos", payload)),
    );

    return result.id;
  } catch (error) {
    console.error("❌ Error al crear proyecto:", error);
    return null;
  }
}

/**
 * Actualiza un proyecto
 */
export async function updateProyecto(
  id: string,
  data: Partial<CreateProyectoInput>,
): Promise<boolean> {
  try {
    const payload: any = {};

    if (data.nombre) payload.nombre = data.nombre;
    if (data.area_beneficiada) payload.area_beneficiada = data.area_beneficiada;
    if (data.descripcion) payload.descripcion = data.descripcion;
    if (data.fecha_inicio) payload.fecha_inicio = data.fecha_inicio;
    if (data.fecha_estimada) payload.fecha_estimada = data.fecha_estimada;
    if (data.fecha_entrega !== undefined)
      payload.fecha_entrega = data.fecha_entrega;
    if (data.estado) payload.estado = data.estado;
    if (data.tipo_proyecto) payload.tipo_proyecto = data.tipo_proyecto;
    if (data.encargados) payload.encargados = data.encargados;

    await withAutoRefresh(() =>
      directus.request(updateItem("gp_proyectos", id, payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al actualizar proyecto:", error);
    return false;
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteProyecto(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("gp_proyectos", id)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proyecto:", error);
    return false;
  }
}

/**
 * Crea múltiples procesos para un proyecto
 */
export async function createProcesos(
  procesos: CreateProcesoInput[],
): Promise<boolean> {
  try {
    const payload = procesos.map((p) => ({
      proyecto_id: p.proyecto_id,
      nombre: p.nombre,
      tiempo_antes: p.tiempo_antes,
      tiempo_despues: p.tiempo_despues,
      frecuencia_tipo: p.frecuencia_tipo,
      frecuencia_cantidad: p.frecuencia_cantidad,
      dias_semana: p.dias_semana,
      orden: p.orden,
    }));

    await withAutoRefresh(() =>
      directus.request(createItems("gp_proceso", payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al crear procesos:", error);
    return false;
  }
}

/**
 * Crea un solo proceso
 */
export async function createProceso(
  data: CreateProcesoInput,
): Promise<string | null> {
  try {
    const payload = {
      proyecto_id: data.proyecto_id,
      nombre: data.nombre,
      tiempo_antes: data.tiempo_antes,
      tiempo_despues: data.tiempo_despues,
      frecuencia_tipo: data.frecuencia_tipo,
      frecuencia_cantidad: data.frecuencia_cantidad,
      dias_semana: data.dias_semana,
      orden: data.orden,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("gp_proceso", payload)),
    );

    return result.id;
  } catch (error) {
    console.error("❌ Error al crear proceso:", error);
    return null;
  }
}

/**
 * Actualiza un proceso
 */
export async function updateProceso(
  id: string,
  data: Partial<CreateProcesoInput>,
): Promise<boolean> {
  try {
    const payload: any = {};

    if (data.nombre) payload.nombre = data.nombre;
    if (data.tiempo_antes !== undefined)
      payload.tiempo_antes = data.tiempo_antes;
    if (data.tiempo_despues !== undefined)
      payload.tiempo_despues = data.tiempo_despues;
    if (data.frecuencia_tipo) payload.frecuencia_tipo = data.frecuencia_tipo;
    if (data.frecuencia_cantidad !== undefined)
      payload.frecuencia_cantidad = data.frecuencia_cantidad;
    if (data.dias_semana !== undefined) payload.dias_semana = data.dias_semana;
    if (data.orden !== undefined) payload.orden = data.orden;

    await withAutoRefresh(() =>
      directus.request(updateItem("gp_proceso", id, payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al actualizar proceso:", error);
    return false;
  }
}

/**
 * Elimina un proceso
 */
export async function deleteProceso(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() => directus.request(deleteItem("gp_proceso", id)));

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proceso:", error);
    return false;
  }
}

/**
 * Crea un beneficio
 */
export async function createBeneficio(
  data: CreateBeneficioInput,
): Promise<string | null> {
  try {
    const payload = {
      proyecto_id: data.proyecto_id,
      descripcion: data.descripcion,
    };

    const result = await withAutoRefresh(() =>
      directus.request(createItem("gp_beneficios", payload)),
    );

    return result.id;
  } catch (error) {
    console.error("❌ Error al crear beneficio:", error);
    return null;
  }
}

/**
 * Crea múltiples beneficios para un proyecto
 */
export async function createBeneficios(
  beneficios: CreateBeneficioInput[],
): Promise<boolean> {
  try {
    const payload = beneficios.map((b) => ({
      proyecto_id: b.proyecto_id,
      descripcion: b.descripcion,
    }));

    await withAutoRefresh(() =>
      directus.request(createItems("gp_beneficios", payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al crear beneficios:", error);
    return false;
  }
}

/**
 * Actualiza un beneficio
 */
export async function updateBeneficio(
  id: string,
  data: Partial<CreateBeneficioInput>,
): Promise<boolean> {
  try {
    const payload: any = {};

    if (data.descripcion) payload.descripcion = data.descripcion;

    await withAutoRefresh(() =>
      directus.request(updateItem("gp_beneficios", id, payload)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al actualizar beneficio:", error);
    return false;
  }
}

/**
 * Elimina un beneficio
 */
export async function deleteBeneficio(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("gp_beneficios", id)),
    );

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar beneficio:", error);
    return false;
  }
}
