// services/notification.service.ts
import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem, deleteItem } from "@directus/sdk";
import { ICreateNotification, INotification } from "../interfaces/notification.interface";

interface IDirectusNotification {
  id: string | number;
  title?: string | null;
  message?: string | null;
  notification_type?: string | null;
  is_persistent?: boolean | null;
  duration_seconds?: number | null;
  destinations_raw?: string | null;
  sender_name?: string | null;
  date_created?: string;
  action_route?: string | null;
}

// ------------------------------------------------------------
// Mapeo de tipos de notificación
// ------------------------------------------------------------
const mapTipoToDirectus = (tipo: ICreateNotification["tipo"]): string => {
  const map = {
    info: "INFO",
    success: "SUCCESS",
    warning: "WARNING",
    error: "ERROR",
  };
  return map[tipo] ?? "INFO";
};

const mapTipoToEstado = (raw: string): INotification["tipo_notificacion"] => {
  const t = raw?.toUpperCase() ?? "";
  if (t === "SUCCESS") return "ENTREGADO";
  if (t === "ERROR") return "ERROR";
  if (t === "WARNING") return "ADVERTENCIA";
  if (t === "INFO") return "INFORMACIÓN";
  return "EN COLA";
};

// ------------------------------------------------------------
// Formateo de fecha/hora
// ------------------------------------------------------------
const formatearFechaHora = (iso?: string) => {
  if (!iso) return { fecha: "", hora: "" };
  const d = new Date(iso);
  return {
    fecha: d.toLocaleDateString("es-ES"),
    hora: d.toLocaleTimeString("es-ES", { hour12: true }),
  };
};

// ------------------------------------------------------------
// SERVICIO PRINCIPAL
// ------------------------------------------------------------
export const servicioNotificaciones = {
  /**
   * Obtiene todas las notificaciones ordenadas por fecha descendente
   */
  async obtenerRegistrosEntrega(): Promise<INotification[]> {
    try {
      const items = await withAutoRefresh(() =>
        directus.request(
          readItems("core_notifications", {
            fields: [
              "id",
              "title",
              "message",
              "notification_type",
              "is_persistent",
              "duration_seconds",
              "destinations_raw",
              "sender_name",
              "date_created",
              "action_route",
            ],
            sort: ["-date_created"],
            limit: 500,
          })
        )
      );

      if (!items) return [];

      return (items as IDirectusNotification[]).map((item) => {
        const { fecha, hora } = formatearFechaHora(item.date_created);
        const estado = mapTipoToEstado(item.notification_type ?? "");
        return {
          id: `#KM-${item.id}`,
          titulo: item.title ?? "Sin título",
          mensaje: item.message ?? "",
          tipo_notificacion: estado,
          progreso: estado === "ENTREGADO" ? 100 : estado === "ERROR" ? 10 : 40,
          fecha,
          hora,
          destinatarios: item.destinations_raw ?? "",
          persistente: item.is_persistent ?? false,
          duracion: item.duration_seconds ?? 0,
          sender_name: item.sender_name ?? "Sistema",
          duration_seconds: item.duration_seconds ?? 0,
        };
      });
    } catch (error) {
      console.error("❌ Error en obtenerRegistrosEntrega:", error);
      return [];
    }
  },

  /**
   * Crea una nueva notificación en Directus
   * Solo envía los campos que SÍ existen en la colección core_notifications
   */
  async enviarNotificacion(payload: ICreateNotification): Promise<void> {
    try {
      // Validaciones básicas
      if (!payload.mensaje?.trim()) {
        throw new Error("El mensaje es obligatorio.");
      }

      // Preparar destinatarios (como string separado por comas)
      let destinatariosStr = "todos";
      if (payload.destinatarios) {
        if (Array.isArray(payload.destinatarios)) {
          destinatariosStr = payload.destinatarios.join(",");
        } else {
          destinatariosStr = payload.destinatarios;
        }
      }

      // Construir el objeto que se enviará a Directus
      const body: Record<string, string | number | boolean | null> = {
        title: payload.titulo || "Notificación",
        message: payload.mensaje,
        notification_type: mapTipoToDirectus(payload.tipo),
        is_persistent: payload.persistente ?? false,
        duration_seconds: Number(payload.duracion_seg) || 20,
        destinations_raw: destinatariosStr,
        sender_name: "Sistema",
      };

      // Campo opcional: ruta de acción
      if (payload.ruta_accion?.trim()) {
        body.action_route = payload.ruta_accion.trim();
      }

      // Campo opcional: fecha programada para más tarde
      if (payload.fecha_programada) {
        body.scheduled_at = payload.fecha_programada;
      }

      // Envío a Directus
      await withAutoRefresh(() =>
        directus.request(createItem("core_notifications", body))
      );
      console.log("✅ Notificación creada exitosamente");
    } catch (error) {
      console.error("❌ Error en enviarNotificacion:", error);
      throw error;
    }
  },

  /**
   * Elimina una notificación por ID (acepta formato "#KM-123" o solo el número)
   */
  async eliminarNotificacion(id: string): Promise<void> {
    try {
      const cleanId = id.replace(/^#KM-/, "");
      await withAutoRefresh(() =>
        directus.request(deleteItem("core_notifications", cleanId))
      );
      console.log(`✅ Notificación ${id} eliminada`);
    } catch (error) {
      console.error("❌ Error al eliminar notificación:", error);
      throw error;
    }
  },
};