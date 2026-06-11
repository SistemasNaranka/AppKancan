import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, aggregate } from "@directus/sdk";
import type {
  Contract,
  ContractFilters,
  ContractStats,
  PaginationParams,
  PaginatedResponse,
  Extension,
} from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildFilter(filters: ContractFilters) {
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
        { middle_name: { _icontains: q } },
        { last_name: { _icontains: q } },
        { second_last_name: { _icontains: q } },
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
function normalizePosition(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    return (raw as { name: string }).name ?? '';
  }
  // Fallback: ya era string (p.ej. en pruebas locales)
  if (typeof raw === 'string') return raw;
  return '';
}

function normalizeContract(item: any): Contract {
  return {
    ...item,
    position: normalizePosition(item.position),
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

export async function getContracts(
  filters: ContractFilters = {},
  pagination: PaginationParams = { page: 0, limit: 25 },
): Promise<PaginatedResponse<Contract>> {
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
      data:  (items as any[]).map(normalizeContract),
      total,
      page:  pagination.page,
      limit: pagination.limit,
    };
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error("❌ Error 403 al cargar contratos (Permisos):", {
        message: error.message,
        errors: error.errors,
        collection: "adm_contracts",
      });
    } else {
      console.error("❌ Error al cargar contratos:", error);
    }
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}

export async function getContractById(id: number): Promise<Contract | null> {
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
      console.warn(`⚠️ Contrato con ID ${id} no encontrado`);
      return null;
    }

    return normalizeContract((items as any[])[0]);
  } catch (error) {
      console.error(`❌ Error al cargar contrato ${id}:`, error);
    return null;
  }
}

export async function getContractStats(
  filters: ContractFilters = {},
): Promise<ContractStats> {
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
    const stats: ContractStats = {
      total,
      vigentes: 0,
      proximos: 0,
      vencidos: 0,
    };

    return stats;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error("❌ Error 403 al cargar estadísticas de contratos:", {
        message: error.message,
        errors: error.errors,
      });
    } else {
      console.error("❌ Error al cargar estadísticas de contratos:", error);
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

export async function getExtensionsByContract(
  contractId: number
): Promise<Extension[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_extensions", {
          fields: ["*"],
          filter: { contract_id: { _eq: contractId } },
          sort:   ["extension_number"],
        })
      )
    );

    return items as Extension[];
  } catch (error) {
    console.error(`❌ Error al cargar prórrogas del contrato ${contractId}:`, error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial Cargos
// ─────────────────────────────────────────────────────────────────────────────

export async function getPositionHistory(contractId: number) {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_position_history", {
          fields: ["*"],
          filter: { contract_id: { _eq: contractId } },
          sort: ["-date_created"],
        })
      )
    );
    return items;
  } catch (error) {
    console.error(`❌ Error al cargar historial de cargos del contrato ${contractId}:`, error);
    return [];
  }
}
