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

// URL del servidor backend
// En producción, la API está en el mismo servidor que el frontend
// En desarrollo, se puede configurar via variable de entorno
const API_URL = import.meta.env.VITE_VENTAS_API_URL || "/api";

// ==================== FUNCIONES DE LECTURA ====================

/**
 * Obtener zonas/procesos
 */
export async function obtenerZonas(): Promise<Zona[]> {
  try {
    const response = await fetch(`${API_URL}/zonas`);
    if (!response.ok) throw new Error("Error al obtener zonas");
    return await response.json();
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    return [];
  }
}

/**
 * Obtener ciudades
 */
export async function obtenerCiudades(): Promise<Ciudad[]> {
  try {
    const response = await fetch(`${API_URL}/ciudades`);
    if (!response.ok) throw new Error("Error al obtener ciudades");
    return await response.json();
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    return [];
  }
}

/**
 * Obtener tiendas/bodegas
 */
export async function obtenerTiendas(): Promise<Tienda[]> {
  try {
    const response = await fetch(`${API_URL}/tiendas`);
    if (!response.ok) throw new Error("Error al obtener tiendas");
    return await response.json();
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
    const response = await fetch(`${API_URL}/grupos-homogeneos`);
    if (!response.ok) throw new Error("Error al obtener grupos homogéneos");
    const data = await response.json();
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

    const response = await fetch(`${API_URL}/ventas?${params.toString()}`);
    if (!response.ok) throw new Error("Error al obtener ventas");

    const data = await response.json();

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
    const response = await fetch(`${API_URL}/asesores`);
    if (!response.ok) throw new Error("Error al obtener asesores");
    return await response.json();
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
    const response = await fetch(`${API_URL}/lineas-venta`);
    if (!response.ok) throw new Error("Error al obtener líneas de venta");
    const data = await response.json();
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
    const response = await fetch(`${API_URL}/agrupaciones`);
    if (!response.ok) throw new Error("Error al obtener agrupaciones");
    const data = await response.json();
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
