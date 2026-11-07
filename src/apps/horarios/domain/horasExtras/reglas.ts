import { MAX_CARACTERES_OBSERVACION } from '../registro/reglas';
import { ESTADOS_ACTIVOS, type EstadoHoraExtra } from './estados';

/** Bloque por defecto, si no se puede leer el configurado en Directus. */
export const BLOQUE_MINUTOS = 15;
/** Solo bloques que en horas dan un decimal exacto (nómina): 0.25, 0.5, 1. */
export const BLOQUES_PERMITIDOS = [15, 30, 60] as const;

export const esBloquePermitido = (minutos: unknown): minutos is number =>
	(BLOQUES_PERMITIDOS as readonly unknown[]).includes(minutos);

/** "15 min (0.25 h)". */
export const textoBloque = (bloque: number) =>
	`${bloque} min (${bloque / 60} h)`;

/** Atajos del registro masivo: múltiplos del bloque, sin repetir. */
export const valoresRapidos = (bloque: number) => [
	...new Set([1, 2, 4, 6, 8, 12].map((n) => n * bloque)),
];

export interface HoraExtraBorrador {
	/** YYYY-MM-DD */
	workDate: string;
	minutos: number;
	observacion?: string;
}

export interface ContextoValidacion {
	/** YYYY-MM-DD (`getRealColombiaTime`). */
	hoy: string;
	empleadoActivo: boolean;
	empleadoDelLider: boolean;
	/** Minutos del bloque configurado; por defecto `BLOQUE_MINUTOS`. */
	bloque?: number;
}

export type ErroresHoraExtra = Partial<
	Record<'workDate' | 'minutos' | 'observacion' | 'empleado', string>
>;

/** Errores del formulario; objeto vacío si es válido. */
export function validarHoraExtra(
	b: HoraExtraBorrador,
	ctx: ContextoValidacion,
): ErroresHoraExtra {
	const errores: ErroresHoraExtra = {};
	if (!/^\d{4}-\d{2}-\d{2}$/.test(b.workDate))
		errores.workDate = 'La fecha es obligatoria';
	else if (b.workDate > ctx.hoy)
		errores.workDate = 'No se pueden registrar horas extras de días futuros';

	if (!Number.isInteger(b.minutos) || b.minutos <= 0)
		errores.minutos = 'Las horas extras deben ser mayores que cero';
	else if (b.minutos % (ctx.bloque ?? BLOQUE_MINUTOS) !== 0)
		errores.minutos = `Las horas extras van en bloques de ${textoBloque(ctx.bloque ?? BLOQUE_MINUTOS)}`;

	if ((b.observacion?.length ?? 0) > MAX_CARACTERES_OBSERVACION)
		errores.observacion = `Máximo ${MAX_CARACTERES_OBSERVACION} caracteres`;

	if (!ctx.empleadoActivo) errores.empleado = 'El empleado no está activo';
	else if (!ctx.empleadoDelLider)
		errores.empleado = 'El empleado no pertenece a tus tiendas';
	return errores;
}

/** Otra hora extra activa entre `existentes` (las del mismo empleado y día). Es un aviso: no bloquea. */
export function buscarDuplicado<
	T extends { id: number; status: EstadoHoraExtra },
>(existentes: readonly T[], excluirId?: number): T | undefined {
	return existentes.find(
		(h) => h.id !== excluirId && ESTADOS_ACTIVOS.includes(h.status),
	);
}

/** 90 → "1 h 30 min". */
export function formatoMinutos(minutos: number): string {
	const h = Math.floor(minutos / 60);
	const m = minutos % 60;
	if (h === 0) return `${m} min`;
	return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Cuántas horas (registros) no son múltiplo de `bloque`, de un conteo minutos → registros. */
export const fueraDeBloque = (
	porMinutos: ReadonlyMap<number, number>,
	bloque: number,
) =>
	[...porMinutos].reduce(
		(n, [minutos, registros]) => n + (minutos % bloque === 0 ? 0 : registros),
		0,
	);
