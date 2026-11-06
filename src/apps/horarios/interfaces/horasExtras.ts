import type { EstadoHoraExtra } from '../domain/horasExtras';

/** Fila de la tabla de horas extras, ya resuelta para mostrar. */
export interface HoraExtraFila {
	id: number;
	/** YYYY-MM-DD (para ordenar y filtrar). */
	fecha: string;
	empleadoId: number | null;
	empleado: string;
	documento: string;
	/** Cargo del empleado ('' si no tiene): cambia el valor de la hora extra. */
	cargo: string;
	tiendaId: number | null;
	tienda: string;
	/** La tienda donde trabajó no es la del empleado (rotación). */
	rotacion: boolean;
	minutos: number;
	/** Motivo de la solicitud (`reason_id.name`); '' en horas anteriores a los motivos. */
	motivo: string;
	/** Texto del motivo "Otros" o, en horas viejas, la observación libre. */
	observacion: string;
	estado: EstadoHoraExtra;
	creadaPor: string;
	/** ISO, o '' si no viene. */
	creadaEl: string;
	/** Quién aprobó o rechazó (`updated_by` en una fila revisada); '' si aún no. */
	revisadaPor: string;
	/** ISO (`reviewed_at`), o ''. */
	revisadaEl: string;
	/** Motivo de la revisión elegido de la lista (`review_reason_id.name`), o ''. */
	motivoRevision: string;
	/** Texto del rechazo (`review_note`): el de "Otros" o, en horas viejas, el motivo libre. */
	motivoRechazo: string;
	/** Periodo de nómina vinculado; `null` = sin vincular. Fechas YYYY-MM-DD ('' si no se expandieron). */
	periodo: {
		id: number;
		/** Nombre del periodo ('' si no tiene o no se expandió). */
		nombre?: string;
		inicio: string;
		fin: string;
	} | null;
}
