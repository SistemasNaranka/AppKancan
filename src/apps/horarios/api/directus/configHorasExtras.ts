import { aggregate, readSingleton, updateSingleton } from '@directus/sdk';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import directus from '@/services/directus/directus';
import { ESTADO_HORA_EXTRA } from '../../domain/horasExtras';
import { errorDeApi } from '../../utils/errores';

const COLECCION = 'com_over_time_settings';

/** Bloque configurado, tal como viene de Directus (lo valida el hook). */
export async function leerBloqueHorasExtras(): Promise<unknown> {
	try {
		const fila = (await withAutoRefresh(() =>
			directus.request(readSingleton(COLECCION, { fields: ['block_minutes'] })),
		)) as { block_minutes?: unknown } | null;
		return fila?.block_minutes;
	} catch (error) {
		throw errorDeApi(
			error,
			'Error consultando la configuración de horas extras',
			'No se pudo cargar el bloque de horas extras',
		);
	}
}

export interface ConfigBloque {
	bloque: unknown;
	/** Nombre de quien lo cambió por última vez; vacío si no se sabe. */
	cambiadoPor: string;
	cambiadoEl: string | null;
}

/** Para Admin: el bloque y su último cambio. */
export async function leerConfigBloqueAdmin(): Promise<ConfigBloque> {
	try {
		const fila = (await withAutoRefresh(() =>
			directus.request(
				readSingleton(COLECCION, {
					fields: [
						'block_minutes',
						'date_updated',
						'user_updated.first_name',
						'user_updated.last_name',
					],
				}),
			),
		)) as {
			block_minutes?: unknown;
			date_updated?: string | null;
			user_updated?: { first_name?: string; last_name?: string } | null;
		} | null;
		const u = fila?.user_updated;
		return {
			bloque: fila?.block_minutes,
			cambiadoPor: [u?.first_name, u?.last_name].filter(Boolean).join(' '),
			cambiadoEl: fila?.date_updated ?? null,
		};
	} catch (error) {
		throw errorDeApi(
			error,
			'Error consultando la configuración de horas extras',
			'No se pudo cargar el bloque de horas extras',
		);
	}
}

export async function guardarBloqueHorasExtras(minutos: number) {
	try {
		return await withAutoRefresh(() =>
			directus.request(updateSingleton(COLECCION, { block_minutes: minutos })),
		);
	} catch (error) {
		throw errorDeApi(
			error,
			'Error guardando el bloque de horas extras',
			'No se pudo guardar el bloque de horas extras',
		);
	}
}

/** Horas pendientes por cantidad de minutos, para saber cuáles no cuadran con un bloque nuevo. */
export async function minutosPendientes(): Promise<Map<number, number>> {
	try {
		const filas = (await withAutoRefresh(() =>
			directus.request(
				aggregate('com_over_time', {
					aggregate: { count: ['id'] },
					groupBy: ['minutes'],
					query: {
						filter: { status: { _eq: ESTADO_HORA_EXTRA.pendiente } },
						limit: -1,
					},
				}),
			),
		)) as Record<string, unknown>[];
		return new Map(
			filas.map((f) => [
				Number(f.minutes),
				Number((f.count as { id?: unknown })?.id ?? 0),
			]),
		);
	} catch (error) {
		throw errorDeApi(
			error,
			'Error contando horas pendientes',
			'No se pudieron contar las horas pendientes',
		);
	}
}
