import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listarMotivos } from '../api/directus/motivos';
import {
	type Motivo,
	motivosParaElegir,
	type TipoMotivo,
} from '../domain/horasExtras';
import { horariosKeys } from './registro/keys';

const SIN_MOTIVOS: Motivo[] = [];

/** Motivos de un tipo para elegir (activos, en orden) y búsqueda por id en todo el catálogo. */
export function useMotivos(tipo: TipoMotivo, enabled = true) {
	const q = useQuery({
		queryKey: horariosKeys.motivosHorasExtras,
		queryFn: listarMotivos,
		enabled,
		staleTime: 30 * 60 * 1000,
	});
	const todos = q.data ?? SIN_MOTIVOS;
	const opciones = useMemo(() => motivosParaElegir(todos, tipo), [todos, tipo]);
	// Las horas viejas pueden usar motivos ya inactivos.
	const delTipo = useMemo(
		() =>
			motivosParaElegir(
				todos.map((m) => ({ ...m, activo: true })),
				tipo,
			),
		[todos, tipo],
	);
	const porId = useMemo(() => new Map(todos.map((m) => [m.id, m])), [todos]);
	return { opciones, delTipo, porId, isLoading: q.isLoading, error: q.error };
}
