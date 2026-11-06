import { ESTADO_HORA_EXTRA } from './estados';
import type { Totales } from './reportes';

/** Una fila del agregado por motivo (y estado, y jefe si se pidió). */
export interface FilaMotivo extends Totales {
	motivoId: number | null;
	estado?: string | null;
	creadaPor?: string | null;
}

export interface MotivoReporte {
	/** `null`: horas históricas sin motivo. */
	motivoId: number | null;
	aprobadas: Totales;
	pendientes: Totales;
	rechazadas: Totales;
	/** Parte de las horas aprobadas del filtro (0–1). */
	porcentaje: number;
	/** Registros aprobados sobre los ya revisados (0–1); `null` si ninguno se revisó. */
	tasaAprobacion: number | null;
}

export interface ReporteMotivos {
	motivos: MotivoReporte[];
	aprobadas: Totales;
	pendientes: Totales;
	rechazadas: Totales;
	tasaAprobacion: number | null;
}

const cero = (): Totales => ({ registros: 0, minutos: 0 });
const sumar = (t: Totales, f: Totales) => {
	t.registros += f.registros;
	t.minutos += f.minutos;
};
const tasa = (a: Totales, r: Totales) =>
	a.registros + r.registros ? a.registros / (a.registros + r.registros) : null;
// Sin motivo (histórico) siempre al final.
const sinMotivoAlFinal = (
	a: { motivoId: number | null },
	b: { motivoId: number | null },
) => Number(a.motivoId == null) - Number(b.motivoId == null);

/** Horas por motivo de solicitud y estado. Otros estados (sugerida, del líder) no cuentan. */
export function reporteMotivos(filas: readonly FilaMotivo[]): ReporteMotivos {
	const porMotivo = new Map<number | null, MotivoReporte>();
	const total = { aprobadas: cero(), pendientes: cero(), rechazadas: cero() };
	for (const f of filas) {
		const clave =
			f.estado === ESTADO_HORA_EXTRA.aprobada
				? 'aprobadas'
				: f.estado === ESTADO_HORA_EXTRA.pendiente
					? 'pendientes'
					: f.estado === ESTADO_HORA_EXTRA.descartadaComercial
						? 'rechazadas'
						: null;
		if (!clave) continue;
		const m = porMotivo.get(f.motivoId) ?? {
			motivoId: f.motivoId,
			aprobadas: cero(),
			pendientes: cero(),
			rechazadas: cero(),
			porcentaje: 0,
			tasaAprobacion: null,
		};
		sumar(m[clave], f);
		sumar(total[clave], f);
		porMotivo.set(f.motivoId, m);
	}
	const motivos = [...porMotivo.values()]
		.map((m) => ({
			...m,
			porcentaje: total.aprobadas.minutos
				? m.aprobadas.minutos / total.aprobadas.minutos
				: 0,
			tasaAprobacion: tasa(m.aprobadas, m.rechazadas),
		}))
		.sort(
			(a, b) =>
				sinMotivoAlFinal(a, b) ||
				b.aprobadas.minutos - a.aprobadas.minutos ||
				b.rechazadas.minutos +
					b.pendientes.minutos -
					a.rechazadas.minutos -
					a.pendientes.minutos,
		);
	return {
		motivos,
		...total,
		tasaAprobacion: tasa(total.aprobadas, total.rechazadas),
	};
}

export interface RechazoMotivo extends Totales {
	motivoId: number | null;
	/** Parte de los registros rechazados (0–1). */
	porcentaje: number;
}

/** Rechazos por motivo de rechazo (`review_reason_id`), de más a menos registros. */
export function rechazosPorMotivo(
	filas: readonly FilaMotivo[],
): RechazoMotivo[] {
	const total = filas.reduce((s, f) => s + f.registros, 0);
	return filas
		.map((f) => ({
			motivoId: f.motivoId,
			registros: f.registros,
			minutos: f.minutos,
			porcentaje: total ? f.registros / total : 0,
		}))
		.sort((a, b) => sinMotivoAlFinal(a, b) || b.registros - a.registros);
}

export interface JefeMotivos {
	creadaPor: string | null;
	/** Minutos aprobados por motivo de solicitud. */
	porMotivo: Map<number | null, number>;
	aprobadas: Totales;
	rechazadas: Totales;
}

/** Por jefe de zona (quien crea): horas aprobadas por motivo y rechazos. Más horas primero. */
export function motivosPorJefe(filas: readonly FilaMotivo[]): JefeMotivos[] {
	const jefes = new Map<string | null, JefeMotivos>();
	for (const f of filas) {
		const aprobada = f.estado === ESTADO_HORA_EXTRA.aprobada;
		if (!aprobada && f.estado !== ESTADO_HORA_EXTRA.descartadaComercial)
			continue;
		const clave = f.creadaPor ?? null;
		const j = jefes.get(clave) ?? {
			creadaPor: clave,
			porMotivo: new Map(),
			aprobadas: cero(),
			rechazadas: cero(),
		};
		if (aprobada) {
			sumar(j.aprobadas, f);
			j.porMotivo.set(
				f.motivoId,
				(j.porMotivo.get(f.motivoId) ?? 0) + f.minutos,
			);
		} else sumar(j.rechazadas, f);
		jefes.set(clave, j);
	}
	return [...jefes.values()].sort(
		(a, b) =>
			b.aprobadas.minutos - a.aprobadas.minutos ||
			b.rechazadas.minutos - a.rechazadas.minutos,
	);
}
