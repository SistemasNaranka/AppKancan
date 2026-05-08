import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, createItems, deleteItem, updateItem } from "@directus/sdk";
import type {
  CreateProyectoInput,
  CreateProcesoInput,
  CreateBeneficioInput,
} from "../../types";

export async function createProject(
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

export async function ProjectUpdate(
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
    if (data.fecha_entrega !== undefined) payload.fecha_entrega = data.fecha_entrega;
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

// ✅ FIX: inserciones individuales + Number(proyecto_id)
export async function Createprocesses(
  procesos: CreateProcesoInput[],
): Promise<boolean> {
  for (const p of procesos) {
    const payload = {
      proyecto_id: Number(p.proyecto_id), // ← FIX CLAVE
      nombre: p.nombre,
      tiempo_antes: p.tiempo_antes,
      tiempo_despues: p.tiempo_despues,
      frecuencia_tipo: p.frecuencia_tipo,
      frecuencia_cantidad: p.frecuencia_cantidad,
      dias_semana: p.dias_semana,
      orden: p.orden,
    };
    await withAutoRefresh(() =>
      directus.request(createItem("gp_proceso", payload)),
    );
  }
  return true;
}

export async function createProcess(
  data: CreateProcesoInput,
): Promise<string | null> {
  try {
    const payload = {
      proyecto_id: Number(data.proyecto_id), // ← FIX
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

export async function updateProcess(
  id: string,
  data: Partial<CreateProcesoInput>,
): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.nombre) payload.nombre = data.nombre;
    if (data.tiempo_antes !== undefined) payload.tiempo_antes = data.tiempo_antes;
    if (data.tiempo_despues !== undefined) payload.tiempo_despues = data.tiempo_despues;
    if (data.frecuencia_tipo) payload.frecuencia_tipo = data.frecuencia_tipo;
    if (data.frecuencia_cantidad !== undefined) payload.frecuencia_cantidad = data.frecuencia_cantidad;
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

export async function deleteProcess(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() => directus.request(deleteItem("gp_proceso", id)));
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proceso:", error);
    return false;
  }
}

export async function createBenefit(
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

export async function createBenefits(
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

export async function updateBenefits(
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

export async function deleteBenefits(id: string): Promise<boolean> {
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

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface CreateFeedbackInput {
  proyecto_id: string;
  autor: string;
  descripcion: string;
  tipo?: string;
}

export async function createFeedback(
  data: CreateFeedbackInput,
): Promise<string | null> {
  try {
    const payload: any = {
      proyecto_id: data.proyecto_id,
      autor: data.autor,
      descripcion: data.descripcion,
    };
    if (data.tipo) payload.tipo = data.tipo;
    const result = await withAutoRefresh(() =>
      directus.request(createItem("gp_feedback", payload)),
    );
    return result.id;
  } catch (error) {
    console.error("❌ Error al crear feedback:", error);
    return null;
  }
}

export async function updateFeedback(
  id: string,
  data: Partial<CreateFeedbackInput>,
): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.autor) payload.autor = data.autor;
    if (data.descripcion) payload.descripcion = data.descripcion;
    if (data.tipo) payload.tipo = data.tipo;
    await withAutoRefresh(() =>
      directus.request(updateItem("gp_feedback", id, payload)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al actualizar feedback:", error);
    return false;
  }
}

export async function deleteFeedback(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("gp_feedback", id)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar feedback:", error);
    return false;
  }
}