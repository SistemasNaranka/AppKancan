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

export const PROTOCOLO_EMPRESA = "empresa://";
export function executeContabilizarFactura(
  datosFactura?: DatosFacturaPDF | null,
) {
  if (!datosFactura) {
    alert("No hay datos de factura para contabilizar");
    return;
  }

  const paramsObj: Record<string, string> = {
    numero: datosFactura.numeroSinPrefijo || datosFactura.numeroFactura,
    fechaVencimiento: datosFactura.fechaVencimiento || "",
    fechaEmision: datosFactura.fechaEmision,
    automatico: datosFactura.automaticoAsignado || datosFactura.automatico || "",
  };

  if (datosFactura.entrada) {
    paramsObj.entrada = datosFactura.entrada;
  }

  const params = new URLSearchParams(paramsObj);

  const uri = `${PROTOCOLO_EMPRESA}actualizar?${params.toString()}`;

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
