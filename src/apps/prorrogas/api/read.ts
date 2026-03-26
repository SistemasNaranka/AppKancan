import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, aggregate } from "@directus/sdk";
import type {
  Contrato,
  ContratoFilters,
  ContratoStats,
  PaginationParams,
  PaginatedResponse,
} from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye el array de filtros para Directus a partir de ContratoFilters.
 * Directus espera: { filter: { _and: [...condiciones] } }
 */
function buildFilter(filters: ContratoFilters) {
  const conditions: object[] = [];

  if (filters.tipo_contrato) {
    conditions.push({ tipo_contrato: { _eq: filters.tipo_contrato } });
  }

  if (filters.cargo) {
    conditions.push({ cargo: { _eq: filters.cargo } });
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    conditions.push({
      _or: [
        { nombre: { _icontains: q } },
        { apellido: { _icontains: q } },
        { cargo: { _icontains: q } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Contratos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene contratos paginados con filtros opcionales.
 */
export async function getContratos(
  filters: ContratoFilters = {},
  pagination: PaginationParams = { page: 0, limit: 25 },
): Promise<PaginatedResponse<Contrato>> {
  try {
    const filter = buildFilter(filters);
    const offset = pagination.page * pagination.limit;

    const [items, countResult] = await Promise.all([
      withAutoRefresh(() =>
        directus.request(
          readItems("contratos", {
            fields: ["*"],
            filter,
            limit: pagination.limit,
            offset,
            sort: [
              `${pagination.order === "asc" ? "" : "-"}${
                pagination.sort ?? "fecha_final"
              }`,
            ],
          }),
        ),
      ),
      withAutoRefresh(() =>
        directus.request(
          aggregate("contratos", {
            aggregate: { count: ["id"] },
            query: { filter },
          }),
        ),
      ),
    ]);

    const total = Number(
      (countResult as Array<{ count: { id: string } }>)?.[0]?.count?.id ?? 0,
    );

    return {
      data: items as Contrato[],
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error("❌ Error 403 al cargar contratos (Permisos):", {
        message: error.message,
        errors: error.errors,
        collection: "contratos",
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

/**
 * Obtiene un contrato por su ID.
 */
export async function getContratoById(id: number): Promise<Contrato | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("contratos", {
          fields: ["*"],
          filter: { id: { _eq: id } },
          limit: 1,
        }),
      ),
    );

    if (!items || (items as Contrato[]).length === 0) {
      console.warn(`⚠️ Contrato con ID ${id} no encontrado`);
      return null;
    }

    return (items as Contrato[])[0];
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error(`❌ Error 403 al cargar contrato ${id}:`, {
        message: error.message,
        errors: error.errors,
      });
    } else {
      console.error(`❌ Error al cargar contrato ${id}:`, error);
    }
    return null;
  }
}

/**
 * Obtiene estadísticas básicas de contratos.
 */
export async function getContratoStats(
  filters: ContratoFilters = {},
): Promise<ContratoStats> {
  try {
    const filter = buildFilter(filters);

    const result = await withAutoRefresh(() =>
      directus.request(
        aggregate("contratos", {
          aggregate: { count: ["id"] },
          query: { filter },
        }),
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
