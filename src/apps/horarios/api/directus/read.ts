import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readMe } from "@directus/sdk";
import { EmpleadoAsistencia, TipoNovedad, Tienda, Cargo, EmpleadoAdmin, Motivo } from "../../interfaces/horarios.interface";

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

// Catálogo de motivos de edición de hora (com_reasons), solo activos.
export async function getReasons(): Promise<Motivo[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_reasons", {
          fields: ["id", "name"],
          filter: { status: { _eq: true } },
          sort: ["name"],
          limit: -1,
        })
      )
    );
    const motivos = (items || []).map((r: any) => ({ id: Number(r.id), name: r.name || "" }));
    // "Otro" siempre va de última opción, el resto en orden alfabético.
    return motivos.sort((a: Motivo, b: Motivo) => {
      const aOtro = a.name.trim().toLowerCase() === "otro";
      const bOtro = b.name.trim().toLowerCase() === "otro";
      if (aOtro !== bOtro) return aOtro ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("❌ Error cargando com_reasons:", error);
    return [];
  }
}

// Motivo vinculado a un registro de tiempo (com_records_reasons) para precargar el selector.
export async function getRecordReasonId(recordId: number): Promise<number | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_records_reasons", {
          fields: ["reasons_id"],
          filter: { records_id: { _eq: recordId } },
          limit: 1,
        })
      )
    );
    const raw = (items || [])[0]?.reasons_id;
    if (raw == null) return null;
    const id = Number(typeof raw === "object" ? raw.id : raw);
    return Number.isFinite(id) ? id : null;
  } catch (error) {
    console.error("❌ Error obteniendo motivo del registro:", error);
    return null;
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

const mapEmpleadoAdmin = (emp: any): EmpleadoAdmin => ({
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
});

// Lista TODOS los empleados (activos e inactivos) de una tienda, para el panel admin.
export async function listarEmpleadosTienda(storeId: number): Promise<EmpleadoAdmin[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: [
            "id", "document_type", "document_number",
            "first_name", "middle_name", "last_name", "second_last_name",
            "store_id", "position_id", "position_id.name", "status",
          ],
          filter: { store_id: { _eq: storeId } },
          sort: ["first_name", "last_name"],
          limit: -1,
        })
      )
    );
    return (items || []).map(mapEmpleadoAdmin);
  } catch (error) {
    console.error("❌ Error listando empleados por tienda:", error);
    throw error;
  }
}

// Busca empleados por número de documento O por nombre/apellido (sin filtrar por
// estado: debe encontrar Activos e Inactivos para reingreso/cambio de tienda).
export async function buscarEmpleados(query: string): Promise<EmpleadoAdmin[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const esNumero = /^\d+$/.test(q);
    // Cada palabra debe coincidir en ALGÚN campo de nombre (AND entre palabras,
    // OR entre campos). Así "Brayan Riascos" matchea first_name + last_name.
    const tokens = q.split(/\s+/).filter(Boolean);
    // document_number es columna numérica: comparamos como número exacto.
    const filter: any = esNumero
      ? { document_number: { _eq: Number(q) } }
      : {
          _and: tokens.map((tok) => ({
            _or: [
              { first_name: { _icontains: tok } },
              { middle_name: { _icontains: tok } },
              { last_name: { _icontains: tok } },
              { second_last_name: { _icontains: tok } },
            ],
          })),
        };

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: [
            "id", "document_type", "document_number",
            "first_name", "middle_name", "last_name", "second_last_name",
            "store_id", "position_id", "position_id.name", "status",
          ],
          filter,
          sort: ["first_name", "last_name"],
          limit: 50,
        })
      )
    );
    return (items || []).map(mapEmpleadoAdmin);
  } catch (error) {
    console.error("❌ Error buscando empleados:", error);
    throw error;
  }
}

