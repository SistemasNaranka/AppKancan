import { MAX_CARACTERES_OBSERVACION } from '../registro/reglas';

/** Momento en que se usa un motivo (`com_over_time_reasons.type`). */
export const TIPO_MOTIVO = {
	solicitud: 'solicitud',
	aprobacion: 'aprobacion',
	rechazo: 'rechazo',
} as const;

export type TipoMotivo = (typeof TIPO_MOTIVO)[keyof typeof TIPO_MOTIVO];

/** Un motivo del catálogo, ya listo para la app. */
export interface Motivo {
	id: number;
	nombre: string;
	descripcion: string;
	tipo: TipoMotivo;
	/** `requires_note`: al elegirlo hay que escribir el motivo en texto ("Otros"). */
	pideTexto: boolean;
	activo: boolean;
	orden: number;
}

/** Los que se ofrecen para elegir: activos del tipo, en el orden del catálogo. */
export const motivosParaElegir = (
	motivos: readonly Motivo[],
	tipo: TipoMotivo,
): Motivo[] =>
	motivos
		.filter((m) => m.activo && m.tipo === tipo)
		.sort(
			(a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'),
		);

export type ErroresMotivo = Partial<Record<'motivo' | 'texto', string>>;

/** Motivo obligatorio y, si lo pide ("Otros"), el texto. Objeto vacío si está bien. */
export function validarMotivo(
	motivo: Motivo | undefined,
	texto: string,
): ErroresMotivo {
	if (!motivo) return { motivo: 'Elige un motivo' };
	const t = texto.trim();
	if (motivo.pideTexto && !t) return { texto: 'Escribe el motivo' };
	if (t.length > MAX_CARACTERES_OBSERVACION)
		return { texto: `Máximo ${MAX_CARACTERES_OBSERVACION} caracteres` };
	return {};
}

/** El texto que se guarda: solo el del motivo que lo pide; en los demás, vacío. */
export const textoDelMotivo = (motivo: Motivo | undefined, texto: string) =>
	motivo?.pideTexto ? texto.trim() : '';

export const SIN_MOTIVO = 'Sin motivo (histórico)';

export type FiltroMotivo = number | 'todos' | 'sin';

export const coincideMotivo = (
	motivoId: number | null,
	filtro: FiltroMotivo,
): boolean =>
	filtro === 'todos' ||
	(filtro === 'sin' ? motivoId == null : motivoId === filtro);
