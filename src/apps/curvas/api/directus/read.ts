import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';
import type {
  MatrizGeneralCurvas,
  DetalleProducto,
  Tienda,
  TipoCurva,
  Talla
} from '../../types';

/**
 * API para leer datos de curvas desde Directus
 * 
 * Funciones disponibles:
 * - getMatrizGeneral: Obtiene la matriz general de curvas
 * - getDetalleProducto: Obtiene el detalle de un producto
 * - getTiendas: Obtiene la lista de tiendas
 * - getCurvas: Obtiene las curvas disponibles
 * - getTallas: Obtiene las tallas disponibles
 */

/**
 * Obtiene la matriz general de curvas desde Directus
 */
export const getMatrizGeneral = async (
  referencia: string
): Promise<MatrizGeneralCurvas | null> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('matriz_curvas', {
          filter: {
            referencia: { _eq: referencia },
          },
        })
      )
    );

    if (response && response.length > 0) {
      const item = response[0];
      return {
        id: item.id || 'matriz-general',
        nombreHoja: item.nombre_hoja || item.referencia || 'MATRIZ',
        referencia: item.referencia,
        curvas: item.curvas ? JSON.parse(item.curvas) : [],
        filas: item.filas ? JSON.parse(item.filas) : [],
        totalesPorCurva: item.totales_por_curva ? JSON.parse(item.totales_por_curva) : {},
        totalGeneral: item.total_general || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching matriz general:', error);
    return null;
  }
};

/**
 * Obtiene el detalle de un producto desde Directus
 */
export const getDetalleProducto = async (
  referencia: string
): Promise<DetalleProducto | null> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('detalle_productos', {
          filter: {
            referencia: { _eq: referencia },
          },
        })
      )
    );

    if (response && response.length > 0) {
      const item = response[0];
      return {
        id: item.id || 'detalle-producto',
        nombreHoja: item.nombre_hoja || item.referencia || 'DETALLE',
        metadatos: {
          referencia: item.referencia,
          imagen: item.imagen || '',
          color: item.color || '',
          proveedor: item.proveedor || '',
          precio: item.precio || 0,
          linea: item.linea || '',
          categoria: item.categoria,
          subcategoria: item.subcategoria,
        },
        tallas: item.tallas ? JSON.parse(item.tallas) : [],
        filas: item.filas ? JSON.parse(item.filas) : [],
        totalesPorTalla: item.totales_por_talla ? JSON.parse(item.totales_por_talla) : {},
        totalGeneral: item.total_general || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching detalle producto:', error);
    return null;
  }
};

/**
 * Obtiene la lista de tiendas desde Directus (colección core_stores)
 * Ordenadas alfabéticamente
 */
export const getTiendas = async (): Promise<Tienda[]> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('core_stores', {
          fields: ['id', 'name', 'ultra_code'],
          sort: ['name'],
        })
      )
    );

    if (response && response.length > 0) {
      return response.map((item: any) => ({
        id: String(item.id),
        codigo: String(item.ultra_code || ''),
        nombre: String(item.name || ''),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching tiendas from core_stores:', error);
    return [];
  }
};

/**
 * Retorna las tiendas por defecto para la carga (excluyendo Oficina y Tienda Online)
 */
export const getDefaultTiendas = (tiendas: Tienda[]): Tienda[] => {
  return tiendas.filter(t =>
    t.nombre.toUpperCase() !== 'OFICINA' &&
    t.nombre.toUpperCase() !== 'TIENDA ONLINE'
  );
};

/**
 * Obtiene las curvas disponibles desde Directus
 */
export const getCurvas = async (): Promise<TipoCurva[]> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('curvas', {
          sort: ['orden'],
        })
      )
    );

    if (response) {
      return response.map((item: Record<string, unknown>) => String(item.codigo || ''));
    }

    return [];
  } catch (error) {
    console.error('Error fetching curvas:', error);
    return [];
  }
};

/**
 * Obtiene las tallas disponibles desde Directus
 */
export const getTallas = async (): Promise<Talla[]> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('tallas', {
          sort: ['orden'],
        })
      )
    );

    if (response) {
      return response.map((item: Record<string, unknown>) => String(item.numero || ''));
    }

    return [];
  } catch (error) {
    console.error('Error fetching tallas:', error);
    return [];
  }
};

/**
 * Obtiene el historial de cargas de curvas
 */
