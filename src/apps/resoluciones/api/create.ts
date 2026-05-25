import directus from "@/services/directus/directus";
import { createItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Crear una nueva resolución en la base de datos
 */
export async function createResolution(data: {
  form_number: string;
  business_name: string;
  prefix: string;
  start_number: number;
  end_number: number;
  validity: number;
  request_type: string;
  creation_date: string;
  expiration_date: string;
  status?: string;
}) {
  try {
    const newResolution = await withAutoRefresh(() =>
      directus.request(
        createItem("acc_resolutions", {
          form_number: data.form_number,
          business_name: data.business_name,
          prefix: data.prefix,
          start_number: data.start_number,
          end_number: data.end_number,
          validity: data.validity,
          request_type: data.request_type,
          creation_date: data.creation_date,
          expiration_date: data.expiration_date,
          status: data.status || "Activo",
        }),
      ),
    );

    return newResolution;
  } catch (error: any) {
    if (error?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE") {
      throw new Error("La resolución ya está registrada");
    }
    console.error("❌ Error al crear resolución:", error);
    throw new Error("Error al crear la resolución");
  }
}
