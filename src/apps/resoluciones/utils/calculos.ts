import { Resolution } from "../types";
import { DirectusResolucion } from "../api/read";

/**
 * Calcula el estado de una resolución basado en varios factores:
 * - Número de facturas restantes
 * - Días restantes de vigencia
 * - Estado original en la base de datos
 */
export function calculateStatus(
  hasta: number,
  vigencia: number,
  fecha_creacion: string,
  consecutivo_actual: number,
  estado: string,
): Resolution["estado"] {
  if (estado === "Pendiente") {
    return "Pendiente";
  }

  if (estado === "Inactivo") {
    return "Vencido";
  }

  const facturasRestantes = hasta - consecutivo_actual;

  const fechaCreacion = new Date(fecha_creacion);
  const fechaExpiracion = new Date(fechaCreacion);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + vigencia);

  const hoy = new Date();
  const diasRestantes = Math.floor(
    (fechaExpiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Vencido por facturas (menos de 10 facturas) o por fecha (días agotados)
  if (facturasRestantes <= 10 || diasRestantes < 1) {
    return "Vencido";
  }

  // Por vencer por facturas (menos de 70 facturas) o por fecha (menos de 5 días)
  if (facturasRestantes <= 70 || diasRestantes < 5) {
    return "Por vencer";
  }

  // Vigente
  return "Vigente";
}

/**
 * Calcula la información de facturas disponibles
 * Retorna el número de facturas restantes y un texto descriptivo
 */
export function calculateInvoices(
  hasta_numero: number,
  ultima_factura: number,
): {
  disponibles: number;
  restantes: number;
  texto: string;
  porcentaje: number;
} {
  const restantes = hasta_numero - ultima_factura;
  const disponibles = Math.max(0, restantes);
  const total = hasta_numero;
  const usadas = ultima_factura;
  const porcentaje = total > 0 ? Math.round((usadas / total) * 100) : 0;

  let texto = "";
  if (restantes <= 0) {
    texto = "Sin facturas disponibles";
  } else if (restantes <= 10) {
    texto = `¡URGENTE! Solo ${restantes} factura${restantes === 1 ? "" : "s"}`;
  } else if (restantes <= 70) {
    texto = `${restantes} facturas (Por vencer)`;
  } else {
    texto = `${restantes} facturas disponibles`;
  }

  return { disponibles, restantes, texto, porcentaje };
}

/**
 * Calcula la fecha de vencimiento sumando los meses de vigencia
 * a la fecha de creación
 */
export function calculateMaturity(
  fecha_creacion: string,
  vigencia: number,
): string {
  const fechaCreacion = new Date(fecha_creacion);
  const fechaExpiracion = new Date(fechaCreacion);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + vigencia);
  return fechaExpiracion.toISOString().split("T")[0];
}

/**
 * Calcula los días restantes hasta el vencimiento y genera
 * un texto descriptivo
 */
export function DaysRemaining(
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

/**
 * Transforma una resolución de Directus (estructura anidada)
 * a un formato plano para la UI
 */
export function flattenResolution(r: DirectusResolucion): Resolution {
  const prefix = r.prefix_id;
  const pos = prefix?.pos_id;
  const tienda = typeof pos?.store_id === "object" ? pos.store_id : null;

  const ultima_factura = Number(prefix?.last_invoice) || 0;
  const desde_numero = Number(r.start_number) || 1;
  const hasta_numero = Number(r.end_number) || 0;
  const vigencia = Number(r.validity) || 12;
  const fecha_creacion = r.creation_date || "";
  const estadoOriginal = r.status || "Pendiente";

  const estadoCalculado = calculateStatus(
    hasta_numero,
    vigencia,
    fecha_creacion,
    ultima_factura,
    estadoOriginal,
  );

  const fecha_vencimiento = fecha_creacion
    ? calculateMaturity(fecha_creacion, vigencia)
    : "";

  const infoFacturas = calculateInvoices(hasta_numero, ultima_factura);

  return {
    id: r.id,
    numero_formulario: r.form_number,
    razon_social: r.business_name,
    prefijo: r.prefix,
    desde_numero: desde_numero,
    hasta_numero: hasta_numero,
    vigencia: vigencia,
    tipo_solicitud: r.request_type,
    fecha_creacion: fecha_creacion,
    fecha_vencimiento: fecha_vencimiento,
    ultima_factura: ultima_factura,
    ente_facturador: prefix?.billing_entity || "Principal",
    estado: estadoCalculado,
    tienda_nombre: tienda?.name || "",
    id_ultra: pos?.ultra_id || 0,
    empresa: pos?.company || "",
    facturas_disponibles: infoFacturas.disponibles,
    facturas_restantes: infoFacturas.restantes,
  };
}


