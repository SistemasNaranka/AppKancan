import {
	aggregate,
	createItem,
	deleteItem,
	readItems,
	updateItem,
} from '@directus/sdk';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import directus from '@/services/directus/directus';
import {
	type Motivo,
	TIPO_MOTIVO,
	type TipoMotivo,
} from '../../domain/horasExtras';
import type { OverTimeReasonDto } from '../../interfaces/api/overTime';
import { errorDeApi } from '../../utils/errores';
import { idRelacion } from './relacion';

/** `type` en Directus. */
const TIPO_DIRECTUS: Record<TipoMotivo, string> = {
	[TIPO_MOTIVO.solicitud]: 'request',
	[TIPO_MOTIVO.rechazo]: 'decline',
};
// También en español: filas creadas antes de fijar los valores en inglés.
const DE_DIRECTUS: Record<string, TipoMotivo> = {
	request: TIPO_MOTIVO.solicitud,
	decline: TIPO_MOTIVO.rechazo,
	solicitud: TIPO_MOTIVO.solicitud,
	rechazo: TIPO_MOTIVO.rechazo,
};

/** DTO → motivo de la app. Un `type` desconocido se descarta. */
export function aMotivo(dto: OverTimeReasonDto): Motivo | null {
	const tipo = DE_DIRECTUS[dto.type];
	if (!tipo) return null;
	return {
		id: Number(dto.id),
		nombre: dto.name?.trim() ?? '',
		descripcion: dto.description?.trim() ?? '',
		tipo,
		pideTexto: dto.requires_note === true,
		activo: (dto.status ?? 'active') === 'active',
		orden: dto.sort ?? 0,
		sistema: dto.is_system === true,
	};
}

/**
 * Catálogo completo de motivos (`com_over_time_reasons`), también los inactivos:
 * las horas viejas pueden usar uno ya desactivado. La app filtra al elegir.
 */
export async function listarMotivos(): Promise<Motivo[]> {
	try {
		const filas = (await withAutoRefresh(() =>
			directus.request(
				readItems('com_over_time_reasons', {
					fields: [
						'id',
						'name',
						'description',
						'type',
						'requires_note',
						'status',
						'sort',
						'is_system',
					],
					sort: ['sort', 'name'],
					limit: -1,
				}),
			),
		)) as OverTimeReasonDto[];
		return filas.map(aMotivo).filter((m): m is Motivo => m != null);
	} catch (error) {
		throw errorDeApi(
			error,
			'Error consultando motivos de horas extras',
			'Error al cargar los motivos de horas extras',
		);
	}
}

export interface DatosMotivo {
	nombre: string;
	descripcion: string;
}

const COLECCION = 'com_over_time_reasons';

/** Opción nueva de una lista. `is_system` y `requires_note` quedan en `false` (los fija Directus). */
export async function crearMotivo(
	tipo: TipoMotivo,
	datos: DatosMotivo,
	orden: number,
) {
	try {
		return await withAutoRefresh(() =>
			directus.request(
				createItem(COLECCION, {
					name: datos.nombre.trim(),
					description: datos.descripcion.trim() || null,
					type: TIPO_DIRECTUS[tipo],
					status: 'active',
					sort: orden,
				}),
			),
		);
	} catch (error) {
		throw errorDeApi(
			error,
			'Error creando motivo',
			'No se pudo crear el motivo',
		);
	}
}

/** Directus solo deja cambiar los que no son del sistema. */
export async function actualizarMotivo(
	id: number,
	cambios: Partial<DatosMotivo> & { activo?: boolean },
) {
	const payload: Record<string, unknown> = {};
	if (cambios.nombre !== undefined) payload.name = cambios.nombre.trim();
	if (cambios.descripcion !== undefined)
		payload.description = cambios.descripcion.trim() || null;
	if (cambios.activo !== undefined)
		payload.status = cambios.activo ? 'active' : 'inactive';
	try {
		return await withAutoRefresh(() =>
			directus.request(updateItem(COLECCION, id, payload)),
		);
	} catch (error) {
		throw errorDeApi(
			error,
			'Error actualizando motivo',
			'No se pudo actualizar el motivo',
		);
	}
}

export async function borrarMotivo(id: number) {
	try {
		await withAutoRefresh(() => directus.request(deleteItem(COLECCION, id)));
	} catch (error) {
		throw errorDeApi(
			error,
			'Error borrando motivo',
			'No se pudo borrar el motivo',
		);
	}
}

/** Horas extras que usan cada motivo, de solicitud o de rechazo (todas las tiendas y estados). */
export async function usosDeMotivos(): Promise<Map<number, number>> {
	const contar = (campo: 'reason_id' | 'review_reason_id') =>
		withAutoRefresh(() =>
			directus.request(
				aggregate('com_over_time', {
					aggregate: { count: ['id'] },
					groupBy: [campo],
					query: { filter: { [campo]: { _nnull: true } }, limit: -1 },
				}),
			),
		) as Promise<Record<string, unknown>[]>;
	try {
		const [solicitud, rechazo] = await Promise.all([
			contar('reason_id'),
			contar('review_reason_id'),
		]);
		const usos = new Map<number, number>();
		for (const [campo, filas] of [
			['reason_id', solicitud],
			['review_reason_id', rechazo],
		] as const) {
			for (const f of filas) {
				const id = idRelacion(f[campo]);
				if (id == null) continue;
				const n = Number((f.count as { id?: unknown })?.id ?? 0);
				usos.set(id, (usos.get(id) ?? 0) + n);
			}
		}
		return usos;
	} catch (error) {
		throw errorDeApi(
			error,
			'Error contando usos de motivos',
			'No se pudo saber qué motivos están en uso',
		);
	}
}
