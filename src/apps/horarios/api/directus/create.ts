import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { createItem } from "@directus/sdk";

export async function createNovedad(data: {
  employee_id: number;
  newness_id: string;
  report_date: string;
  store_id?: number;
  description?: string; // 👈 AGREGADO EN EL TIPADO
  notes?: string;        // 👈 AGREGADO EN EL TIPADO
}) {
  try {
    const payload = {
      employee_id: data.employee_id,
      newness_id: data.newness_id,
      report_date: data.report_date,
      store_id: data.store_id ?? 90,
      description: data.description || '', // 👈 ENVIAR A DIRECTUS
      notes: data.notes || '',             // 👈 ENVIAR A DIRECTUS
    };
    
    console.log("📤 Enviando a Directus (create):", payload);
    const result = await withAutoRefresh(() =>
      directus.request(createItem("com_newness_reports", payload))
    );
    console.log("✅ Novedad creada:", result);
    return result;
  } catch (error) {
    console.error("❌ Error en createNovedad:", error);
    throw error;
  }
}