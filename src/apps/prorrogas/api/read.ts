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

/**
 * Construye el array de filtros para Directus a partir de ContratoFilters.
 * Directus espera: { filter: { _and: [...condiciones] } }
 */
function buildFilter(filters: ContratoFilters) {
  const conditions: object[] = [];

  if (filters.request_status && filters.request_status.length > 0) {
    conditions.push({ request_status: { _in: filters.request_status } });
  }

  if (filters.departamento) {
    conditions.push({ empleado_departamento: { _eq: filters.departamento } });
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    conditions.push({
      _or: [
        { empleado_nombre: { _icontains: q } },
        { empleado_cargo: { _icontains: q } },
        { empleado_departamento: { _icontains: q } },
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
 * Incluye las relaciones prorrogas y documentos en la misma petición.
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
            fields: ["*", { prorrogas: ["*"] }, { documentos: ["*"] }],
            filter,
            limit: pagination.limit,
            offset,
            sort: [
              `${pagination.order === "asc" ? "" : "-"}${
                pagination.sort ?? "date_created"
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
  } catch (error) {
    console.error("❌ Error al cargar contratos:", error);
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}

/**
 * Obtiene un contrato por su ID incluyendo prórrogas y documentos.
 */
export async function getContratoById(id: number): Promise<Contrato | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("contratos", {
          fields: ["*", { prorrogas: ["*"] }, { documentos: ["*"] }],
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
  } catch (error) {
    console.error(`❌ Error al cargar contrato ${id}:`, error);
    return null;
  }
}

/**
 * Obtiene los conteos por request_status para las tarjetas del dashboard.
 * Una sola llamada con groupBy para mayor eficiencia.
 */
export async function getContratoStats(
  filters: ContratoFilters = {},
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
        }),
      ),
    );

    const stats: ContratoStats = {
      total: 0,
      pendiente: 0,
      en_revision: 0,
      aprobada: 0,
      rechazada: 0,
      completada: 0,
    };

    (
      result as Array<{ request_status: string; count: { id: string } }>
    ).forEach((row) => {
      const count = Number(row.count?.id ?? 0);
      stats.total += count;

      switch (row.request_status) {
        case "pendiente":
          stats.pendiente = count;
          break;
        case "en_revision":
          stats.en_revision = count;
          break;
        case "aprobada":
          stats.aprobada = count;
          break;
        case "rechazada":
          stats.rechazada = count;
          break;
        case "completada":
          stats.completada = count;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error("❌ Error al cargar estadísticas de contratos:", error);
    return {
      total: 0,
      pendiente: 0,
      en_revision: 0,
      aprobada: 0,
      rechazada: 0,
      completada: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prórrogas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las prórrogas de un contrato, ordenadas por número ascendente.
 */
export async function getProrrogasByContrato(
  contratoId: number,
): Promise<Prorroga[]> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("prorrogas", {
          fields: ["*"],
          filter: { contrato_id: { _eq: contratoId } },
          sort: ["numero"],
        }),
      ),
    );

    return items as Prorroga[];
  } catch (error) {
    console.error(
      `❌ Error al cargar prórrogas del contrato ${contratoId}:`,
      error,
    );
    return [];
  }
}
