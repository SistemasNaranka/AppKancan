import directus from "@/services/directus/directus";
import { updateItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export async function updateResolutionStatus(id: number, status: string) {
  try {
    const updated = await withAutoRefresh(() =>
      directus.request(
        updateItem("acc_resolutions", id, {
          status: status,
        })
      )
    );
    return updated;
  } catch (error) {
    console.error("❌ Error al actualizar estado de la resolución:", error);
    throw new Error("Error al actualizar la resolución");
  }
}
