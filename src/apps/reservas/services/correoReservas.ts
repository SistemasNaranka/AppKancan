import type { NuevaReserva } from "../types/reservas.types";

// Credenciales y URL del webhook n8n. Mismo patrón que traslados.
const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;

// URLs separadas por evento. Cada evento tiene su propio webhook n8n.
const WEBHOOK_URL_CREADA = import.meta.env.VITE_WEBHOOK_URL_ENVIO_CORREO;
const WEBHOOK_URL_ACTUALIZADA = import.meta.env.VITE_WEBHOOK_URL_RESERVA_ACTUALIZADA;
const WEBHOOK_URL_CANCELADA = import.meta.env.VITE_WEBHOOK_URL_RESERVA_CANCELADA;

type EventoReserva = "reserva_creada" | "reserva_actualizada" | "reserva_cancelada";

export interface NotificarCorreoReservaPayload {
  evento: EventoReserva;
  reserva: NuevaReserva;
  timestamp?: string;
}

const URL_POR_EVENTO: Record<EventoReserva, string | undefined> = {
  reserva_creada: WEBHOOK_URL_CREADA,
  reserva_actualizada: WEBHOOK_URL_ACTUALIZADA,
  reserva_cancelada: WEBHOOK_URL_CANCELADA,
};

/**
 * Envía notificación de correo a través del webhook de n8n.
 * Usa Basic Auth con credenciales VITE_WEBHOOK_USERNAME / VITE_WEBHOOK_PASSWORD.
 *
 * No bloquea el flujo principal: si falla, lanza Error y el caller decide
 * si mostrar al usuario o solo logear.
 */
export async function notificarCorreoReserva(
  payload: NotificarCorreoReservaPayload,
): Promise<any> {
  const url = URL_POR_EVENTO[payload.evento];
  if (!url) {
    throw new Error(`Webhook URL no definida para evento "${payload.evento}". Revisa tu .env`);
  }

  const body = {
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + btoa(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`),
      },
      body: JSON.stringify(body),
    });

    const responseText = await resp.text();

    if (!resp.ok) {
      let errorMessage = `Error al enviar correo (${resp.status})`;
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
    console.error("❌ Error en notificarCorreoReserva:", error);
    throw new Error(error.message || "Error de conexión al enviar correo");
  }
}
