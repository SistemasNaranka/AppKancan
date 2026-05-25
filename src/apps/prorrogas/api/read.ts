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

  if (filters.contract_type) {
    conditions.push({ contract_type: { _eq: filters.contract_type } });
  }

  if (filters.department) {
    conditions.push({ department: { _eq: filters.department } });
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    conditions.push({
      _or: [
        { first_name: { _icontains: q } },
        { department: { _icontains: q } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : undefined;
}

/**
 * Directus devuelve el campo `position` como un objeto { id, name } cuando se
 * expande la relación con core_positions. Aquí normalizamos para que el resto
 * de la app siempre reciba un string con el nombre del cargo.
 */
function normalizeCargo(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    return (raw as { name: string }).name ?? '';
  }
  // Fallback: ya era string (p.ej. en pruebas locales)
  if (typeof raw === 'string') return raw;
  return '';
}

function normalizeContrato(item: any): Contrato {
  return {
    ...item,
    position: normalizeCargo(item.position),
    extensions: item.extensions ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos
// ─────────────────────────────────────────────────────────────────────────────

// Fields comunes — expandimos position → core_positions para obtener el nombre
const CONTRATO_FIELDS = [
  "*",
  "position.id",
  "position.name",
  "contract_type",
  "end_date",
  "extensions.*",
];

export async function getContratos(
  filters: ContratoFilters = {},
  pagination: PaginationParams = { page: 0, limit: 25 },
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
        directus.request(readItems("adm_contracts", readOptions))
      ),
      withAutoRefresh(() =>
        directus.request(
          aggregate("adm_contracts", {
            aggregate: { count: ["id"] },
            ...(filter ? { query: { filter } } : {}),
          })
        )
      ),
    ]);

    const total = Number(
      (countResult as Array<{ count: { id: string } }>)?.[0]?.count?.id ?? 0,
    );

    return {
      data:  (items as any[]).map(normalizeContrato),
      total,
      page:  pagination.page,
      limit: pagination.limit,
    };
  } catch (error: any) {
    if (error?.response?.status === 403) {
    } else {
    }
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}

export async function getContratoById(id: number): Promise<Contrato | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_contracts", {
          fields: CONTRATO_FIELDS,
          filter: { id: { _eq: id } },
          limit: 1,
        }),
      ),
    );

    if (!items || (items as any[]).length === 0) {
      return null;
    }

    return normalizeContrato((items as any[])[0]);
  } catch (error) {
    return null;
  }
}

export async function getContratoStats(
  filters: ContratoFilters = {},
): Promise<ContratoStats> {
  try {
    const filter = buildFilter(filters);

    const result = await withAutoRefresh(() =>
      directus.request(
        aggregate("adm_contracts", {
          aggregate: { count: ["id"] },
            ...(filter ? { query: { filter } } : {}),
          })
      ),
    );

    const total = Number(
      (result as Array<{ count: { id: string } }>)?.[0]?.count?.id ?? 0,
    );

    // Stats básicos - se puede expandir según necesidades
    const stats: ContratoStats = {
      total,
      vigentes: 0,
      proximos: 0,
      vencidos: 0,
    };

    return stats;
  } catch (error: any) {
    if (error?.response?.status === 403) {
    } else {
    }
    return {
      total: 0,
      vigentes: 0,
      proximos: 0,
      vencidos: 0,
    };
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
        readItems("adm_extensions", {
          fields: ["*"],
          filter: { contract_id: { _eq: contratoId } },
          sort:   ["extension_number"],
        })
      )
    );

    return items as Prorroga[];
  } catch (error) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial Cargos
// ─────────────────────────────────────────────────────────────────────────────

export async function getHistorialCargos(contratoId: number) {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_position_history", {
          fields: ["*"],
          filter: { contract_id: { _eq: contratoId } },
          sort: ["-date_created"],
        })
      )
    );
    return items;
  } catch (error) {
    return [];
  }
}
