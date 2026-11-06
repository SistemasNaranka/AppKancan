import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
	agregadoHorasExtras,
	nombresDeUsuarios,
} from '../api/directus/reportesHorasExtras';
import {
	ESTADO_HORA_EXTRA,
	motivosPorJefe,
	rechazosPorMotivo,
	reporteMotivos,
	TIPO_MOTIVO,
} from '../domain/horasExtras';
import { formatNombrePropio } from '../utils/format';
import { horariosKeys } from './registro/keys';
import { useMotivos } from './useMotivos';

// Bajo `horasExtras.todos`: aprobar, rechazar o registrar refresca el reporte.
const clave = (...partes: unknown[]) =>
	[...horariosKeys.horasExtras.todos, 'reporte', 'motivos', ...partes] as const;
const fresco = { staleTime: 60 * 1000, refetchInterval: 5 * 60 * 1000 };
const REVISADAS = [
	ESTADO_HORA_EXTRA.aprobada,
	ESTADO_HORA_EXTRA.descartadaComercial,
];

export interface OpcionesReporteMotivos {
	/** Tiendas trabajadas; vacío = todas las que permita Directus. */
	tiendas: number[];
	desde: string;
	hasta: string;
	enabled: boolean;
	/** Tabla por jefe de zona (lee quién creó cada hora: no para gerencia). */
	porJefe: boolean;
}

/** Horas extras por motivo de solicitud, de rechazo y, si se pide, por jefe de zona. */
export function useReporteMotivos({
	tiendas,
	desde,
	hasta,
	enabled,
	porJefe,
}: OpcionesReporteMotivos) {
	const base = { tiendas, desde, hasta };
	const motivos = useMotivos(TIPO_MOTIVO.solicitud, enabled);
	const solicitudQ = useQuery({
		queryKey: clave('solicitud', base),
		queryFn: () =>
			agregadoHorasExtras(
				{
					...base,
					estados: [...REVISADAS, ESTADO_HORA_EXTRA.pendiente],
				},
				['reason_id', 'status'],
			),
		enabled,
		...fresco,
	});
	const rechazoQ = useQuery({
		queryKey: clave('rechazo', base),
		queryFn: () =>
			agregadoHorasExtras(
				{ ...base, estados: [ESTADO_HORA_EXTRA.descartadaComercial] },
				['review_reason_id'],
			),
		enabled,
		...fresco,
	});
	const jefesQ = useQuery({
		queryKey: clave('jefes', base),
		queryFn: () =>
			agregadoHorasExtras({ ...base, estados: REVISADAS }, [
				'created_by',
				'reason_id',
				'status',
			]),
		enabled: enabled && porJefe,
		...fresco,
	});
	const jefes = useMemo(() => motivosPorJefe(jefesQ.data ?? []), [jefesQ.data]);
	const idsJefes = useMemo(
		() => jefes.flatMap((j) => (j.creadaPor ? [j.creadaPor] : [])),
		[jefes],
	);
	const nombresQ = useQuery({
		queryKey: ['nombresUsuarios', idsJefes],
		queryFn: () => nombresDeUsuarios(idsJefes),
		enabled: idsJefes.length > 0,
		staleTime: 30 * 60 * 1000,
	});

	const reporte = useMemo(
		() => reporteMotivos(solicitudQ.data ?? []),
		[solicitudQ.data],
	);
	const rechazos = useMemo(
		() =>
			rechazosPorMotivo(
				(rechazoQ.data ?? []).map((f) => ({
					...f,
					motivoId: f.motivoRevisionId,
				})),
			),
		[rechazoQ.data],
	);

	return {
		reporte,
		rechazos,
		jefes,
		/** Motivos de solicitud del catálogo (también inactivos), para columnas fijas. */
		motivosSolicitud: motivos.delTipo,
		nombreMotivo: (id: number | null) =>
			id == null ? null : (motivos.porId.get(id)?.nombre ?? `Motivo ${id}`),
		nombreJefe: (id: string | null) =>
			id
				? formatNombrePropio(nombresQ.data?.get(id)) || 'Sin nombre'
				: 'Sin creador',
		isLoading:
			motivos.isLoading ||
			solicitudQ.isLoading ||
			rechazoQ.isLoading ||
			(porJefe && jefesQ.isLoading),
		error:
			solicitudQ.error ??
			rechazoQ.error ??
			jefesQ.error ??
			motivos.error ??
			nombresQ.error,
	};
}
