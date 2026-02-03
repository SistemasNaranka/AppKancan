import directus from "@/services/directus/directus";
import { createItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";

/**
 * Crear una nueva resolución en la base de datos
 */
export async function crearResolucion(data: {
  numero_formulario: string;
  razon_social: string;
  prefijo: string;
  desde_numero: number;
  hasta_numero: number;
  vigencia: number;
  tipo_solicitud: string;
  fecha_creacion: string;
  fecha_vencimiento: string;
}) {
  try {
    const newResolution = await withAutoRefresh(() =>
      directus.request(
        createItem("resoluciones", {
          numero_formulario: data.numero_formulario,
          razon_social: data.razon_social,
          prefijo: data.prefijo,
          desde_numero: data.desde_numero,
          hasta_numero: data.hasta_numero,
          vigencia: data.vigencia,
          tipo_solicitud: data.tipo_solicitud,
          fecha_creacion: data.fecha_creacion,
          fecha_vencimiento: data.fecha_vencimiento,
          estado: "Activo",
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
