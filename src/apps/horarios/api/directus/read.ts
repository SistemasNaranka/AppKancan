import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, readMe } from "@directus/sdk";
import { EmpleadoAsistencia, TipoNovedad, Tienda, Cargo, EmpleadoAdmin, Motivo } from "../../interfaces/horarios.interface";

// Tienda "Oficina" usada para pruebas. Se excluye de las exportaciones salvo
// que quien exporta sea admin (incluirPruebas = true).
export const STORE_PRUEBAS = 90;

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

export async function getReasonNamesForRecords(recordIds: number[]): Promise<Map<number, string>> {
  const mapa = new Map<number, string>();
  if (!recordIds || recordIds.length === 0) return mapa;
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_records_reasons", {
          fields: ["records_id", "reasons_id.name"],
          filter: { records_id: { _in: recordIds } },
          limit: -1,
        })
      )
    );
    (items || []).forEach((it: any) => {
      const rid = Number(typeof it.records_id === "object" ? it.records_id?.id : it.records_id);
      const nombre = it.reasons_id?.name ?? null;
      if (Number.isFinite(rid) && nombre) mapa.set(rid, nombre);
    });
    return mapa;
  } catch (error) {
    console.error("❌ Error obteniendo motivos de los registros:", error);
    return mapa;
  }
}

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
    document_number?: string | number | null;
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

        fields: ['id', 'record_date', 'record_time', 'original_record_time', 'log_type', 'employee_id.document_number', 'employee_id.first_name', 'employee_id.middle_name', 'employee_id.last_name', 'employee_id.second_last_name', 'store_id', 'observations'],


        filter,
        sort: ['-record_date'],
        limit: -1,
      })
    )
  ) as TimeRecord[];
};

export const fetchTimeRecordsExport = async (
  fechaInicio?: string,
  fechaFin?: string,
  storeIds?: number[],
  incluirPruebas = false
): Promise<TimeRecord[]> => {
  const filter: any = {};

  if (storeIds && storeIds.length > 0) {
    filter.store_id = { _in: storeIds };
  }
  if (!incluirPruebas) {
    filter.store_id = { ...(filter.store_id || {}), _neq: STORE_PRUEBAS };
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
        fields: ['id', 'record_date', 'record_time', 'original_record_time', 'log_type', 'employee_id.document_number', 'employee_id.first_name', 'employee_id.middle_name', 'employee_id.last_name', 'employee_id.second_last_name', 'store_id', 'observations'],
        filter,
        sort: ['record_date'],
        limit: -1,
      })
    )
  ) as TimeRecord[];
};

export interface NewnessReport {
  id: number;
  report_date: string | null;
  date_created: string | null;
  observations: string | null;
  newness_id: { name?: string | null } | null;
  store_id: string | number | null;
  employee_id: {
    document_number?: string | number | null;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
  } | null;
}

export const fetchNewnessReportsExport = async (
  fechaInicio?: string,
  fechaFin?: string,
  storeIds?: number[],
  incluirPruebas = false
): Promise<NewnessReport[]> => {
  const filter: any = { _and: [] };

  if (storeIds && storeIds.length > 0) {
    filter._and.push({ store_id: { _in: storeIds } });
  }
  if (!incluirPruebas) {
    filter._and.push({ store_id: { _neq: STORE_PRUEBAS } });
  }

  if (fechaInicio || fechaFin) {
    const reportRange: any = {};
    const createdRange: any = {};
    if (fechaInicio) {
      reportRange._gte = fechaInicio;
      createdRange._gte = `${fechaInicio}T00:00:00`;
    }
    if (fechaFin) {
      reportRange._lte = fechaFin;
      createdRange._lte = `${fechaFin}T23:59:59`;
    }
    filter._and.push({
      _or: [
        { report_date: reportRange },
        { _and: [{ report_date: { _null: true } }, { date_created: createdRange }] },
      ],
    });
  }

  if (filter._and.length === 0) delete filter._and;

  return await withAutoRefresh(() =>
    directus.request(
      readItems('com_newness_reports', {
        fields: [
          'id',
          'report_date',
          'date_created',
          'observations',
          'newness_id.name',
          'store_id',
          'employee_id.document_number',
          'employee_id.first_name',
          'employee_id.middle_name',
          'employee_id.last_name',
          'employee_id.second_last_name',
        ],
        filter,
        sort: ['report_date'],
        limit: -1,
      })
    )
  ) as NewnessReport[];
};

export interface EventReportExport {
  event_type: string;
  date: string | null;
  hour: string | null;
  observations: string | null;
  store_id: string | number | null;
  employee_id: {
    document_number?: string | number | null;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
  } | null;
}

