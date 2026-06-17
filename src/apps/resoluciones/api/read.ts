import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

export interface DirectusResolucion {
  id: number;
  form_number: string;
  business_name: string;
  prefix: string;
  start_number: number;
  end_number: number;
  validity: number;
  request_type: string;
  creation_date: string;
  expiration_date: string;
  status: string;
  prefix_id: {
    last_invoice: number;
    billing_entity: string;
    pos_id: {
      company: string;
      ultra_id: number;
      store_id:
      | number
      | {
        id: number;
        name: string;
      }
      | null;
    } | null;
  } | null;
}

export async function getResolutions(): Promise<DirectusResolucion[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("acc_resolutions", {
          fields: [
            "*",
            {
              prefix_id: [
                "last_invoice",
                "billing_entity",
                {
                  pos_id: [
                    "company",
                    "ultra_id",
                    {
                      store_id: ["id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
          filter: {
            status: {
              _in: ["Activo", "Pendiente"],
            },
          },
          limit: 500,
          sort: ["-id"],
        }),
      ),
    );
    return data as DirectusResolucion[];
  } catch (error) {
    console.error("❌ Error al obtener resoluciones:", error);
    throw error;
  }
}

export interface PrefixValidationResult {
  exists: boolean;
  ultra_id?: number;
}

export async function checkPrefixExists(prefix: string, businessName: string): Promise<PrefixValidationResult> {
  if (!businessName || !prefix) return { exists: false };

  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("acc_prefix_resolutions", {
          fields: [
            "id",
            {
              pos_id: ["ultra_id"],
            },
          ],
          filter: {
            _and: [
              {
                prefix_name: {
                  _eq: prefix,
                },
              },
              {
                pos_id: {
                  company: {
                    _eq: businessName,
                  },
                },
              },
            ],
          },
          limit: 1,
        })
      )
    );
    if (items && items.length > 0) {
      const item = items[0] as any;
      return {
        exists: true,
        ultra_id: item.pos_id?.ultra_id,
      };
    }
    return { exists: false };
  } catch (error) {
    console.error("❌ Error al verificar existencia de prefijo:", error);
    return { exists: false };
  }
}


