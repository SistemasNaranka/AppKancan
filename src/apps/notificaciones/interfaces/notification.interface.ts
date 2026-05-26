export interface INotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo_notificacion: 'EN COLA' | 'ERROR' | 'ENTREGADO' | 'ADVERTENCIA';
  progreso: number;
  fecha: string;
  hora: string;
}

export interface ICreateNotification {
  destinatarios: string [];
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error' | 'info_dark';
  duracion_seg: number;
  persistente: boolean;
  clickeable: boolean;
  mostrar_boton_cerrar: boolean;
  pausar_al_hover:boolean;
  excluir: string[];
  ruta_accion: string | null;
  fecha_programada: string | null;

}