import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readMe } from "@directus/sdk";
import { EmpleadoAsistencia, TipoNovedad, Tienda, Cargo, EmpleadoAdmin } from "../../interfaces/horarios.interface";

export async function getStoreIdUsuarioActual(): Promise<number | null> {
  try {
    const me: any = await withAutoRefresh(() =>
      directus.request(readMe({ fields: ["store_id", "store.id"] as any }))
    );
    const raw = me?.store_id ?? me?.store?.id ?? null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
  } catch (error) {
    console.error("❌ Error obteniendo store_id del usuario (readMe):", error);
    return null;
  }
}



export async function getEmpleados(storeId: number): Promise<EmpleadoAsistencia[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: ["id", "first_name", "middle_name", "last_name", "second_last_name", "store_id", "position_id.name"],
          filter: {
            store_id: { _eq: storeId },
            status: { _eq: "Activo" }
          },
          limit: -1,
        })
      )
    );

    return (items || []).map((emp: any) => {
      const parts = [
        emp.first_name,
        emp.middle_name,
        emp.last_name,
        emp.second_last_name
      ].filter(part => part && part.trim() !== "");
      const full_name = parts.join(" ").trim() || "Empleado Sin Nombre";

      return {
        id: String(emp.id),
        documento: String(emp.id), 
        nombre: full_name,
        cargo: emp.position_id?.name || "Sin Cargo",
        estadoActual: "entrada_pendiente",
        registros: {
          inicioJornada: null,
          inicioAlmuerzo: null,
          finAlmuerzo: null,
          finJornada: null,
          observaciones: {},
        },
      };
    });
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

export async function getNovedades(storeId: number): Promise<any[]> {
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
            "employee_id.middle_name",
            "employee_id.last_name",
            "employee_id.second_last_name",
            "report_date"
          ],
          filter: { store_id: { _eq: storeId } },
          sort: ["-id"],
          limit: -1,
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
  original_record_time: string | null;
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
  fechaFin?: string,
  storeId?: number
): Promise<TimeRecord[]> => {
  const filter: any = {};

  if (storeId != null) {
    filter.store_id = { _eq: storeId };
  }
  if (fechaInicio) {
    filter.record_date = { ...filter.record_date, _gte: fechaInicio };
  }
  if (fechaFin) {
    filter.record_date = { ...filter.record_date, _lte: fechaFin };
  }

  return await withAutoRefresh(() =>
    directus.request(
      readItems('com_time_records', {

        fields: ['id', 'record_date', 'record_time', 'original_record_time', 'log_type', 'employee_id.first_name', 'employee_id.middle_name', 'employee_id.last_name', 'employee_id.second_last_name', 'store_id', 'observations'],

 
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
          fields: ['id', 'record_date', 'record_time', 'original_record_time', 'log_type', 'employee_id.id', 'store_id', 'observations'],
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

/* ──────────────────────────────────────────────────────────────
   Panel administrativo de empleados
   ────────────────────────────────────────────────────────────── */

// Todas las tiendas (para el selector del admin; no se filtra por la del usuario).
export async function getStores(): Promise<Tienda[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_stores", {
          fields: ["id", "name", "ultra_code", "company"],
          sort: ["name"],
          limit: -1,
        })
      )
    );
    return (data || []) as Tienda[];
  } catch (error) {
    console.error("❌ Error cargando core_stores:", error);
    return [];
  }
}

// Catálogo de cargos (core_positions).
export async function getCargos(): Promise<Cargo[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_positions", {
          fields: ["id", "name"],
          sort: ["name"],
          limit: -1,
        })
      )
    );
    return (data || []).map((c: any) => ({ id: c.id, name: c.name || "Sin nombre" })) as Cargo[];
  } catch (error) {
    console.error("❌ Error cargando core_positions:", error);
    return [];
  }
}

// Busca un empleado por número de documento, sin filtrar por estado
// (debe encontrar Activos e Inactivos para reingreso/cambio de tienda).
export async function buscarEmpleadoPorDocumento(documentNumber: string): Promise<EmpleadoAdmin | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: [
            "id", "document_type", "document_number",
            "first_name", "middle_name", "last_name", "second_last_name",
            "store_id", "position_id", "position_id.name", "status",
          ],
          filter: { document_number: { _eq: documentNumber } },
          limit: 1,
        })
      )
    );
    const emp: any = (items || [])[0];
    if (!emp) return null;
    return {
      id: emp.id,
      document_type: emp.document_type ?? null,
      document_number: emp.document_number != null ? String(emp.document_number) : null,
      first_name: emp.first_name ?? null,
      middle_name: emp.middle_name ?? null,
      last_name: emp.last_name ?? null,
      second_last_name: emp.second_last_name ?? null,
      store_id: emp.store_id != null ? Number(emp.store_id) : null,
      position_id: emp.position_id?.id != null ? Number(emp.position_id.id) : (emp.position_id != null ? Number(emp.position_id) : null),
      position_name: emp.position_id?.name ?? null,
      status: emp.status ?? null,
    };
  } catch (error) {
    console.error("❌ Error buscando empleado por documento:", error);
    throw error;
  }
}

