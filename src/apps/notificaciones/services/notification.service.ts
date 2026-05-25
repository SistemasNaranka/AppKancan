import { INotification } from '../interfaces/notification.interface';

const demoContactData: INotification[] = [
  { id: '#KM-00148', titulo: 'Presupuesto de Mayo', mensaje: 'Región Norte procesando...', tipo_notificacion: 'EN COLA', progreso: 40, fecha: '21/05/2026', hora: '10:16:55 a.m.' },
  { id: '#KM-00147', titulo: 'Actualización de Ruta', mensaje: 'Cambio protocolo descarga contenedores...', tipo_notificacion: 'ENTREGADO', progreso: 100, fecha: '21/05/2026', hora: '09:42:12 a.m.' },
  { id: '#KM-00146', titulo: 'Alerta de Latencia', mensaje: 'Demora crítica nodo 4-G detectada...', tipo_notificacion: 'ERROR', progreso: 10, fecha: '20/05/2026', hora: '23:15:00 p.m.' },
  { id: '#KM-00145', titulo: 'Aviso de Mantenimiento', mensaje: 'Programación mantenimiento preventivo...', tipo_notificacion: 'ADVERTENCIA', progreso: 25, fecha: '20/05/2026', hora: '18:30:10 p.m.' },
  // Se añaden registros extra para la funcionalidad del paginado
  { id: '#KM-00144', titulo: 'Backlog logístico', mensaje: 'Demo: Datos simulados para paginado', tipo_notificacion: 'ENTREGADO', progreso: 100, fecha: '19/05/2026', hora: '11:00:00 a.m.' },
  { id: '#KM-00143', titulo: 'Sincronización Nodos', mensaje: 'Demo: Datos simulados para paginado', tipo_notificacion: 'ENTREGADO', progreso: 100, fecha: '19/05/2026', hora: '10:15:22 a.m.' },
];

export const servicioNotificaciones = {
  obtenerRegistrosEntrega: async (): Promise<INotification[]> => {
    try {
      const response = await fetch('/api-data/items/core_notifications?sort=-sent_at');
      if (!response.ok) throw new Error('CORS o Red');
      const resData = await response.json();
      return resData.data && resData.data.length > 0 ? resData.data : demoContactData;
    } catch (error) {
      console.warn("Conexión bloqueada por CORS o servidor inaccesible. Cargando base de datos demo.");
      return demoContactData;
    }
  }
};