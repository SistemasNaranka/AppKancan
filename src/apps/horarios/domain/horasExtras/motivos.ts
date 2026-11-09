import { MAX_CARACTERES_OBSERVACION } from '../registro/reglas';

/** Momento en que se usa un motivo (`com_over_time_reasons.type`). */
export const TIPO_MOTIVO = {
	/** Al crear. Aprobar no tiene lista propia: se aprueba con este motivo. */
	solicitud: 'solicitud',
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
	/** `is_system`: motivo base, no se edita ni se borra. */
	sistema: boolean;
}

/** Todos los del tipo (también inactivos), en el orden del catálogo. */
export const motivosDelTipo = (
	motivos: readonly Motivo[],
	tipo: TipoMotivo,
): Motivo[] =>
	motivos
		.filter((m) => m.tipo === tipo)
		.sort(
			(a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'),
		);

/** Los que se ofrecen para elegir: activos del tipo, en el orden del catálogo. */
export const motivosParaElegir = (
	motivos: readonly Motivo[],
	tipo: TipoMotivo,
): Motivo[] => motivosDelTipo(motivos, tipo).filter((m) => m.activo);

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

export const MAX_NOMBRE_MOTIVO = 60;
export const MAX_DESCRIPCION_MOTIVO = 150;
/** Activos por lista (sistema incluidos): una lista larga hace que se elija mal. */
export const MAX_MOTIVOS_ACTIVOS = 10;
/** `sort` de "Otros": siempre al final. */
const ORDEN_FINAL = 99;

const normalizar = (t: string) =>
	t
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

export type ErroresNuevoMotivo = Partial<
	Record<'nombre' | 'descripcion', string>
>;

/** Nombre requerido y sin repetir en la lista (sin importar mayúsculas ni tildes). */
export function validarNuevoMotivo(
	datos: { nombre: string; descripcion: string },
	delTipo: readonly Motivo[],
	editandoId?: number,
): ErroresNuevoMotivo {
	const errores: ErroresNuevoMotivo = {};
	const nombre = normalizar(datos.nombre);
	if (!nombre) errores.nombre = 'Escribe el nombre';
	else if (datos.nombre.trim().length > MAX_NOMBRE_MOTIVO)
		errores.nombre = `Máximo ${MAX_NOMBRE_MOTIVO} caracteres`;
	else if (
		delTipo.some((m) => m.id !== editandoId && normalizar(m.nombre) === nombre)
	)
		errores.nombre = 'Ya existe un motivo con ese nombre';
	if (datos.descripcion.trim().length > MAX_DESCRIPCION_MOTIVO)
		errores.descripcion = `Máximo ${MAX_DESCRIPCION_MOTIVO} caracteres`;
	return errores;
}

/** `sort` de un motivo nuevo: después de los demás y antes de "Otros". */
export const ordenNuevoMotivo = (delTipo: readonly Motivo[]) =>
	Math.min(
		ORDEN_FINAL - 1,
		Math.max(0, ...delTipo.map((m) => m.orden).filter((o) => o < ORDEN_FINAL)) +
			1,
	);

/** Hay cupo para un motivo activo más en la lista. */
export const hayCupoMotivo = (delTipo: readonly Motivo[]) =>
	delTipo.filter((m) => m.activo).length < MAX_MOTIVOS_ACTIVOS;
