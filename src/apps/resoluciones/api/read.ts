import directus from "@/services/directus/directus";
import { readItems, createItem } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { Resolucion } from "../types";

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

function calcularEstado(
  hasta: number,
  vigencia: number,
  fecha_creacion: string,
  consecutivo_actual: number,
  estado: string,
): Resolucion["estado"] {
  if (estado === "Pendiente") {
    return "Pendiente";
  }

  if (estado === "Inactivo") {
    return "Vencido";
  }

  const diff = hasta - consecutivo_actual;

  const fechaCreacion = new Date(fecha_creacion);
  const fechaExpiracion = new Date(fechaCreacion);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + vigencia);

  const hoy = new Date();
  const diasRestantes = Math.floor(
    (fechaExpiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Vencido
  if (diff < 10 || diasRestantes < 1) {
    return "Vencido";
  }

  // Por vencer
  if (diff < 25 || diasRestantes < 5) {
    return "Por vencer";
  }

  // Vigente
  return "Vigente";
}

export function calcularVencimiento(
  fecha_creacion: string,
  vigencia: number,
): string {
  const fechaCreacion = new Date(fecha_creacion);
  const fechaExpiracion = new Date(fechaCreacion);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + vigencia);
  return fechaExpiracion.toISOString().split("T")[0];
}

export function diasRestantes(
  vigencia: number,
  fecha_creacion: string,
): { dias: number; texto: string } {
  const fechaCreacion = new Date(fecha_creacion);
  const fechaExpiracion = new Date(fechaCreacion);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + vigencia);

  const hoy = new Date();
  const dias = Math.floor(
    (fechaExpiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  let texto = "";
  if (dias > 1) {
    texto = `Vence en ${dias} días`;
  } else if (dias === 1) {
    texto = "Vence mañana";
  } else if (dias === 0) {
    texto = "Vence hoy";
  } else if (dias === -1) {
    texto = "Venció ayer";
  } else {
    texto = `Venció hace ${Math.abs(dias)} días`;
  }

  return { dias, texto };
}

export function aplanarResolucion(r: DirectusResolucion): Resolucion {
  const prefijo = r.prefijo_id || {};
  const caja = prefijo.caja_id || {};
  const tienda = caja.tienda_id || {};

  const ultima_factura = Number(prefijo.ultima_factura) || 0;
  const desde_numero = Number(r.desde_numero) || 1;
  const hasta_numero = Number(r.hasta_numero) || 0;
  const vigencia = Number(r.vigencia) || 12;
  const fecha_creacion = r.fecha_creacion || "";
  const estadoOriginal = r.estado || "Pendiente";

  const estadoCalculado = calcularEstado(
    hasta_numero,
    vigencia,
    fecha_creacion,
    ultima_factura,
    estadoOriginal,
  );

  const fecha_vencimiento = fecha_creacion
    ? calcularVencimiento(fecha_creacion, vigencia)
    : "";

  return {
    id: r.id,
    numero_formulario: r.numero_formulario,
    razon_social: r.razon_social,
    prefijo: r.prefijo,
    desde_numero: desde_numero,
    hasta_numero: hasta_numero,
    vigencia: vigencia,
    tipo_solicitud: r.tipo_solicitud,
    fecha_creacion: fecha_creacion,
    fecha_vencimiento: fecha_vencimiento,
    ultima_factura: ultima_factura,
    ente_facturador: prefijo.ente_facturador || "Principal",
    estado: estadoCalculado,
    tienda_nombre: tienda.nombre || "",
    empresa: caja.empresa || "",
  };
}

/**
 * Crear una nueva resolución
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
