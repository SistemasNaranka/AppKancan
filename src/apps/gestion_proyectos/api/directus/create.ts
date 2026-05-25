import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem, createItems, deleteItem, updateItem } from "@directus/sdk";
import type {
  CreateProjectInput,
  CreateProcessInput,
  CreateBenefitInput,
  CreateFeedbackInput,
} from "../../types";

export async function createProject(
  data: CreateProjectInput,
): Promise<string | null> {
  try {
    const payload: any = {
      name: data.name,
      benefited_area: data.benefited_area,
      description: data.description || null,
      start_date: data.start_date,
      estimated_date: data.estimated_date || null,
      delivery_date: data.delivery_date || null,
      status: data.status,
      project_type: data.project_type,
    };
    if (data.assignees && data.assignees.length > 0) {
      payload.assignees = data.assignees;
    }
    const result = await withAutoRefresh(() =>
      directus.request(createItem("sys_projects", payload)),
    );
    return result.id;
  } catch (error) {
    console.error("❌ Error al crear proyecto:", error);
    return null;
  }
}

export async function updateProject(
  id: string,
  data: Partial<CreateProjectInput>,
): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.benefited_area) payload.benefited_area = data.benefited_area;
    if (data.description) payload.description = data.description;
    if (data.start_date) payload.start_date = data.start_date;
    if (data.estimated_date) payload.estimated_date = data.estimated_date;
    if (data.delivery_date !== undefined) payload.delivery_date = data.delivery_date;
    if (data.status) payload.status = data.status;
    if (data.project_type) payload.project_type = data.project_type;
    if (data.assignees) payload.assignees = data.assignees;
    await withAutoRefresh(() =>
      directus.request(updateItem("sys_projects", id, payload)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al actualizar proyecto:", error);
    return false;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("sys_projects", id)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proyecto:", error);
    return false;
  }
}

// ✅ FIX: individual insertions + Number(project_id)
export async function createProcesses(
  processes: CreateProcessInput[],
): Promise<boolean> {
  for (const p of processes) {
    const payload = {
      project_id: Number(p.project_id), // ← KEY FIX
      name: p.name,
      time_before: p.time_before,
      time_after: p.time_after,
      frequency_type: p.frequency_type,
      frequency_quantity: p.frequency_quantity,
      weekdays: p.weekdays,
      order: p.order,
    };
    await withAutoRefresh(() =>
      directus.request(createItem("sys_processes", payload)),
    );
  }
  return true;
}

export async function createProcess(
  data: CreateProcessInput,
): Promise<string | null> {
  try {
    const payload = {
      project_id: Number(data.project_id), // ← FIX
      name: data.name,
      time_before: data.time_before,
      time_after: data.time_after,
      frequency_type: data.frequency_type,
      frequency_quantity: data.frequency_quantity,
      weekdays: data.weekdays,
      order: data.order,
    };
    const result = await withAutoRefresh(() =>
      directus.request(createItem("sys_processes", payload)),
    );
    return result.id;
  } catch (error) {
    console.error("❌ Error al crear proceso:", error);
    return null;
  }
}

export async function updateProcess(
  id: string,
  data: Partial<CreateProcessInput>,
): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.time_before !== undefined) payload.time_before = data.time_before;
    if (data.time_after !== undefined) payload.time_after = data.time_after;
    if (data.frequency_type) payload.frequency_type = data.frequency_type;
    if (data.frequency_quantity !== undefined) payload.frequency_quantity = data.frequency_quantity;
    if (data.weekdays !== undefined) payload.weekdays = data.weekdays;
    if (data.order !== undefined) payload.order = data.order;
    await withAutoRefresh(() =>
      directus.request(updateItem("sys_processes", id, payload)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al actualizar proceso:", error);
    return false;
  }
}

export async function deleteProcess(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() => directus.request(deleteItem("sys_processes", id)));
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar proceso:", error);
    return false;
  }
}

export async function createBenefit(
  data: CreateBenefitInput,
): Promise<string | null> {
  try {
    const payload = {
      project_id: data.project_id,
      description: data.description,
    };
    const result = await withAutoRefresh(() =>
      directus.request(createItem("sys_benefits", payload)),
    );
    return result.id;
  } catch (error) {
    console.error("❌ Error al crear beneficio:", error);
    return null;
  }
}

export async function createBenefits(
  benefits: CreateBenefitInput[],
): Promise<boolean> {
  try {
    const payload = benefits.map((b) => ({
      project_id: b.project_id,
      description: b.description,
    }));
    await withAutoRefresh(() =>
      directus.request(createItems("sys_benefits", payload)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al crear beneficios:", error);
    return false;
  }
}

export async function updateBenefit(
  id: string,
  data: Partial<CreateBenefitInput>,
): Promise<boolean> {
  try {
    const payload: any = {};
    if (data.description) payload.description = data.description;
    await withAutoRefresh(() =>
      directus.request(updateItem("sys_benefits", id, payload)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al actualizar beneficio:", error);
    return false;
  }
}

export async function deleteBenefit(id: string): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("sys_benefits", id)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar beneficio:", error);
    return false;
  }
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function createFeedback(
  data: CreateFeedbackInput,
): Promise<string | null> {
  try {
    const payload: any = {
      project_id: data.project_id,
      author: data.author,
      description: data.description,
    };
    const result = await withAutoRefresh(() =>
      directus.request(createItem("sys_feedback", payload)),
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
    if (data.author) payload.author = data.author;
    if (data.description) payload.description = data.description;
    await withAutoRefresh(() =>
      directus.request(updateItem("sys_feedback", id, payload)),
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
      directus.request(deleteItem("sys_feedback", id)),
    );
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar feedback:", error);
    return false;
  }
}