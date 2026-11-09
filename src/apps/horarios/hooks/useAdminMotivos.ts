import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	actualizarMotivo,
	borrarMotivo,
	crearMotivo,
	type DatosMotivo,
	usosDeMotivos,
} from '../api/directus/motivos';
import { ordenNuevoMotivo, type TipoMotivo } from '../domain/horasExtras';
import { horariosKeys } from './registro/keys';
import { useMotivos } from './useMotivos';

const USOS = [...horariosKeys.motivosHorasExtras, 'usos'] as const;

/** Lista de motivos de un tipo para Admin (con inactivos), sus usos y las acciones. */
export function useAdminMotivos(tipo: TipoMotivo) {
	const qc = useQueryClient();
	const { delTipo, isLoading, error } = useMotivos(tipo);
	const usosQ = useQuery({ queryKey: USOS, queryFn: usosDeMotivos });
	// Registro, revisión y filtros leen la misma caché: ven el cambio sin recargar.
	const refrescar = () =>
		qc.invalidateQueries({ queryKey: horariosKeys.motivosHorasExtras });

	const crear = useMutation({
		mutationFn: (datos: DatosMotivo) =>
			crearMotivo(tipo, datos, ordenNuevoMotivo(delTipo)),
		onSuccess: refrescar,
	});
	const editar = useMutation({
		mutationFn: ({
			id,
			...cambios
		}: { id: number } & Partial<DatosMotivo> & { activo?: boolean }) =>
			actualizarMotivo(id, cambios),
		onSuccess: refrescar,
	});
	const borrar = useMutation({
		mutationFn: borrarMotivo,
		onSuccess: refrescar,
	});

	return {
		motivos: delTipo,
		/** `undefined` mientras no se sepa: no se ofrece borrar. */
		usos: (id: number) => usosQ.data?.get(id) ?? (usosQ.data ? 0 : undefined),
		isLoading,
		error: error ?? usosQ.error,
		crear,
		editar,
		borrar,
	};
}
