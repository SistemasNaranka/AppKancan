import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";
import { EmpleadoAsistencia, TipoNovedad } from "../../interfaces/horarios.interface";



export async function getEmpleados(storeId: number): Promise<EmpleadoAsistencia[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
        
          fields: ["id", "first_name", "last_name", "store_id", "position_id.name"],
        })
      )
    );

    return (items || []).map((emp: any) => ({
      id: String(emp.id),
      documento: String(emp.id), 
      nombre: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Empleado Sin Nombre",
      cargo: emp.position_id?.name || "Sin Cargo",
      estadoActual: "entrada_pendiente",
      registros: {
        inicioJornada: null,
        inicioAlmuerzo: null,
        finAlmuerzo: null,
        finJornada: null,
        observaciones: {},
      },
    }));
  } catch (error) {
    console.error("❌ Error cargando la tabla adm_employees:", error);
    return [];
  }
}

export async function getTiposNovedad(): Promise<TipoNovedad[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_newness", {
          fields: ["id", "name"],
       
        })
      )
    );
    return (items || []).map((t: any) => ({
      id: t.id, 
      nombre: t.name,
      name: t.name,
    }));
  } catch (error) {
    console.error("❌ Error cargando com_newness:", error);
    return [];
  }
}

export async function getNovedades(): Promise<any[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_newness_reports", {
          fields: [
            "id",
            "date_created",
            "observations", 
            "newness_id.id",
            "newness_id.name",
            "employee_id.id",
            "employee_id.first_name",
            "employee_id.last_name",
            "report_date"
          ],
          sort: ["-id"], 
        })
      )
    );
    return items || [];
  } catch (error) {
    console.error("❌ Error cargando la tabla com_newness_reports:", error);
    return [];
  }
}

export interface TimeRecord {
  id: number;
  record_date: string;
  record_time: string;
  log_type: string;
  employee_id: { first_name: string; last_name: string };
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
        fields: ['id', 'record_date', 'record_time', 'log_type', 'employee_id.first_name', 'employee_id.last_name', 'store_id', 'observations'],
        filter,
        sort: ['-record_date'],
        limit: -1,
      })
    )
  ) as TimeRecord[];
};

export async function getTimeRecords(storeId: number, date: string): Promise<any[]> {
  try {
    return await withAutoRefresh(() =>
      directus.request(
        readItems('com_time_records', {
          fields: ['id', 'record_date', 'record_time', 'log_type', 'employee_id.id', 'store_id', 'observations'],
          filter: {
            store_id: { _eq: storeId },
            record_date: { _eq: date }
          },
          limit: -1
        })
      )
    );
  } catch (error) {
    console.error('❌ Error al obtener registros de tiempo:', error);
    return [];
  }
}