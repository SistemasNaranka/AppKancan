import directus from "@/services/directus/directus";
import { createItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function createNovedad(data: { 
  employee_id: number; 
  newness_id: number; // 🚀 Cambiado a number para evitar el error inesperado (500)
  report_date: string; 
  observations?: string; 
  store_id?: number; 
}) {
  try {
    // Sanitizamos todos los datos antes de enviarlos a la BD
    const payload = {
      employee_id: Number(data.employee_id),
      newness_id: Number(data.newness_id), // Forzamos a entero puro
      report_date: data.report_date,       // Formato exacto YYYY-MM-DD
      observations: data.observations || '',
      store_id: Number(data.store_id || 90), 
    };

    return await withAutoRefresh(() => 
      directus.request(createItem('com_newness_reports', payload))
    );
  } catch (error: any) {
    console.error('❌ Error crítico guardando en BD:', error);
    throw new Error(error?.errors?.[0]?.message || 'Error inesperado al guardar en Directus');
  }
}