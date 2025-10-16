import directus from "@/services/directus/directus";
import { hasStatusCode } from "@/shared/utils/hasStatus";
import { type App } from "@/auth/hooks/AuthContext";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Obtiene la lista de empresas desde Directus
 * ✅ Ahora con refresh automático si el token está expirado
 */
export async function getEmpresas() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(readItems('empresas', { limit: 5 }))
    ) as App[];
    return items;
  } catch (error) {
    if (hasStatusCode(error) && error.response.status === 403) {
      console.warn("⚠️ Usuario sin permisos para ver empresas. Continuando sin empresas...");
      return [];
    }

    console.error("❌ Error cargando empresas:", error);
    throw error;
  }
}