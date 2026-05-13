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
      readItems("core_user_role", {
        fields: ["id", "department", "rol_id.name"],
      }),
    ),
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
        readItems("core_warehouse_user", {
          fields: ["id", "warehouse"],
        }),
      ),
    );

    // 🔹 Aplanar los datos - warehouse es el número directo
    const bodegas = items.map((item: any) => ({
      codigo: item.warehouse?.toString() || "",
      nombre: `Bodega ${item.warehouse || ""}`,
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
        readItems("core_user_app", {
          fields: [
            "id",
            "app_id.id",
            "app_id.name",
            "app_id.route",
            "app_id.category",
            "app_id.app_icon",
            "app_id.category_icon",
            "app_id.role_id.name",
          ],
        }),
      ),
    );

    // 🔹 Aplanar los datos
    const apps = items.map((item: any) => ({
      id: item.app_id.id,
      nombre: item.app_id.name,
      ruta: item.app_id.route,
      categoria: item.app_id.category,
      icono_app: item.app_id.app_icon,
      icono_categoria: item.app_id.category_icon,
      rol: item.app_id.role_id?.name,
    }));

    return apps;
  } catch (error) {
    console.error("❌ Error al cargar apps:", error);
    return [];
  }
}
