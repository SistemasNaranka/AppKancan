import { readItems } from '@directus/sdk';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import directus from '@/services/directus/directus';
import {
	type Motivo,
	TIPO_MOTIVO,
	type TipoMotivo,
} from '../../domain/horasExtras';
import type { OverTimeReasonDto } from '../../interfaces/api/overTime';
import { errorDeApi } from '../../utils/errores';

const TIPOS = Object.values(TIPO_MOTIVO) as string[];

/** DTO → motivo de la app. Un `type` desconocido se descarta. */
export function aMotivo(dto: OverTimeReasonDto): Motivo | null {
	if (!TIPOS.includes(dto.type)) return null;
	return {
		id: Number(dto.id),
		nombre: dto.name?.trim() ?? '',
		descripcion: dto.description?.trim() ?? '',
		tipo: dto.type as TipoMotivo,
		pideTexto: dto.requires_note === true,
		activo: (dto.status ?? 'active') === 'active',
		orden: dto.sort ?? 0,
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
