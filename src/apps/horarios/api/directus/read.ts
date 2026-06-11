import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";
import dayjs from 'dayjs'; // Importamos dayjs para formatear la fecha que viene de Directus

export async function getEmpleados() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: ["id", "first_name", "last_name", "*"],
        })
      )
    );
    return items.map((emp: any) => {
      const docNum = emp.document_number || emp.document || emp.documento || "";
      return {
        id: String(emp.id),
        nombre: `${emp.first_name} ${emp.last_name}`.trim(),
        documento: String(docNum),
      };
    });
  } catch (error) {
    console.error("❌ Error empleados:", error);
    return [];
  }
}

export async function getNovedades() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_newness_reports", {
          fields: [
            "id",
            "newness_id",
            "report_date",
            "store_id",
            "employee_id.*",
            "description",
            "notes",
          ],
          sort: ["-report_date"],
        })
      )
    );
    
    return items.map((n: any) => {
      let empleadoNombre = "Desconocido";
      let empleadoDocumento = "";
      if (n.employee_id && typeof n.employee_id === "object") {
        const first = n.employee_id.first_name || "";
        const last = n.employee_id.last_name || "";
        empleadoNombre = `${first} ${last}`.trim() || "Desconocido";
        
        const docNum = n.employee_id.document_number || n.employee_id.document || n.employee_id.documento || "";
        empleadoDocumento = String(docNum);
      }
      
      return {
        id: String(n.id),
        empleadoId: n.employee_id?.id ? String(n.employee_id.id) : '',
        empleadoNombre,
        empleadoDocumento,
        tipo: n.newness_id || 'Desconocido', // 👈 MAPEO CLAVE: Asigna newness_id a 'tipo' para activar los iconos en RegistrosPage
        fecha: n.report_date ? dayjs(n.report_date).format('YYYY-MM-DD') : '', // 👈 Formatea la fecha limpia
        description: n.description || '', // 👈 MAPEO CLAVE: Pasa la descripción a la tabla
        notes: n.notes || '',             // 👈 MAPEO CLAVE: Pasa las notas a la tabla
      };
    });
  } catch (error) {
    console.error("❌ Error novedades:", error);
    return [];
  }
}

export interface TimeRecord {
  id: number;
  record_date: string;
  record_time: string;
  log_type: string;
  employee_id: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
  } | null;
  store_id: string;
  observations: string | null;
}

export const fetchTimeRecords = async (
  fechaInicio?: string,
  fechaFin?: string
): Promise<TimeRecord[]> => {
  const filter: any = {};

  if (fechaInicio) {
    filter.record_date = { ...filter.record_date, _gte: fechaInicio };
  }
  if (fechaFin) {
    filter.record_date = { ...filter.record_date, _lte: fechaFin };
  }

  return await withAutoRefresh(() =>
    directus.request(
      readItems('com_time_records', {
        fields: ['id', 'record_date', 'record_time', 'log_type', 'employee_id.first_name', 'employee_id.middle_name', 'employee_id.last_name', 'employee_id.second_last_name', 'store_id', 'observations'],
        filter,
        sort: ['-record_date'],
        limit: -1,
      })
    )
  ) as TimeRecord[];
};