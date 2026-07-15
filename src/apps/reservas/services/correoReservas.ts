import type { NewReservation } from "../types/reservas.types";
import { resolveNetworkUrl } from "@/shared/utils/network";

const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;

const WEBHOOK_URL_CREADA = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_ENVIO_CORREO);
const WEBHOOK_URL_ACTUALIZADA = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_RESERVA_ACTUALIZADA);
const WEBHOOK_URL_CANCELADA = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_RESERVA_CANCELADA);

type ReservationEvent = "reserva_creada" | "reserva_actualizada" | "reserva_cancelada";

export interface SendReservationEmailNotificationPayload {
  evento: ReservationEvent;
  reserva: NewReservation;
  timestamp?: string;
}

const URL_BY_EVENT: Record<ReservationEvent, string | undefined> = {
  reserva_creada: WEBHOOK_URL_CREADA,
  reserva_actualizada: WEBHOOK_URL_ACTUALIZADA,
  reserva_cancelada: WEBHOOK_URL_CANCELADA,
};

export async function sendReservationEmailNotification(
  payload: SendReservationEmailNotificationPayload,
): Promise<any> {
  const url = URL_BY_EVENT[payload.evento];
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
    console.error("❌ Error en sendReservationEmailNotification:", error);
    throw new Error(error.message || "Error de conexión al enviar correo");
  }
}
