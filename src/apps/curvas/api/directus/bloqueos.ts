import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItems, readItems, deleteItems, updateItems } from '@directus/sdk';
import type { BloqueoEscaner } from '../../types';

const COLLECTION = 'log_curve_scans';

/**
 * Obtiene los bloqueos activos para una reference específica.
 * Filtra los que tienen más de 7 minutos de inactividad.
 */
export const obtenerBloqueosActivos = async (reference?: string): Promise<BloqueoEscaner[]> => {
  try {
    // Calculamos el timestamp de hace 7 minutos
    const sieteMinutosAtras = new Date(Date.now() - 7 * 60 * 1000).toISOString();

    const filter: any = {
      last_activity_at: { _gte: sieteMinutosAtras } // Solo los activos recientes
    };
    
    if (reference) {
      filter.reference = { _eq: reference };
    }

    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter,
          limit: -1,
        } as any)
      )
    );

    return (response as any[]) || [];
  } catch (error) {
    console.error('Error fetching bloqueos:', error);
    return [];
  }
};

/**
 * Intenta bloquear una tienda para un usuario en una reference.
 * Retorna true si tuvo éxito, false si ya estaba bloqueada por otro.
 */
export const intentarBloquearTienda = async (
  reference: string,
  store_id: string,
  user_id: string
): Promise<boolean> => {
  try {
    // 1. Verificar si ya existe un bloqueo activo para esta tienda
    const bloqueosActuales = await obtenerBloqueosActivos(reference);
    const bloqueoExistente = bloqueosActuales.find(b => String(b.store_id) === String(store_id));

    if (bloqueoExistente) {
      const existingUserId = typeof bloqueoExistente.user_id === 'object' && bloqueoExistente.user_id !== null ? bloqueoExistente.user_id: bloqueoExistente.user_id;
      if (String(existingUserId) === String(user_id)) {
        // Ya es nuestro, solo actualizamos el tiempo
        await renovarBloqueo(String(bloqueoExistente.id));
        return true;
      }
      // Está bloqueado por OTRO usuario
      return false;
    }

    // 2. Si no hay bloqueo activo, creamos el nuestro
    await withAutoRefresh(() =>
      directus.request(
        createItems(COLLECTION, {
          reference,
          store_id: String(store_id),
          user_id: String(user_id),
          last_activity_at: new Date().toISOString(),
        } as any)
      )
    );

    return true;
  } catch (error) {
    console.error('Error al intentar bloquear tienda:', error);
    return false;
  }
};

/**
 * Renueva el tiempo de un bloqueo existente para que no expire.
 */
export const renovarBloqueo = async (lock_id: string): Promise<void> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        updateItems(COLLECTION, [lock_id], {
          last_activity_at: new Date().toISOString(),
        })
      )
    );
  } catch (error) {
    console.error('Error al renovar bloqueo:', error);
  }
};

/**
 * Libera el bloqueo de una tienda específica para un usuario.
 */
export const liberarTienda = async (
  reference: string,
  store_id: string,
  user_id: string
): Promise<void> => {
  try {
    // Buscar todos los bloqueos de este usuario para esta tienda y reference
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            reference: { _eq: reference },
            store_id: { _eq: String(store_id) },
            user_id: { _eq: String(user_id) },
          },
        })
      )
    );

    const locks = response as any[];

    if (locks && locks.length > 0) {
      // Eliminar todos los locks encontrados
      await Promise.all(
        locks.map(lock =>
          withAutoRefresh(() =>
            directus.request(deleteItems(COLLECTION, [lock.id]))
          )
        )
      );
    }
  } catch (error) {
    console.error('Error al liberar tienda:', error);
  }
};

/**
 * Libera todos los bloqueos de un usuario para una reference (útil al limpiar todo o salir).
 */
export const liberarTodasLasTiendasDeUsuario = async (
  reference: string,
  user_id: string
): Promise<void> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            reference: { _eq: reference },
            user_id: { _eq: String(user_id) },
          },
        })
      )
    );

    const locks = response as any[];

    if (locks && locks.length > 0) {
      await Promise.all(
        locks.map(lock =>
          withAutoRefresh(() =>
            directus.request(deleteItems(COLLECTION, [lock.id]))
          )
        )
      );
    }
  } catch (error) {
    console.error('Error al liberar todas las tiendas del usuario:', error);
  }
};

/**
 * Libera TODOS los bloqueos a nivel global de un usuario (para cuando cierra o limpia todo).
 */
export const liberarTodosLosBloqueosDeUsuario = async (
  user_id: string
): Promise<void> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            user_id: { _eq: String(user_id) },
          },
        })
      )
    );

    const locks = response as any[];

    if (locks && locks.length > 0) {
      await Promise.all(
        locks.map(lock =>
          withAutoRefresh(() =>
            directus.request(deleteItems(COLLECTION, [lock.id]))
          )
        )
      );
    }
  } catch (error) {
    console.error('Error al liberar bloqueos globales del usuario:', error);
  }
};