export const fetchEventReportsExport = async (
  fechaInicio?: string,
  fechaFin?: string,
  storeIds?: number[],
  incluirPruebas = false
): Promise<EventReportExport[]> => {
  const filter: any = {};
  if (storeIds && storeIds.length > 0) filter.store_id = { _in: storeIds };
  if (!incluirPruebas) filter.store_id = { ...(filter.store_id || {}), _neq: STORE_PRUEBAS };
  if (fechaInicio) filter.date = { ...filter.date, _gte: fechaInicio };
  if (fechaFin) filter.date = { ...filter.date, _lte: fechaFin };

  return await withAutoRefresh(() =>
    directus.request(
      readItems('com_event_reports', {
        fields: [
          'event_type',
          'date',
          'hour',
          'observations',
          'store_id',
          'employee_id.document_number',
          'employee_id.first_name',
          'employee_id.middle_name',
          'employee_id.last_name',
          'employee_id.second_last_name',
        ],
        filter,
        sort: ['date', 'hour'],
        limit: -1,
      })
    )
  ) as EventReportExport[];
};


export async function getEmployeeTimeRecords(
  employeeId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<any[]> {
  try {
    return await withAutoRefresh(() =>
      directus.request(
        readItems('com_time_records', {
          fields: ['id', 'record_date', 'record_time', 'original_record_time', 'log_type'],
          filter: { employee_id: { _eq: employeeId }, record_date: { _gte: fechaInicio, _lte: fechaFin } },
          sort: ['record_date', 'record_time'],
          limit: -1,
        })
      )
    );
  } catch (error) {
    console.error('❌ Error cargando marcaciones del empleado:', error);
    return [];
  }
}

export async function getEmployeeNovedades(employeeId: number, limit = 10): Promise<any[]> {
  try {
    return await withAutoRefresh(() =>
      directus.request(
        readItems('com_newness_reports', {
          fields: ['id', 'report_date', 'date_created', 'observations', 'newness_id.name'],
          filter: { employee_id: { _eq: employeeId } },
          sort: ['-id'],
          limit,
        })
      )
    );
  } catch (error) {
    console.error('❌ Error cargando novedades del empleado:', error);
    return [];
  }
}

export async function getEmployeeEventReports(
  employeeId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<any[]> {
  try {
    return await withAutoRefresh(() =>
      directus.request(
        readItems('com_event_reports', {
          fields: ['id', 'event_type', 'date', 'hour', 'observations'],
          filter: { employee_id: { _eq: employeeId }, date: { _gte: fechaInicio, _lte: fechaFin } },
          sort: ['-date', '-hour'],
          limit: -1,
        })
      )
    );
  } catch (error) {
    console.error('❌ Error cargando eventos del empleado:', error);
    return [];
  }
}

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


const idRelacion = (val: any): number | null => {
  const raw = val != null && typeof val === "object" ? val.id : val;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

const mapEmpleadoAdmin = (emp: any): EmpleadoAdmin => ({
  id: emp.id,
  document_type: emp.document_type ?? null,
  document_number: emp.document_number != null ? String(emp.document_number) : null,
  first_name: emp.first_name ?? null,
  middle_name: emp.middle_name ?? null,
  last_name: emp.last_name ?? null,
  second_last_name: emp.second_last_name ?? null,
  store_id: idRelacion(emp.store_id),
  position_id: idRelacion(emp.position_id),
  position_name: (typeof emp.position_id === "object" ? emp.position_id?.name : null) ?? null,
  status: emp.status ?? null,
});

export async function listarEmpleadosTienda(storeId: number): Promise<EmpleadoAdmin[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: [
            "id", "document_type", "document_number",
            "first_name", "middle_name", "last_name", "second_last_name",
            "store_id", "position_id.id", "position_id.name", "status",
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

export async function listarTodosEmpleados(): Promise<EmpleadoAdmin[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_employees", {
          fields: [
            "id", "document_type", "document_number",
            "first_name", "middle_name", "last_name", "second_last_name",
            "store_id", "position_id.id", "position_id.name", "status",
          ],
          sort: ["first_name", "last_name"],
          limit: -1,
        })
      )
    );
    return (items || []).map(mapEmpleadoAdmin);
  } catch (error) {
    console.error("❌ Error listando todos los empleados:", error);
    throw error;
  }
}

export async function buscarEmpleados(query: string): Promise<EmpleadoAdmin[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const esNumero = /^\d+$/.test(q);
    const tokens = q.split(/\s+/).filter(Boolean);
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
            "store_id", "position_id.id", "position_id.name", "status",
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

