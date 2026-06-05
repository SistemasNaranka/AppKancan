/**
 * Utilidades para el módulo de Contabilización de Facturas
 * Incluye constantes, configuración y función para ejecutar el programa corporativo
 */

import { DatosFacturaPDF, EstadoProceso } from "../types";

// ============ CONSTANTES ============

export const ESTADO_CONFIG: Record<
  EstadoProceso,
  { label: string; color: "info" | "warning" | "success" | "error" | "default" }
> = {
  idle: { label: "Esperando archivo", color: "default" },
  cargando: { label: "Cargando archivo", color: "info" },
  procesando: { label: "Extrayendo datos", color: "info" },
  validando: { label: "Validando información", color: "warning" },
  completado: { label: "Proceso completado", color: "success" },
  error: { label: "Error en el proceso", color: "error" },
};

// ============ CONFIGURACIÓN DEL EJECUTABLE ============

// Protocolo URI registrado en Windows para la contabilización de facturas
export const PROTOCOLO_EMPRESA = "empresa://";

// ============ FUNCIÓN PARA EJECUTAR .EXE ============

/**
 * Sanitiza un valor para evitar inyecciones de comandos en la llamada del protocolo local.
 * Permite letras, números, guiones, guiones bajos, puntos y barras diagonales.
 */
function sanitizeParam(val: string): string {
  return String(val).replace(/[^a-zA-Z0-9\-_./]/g, "").trim();
}

/**
 * Sanitiza el número automático (debe ser estrictamente numérico y de máximo 4 dígitos).
 */
function sanitizeAutomatico(val: string): string {
  return String(val).replace(/[^0-9]/g, "").slice(0, 4).trim();
}

/**
 * Ejecuta el programa corporativo de contabilización usando el protocolo URI registrado
 * El protocolo llama a un VBS que ejecuta el .exe
 *
 * Parámetros que se envían al programa corporativo (en orden requerido):
 * 1. numero: Número de factura
 * 2. fechaVencimiento: Fecha de vencimiento de la factura
 * 3. fechaEmision: Fecha de emisión de la factura
 * 4. automatico: Número automático asignado
 */
export function executeContabilizarFactura(
  datosFactura?: DatosFacturaPDF | null,
) {
  if (!datosFactura) {
    alert("No hay datos de factura para contabilizar");
    return;
  }

  const numeroRaw = datosFactura.numeroSinPrefijo || datosFactura.numeroFactura;
  const automaticoRaw = datosFactura.automaticoAsignado || datosFactura.automatico || "";
  const entradaRaw = datosFactura.entrada || "";

  // Construir los parámetros de la factura sanitizados de forma estricta
  const paramsObj: Record<string, string> = {
    numero: sanitizeParam(numeroRaw),
    fechaVencimiento: sanitizeParam(datosFactura.fechaVencimiento || ""),
    fechaEmision: sanitizeParam(datosFactura.fechaEmision),
    automatico: sanitizeAutomatico(automaticoRaw),
  };

  // Añadir la entrada si existe
  if (entradaRaw) {
    paramsObj.entrada = sanitizeParam(entradaRaw);
  }

  const params = new URLSearchParams(paramsObj);

  // Construir el URI del protocolo con los parámetros
  const uri = `${PROTOCOLO_EMPRESA}actualizar?${params.toString()}`;

  // Log para visualizar lo que se envía a la hora de causar
  console.log("=== ENVIANDO PARÁMETROS A CONTABILIZACIÓN DE FACTURA ===");
  console.log("1. Número factura sin prefijo (numero):", datosFactura.numeroSinPrefijo || datosFactura.numeroFactura);
  console.log("2. Fecha vencimiento (fechaVencimiento):", datosFactura.fechaVencimiento || "N/A");
  console.log("3. Fecha factura/emisión (fechaEmision):", datosFactura.fechaEmision);
  console.log("4. Automático (automatico):", datosFactura.automaticoAsignado || datosFactura.automatico || "N/A");
  if (datosFactura.entrada) {
    console.log("5. Entrada de mercancía (entrada):", datosFactura.entrada);
  }
  console.log("URI invocada:", uri);

  window.location.href = uri;
}
