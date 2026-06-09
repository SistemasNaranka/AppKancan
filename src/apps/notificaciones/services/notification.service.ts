// services/notification.service.ts
import directus from "@/services/directus/directus";
import { withAutoRefresh, ensureValidToken } from "@/auth/services/directusInterceptor";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { readItems, createItem, deleteItem, updateItem } from "@directus/sdk";
import { ICreateNotification, INotification, INotificationGroup, EstadoVisibilidad } from "../interfaces/notification.interface";

interface IDirectusNotificationDetail {
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

interface IDirectusNotificationPending {
  id: string | number;
  date_created?: string;
  client_id?: string | number | null;
  is_delivered?: boolean | null;
  expiration_date?: string | null;
  scheduled_date?: string | null;
  status?: string | null;
  notification_id?: IDirectusNotificationDetail | null;
}

const mapTipoToDirectus = (tipo: ICreateNotification["tipo"]): string => {
  const map: Record<ICreateNotification["tipo"], string> = { 
    info: "INFO", 
    success: "SUCCESS", 
    warning: "WARNING", 
    error: "ERROR" 
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

const formatearFechaHora = (iso?: string) => {
  if (!iso) return { fecha: "", hora: "" };
  const d = new Date(iso);
  return { fecha: d.toLocaleDateString("es-ES"), hora: d.toLocaleTimeString("es-ES", { hour12: true }) };
};

export const servicioNotificaciones = {
  async obtenerRegistrosEntrega(): Promise<INotification[]> {
    try {
      const items = await withAutoRefresh(() =>
        directus.request(
          readItems("core_notifications_pending" as any, {
            fields: [
              "id",
              "date_created",
              "client_id",
              "is_delivered",
              "expiration_date",
              "scheduled_date",
              "status",
              "notification_id.id",
              "notification_id.title",
              "notification_id.message",
              "notification_id.notification_type",
              "notification_id.is_persistent",
              "notification_id.duration_seconds",
              "notification_id.destinations_raw",
              "notification_id.sender_name",
              "notification_id.date_created",
              "notification_id.action_route",
            ] as any[],
            sort: ["-date_created"],
            limit: 500,
          })
        )
      );
      if (!items) return [];
      return (items as any[]).map((item: IDirectusNotificationPending) => {
        const notif = item.notification_id || ({} as Partial<IDirectusNotificationDetail>);
        const dateCreated = notif.date_created || item.date_created;
        const { fecha, hora } = formatearFechaHora(dateCreated);
        const estado = mapTipoToEstado(notif.notification_type ?? "");
        const rawStatus = (item.status ?? "activo").toString().toLowerCase();
        const statusNormalizado: EstadoVisibilidad = rawStatus === "inactivo" ? "inactivo" : "activo";
        return {
          id: `#KM-${item.id}`,
          titulo: notif.title ?? "Sin título",
          mensaje: notif.message ?? "",
          tipo_notificacion: estado,
          progreso: estado === "ENTREGADO" ? 100 : estado === "ERROR" ? 10 : 40,
          fecha,
          hora,
          destinatarios: notif.destinations_raw ?? "",
          persistente: notif.is_persistent ?? false,
          duracion: notif.duration_seconds ?? 0,
          sender_name: notif.sender_name ?? "Sistema",
          duration_seconds: notif.duration_seconds ?? 0,
          status: statusNormalizado,
        };
      });
    } catch (error) {
      console.error("❌ Error en obtenerRegistrosEntrega:", error);
      return [];
    }
  },

  async obtenerClientesNotificadores(): Promise<{ id: string | number; code: string; name: string }[]> {
    try {
      const items = await withAutoRefresh(() =>
        directus.request(
          readItems("core_notification_group_members" as any, {
            fields: [
              "notifier_client_id.core_notifier_clients_id.id",
              "notifier_client_id.core_notifier_clients_id.code",
              "notifier_client_id.core_notifier_clients_id.name",
            ] as any[],
            filter: {
              group_id: {
                type: {
                  _eq: "destinatarios",
                },
              },
            },
            limit: 500,
          })
        )
      );
      if (!items) return [];

      const clientsMap = new Map<string | number, { id: string | number; code: string; name: string }>();
      items.forEach((item: any) => {
        const junctions = item.notifier_client_id;
        if (Array.isArray(junctions)) {
          junctions.forEach((junc: any) => {
            const client = junc.core_notifier_clients_id;
            if (client && client.id) {
              clientsMap.set(client.id, {
                id: client.id,
                code: client.code || "",
                name: client.name || "Sin nombre",
              });
            }
          });
        }
      });

      return Array.from(clientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("❌ Error al cargar clientes notificadores:", error);
      return [];
    }
  },

  async obtenerGrupos(): Promise<INotificationGroup[]> {
    try {
      const items = await withAutoRefresh(() =>
      directus.request(
        readItems("core_notification_groups" as any, {
          fields: ["id", "name"],
          sort: ["name"],
        })
      )
    );
    return items.map((item: any) => ({ id: item.id, name: item.name}));
    } catch (error) {
      console.error("❌ Error al cargar grupos:", error);
      return [];
    }
  },

  async enviarNotificacion(payload: ICreateNotification): Promise<void> {
    try {
      if (!payload.mensaje?.trim()) throw new Error("El mensaje es obligatorio.");
      await ensureValidToken();
      const tokens = cargarTokenStorage();
      if (!tokens?.access) throw new Error("No se pudo obtener el token de acceso.");

      const destinatariosArray = Array.isArray(payload.destinatarios) ? payload.destinatarios : payload.destinatarios ? [payload.destinatarios] : ["todos"];
      const excluirArray = Array.isArray(payload.excluir) ? payload.excluir : payload.excluir ? [payload.excluir] : [];

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
        headers: { "Authorization": `Bearer ${tokens.access}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
      }
      console.log("✅ Notificación enviada");
    } catch (error) {
      console.error("❌ Error en enviarNotificacion:", error);
      throw error;
    }
  },

  async eliminarNotificacion(id: string): Promise<void> {
    try {
      const cleanId = id.replace(/^#KM-/, "");
      await withAutoRefresh(() => directus.request(deleteItem("core_notifications_pending" as any, cleanId as any)));
      console.log(`✅ Notificación ${id} eliminada`);
    } catch (error) {
      console.error("❌ Error al eliminar notificación:", error);
      throw error;
    }
  },

  /**
   * Cambia el estado de visibilidad (status) de la notificación en
   * core_notifications_pending entre 'activo' e 'inactivo'.
   */
  async toggleVisibilidadNotificacion(id: string, nuevoStatus: EstadoVisibilidad): Promise<void> {
    try {
      const cleanId = id.replace(/^#KM-/, "");
      await withAutoRefresh(() =>
        directus.request(
          updateItem("core_notifications_pending" as any, cleanId as any, { status: nuevoStatus } as any)
        )
      );
      console.log(`✅ Notificación ${id} ahora está ${nuevoStatus}`);
    } catch (error) {
      console.error("❌ Error al cambiar visibilidad de notificación:", error);
      throw error;
    }
  },
};