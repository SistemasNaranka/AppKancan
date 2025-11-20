// 🔹 Variables de entorno para credenciales y URLs (reutilizadas de traslados)
const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;
const WEBHOOK_URL_POST = import.meta.env.VITE_WEBHOOK_URL_POST;

// 🔹 Interfaz para la estructura de envío de muestras
export interface EnvioMuestrasRequest {
  codigos: Array<{
    codigo: number;
    cantidad: number;
  }>;
  bodega: number;
}

/**
 * Envía las muestras escaneadas al backend para su procesamiento
 * Reutiliza la lógica de autenticación y envío de traslados
 * Estructura específica:
 * {
 *   "codigos": [{"codigo": 12345, "cantidad": 10}],
 *   "bodega": 34
 * }
 */
export async function enviarMuestras(
  codigos: Array<{ codigo: string; cantidad: number }>,
  bodega: string
): Promise<any> {
  // ✅ Validaciones previas
  if (!codigos || codigos.length === 0) {
    throw new Error("No hay códigos para enviar");
  }

  if (!bodega || bodega.trim() === "") {
    throw new Error("Debe seleccionar una bodega");
  }

  // ✅ Transformar los códigos al formato requerido (convertir string a number)
  const codigosFormateados = codigos.map((c) => ({
    codigo: parseInt(c.codigo, 10),
    cantidad: c.cantidad,
  }));

  // ✅ Construir el payload con la estructura exacta
  const payload: EnvioMuestrasRequest = {
    codigos: codigosFormateados,
    bodega: parseInt(bodega, 10),
  };

  console.log("📤 Enviando muestras:", payload);

  // ✅ Hacer la petición al endpoint usando las mismas credenciales que traslados
  try {
    const resp = await fetch("http://localhost:1880/muestras", {
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

// 🔹 Función anterior mantenida por compatibilidad (puede ser removida después)
export const sendArticulos = async (data: {
  codigos: { codigo: number; cantidad: number }[];
  bodega: number;
}): Promise<void> => {
  // Aquí va la lógica para enviar a Node-RED
  // Asumiendo un endpoint POST a http://localhost:1880/muestras o similar
  const response = await fetch("http://localhost:1880/muestras", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al enviar códigos");
  }
};
