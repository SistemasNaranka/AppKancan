import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";



/**
 * Obtiene el area del usuario autenticado
 * ✅ Ahora con refresh automático si el token está expirado
 */
export async function getUserArea() {
  return await withAutoRefresh(() =>
    directus.request(readItems('rol_usuario', {
      fields: ['id', 'area', 'rol_id.name'],
    }))
  );
}

/**
 * Retorna registros de la tabla Apps
 * ✅ Ahora con refresh automático si el token está expirado
 */
export async function getApps() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("app_usuario", {
          fields: [   
            "id",
            "app_id.id",
            "app_id.nombre",
            "app_id.ruta",
            "app_id.categoria",
            "app_id.rol.name",

          ],
        })
      )
    );
    console.log(items)

    // Mapear el resultado para devolver solo los datos del app
    const apps = items.map((item: any) => ({
      id: item.app_id.id,
      nombre: item.app_id.nombre,
      categoria: item.app_id.categoria,
      ruta: item.app_id.ruta,
      rol: item.app_id.rol?.name ?? null,
    }));
    console.log(apps)
    return apps;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      console.warn("⚠️ Usuario sin permisos para ver apps. Continuando sin apps...");
      return [];
    }

    console.error("❌ Error cargando apps:", error);
    throw error;
  }
}