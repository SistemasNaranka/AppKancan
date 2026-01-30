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
      tienda_id: {
        id: number;
        nombre: string;
      };
    };
  };
}

// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener todas las resoluciones con sus relaciones
 */
export async function obtenerResoluciones(): Promise<DirectusResolucion[]> {
  try {
    const data = await withAutoRefresh(() =>
      directus.request(
        readItems("resoluciones", {
          fields: [
            "id",
            "numero_formulario",
            "razon_social",
            "prefijo",
            "desde_numero",
            "hasta_numero",
            "vigencia",
            "tipo_solicitud",
            "fecha_creacion",
            "fecha_vencimiento",
            "estado",
            "prefijo_id.ultima_factura",
            "prefijo_id.ente_facturador",
            "prefijo_id.caja_id.empresa",
            "prefijo_id.caja_id.id_ultra",
            "prefijo_id.caja_id.tienda_id.id",
            "prefijo_id.caja_id.tienda_id.nombre",
          ],
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
