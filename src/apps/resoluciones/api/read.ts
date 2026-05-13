import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

// ==================== INTERFACES DIRECTUS ====================

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

// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener todas las resoluciones con sus relaciones
 * Solo trae resoluciones con estado 'Activo' o 'Pendiente'
 */
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