export const getHistorialCargas = async (limit = 10) => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('historial_curvas', {
          sort: ['-fecha_carga'],
          limit,
        })
      )
    );

    return response || [];
  } catch (error) {
    console.error('Error fetching historial:', error);
    return [];
  }
};

/**
 * Obtiene los registros de log_curvas para mostrar en Envíos
 * Permite filtrar por fecha y referencia
 */
export const getLogCurvas = async (
  fecha?: string,
  referencia?: string,
  lastUpdated?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];

    if (fecha) {
      // Filtrar por fecha (solo la fecha, sin hora)
      queryFilter.push({
        fecha: { _gte: `${fecha}T00:00:00`, _lte: `${fecha}T23:59:59` }
      });
    }

    if (referencia) {
      queryFilter.push({
        referencia: { _contains: referencia }
      });
    }

    if (lastUpdated) {
      queryFilter.push({
        fecha_creacion: { _gt: lastUpdated }
      });
    }

    const queryOptions: any = {
      sort: ['-fecha', '-id'],
      limit: 5000,
    };

    // Solo agregar filtro si hay condiciones
    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1
        ? queryFilter[0]
        : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('log_curvas', queryOptions)
      )
    );

    return response || [];
  } catch (error) {
    console.error('Error fetching log_curvas:', error);
    return [];
  }
};

/**
 * Obtiene los registros de envios_curvas para una fecha y referencia específicas
 * Se usa para hidratar la validación física (escaneo)
 */
export const getEnviosCurvas = async (
  fecha?: string,
  referencia?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];
    if (fecha) {
      queryFilter.push({ fecha: { _gte: `${fecha}T00:00:00`, _lte: `${fecha}T23:59:59` } });
    }
    if (referencia) {
      queryFilter.push({ referencia: { _contains: referencia } });
    }

    const queryOptions: any = {
      sort: ['-fecha'],
      limit: 5000,
      fields: ['*', 'tienda_id.*']
    };

    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1 ? queryFilter[0] : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(readItems('envios_curvas', queryOptions))
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching envios_curvas:', error);
    return [];
  }
};

/**
 * Obtiene los registros de envios_curvas para el módulo de Análisis

 * Permite filtrar por un rango de fechas
 */
export const getEnviosAnalisis = async (
  fechaInicio?: string,
  fechaFin?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];

    if (fechaInicio && fechaFin) {
      queryFilter.push({
        fecha: { _between: [fechaInicio, fechaFin] }
      });
    } else if (fechaInicio) {
      queryFilter.push({
        fecha: { _gte: fechaInicio }
      });
    }

    const queryOptions: any = {
      sort: ['-fecha'],
      limit: -1,
      // Traemos info del usuario y de la tienda si existe la relación
      fields: [
        '*',
        'usuario_id.id',
        'usuario_id.first_name',
        'usuario_id.last_name',
        'tienda_id.id',
        'tienda_id.name',
        'tienda_id.ultra_code'
      ],
    };

    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1
        ? queryFilter[0]
        : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('envios_curvas', queryOptions)
      )
    );

    return response || [];
  } catch (error) {
    console.error('Error fetching envios_analisis:', error);
    return [];
  }
};

/**
 * Obtiene las fechas recientes que tienen datos y su estado consolidado.
 * Retorna un mapa: fecha (YYYY-MM-DD) -> 'pendiente' | 'enviado'
 */
export const getResumenFechasCurvas = async (): Promise<Record<string, 'pendiente' | 'enviado'>> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('log_curvas', {
          fields: ['fecha'],
          sort: ['-fecha'],
          limit: 1000,
        })
      )
    );

    const fechas: Record<string, 'pendiente' | 'enviado'> = {};
    response.forEach((item: any) => {
      const fecha = item.fecha?.split('T')[0];
      if (fecha && !fechas[fecha]) {
        fechas[fecha] = 'enviado';
      }
    });

    // Marcar fechas futuras o actuales como pendientes si no hay datos
    const today = new Date().toISOString().split('T')[0];
    if (!fechas[today]) fechas[today] = 'pendiente';

    return fechas;
  } catch (err) {
    console.error('Error fetching resumen fechas:', err);
    return {};
  }
};



export default {
  getMatrizGeneral,
  getDetalleProducto,
  getTiendas,
  getDefaultTiendas,
  getCurvas,
  getTallas,
  getHistorialCargas,
  getLogCurvas,
  getEnviosCurvas,
  getEnviosAnalisis,
  getResumenFechasCurvas,
};
