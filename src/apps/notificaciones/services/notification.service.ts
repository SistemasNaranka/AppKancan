// services/notification.service.ts
import directus from "@/services/directus/directus";
import { withAutoRefresh, ensureValidToken } from "@/auth/services/directusInterceptor";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
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

      // Asegurarse de tener un token de Directus válido
      await ensureValidToken();
      const tokens = cargarTokenStorage();
      if (!tokens?.access) {
        throw new Error("No se pudo obtener el token de acceso para enviar la notificación.");
      }

      // Preparar destinatarios (debe ser un array de strings en FastAPI)
      const destinatariosArray = Array.isArray(payload.destinatarios)
        ? payload.destinatarios
        : payload.destinatarios
        ? [payload.destinatarios]
        : ["todos"];

      // Preparar excluidos (debe ser un array de strings en FastAPI)
      const excluirArray = Array.isArray(payload.excluir)
        ? payload.excluir
        : payload.excluir
        ? [payload.excluir]
        : [];

      // Construir el objeto para el servidor de notificaciones (puerto 5050)
      const body = {
        destinatarios: destinatariosArray,
        excluir: excluirArray,
        titulo: payload.titulo || "Notificación",
        mensaje: payload.mensaje,
        tipo: payload.tipo || "info",
        duracion_seg: Number(payload.duracion_seg) || 15,
        persistente: payload.persistente ?? false,
        clickeable: payload.clickeable ?? false,
        mostrar_boton_cerrar: payload.mostrar_boton_cerrar ?? true,
        pausar_al_hover: payload.pausar_al_hover ?? true,
        ruta_accion: payload.ruta_accion || null,
        fecha_programada: payload.fecha_programada || null,
      };

      const response = await fetch("http://192.168.19.245:5050/notify", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `Error ${response.status} en el servidor de notificaciones.`
        );
      }

      console.log("✅ Notificación enviada exitosamente al servidor");
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