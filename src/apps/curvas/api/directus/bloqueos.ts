import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItems, readItems, deleteItems, updateItems } from '@directus/sdk';
import type { BloqueoEscaner } from '../../types';

const COLLECTION = 'log_curve_scans';

/**
 * Obtiene los bloqueos activos para una referencia específica.
 * Filtra los que tienen más de 5 minutos de inactividad.
 */
export const obtenerBloqueosActivos = async (referencia?: string): Promise<BloqueoEscaner[]> => {
  try {
    // Calculamos el timestamp de hace 5 minutos
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const filter: any = {
      ultima_actividad: { _gte: cincoMinutosAtras } // Solo los activos recientes
    };
    
    if (referencia) {
      filter.referencia = { _eq: referencia };
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
 * Intenta bloquear una tienda para un usuario en una referencia.
 * Retorna true si tuvo éxito, false si ya estaba bloqueada por otro.
 */
export const intentarBloquearTienda = async (
  referencia: string,
  tienda_id: string,
  usuario_id: string
): Promise<boolean> => {
  try {
    // 1. Verificar si ya existe un bloqueo activo para esta tienda
    const bloqueosActuales = await obtenerBloqueosActivos(referencia);
    const bloqueoExistente = bloqueosActuales.find(b => String(b.tienda_id) === String(tienda_id));

    if (bloqueoExistente) {
      const existingUserId = typeof bloqueoExistente.usuario_id === 'object' && bloqueoExistente.usuario_id !== null ? bloqueoExistente.usuario_id.id : bloqueoExistente.usuario_id;
      if (String(existingUserId) === String(usuario_id)) {
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
          referencia,
          tienda_id: String(tienda_id),
          usuario_id: String(usuario_id),
          ultima_actividad: new Date().toISOString(),
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
          ultima_actividad: new Date().toISOString(),
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
  referencia: string,
  tienda_id: string,
  usuario_id: string
): Promise<void> => {
  try {
    // Buscar todos los bloqueos de este usuario para esta tienda y referencia
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            referencia: { _eq: referencia },
            tienda_id: { _eq: String(tienda_id) },
            usuario_id: { _eq: String(usuario_id) },
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
 * Libera todos los bloqueos de un usuario para una referencia (útil al limpiar todo o salir).
 */
export const liberarTodasLasTiendasDeUsuario = async (
  referencia: string,
  usuario_id: string
): Promise<void> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            referencia: { _eq: referencia },
            usuario_id: { _eq: String(usuario_id) },
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
  usuario_id: string
): Promise<void> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems(COLLECTION, {
          filter: {
            usuario_id: { _eq: String(usuario_id) },
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

