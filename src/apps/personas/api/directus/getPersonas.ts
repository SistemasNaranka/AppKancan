import directus from "@/services/directus/directus";
import { hasStatusCode } from "@/shared/utils/hasStatus";
import { type App } from "@/auth/hooks/AuthContext";
import { readItems} from "@directus/sdk";

export async function getPersonas(){
    try {
    const items = await directus.request(readItems('personas', { limit: 5 })) as App[];
    return items;
  } catch (error) {
    if (hasStatusCode(error) && error.response.status === 403) {
      console.warn("⚠️ Usuario sin permisos para ver apps. Continuando sin apps...");
      return [];
    }

    console.error("❌ Error cargando apps:", error);
    throw error;
  }
}
