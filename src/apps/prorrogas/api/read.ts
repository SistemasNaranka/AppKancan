import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, aggregate } from "@directus/sdk";
import type {
  Contrato,
  ContratoFilters,
  ContratoStats,
  PaginationParams,
  PaginatedResponse,
  Prorroga,
} from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildFilter(filters: ContratoFilters) {
  const conditions: object[] = [];

  if (filters.request_status && filters.request_status.length > 0) {
    conditions.push({ request_status: { _in: filters.request_status } });
  }

  if (filters.area) {
    conditions.push({ empleado_area: { _eq: filters.area } });
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    conditions.push({
      _or: [
        { nombre: { _icontains: q } },
        { empleado_area:   { _icontains: q } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : undefined;
}

/**
 * Directus devuelve el campo `cargo` como un objeto { id, nombre } cuando se
 * expande la relación con util_cargo. Aquí normalizamos para que el resto de
 * la app siempre reciba un string con el nombre del cargo.
 */
function normalizeCargo(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'object' && raw !== null && 'nombre' in raw) {
    return (raw as { nombre: string }).nombre ?? '';
  }
  // Fallback: ya era string (p.ej. en pruebas locales)
  if (typeof raw === 'string') return raw;
  return '';
}

function normalizeContrato(item: any): Contrato {
  return {
    ...item,
    cargo: normalizeCargo(item.cargo),
    prorrogas:  item.prorrogas  ?? [],
    documentos: item.documentos ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos
// ─────────────────────────────────────────────────────────────────────────────

// Fields comunes — expandimos cargo → util_cargo para obtener el nombre
const CONTRATO_FIELDS = [
  "*",
  "cargo.id",
  "cargo.nombre",
  "tipo_contrato",
  "fecha_final",
  "prorrogas.*",
  "documentos.*",
];

export async function getContratos(
  filters: ContratoFilters = {},
  pagination: PaginationParams = { page: 0, limit: 25 }
): Promise<PaginatedResponse<Contrato>> {
  try {
    const filter = buildFilter(filters);
    const offset = pagination.page * pagination.limit;

    const sortField = pagination.sort ?? "date_created";
    const sortDir   = pagination.order === "asc" ? sortField : `-${sortField}`;

    const readOptions: any = {
      fields: CONTRATO_FIELDS,
      limit:  pagination.limit,
      sort:   [sortDir],
    };
    if (filter)     readOptions.filter = filter;
    if (offset > 0) readOptions.offset = offset;

    const [items, countResult] = await Promise.all([
      withAutoRefresh(() =>
        directus.request(readItems("contratos", readOptions))
      ),
      withAutoRefresh(() =>
        directus.request(
          aggregate("contratos", {
            aggregate: { count: ["id"] },
            ...(filter ? { query: { filter } } : {}),
          })
        )
      ),
    ]);

    const total = Number(
      (countResult as Array<{ count: { id: string } }>)?.[0]?.count?.id ?? 0
    );

    return {
      data:  (items as any[]).map(normalizeContrato),
      total,
      page:  pagination.page,
      limit: pagination.limit,
    };
  } catch (error) {
    console.error("❌ Error al cargar contratos:", error);
    return { data: [], total: 0, page: pagination.page, limit: pagination.limit };
  }
}

export async function getContratoById(id: number): Promise<Contrato | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("contratos", {
          fields: CONTRATO_FIELDS,
          filter: { id: { _eq: id } },
          limit: 1,
        })
      )
    );

    if (!items || (items as any[]).length === 0) {
      console.warn(`⚠️ Contrato con ID ${id} no encontrado`);
      return null;
    }

    return normalizeContrato((items as any[])[0]);
  } catch (error) {
    console.error(`❌ Error al cargar contrato ${id}:`, error);
    return null;
  }
}

export async function getContratoStats(
  filters: ContratoFilters = {}
): Promise<ContratoStats> {
  try {
    const { request_status: _rs, ...filtersWithoutStatus } = filters;
    const filter = buildFilter(filtersWithoutStatus);

    const result = await withAutoRefresh(() =>
      directus.request(
        aggregate("contratos", {
          aggregate: { count: ["id"] },
          query: {
            filter,
            groupBy: ["request_status"],
          },
        })
      )
    );

    const stats: ContratoStats = {
      total:       0,
      pendiente:   0,
      en_revision: 0,
      aprobada:    0,
      rechazada:   0,
      completada:  0,
    };

    (result as Array<{ request_status: string; count: { id: string } }>).forEach(
      (row) => {
        const count = Number(row.count?.id ?? 0);
        stats.total += count;

        switch (row.request_status) {
          case "pendiente":   stats.pendiente   = count; break;
          case "en_revision": stats.en_revision = count; break;
          case "aprobada":    stats.aprobada    = count; break;
          case "rechazada":   stats.rechazada   = count; break;
          case "completada":  stats.completada  = count; break;
        }
      }
    );

    return stats;
  } catch (error) {
    console.error("❌ Error al cargar estadísticas de contratos:", error);
    return { total: 0, pendiente: 0, en_revision: 0, aprobada: 0, rechazada: 0, completada: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prórrogas
// ─────────────────────────────────────────────────────────────────────────────

export async function getProrrogasByContrato(
  contratoId: number
): Promise<Prorroga[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("prorrogas", {
          fields: ["*"],
          filter: { contrato_id: { _eq: contratoId } },
          sort:   ["numero"],
        })
      )
    );

    return items as Prorroga[];
  } catch (error) {
    console.error(`❌ Error al cargar prórrogas del contrato ${contratoId}:`, error);
    return [];
  }
}