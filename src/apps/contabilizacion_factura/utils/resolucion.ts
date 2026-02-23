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

// Protocolo URI registrado en Windows
export const PROTOCOLO_EMPRESA = "empresa://";

// ============ FUNCIÓN PARA EJECUTAR .EXE ============

/**
 * Ejecuta el programa corporativo usando el protocolo URI registrado
 * El protocolo llama a un VBS que ejecuta el .exe
 *
 * Parámetros que se envían al programa corporativo:
 * - numero: Número de factura
 * - serie: Serie de la factura
 * - fechaEmision: Fecha de emisión de la factura
 * - fechaVencimiento: Fecha de vencimiento de la factura
 * - proveedor: Nombre del proveedor
 * - proveedorNif: NIF/CIF del proveedor
 * - total: Monto total de la factura
 */
export function ejecutarActualizarResolucion(
  datosFactura?: DatosFacturaPDF | null,
) {
  if (!datosFactura) {
    alert("No hay datos de factura para actualizar");
    return;
  }

  // Construir los parámetros de la factura
  const params = new URLSearchParams({
    numero: datosFactura.numeroFactura,
    serie: datosFactura.serie || "",
    fechaEmision: datosFactura.fechaEmision,
    fechaVencimiento: datosFactura.fechaVencimiento || "",
    proveedor: datosFactura.proveedor.nombre,
    proveedorNif: datosFactura.proveedor.nif || "",
    total: datosFactura.total.toString(),
    moneda: datosFactura.moneda,
  });

  // Construir el URI del protocolo con los parámetros
  const uri = `${PROTOCOLO_EMPRESA}actualizar?${params.toString()}`;

  console.log("Ejecutando protocolo con parámetros:", uri);
  window.location.href = uri;
}
