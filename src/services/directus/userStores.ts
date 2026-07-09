import directus from "./directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Interfaz para representar la tienda con su ID y empresa asociada
 */
export interface UserStoreAccess {
  store_id: number;
  company: string;
}

/**
 * Obtener IDs de tiendas asignadas al usuario actual
 */
export async function obtenerTiendasIdsUsuarioActual(): Promise<number[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_user_stores", {
          fields: ["store_id"],
          filter: {
            status: { _eq: "Activo" },
          },
          limit: -1,
        }),
      ),
    );

    const tiendaIds = (data as any[]).map((item: any) => item.store_id);
    return tiendaIds;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

/**
 * Obtener tiendas (ID y empresa) asignadas al usuario actual
 */
export async function obtenerTiendasUsuarioActual(): Promise<UserStoreAccess[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("core_user_stores", {
          fields: ["store_id.id", "store_id.company"],
          filter: {
            status: { _eq: "Activo" },
          },
          limit: -1,
        }),
      ),
    );

    return (data as any[]).map((item: any) => ({
      store_id: Number(item.store_id?.id ?? item.store_id),
      company: String(item.store_id?.company ?? ""),
    }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}
