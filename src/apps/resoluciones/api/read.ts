import directus from "@/services/directus/directus";
import { readItems } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

// ==================== INTERFACES DIRECTUS ====================

export interface DirectusResolucion {
  id: number;
  numero_formulario: string;
  razon_social: string;
  prefijo: string;
  desde_numero: number;
  hasta_numero: number;
  vigencia: number;
  tipo_solicitud: string;
  fecha_creacion: string;
  fecha_vencimiento: string;
  estado: string;
  prefijo_id: {
    ultima_factura: number;
    ente_facturador: string;
    caja_id: {
      empresa: string;
      id_ultra: number;
      tienda_id:
      | number
      | {
        id: number;
        nombre: string;
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
        readItems("resoluciones", {
          fields: [
            "*",
            {
              prefijo_id: [
                "ultima_factura",
                "ente_facturador",
                {
                  caja_id: [
                    "empresa",
                    "id_ultra",
                    {
                      tienda_id: ["id", "nombre"],
                    },
                  ],
                },
              ],
            },
          ],
          filter: {
            estado: {
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
