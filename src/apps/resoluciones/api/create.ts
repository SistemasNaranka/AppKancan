import directus from "@/services/directus/directus";
import { createItem, readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Crear una nueva resolución en la base de datos vinculándola automáticamente
 * con su prefijo (prefix_id) correspondiente en acc_prefix_resolutions.
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
    let prefix_id: number | null = null;

    // La columna company en la tabla acc_points_of_sale contiene el nombre completo en mayúsculas (ej: "NARANKA SAS")
    const company = data.business_name;

    // Buscar prefix_id coincidente por nombre de prefijo y empresa
    if (company && data.prefix) {
      try {
        const matchingPrefixes = await withAutoRefresh(() =>
          directus.request(
            readItems("acc_prefix_resolutions", {
              fields: ["id"],
              filter: {
                _and: [
                  {
                    prefix_name: {
                      _eq: data.prefix,
                    },
                  },
                  {
                    pos_id: {
                      company: {
                        _eq: company,
                      },
                    },
                  },
                ],
              },
              limit: 1,
            })
          )
        );

        if (matchingPrefixes && matchingPrefixes.length > 0) {
          prefix_id = matchingPrefixes[0].id as number;
          console.log(`✅ prefix_id encontrado para vincular en Directus: ${prefix_id}`);
        } else {
          console.warn(`⚠️ No se encontró coincidencia para el prefijo ${data.prefix} de la empresa ${company} en acc_prefix_resolutions.`);
        }
      } catch (prefixError) {
        console.error("❌ Error al consultar acc_prefix_resolutions:", prefixError);
      }
    }

    const newResolution = await withAutoRefresh(() =>
      directus.request(
        createItem("acc_resolutions", {
          form_number: data.form_number,
          business_name: data.business_name,
          prefix: data.prefix,
          prefix_id: prefix_id, // Vinculación en base de datos
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
