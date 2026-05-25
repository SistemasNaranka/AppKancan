import { INotification } from '../interfaces/notification.interface';

/**
 * Limpia las etiquetas HTML de un texto (útil para exportaciones a CSV limpias)
 */
export const cleanHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Devuelve la configuración de estilos (colores de fondo y texto) 
 * y el icono correspondiente según el tipo de notificación.
 */
export const getStatusConfig = (type: string) => {
  const normalized = type?.toUpperCase() || 'INFO';
  
  switch (normalized) {
    case 'ÉXITO':
    case 'SUCCESS':
      return {
        bg: '#f0fdf4',      // Verde claro
        color: '#16a34a',   // Verde oscuro
        label: 'ÉXITO'
      };
    case 'ERROR':
    case 'FAILED':
      return {
        bg: '#fef2f2',      // Rojo claro
        color: '#dc2626',   // Rojo oscuro
        label: 'ERROR'
      };
    case 'INFO':
    case 'EN COLA':
    default:
      return {
        bg: '#eff6ff',      // Azul claro
        color: '#2563eb',   // Azul oscuro
        label: 'INFO'
      };
  }
};

/**
 * Filtra un array de notificaciones basándose en un término de búsqueda (ID o Título)
 */
export const filterNotifications = (items: INotification[], query: string): INotification[] => {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item => 
    item.id.toLowerCase().includes(lowerQuery) ||
    item.titulo.toLowerCase().includes(lowerQuery) ||
    item.mensaje.toLowerCase().includes(lowerQuery)
  );
};