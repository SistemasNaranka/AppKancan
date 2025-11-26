const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;
const WEBHOOK_URL_POST = import.meta.env.VITE_WEBHOOK_URL_POST_MUESTRAS;

// 🔹 Interfaz para la estructura de envío de muestras
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

/**
 * Envía las muestras escaneadas al backend para su procesamiento
 * Reutiliza la lógica de autenticación y envío de traslados
 * Estructura específica:
 * {
 *   "records": [{"barcode": 12345, "quantity": 10}],
 *   "storeId": "34",
 *   "observations": "Texto opcional",
 *   "movementType": "E"
 * }
 */
export async function enviarMuestras(
  articulos: Array<{ codigo: string; cantidad: number }>,
  bodega: string,
  observaciones?: string,
  printer: number = 2
): Promise<any> {
  // ✅ Validaciones previas
  if (!articulos || articulos.length === 0) {
    throw new Error("No hay códigos para enviar");
  }

  if (!bodega || bodega.trim() === "") {
    throw new Error("Debe seleccionar una bodega");
  }

  // ✅ Transformar los códigos al formato requerido (convertir string a number)
  const records = articulos.map((c) => ({
    movementType: "E",
    barcode: parseInt(c.codigo, 10),
    quantity: c.cantidad,
  }));

  // ✅ Construir el payload con la estructura exacta
  const payload: EnvioMuestrasRequest = {
    records: records,
    storeId: bodega,
    observations: observaciones || "",
    factory: "Naranka",
    printer: printer.toString(),
  };

  console.log("📤 Enviando muestras:", payload);
  //colocar un tiempo de espera en lo que se envia los datos
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // ✅ Hacer la petición al endpoint usando las mismas credenciales que traslados
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

    // Leer la respuesta como texto primero
    const responseText = await resp.text();

    if (!resp.ok) {
      // Intentar parsear el error como JSON
      let errorMessage = `Error al enviar muestras (${resp.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // ✅ Intentar parsear la respuesta exitosa
    try {
      return JSON.parse(responseText);
    } catch {
      // Si no es JSON, devolver como texto
      return { mensaje: responseText, success: true };
    }
  } catch (error: any) {
    console.error("❌ Error en enviarMuestras:", error);
    throw new Error(error.message || "Error de conexión al enviar muestras");
  }
}
