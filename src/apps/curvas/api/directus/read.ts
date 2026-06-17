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

const TIENDAS_TTL_MS = 10 * 60 * 1000;
let tiendasCache: { data: Tienda[]; expiresAt: number } | null = null;
let tiendasInFlight: Promise<Tienda[]> | null = null;

export const invalidateTiendasCache = () => {
  tiendasCache = null;
};

const fetchTiendasFresh = async (): Promise<Tienda[]> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('core_stores', {
          fields: ['id', 'name', 'ultra_code'],
          sort: ['name'],
          limit: -1,
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

export const getTiendas = async (): Promise<Tienda[]> => {
  const now = Date.now();
  if (tiendasCache && tiendasCache.expiresAt > now) {
    return tiendasCache.data;
  }
  if (tiendasInFlight) return tiendasInFlight;

  tiendasInFlight = fetchTiendasFresh()
    .then((data) => {
      if (data.length > 0) {
        tiendasCache = { data, expiresAt: Date.now() + TIENDAS_TTL_MS };
      }
      return data;
    })
    .finally(() => {
      tiendasInFlight = null;
    });

  return tiendasInFlight;
};

export const getDefaultTiendas = (tiendas: Tienda[]): Tienda[] => {
  return tiendas.filter(t =>
    t.nombre.toUpperCase() !== 'OFICINA' &&
    t.nombre.toUpperCase() !== 'TIENDA ONLINE'
  );
};

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

export const getLogCurvas = async (
  fecha?: string,
  referencia?: string,
  lastUpdated?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];

    if (fecha) {
      queryFilter.push({
        log_date: { _gte: `${fecha}T00:00:00`, _lte: `${fecha}T23:59:59` }
      });
    }

    if (referencia) {
      queryFilter.push({
        reference: { _contains: referencia }
      });
    }

    if (lastUpdated) {
      queryFilter.push({
        date_created: { _gt: lastUpdated }
      });
    }

    const queryOptions: any = {
      sort: ['-log_date', '-id'],
      limit: 5000,
    };

    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1
        ? queryFilter[0]
        : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('log_curve', queryOptions)
      )
    );

    return response || [];
  } catch (error) {
    console.error('Error fetching log_curvas:', error);
    return [];
  }
};

export const getEnviosCurvas = async (
  fecha?: string,
  referencia?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];
    if (fecha) {
      queryFilter.push({ shipment_date: { _gte: `${fecha}T00:00:00`, _lte: `${fecha}T23:59:59` } });
    }
    if (referencia) {
      queryFilter.push({ reference: { _contains: referencia } });
    }

    const queryOptions: any = {
      sort: ['-shipment_date'],
      limit: 5000,
      fields: ['*', 'store_id.*']
    };

    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1 ? queryFilter[0] : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(readItems('log_curve_shipments', queryOptions))
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching envios_curvas:', error);
    return [];
  }
};

export const getEnviosAnalisis = async (
  fechaInicio?: string,
  fechaFin?: string
): Promise<any[]> => {
  try {
    const queryFilter: any[] = [];

    if (fechaInicio && fechaFin) {
      queryFilter.push({
        shipment_date: { _between: [fechaInicio, fechaFin] }
      });
    } else if (fechaInicio) {
      queryFilter.push({
        shipment_date: { _gte: fechaInicio }
      });
    }

    const queryOptions: any = {
      sort: ['-shipment_date'],
      limit: -1,
      fields: [
        '*',
        'user_id.id',
        'user_id.first_name',
        'user_id.last_name',
        'store_id.id',
        'store_id.name',
        'store_id.ultra_code'
      ],
    };

    if (queryFilter.length > 0) {
      queryOptions.filter = queryFilter.length === 1
        ? queryFilter[0]
        : { _and: queryFilter };
    }

    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('log_curve_shipments', queryOptions)
      )
    );

    return response || [];
  } catch (error) {
    console.error('Error fetching envios_analisis:', error);
    return [];
  }
};

export const getResumenFechasCurvas = async (): Promise<Record<string, 'pendiente' | 'enviado'>> => {
  try {
    const response = await withAutoRefresh(() =>
      directus.request(
        readItems('log_curve', {
          fields: ['log_date'],
          sort: ['-log_date'],
          limit: 1000,
        })
      )
    );

    const fechas: Record<string, 'pendiente' | 'enviado'> = {};
    response.forEach((item: any) => {
      const fecha = item.log_date?.split('T')[0];
      if (fecha && !fechas[fecha]) {
        fechas[fecha] = 'enviado';
      }
    });

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
