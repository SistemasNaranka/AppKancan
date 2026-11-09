import { useQuery } from '@tanstack/react-query';
import { leerBloqueHorasExtras } from '../api/directus/configHorasExtras';
import { BLOQUE_MINUTOS, esBloquePermitido } from '../domain/horasExtras';
import { horariosKeys } from './registro/keys';

/**
 * Bloque de las horas extras configurado en Admin. Si no se puede leer o no es un
 * valor permitido, usa `BLOQUE_MINUTOS` y lo indica en `aviso`.
 */
export function useBloqueHorasExtras(enabled = true) {
	const q = useQuery({
		queryKey: horariosKeys.configHorasExtras,
		queryFn: leerBloqueHorasExtras,
		enabled,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
		// Sin la colección o sin permiso no tiene caso insistir: se usa el respaldo.
		retry: 1,
	});
	const valido = esBloquePermitido(q.data);
	return {
		bloque: esBloquePermitido(q.data) ? q.data : BLOQUE_MINUTOS,
		cargando: q.isLoading,
		aviso:
			q.isError || (q.isSuccess && !valido)
				? `No se pudo cargar el bloque configurado: se usan bloques de ${BLOQUE_MINUTOS} min.`
				: null,
	};
}
