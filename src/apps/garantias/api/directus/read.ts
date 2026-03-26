import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, aggregate } from "@directus/sdk";
import type {
  Garantia,
  GarantiaFilters,
  GarantiaStats,
  PaginationParams,
  PaginatedResponse,
  Cliente,
} from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye el array de filtros para Directus a partir de GarantiaFilters.
 * Directus espera: { filter: { _and: [...condiciones] } }
 */
function buildFilter(filters: GarantiaFilters) {
  const conditions: object[] = [];

  if (filters.estado && filters.estado.length > 0) {
    conditions.push({ estado: { _in: filters.estado } });
  }

  if (filters.tipo_garantia && filters.tipo_garantia.length > 0) {
    conditions.push({ tipo_garantia: { _in: filters.tipo_garantia } });
  }

  if (filters.fecha_inicio) {
    conditions.push({ fecha_solicitud: { _gte: filters.fecha_inicio } });
  }

  if (filters.fecha_fin) {
    conditions.push({ fecha_solicitud: { _lte: filters.fecha_fin } });
  }

  if (filters.tienda_id) {
    conditions.push({ producto_tienda_id: { _eq: filters.tienda_id } });
  }

  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    // Busca en nombre del cliente, producto, referencia y número de factura
    conditions.push({
      _or: [
        { cliente_nombre: { _icontains: q } },
        { cliente_documento: { _icontains: q } },
        { producto_nombre: { _icontains: q } },
        { producto_referencia: { _icontains: q } },
        { numero_factura: { _icontains: q } },
      ],
    });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Garantías
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene garantías paginadas con filtros opcionales.
 */
export async function getGarantias(
  filters: GarantiaFilters = {},
  pagination: PaginationParams = { page: 0, limit: 10 }
): Promise<PaginatedResponse<Garantia>> {
  try {
    const filter = buildFilter(filters);
    const offset = pagination.page * pagination.limit;

    const [items, countResult] = await Promise.all([
      withAutoRefresh(() =>
        directus.request(
          readItems("garantias", {
            fields: ["*"],
            filter,
            limit: pagination.limit,
            offset,
            sort: [
              `${pagination.order === "asc" ? "" : "-"}${pagination.sort ?? "date_created"}`,
            ],
          })
        )
      ),
      withAutoRefresh(() =>
        directus.request(
          aggregate("garantias", {
            aggregate: { count: ["id"] },
            query: { filter },
          })
        )
      ),
    ]);

    const total = Number((countResult as any)?.[0]?.count?.id ?? 0);

    return {
      data: items as Garantia[],
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error("❌ Error 403 al cargar garantías (Permisos):", {
        message: error.message,
        errors: error.errors,
        collection: "garantias"
      });
    } else {
      console.error("❌ Error al cargar garantías:", error);
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
 * Obtiene una garantía por su ID.
 */
export async function getGarantiaById(id: number): Promise<Garantia> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("garantias", {
          fields: ["*"],
          filter: { id: { _eq: id } },
          limit: 1,
        })
      )
    );

    if (!items || (items as Garantia[]).length === 0) {
      throw new Error(`Garantía con ID ${id} no encontrada`);
    }

    return (items as Garantia[])[0];
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error(`❌ Error 403 al cargar garantía ${id} (Permisos):`, {
        message: error.message,
        errors: error.errors,
        collection: "garantias",
        id,
      });
    } else {
      console.error(`❌ Error al cargar garantía ${id}:`, error);
    }
    throw error;
  }
}

/**
 * Obtiene los conteos por estado para las tarjetas de estadísticas.
 * Hace UNA sola llamada usando aggregate con groupBy para ser eficiente.
 */
export async function getGarantiaStats(
  filters: GarantiaFilters = {}
): Promise<GarantiaStats> {
  try {
    // Filtros base sin filtro de estado (queremos conteos de TODOS los estados)
    const { estado: _estado, ...filtersWithoutEstado } = filters;
    const filter = buildFilter(filtersWithoutEstado);

    const result = await withAutoRefresh(() =>
      directus.request(
        aggregate("garantias", {
          aggregate: { count: ["id"] },
          query: {
            filter,
            groupBy: ["estado"],
          },
        })
      )
    );

    // Construir el objeto de stats a partir del resultado agrupado
    const stats: GarantiaStats = {
      total: 0,
      pendiente: 0,
      en_revision: 0,
      aprobada: 0,
      rechazada: 0,
      completada: 0,
    };

    (result as Array<{ estado: string; count: { id: string } }>).forEach(
      (row) => {
        const count = Number(row.count?.id ?? 0);
        stats.total += count;

        switch (row.estado) {
          case "pendiente":    stats.pendiente   = count; break;
          case "en_revision":  stats.en_revision = count; break;
          case "aprobada":     stats.aprobada    = count; break;
          case "rechazada":    stats.rechazada   = count; break;
          case "completada":   stats.completada  = count; break;
        }
      }
    );

    return stats;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.error("❌ Error 403 al cargar estadísticas de garantías:", {
        message: error.message,
        errors: error.errors
      });
    } else {
      console.error("❌ Error al cargar estadísticas de garantías:", error);
    }
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
// Clientes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca clientes por nombre o documento (para autocompletar en el formulario).
 */
export async function searchClientes(query: string): Promise<Cliente[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("clientes", {
          fields: ["id", "nombre", "documento", "telefono", "email", "direccion"],
          filter: {
            _or: [
              { nombre:    { _icontains: query } },
              { documento: { _icontains: query } },
            ],
          },
          limit: 10,
          sort: ["nombre"],
        })
      )
    );

    return items as Cliente[];
  } catch (error: any) {
    console.error("❌ Error al buscar clientes:", error);
    return [];
  }
}