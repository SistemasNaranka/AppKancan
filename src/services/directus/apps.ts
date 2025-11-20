import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";

/**
 * Obtiene el area del usuario autenticado
 * ✅ Ahora con refresh automático si el token está expirado
 */
export async function getUserArea() {
  return await withAutoRefresh(() =>
    directus.request(
      readItems("rol_usuario", {
        fields: ["id", "area", "rol_id.name"],
      })
    )
  );
}

/**
 * Obtiene las bodegas asignadas al usuario actual desde ulti_bodega_usuario
 * ✅ Usa regla "current user" de Directus para filtrar automáticamente
 */
export async function getUserBodegas() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("util_bodega_usuario", {
          fields: ["bodega"],
        })
      )
    );

    // 🔹 Aplanar los datos - bodega es el número directo
    const bodegas = items.map((item: any) => ({
      codigo: item.bodega.toString(),
      nombre: `Bodega ${item.bodega}`,
    }));

    return bodegas;
  } catch (error) {
    console.error("❌ Error al cargar bodegas del usuario:", error);
    return [];
  }
}

/**
 * Retorna registros de la tabla Apps
 * ✅ Ahora con refresh automático si el token está expirado
 */ export async function getApps() {
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
            "app_id.icono_app",
            "app_id.icono_categoria",
            "app_id.rol.name",
          ],
        })
      )
    );

    // 🔹 Aplanar los datos
    const apps = items.map((item: any) => ({
      id: item.app_id.id,
      nombre: item.app_id.nombre,
      ruta: item.app_id.ruta,
      categoria: item.app_id.categoria,
      icono_app: item.app_id.icono_app,
      icono_categoria: item.app_id.icono_categoria,
      rol: item.app_id.rol?.name,
    }));

    return apps;
  } catch (error) {
    console.error("❌ Error al cargar apps:", error);
    return [];
  }
}
