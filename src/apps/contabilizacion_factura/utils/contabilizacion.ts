import { DatosFacturaPDF, EstadoProceso } from "../types";

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

export const PROTOCOLO_EMPRESA = "ContabilizarFactura://";

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
 * Convierte una cadena de fecha a formato YYYYMMDD (ej. 20260630).
 */
function formatToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return "";

  const datePart = dateStr.split("T")[0].trim();

  // Caso YYYY-MM-DD o YYYY/MM/DD
  const ymdMatch = datePart.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}${month}${day}`;
  }

  // Caso DD-MM-YYYY o DD/MM/YYYY
  const dmyMatch = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}${month}${day}`;
  }

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    }
  } catch (e) {
    console.error("Error al parsear la fecha:", e);
  }

  const digits = dateStr.replace(/\D/g, "");
  if (digits.length >= 8) {
    return digits.slice(0, 8);
  }

  return dateStr;
}

/**
 * Ejecuta el programa corporativo de contabilización usando el protocolo URI registrado
 * El protocolo llama a un VBS que ejecuta el .exe
 *
 * Parámetros que se envían al programa corporativo (en el nuevo orden requerido):
 * 1. entrada: Número de entrada
 * 2. numero: Número de factura sin prefijo
 * 3. fechaEmision: Fecha de creación en formato YYYYMMDD
 * 4. fechaVencimiento: Fecha de vencimiento en formato YYYYMMDD
 * 5. automatico: Número automático asignado
 */
export function executeContabilizarFactura(
  datosFactura?: DatosFacturaPDF | null,
) {
  if (!datosFactura) {
    alert("No hay datos de factura para contabilizar");
    return;
  }

  const numeroRaw = datosFactura.numeroSinPrefijo || datosFactura.numeroFactura;
  const entradaRaw = datosFactura.entrada || "";
  const fechaFormateada = formatToYYYYMMDD(datosFactura.fechaEmision);
  const fechaVencimiento = formatToYYYYMMDD(datosFactura.fechaVencimiento);
  const automaticoAsignado = sanitizeParam(datosFactura.automaticoAsignado);

  // Construir los parámetros en formato "llave:valor" separados por espacios
  // en el orden solicitado: entrada, numero y fechaEmision
  const paramsList = [
    `entrada:${sanitizeParam(entradaRaw)}`,
    `factura:${sanitizeParam(numeroRaw)}`,
    `fechaEmision:${sanitizeParam(fechaFormateada)}`,
    `fechaVencimiento:${sanitizeParam(fechaVencimiento)}`,
    `automatico:${sanitizeParam(automaticoAsignado)}`
  ];

  const paramsString = paramsList.join(" ");
  const uri = `${PROTOCOLO_EMPRESA}?${encodeURIComponent(paramsString)}`;

  console.log("=== ENVIANDO PARÁMETROS A CONTABILIZACIÓN DE FACTURA ===");
  console.log("1. Entrada de mercancía (entrada):", entradaRaw);
  console.log("2. Número factura sin prefijo (factura):", numeroRaw);
  console.log("3. Fecha factura/emisión (fechaEmision) [YYYYMMDD]:", fechaFormateada);
  console.log("4. Fecha vencimiento (fechaVencimiento) [YYYYMMDD]:", fechaVencimiento);
  console.log("5. Automático asignado (automatico):", automaticoAsignado);
  console.log("URI invocada:", uri);

  window.location.href = uri; 
}