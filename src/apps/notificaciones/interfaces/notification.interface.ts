export interface INotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo_notificacion: 'EN COLA' | 'ERROR' | 'ENTREGADO' | 'ADVERTENCIA';
  progreso: number;
  fecha: string;
  hora: string;
}