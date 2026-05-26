// ─────────────────────────────────────────────────────────
//  interfaces/notification.interface.ts
// ─────────────────────────────────────────────────────────

export interface INotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo_notificacion: 'ENTREGADO' | 'ERROR' | 'ADVERTENCIA' | 'INFORMACIÓN' | 'EN COLA';
  progreso: number;
  fecha: string;
  hora: string;
  destinatarios?: string;
  persistente?: boolean;
  duracion?: number;
}

export interface ICreateNotification {
  destinatarios: string | string[];
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  duracion_seg: number;
  persistente: boolean;
  clickeable?: boolean;
  mostrar_boton_cerrar?: boolean;
  pausar_al_hover?: boolean;
  excluir?: string[];
  ruta_accion?: string | null;
  fecha_programada?: string | null;
}