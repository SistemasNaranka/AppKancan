import { resolveNetworkUrl } from "@/shared/utils/network";

const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;
const WEBHOOK_URL_POST = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_POST_MUESTRAS);

export interface EnvioMuestrasRequest {
  records: Array<{
    barcode: number;
    quantity: number;
    movementType: string;
  }>;
  storeId: string;
  observations?: string;
  factory?: string;
  printer?: string;
}

export async function sendSamples(
  articulos: Array<{ codigo: string; cantidad: number }>,
  bodega: string,
  observaciones?: string,
  printer: number = 2
): Promise<any> {
  if (!articulos || articulos.length === 0) {
    throw new Error("No hay códigos para enviar");
  }

  if (!bodega || bodega.trim() === "") {
    throw new Error("Debe seleccionar una bodega");
  }

  const records = articulos.map((c) => ({
    movementType: "E",
    barcode: parseInt(c.codigo, 10),
    quantity: c.cantidad,
  }));

  const payload: EnvioMuestrasRequest = {
    records: records,
    storeId: bodega,
    observations: observaciones || "",
    factory: "Naranka",
    printer: printer.toString(),
  };

  try {
    const resp = await fetch(WEBHOOK_URL_POST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + btoa(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`),
      },
      body: JSON.stringify(payload),
    });

    const responseText = await resp.text();

    if (!resp.ok) {
      let errorMessage = `Error al enviar muestras (${resp.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return { mensaje: responseText, success: true };
    }
  } catch (error: any) {
    console.error("❌ Error en enviarMuestras:", error);
    throw new Error(error.message || "Error de conexión al enviar muestras");
  }
}
