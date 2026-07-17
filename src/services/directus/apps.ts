import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems } from "@directus/sdk";

export async function getUserArea() {
  return await withAutoRefresh(() =>
    directus.request(
      readItems("core_user_role", {
        fields: ["id", "department", "rol_id.name"],
      }),
    ),
  );
}

export async function getUserBodegas() {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("core_warehouse_user", {
          fields: ["id", "warehouse"],
        }),
      ),
    );

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

export async function getApps() {
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
