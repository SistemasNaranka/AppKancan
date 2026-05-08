import type { Traslado } from "../hooks/types";

const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;
const WEBHOOK_URL_POST = import.meta.env.VITE_WEBHOOK_URL_POST_TRASLADOS;
const WEBHOOK_URL_TRASLADOS = import.meta.env.VITE_WEBHOOK_URL_TRASLADOS;
const WEBHOOK_URL_TRASLADOS_TIENDAS = import.meta.env
  .VITE_WEBHOOK_URL_TRASLADOS_TIENDAS;

/**
 * Obtiene los traslados pendientes desde el backend
 * @param ultra_code - Código del usuario (proviene de user.ultra_code)
 * @param company - Empresa del usuario (proviene de user.company)
 * @param esTienda - Si es true, usa la URL de traslados de tiendas
 */
export async function obtenerTraslados(
  ultra_code: string,
  company: string,
  esTienda: boolean = false,
): Promise<Traslado[]> {
  // Seleccionar la URL correcta según el tipo de usuario
  const url = esTienda ? WEBHOOK_URL_TRASLADOS_TIENDAS : WEBHOOK_URL_TRASLADOS;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Mapeamos de vuelta a los nombres que espera el Webhook
    body: JSON.stringify({ codigo_ultra: ultra_code, empresa: company }),
  });

  if (!resp.ok) {
    throw new Error(`Error del servidor (${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error("Formato inesperado de datos recibidos");
  }

  return data;
}

// 🔹 Interfaz para la estructura de envío que espera el Webhook
export interface AprobacionTrasladosRequest {
  traslados: Array<{
    traslado: number;
    fecha: string;
  }>;
  empresa: string;
  codigo_ultra: string;
  clave: string;
}

export async function aprobarTraslados(
  trasladosSeleccionados: Traslado[],
  company: string,
  ultra_code: string,
  clave: string,
): Promise<any> {
  // ✅ Validaciones
  if (!company || !ultra_code || !clave) {
    throw new Error("Faltan datos requeridos: empresa, codigo_ultra o clave");
  }

  if (!trasladosSeleccionados || trasladosSeleccionados.length === 0) {
    throw new Error("No hay traslados seleccionados para aprobar");
  }

  // ✅ Transformar los traslados al formato requerido
  const trasladosFormateados = trasladosSeleccionados.map((t) => ({
    traslado: t.traslado,
    fecha: t.fecha,
  }));

  // ✅ Construir el payload con la estructura exacta que espera el Webhook
  const payload: AprobacionTrasladosRequest = {
    traslados: trasladosFormateados,
    empresa: company,
    codigo_ultra: String(ultra_code),
    clave,
  };


  // ✅ Hacer la petición al endpoint
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
      let errorMessage = `Error al aprobar traslados (${resp.status})`;
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
    console.error("❌ Error en aprobarTraslados:", error);
    throw new Error(error.message || "Error de conexión al aprobar traslados");
  }
}
