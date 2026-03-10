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

const API_URL = import.meta.env.VITE_VENTAS_API_URL || "/api";

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
 * Obtener ventas con filtros de fecha (solo fechas son pasadas al servidor)
 * Los demás filtros (bodega, asesor, zona, etc.) se aplican en memoria
 */
export async function obtenerVentas(
  filtros: FiltrosVentas,
): Promise<VentaRegistro[]> {
  try {
    const params = new URLSearchParams();
    // Solo pasamos las fechas al servidor
    params.append("fecha_desde", filtros.fecha_desde || "");
    params.append("fecha_hasta", filtros.fecha_hasta || "");

    // Los demás filtros ya NO se envían al servidor
    // Se aplican en memoria (client-side) en el hook

    const response = await fetch(`${API_URL}/ventas?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<any[]>(response);

    // Transformar datos al formato esperado
    return data.map((item: any) => ({
      // Campos necesarios para cálculos y filtros
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
