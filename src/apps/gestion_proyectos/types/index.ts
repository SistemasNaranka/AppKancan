export type ProyectoEstado = "pendiente" | "en_proceso" | "completado" | "cancelado";

export interface Proyecto {
  id: string;
  nombre: string;
  estado: ProyectoEstado;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  responsable_id?: string;
  [key: string]: any;
}
