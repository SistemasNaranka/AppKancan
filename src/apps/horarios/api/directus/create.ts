import directus from "@/services/directus/directus";
import { createItem, createItems, updateItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function createNovedad(data: { 
  employee_id: number; 
  newness_id: number;
  report_date: string; 
  observations?: string; 
  store_id?: number; 
}) {
  try {
    const payload = {
      employee_id: Number(data.employee_id),
      newness_id: Number(data.newness_id),
      report_date: data.report_date,
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

export async function createNovedades(items: { 
  employee_id: number; 
  newness_id: number; 
  report_date: string; 
  observations?: string; 
  store_id?: number; 
}[]) {
  try {
    const payloads = items.map((data) => ({
      employee_id: Number(data.employee_id),
      newness_id: Number(data.newness_id),
      report_date: data.report_date,
      observations: data.observations || '',
      store_id: Number(data.store_id || 90),
    }));
    return await withAutoRefresh(() => 
      directus.request(createItems('com_newness_reports', payloads))
    );
  } catch (error: any) {
    console.error('❌ Error crítico guardando novedades en lote en BD:', error);
    throw new Error(error?.errors?.[0]?.message || 'Error inesperado al guardar novedades en Directus');
  }
}

export async function createTimeRecord(data: {
  employee_id: number;
  store_id: number;
  log_type: string;
  record_date: string;
  record_time: string;
  observations?: string;
}) {
  try {
    const payload = {
      employee_id: Number(data.employee_id),
      store_id: Number(data.store_id || 90),
      log_type: data.log_type,
      record_date: data.record_date,
      record_time: data.record_time,
      observations: data.observations || '',
    };
    return await withAutoRefresh(() =>
      directus.request(createItem('com_time_records', payload))
    );
  } catch (error: any) {
    console.error('❌ Error guardando registro de tiempo:', error);
    throw new Error(error?.errors?.[0]?.message || 'Error al crear registro de tiempo');
  }
}

// ✅ Corregido: ahora acepta record_time y observations
export async function updateTimeRecord(id: number, data: { observations?: string; record_time?: string }) {
  try {
    const payload: any = {};
    if (data.observations !== undefined) payload.observations = data.observations;
    if (data.record_time !== undefined) payload.record_time = data.record_time;
    return await withAutoRefresh(() =>
      directus.request(updateItem('com_time_records', id, payload))
    );
  } catch (error: any) {
    console.error('❌ Error al actualizar registro de tiempo:', error);
    throw new Error(error?.errors?.[0]?.message || 'Error al actualizar registro de tiempo');
  }
}