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

  // Construir los parámetros de la factura en el orden requerido
  const paramsObj: Record<string, string> = {
    numero: datosFactura.numeroSinPrefijo || datosFactura.numeroFactura,
    fechaVencimiento: datosFactura.fechaVencimiento || "",
    fechaEmision: datosFactura.fechaEmision,
    automatico: datosFactura.automaticoAsignado || datosFactura.automatico || "",
  };

  // Añadir la entrada si existe
  if (datosFactura.entrada) {
    paramsObj.entrada = datosFactura.entrada;
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
