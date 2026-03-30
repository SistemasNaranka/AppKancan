import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { createItems } from '@directus/sdk';
import type {
  MatrizGeneralCurvas,
  DetalleProducto,
  LogCurvas,
  EnvioCurva
} from '../../types';

/**
 * API para crear datos de curvas en Directus
 * 
 * Funciones disponibles:
 * - saveMatrizGeneral: Guarda la matriz general de curvas
 * - saveDetalleProducto: Guarda el detalle de un producto
 * - saveHistorialCarga: Guarda el historial de carga
 */

/**
 * Guarda la matriz general de curvas en Directus
 */
export const saveMatrizGeneral = async (
  matriz: MatrizGeneralCurvas
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems('matriz_curvas', [
          {
            referencia: matriz.referencia,
            curvas: JSON.stringify(matriz.curvas),
            filas: JSON.stringify(matriz.filas),
            totales_por_curva: JSON.stringify(matriz.totalesPorCurva),
            total_general: matriz.totalGeneral,
            fecha_creacion: new Date().toISOString(),
          },
        ])
      )
    );

    return true;
  } catch (error) {
    console.error('Error saving matriz general:', error);
    return false;
  }
};

/**
 * Guarda el detalle de un producto en Directus
 */
export const saveDetalleProducto = async (
  producto: DetalleProducto
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems('detalle_productos', [
          {
            referencia: producto.metadatos.referencia,
            imagen: producto.metadatos.imagen,
            color: producto.metadatos.color,
            proveedor: producto.metadatos.proveedor,
            precio: producto.metadatos.precio,
            linea: producto.metadatos.linea,
            categoria: producto.metadatos.categoria,
            subcategoria: producto.metadatos.subcategoria,
            tallas: JSON.stringify(producto.tallas),
            filas: JSON.stringify(producto.filas),
            totales_por_talla: JSON.stringify(producto.totalesPorTalla),
            total_general: producto.totalGeneral,
            fecha_creacion: new Date().toISOString(),
          },
        ])
      )
    );

    return true;
  } catch (error) {
    console.error('Error saving detalle producto:', error);
    return false;
  }
};

/**
 * Guarda el historial de carga de archivos
 */
export const saveHistorialCarga = async (
  datos: {
    tipo_archivo: string;
    nombre_archivo: string;
    referencia?: string;
    registros_procesados: number;
    errores: number;
    estado: 'exitoso' | 'fallido';
  }
): Promise<boolean> => {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItems('historial_curvas', [
          {
            tipo_archivo: datos.tipo_archivo,
            nombre_archivo: datos.nombre_archivo,
            referencia: datos.referencia,
            registros_procesados: datos.registros_procesados,
            errores: datos.errores,
            estado: datos.estado,
            fecha_carga: new Date().toISOString(),
          },
        ])
      )
    );

    return true;
  } catch (error) {
    console.error('Error saving historial:', error);
    return false;
  }
};

/**
 * Guarda múltiples curvas de distribución en batch
 */
export const saveBatchCurvas = async (
  curvas: MatrizGeneralCurvas[]
): Promise<boolean> => {
  try {
    const items = curvas.map((matriz) => ({
      referencia: matriz.referencia,
      curvas: JSON.stringify(matriz.curvas),
      filas: JSON.stringify(matriz.filas),
      totales_por_curva: JSON.stringify(matriz.totalesPorCurva),
      total_general: matriz.totalGeneral,
      fecha_creacion: new Date().toISOString(),
    }));

    await withAutoRefresh(() =>
      directus.request(createItems('matriz_curvas', items))
    );

    return true;
  } catch (error) {
    console.error('Error saving batch curvas:', error);
    return false;
  }
};

/**
 * Guarda un registro de log de curvas en Directus
 */
export const saveLogCurvas = async (
  logData: Omit<LogCurvas, 'id' | 'fecha_creacion'>
): Promise<boolean> => {
  return saveLogsBatch([logData]);
};

/**
 * Guarda múltiples registros de log de curvas en Directus (Batch)
 */
export const saveLogsBatch = async (
  logsData: Omit<LogCurvas, 'id' | 'fecha_creacion'>[]
): Promise<boolean> => {
  if (!logsData || logsData.length === 0) return true;

  try {
    const items = logsData.map(log => ({
      tienda_id: log.tienda_id,
      tienda_nombre: log.tienda_nombre || '',
      plantilla: log.plantilla,
      fecha: log.fecha,
      cantidad_talla: log.cantidad_talla,
      referencia: log.referencia || '',
      estado: log.estado || 'borrador',
      fecha_creacion: new Date().toISOString(),
    }));

    await withAutoRefresh(() =>
      directus.request(createItems('log_curvas', items))
    );

    return true;
  } catch (error) {
    console.error('Error saving logs batch:', error);
    return false;
  }
};

/**
 * Guarda un registro de envío a despacho en Directus (tabla envios_curvas)
 */
export const saveEnvioCurva = async (
  envioData: Omit<EnvioCurva, 'id' | 'fecha_creacion'>
): Promise<boolean> => {
  return saveEnviosBatch([envioData]);
};

/**
 * Guarda múltiples registros de envío a despacho en Directus (Batch)
 */
export const saveEnviosBatch = async (
  enviosData: Omit<EnvioCurva, 'id' | 'fecha_creacion'>[]
): Promise<boolean> => {
  if (!enviosData || enviosData.length === 0) return true;

  try {
    const items = enviosData.map(envio => ({
      tienda_id: envio.tienda_id,
      plantilla: envio.plantilla,
      fecha: envio.fecha,
      cantidad_talla: envio.cantidad_talla,
      referencia: envio.referencia,
      usuario_id: envio.usuario_id,
    }));

    await withAutoRefresh(() =>
      directus.request(createItems('envios_curvas', items))
    );

    return true;
  } catch (error) {
    console.error('Error saving envios batch:', error);
    return false;
  }
};

export default {
  saveMatrizGeneral,
  saveDetalleProducto,
  saveHistorialCarga,
  saveBatchCurvas,
  saveLogCurvas,
  saveLogsBatch,
  saveEnvioCurva,
  saveEnviosBatch,
};
