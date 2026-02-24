/**
 * API para leer datos del Informe de Ventas
 *
 * Conecta con el servidor backend que se comunica con MySQL
 * - Servidor: 192.168.19.250
 * - Bases de datos: kancan, naranka
 */

import {
  VentaRegistro,
  Zona,
  Ciudad,
  Tienda,
  GrupoHomogeneo,
  FiltrosVentas,
  LineaVenta,
  Agrupacion,
} from "../../types";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";

// URL del servidor backend
// En producción, la API está en el mismo servidor que el frontend
// En desarrollo, se puede configurar via variable de entorno
const API_URL = import.meta.env.VITE_VENTAS_API_URL || "/api";

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtiene los headers de autenticación con el token de Directus
 */
function getAuthHeaders(): HeadersInit {
  const tokens = cargarTokenStorage();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  return headers;
}

/**
 * Maneja respuestas de la API, incluyendo errores de autenticación
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token inválido o expirado - el interceptor debería manejar el refresh
    throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(
      errorData.error || errorData.message || "Error en la petición",
    );
  }

  return response.json();
}

// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener zonas/procesos
 * @param fechaDesde - Fecha desde para filtrar (opcional)
 * @param fechaHasta - Fecha hasta para filtrar (opcional)
 */
export async function obtenerZonas(
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<Zona[]> {
  try {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);

    const url = `${API_URL}/zonas${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await handleResponse<Zona[]>(response);
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    return [];
  }
}

/**
 * Obtener ciudades
 * @param fechaDesde - Fecha desde para filtrar (opcional)
 * @param fechaHasta - Fecha hasta para filtrar (opcional)
 */
export async function obtenerCiudades(
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<Ciudad[]> {
  try {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);

    const url = `${API_URL}/ciudades${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await handleResponse<Ciudad[]>(response);
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    return [];
  }
}

/**
 * Obtener tiendas/bodegas
 * @param fechaDesde - Fecha desde para filtrar (opcional)
 * @param fechaHasta - Fecha hasta para filtrar (opcional)
 */
export async function obtenerTiendas(
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<Tienda[]> {
  try {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fecha_desde", fechaDesde);
    if (fechaHasta) params.append("fecha_hasta", fechaHasta);

    const url = `${API_URL}/tiendas${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await handleResponse<Tienda[]>(response);
  } catch (error) {
    console.error("Error al obtener tiendas:", error);
    return [];
  }
}

/**
 * Obtener grupos homogéneos (para agrupaciones y líneas de venta)
 */
export async function obtenerGruposHomogeneos(): Promise<GrupoHomogeneo[]> {
  try {
    const response = await fetch(`${API_URL}/grupos-homogeneos`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    return data.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      origen: item.origen,
      linea_venta: item.linea_venta as LineaVenta,
      id_grupo: item.id_grupo,
      agrupacion: item.agrupacion as Agrupacion,
    }));
  } catch (error) {
    console.error("Error al obtener grupos homogéneos:", error);
    return [];
  }
}

/**
 * Obtener ventas con filtros
 */
export async function obtenerVentas(
  filtros: FiltrosVentas,
): Promise<VentaRegistro[]> {
  try {
    const params = new URLSearchParams();
    params.append("fecha_desde", filtros.fecha_desde);
    params.append("fecha_hasta", filtros.fecha_hasta);

    if (filtros.bodega) params.append("bodega", filtros.bodega);
    if (filtros.asesor) params.append("asesor", filtros.asesor);
    if (filtros.zona) params.append("zona", filtros.zona);
    if (filtros.ciudad) params.append("ciudad", filtros.ciudad);
    if (filtros.linea_venta) params.append("linea_venta", filtros.linea_venta);
    if (filtros.agrupacion) params.append("agrupacion", filtros.agrupacion);

    const response = await fetch(`${API_URL}/ventas?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);

    // Transformar datos al formato esperado
    return data.map((item: any) => ({
      id_referencia: item.codigo_referencia || "",
      id_factura: item.documentos || "",
      fecha_factura: item.fecdoc || "",
      asesor: item.nombre_vendedor || "",
      bodega: item.nombre_bodega || "",
      venta: Number(item.venta) || 0,
      valor: Number(item.valor) || 0,
      linea_venta: item.linea_venta || "Sin línea",
      agrupacion: item.agrupacion || "Sin agrupación",
      ciudad: item.ciudad || "Sin ciudad",
      zona: item.zona || "Sin zona",
    }));
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return [];
  }
}

/**
 * Obtener lista única de asesores
 */
export async function obtenerAsesores(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/asesores`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse<string[]>(response);
  } catch (error) {
    console.error("Error al obtener asesores:", error);
    return [];
  }
}

/**
 * Obtener líneas de venta disponibles (mapeadas)
 * Retorna: Colección, Básicos, Promoción
 */
export async function obtenerLineasVenta(): Promise<LineaVenta[]> {
  try {
    const response = await fetch(`${API_URL}/lineas-venta`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    return data.map((item: any) => item.id as LineaVenta);
  } catch (error) {
    console.error("Error al obtener líneas de venta:", error);
    return ["Colección", "Básicos", "Promoción"];
  }
}

/**
 * Obtener agrupaciones disponibles (mapeadas)
 * Retorna: Indigo, Tela Liviana, Calzado, Complemento
 */
export async function obtenerAgrupaciones(): Promise<Agrupacion[]> {
  try {
    const response = await fetch(`${API_URL}/agrupaciones`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);
    return data.map((item: any) => item.id as Agrupacion);
  } catch (error) {
    console.error("Error al obtener agrupaciones:", error);
    return ["Indigo", "Tela Liviana", "Calzado", "Complemento"];
  }
}

// ==================== FUNCIONES DE RESUMEN ====================

/**
 * Obtener resumen de ventas por asesor
 */
export async function obtenerResumenPorAsesor(
  filtros: FiltrosVentas,
): Promise<Map<string, any>> {
  try {
    const ventas = await obtenerVentas(filtros);
    const resumen = new Map<string, any>();

    ventas.forEach((venta) => {
      const key = `${venta.asesor}|${venta.bodega}`;

      if (!resumen.has(key)) {
        resumen.set(key, {
          asesor: venta.asesor,
          bodega: venta.bodega,
          total_unidades: 0,
          total_valor: 0,
          unidades_indigo: 0,
          unidades_liviano: 0,
          valor_indigo: 0,
          valor_liviano: 0,
        });
      }

      const actual = resumen.get(key);
      actual.total_unidades += venta.venta;
      actual.total_valor += venta.valor;
    });

    return resumen;
  } catch (error) {
    console.error("Error al obtener resumen por asesor:", error);
    return new Map();
  }
}

/**
 * Obtener resumen de ventas por tienda
 */
export async function obtenerResumenPorTienda(
  filtros: FiltrosVentas,
): Promise<Map<string, any>> {
  try {
    const ventas = await obtenerVentas(filtros);
    const resumen = new Map<string, any>();

    ventas.forEach((venta) => {
      const key = venta.bodega;

      if (!resumen.has(key)) {
        resumen.set(key, {
          bodega: venta.bodega,
          total_unidades: 0,
          total_valor: 0,
          ventas: [],
        });
      }

      const actual = resumen.get(key);
      actual.total_unidades += venta.venta;
      actual.total_valor += venta.valor;
      actual.ventas.push(venta);
    });

    return resumen;
  } catch (error) {
    console.error("Error al obtener resumen por tienda:", error);
    return new Map();
  }
}
