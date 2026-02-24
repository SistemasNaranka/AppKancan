/**
 * Tipos TypeScript para el Informe de Ventas
 *
 * Esta aplicación muestra información de ventas por asesor, incluyendo:
 * - Nombre del asesor y su venta en unidades
 * - Valor de la venta
 * - Tienda/bodega a la que pertenece
 * - Zona de ubicación
 * - Línea de venta y agrupación (indigo/liviano)
 */

// ==================== ENTIDADES BÁSICAS ====================

/**
 * Zona de la empresa (viene de bodegas.zona)
 */
export interface Zona {
  nombre: string;
}

/**
 * Ciudad para filtro (viene de bodegas.ciudad)
 */
export interface Ciudad {
  nombre: string;
}

/**
 * Tienda/Bodega
 */
export interface Tienda {
  id: number;
  nombre: string;
  ciudad: string;
  codigo_ultra: number;
  subproceso_nombre: string;
  categoria: string;
  zona: string;
}

/**
 * Línea de venta (mapeadas desde BD)
 * - Colección: colección
 * - Básicos: basic
 * - Promoción: promocion, liquidacion, segundas (unificados)
 */
export type LineaVenta = "Colección" | "Básicos" | "Promoción";

/**
 * Agrupación de producto (mapeadas desde BD)
 * - Indigo: indigo, jeans
 * - Tela Liviana: nacional, importado, tela liviana
 * - Calzado: calzado
 * - Complemento: complemento
 */
export type Agrupacion = "Indigo" | "Tela Liviana" | "Calzado" | "Complemento";

/**
 * Grupo homogéneo de productos
 */
export interface GrupoHomogeneo {
  id: number;
  nombre: string;
  origen: string;
  linea_venta: LineaVenta;
  id_grupo: number;
  agrupacion: Agrupacion;
}

// ==================== VENTAS ====================

/**
 * Registro de venta individual
 */
export interface VentaRegistro {
  id_referencia: string;
  id_factura: string;
  fecha_factura: string; // YYYY-MM-DD
  asesor: string;
  bodega: string;
  venta: number; // unidades
  valor: number; // valor monetario
  linea_venta: string;
  agrupacion: string;
  ciudad: string;
  zona: string;
}

/**
 * Venta agregada por asesor
 */
export interface VentaAsesor {
  asesor: string;
  bodega: string;
  ciudad: string;
  zona: string;
  total_unidades: number;
  total_valor: number;
  // Desglose por agrupación (4 categorías)
  unidades_indigo: number;
  unidades_tela_liviana: number;
  unidades_calzado: number;
  unidades_complemento: number;
  // Desglose por línea de venta - unidades (3 categorías)
  unidades_coleccion: number;
  unidades_basicos: number;
  unidades_promocion: number;
  // Desglose por línea de venta - valores (3 categorías)
  valor_coleccion: number;
  valor_basicos: number;
  valor_promocion: number;
}

/**
 * Venta agregada por tienda
 */
export interface VentaTienda {
  bodega: string;
  ciudad: string;
  zona: string;
  total_unidades: number;
  total_valor: number;
  asesores: VentaAsesor[];
}

/**
 * Venta agregada por zona
 */
export interface VentaZona {
  zona: string;
  total_unidades: number;
  total_valor: number;
  tiendas: VentaTienda[];
}

// ==================== FILTROS ====================

/**
 * Filtros disponibles para el informe
 */
export interface FiltrosVentas {
  fecha_desde: string; // YYYY-MM-DD
  fecha_hasta: string; // YYYY-MM-DD
  zona?: string;
  ciudad?: string;
  bodega?: string;
  asesor?: string;
  linea_venta?: LineaVenta;
  agrupacion?: Agrupacion;
}

/**
 * Estado de filtros en la UI
 */
export interface FiltrosUI {
  zonas: Zona[];
  ciudades: Ciudad[];
  tiendas: Tienda[];
  lineas_venta: LineaVenta[];
  agrupaciones: Agrupacion[];
  asesores: string[]; // Lista de nombres de asesores
}

// ==================== ESTADO DE LA APP ====================

/**
 * Estado principal de la aplicación
 */
export interface AppState {
  ventas: VentaRegistro[];
  zonas: Zona[];
  ciudades: Ciudad[];
  tiendas: Tienda[];
  grupos_homogeneos: GrupoHomogeneo[];
  filtros: FiltrosVentas;
  loading: boolean;
  error: string | null;
}

// ==================== RESPUESTA DE API ====================

/**
 * Respuesta de la API de ventas
 */
export interface VentasApiResponse {
  ventas: VentaRegistro[];
  total_registros: number;
}

/**
 * Parámetros para consulta de ventas
 */
export interface VentasQueryParams {
  fecha_desde: string;
  fecha_hasta: string;
  bodega_id?: number;
  zona_id?: number;
  ciudad_id?: number;
}

// ==================== RESUMEN Y ESTADÍSTICAS ====================

/**
 * Resumen general de ventas
 */
export interface ResumenVentas {
  total_unidades: number;
  total_valor: number;
  total_asesores: number;
  total_tiendas: number;
  // Totales por agrupación
  total_unidades_indigo: number;
  total_unidades_liviano: number;
  total_valor_indigo: number;
  total_valor_liviano: number;
  promedio_unidades_asesor: number;
  promedio_valor_asesor: number;
  // Top performers
  top_asesores_unidades: VentaAsesor[];
  top_asesores_valor: VentaAsesor[];
  top_tiendas_unidades: VentaTienda[];
  top_tiendas_valor: VentaTienda[];
}

/**
 * Datos para gráficos
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }[];
}

// ==================== TIPOS PARA TABLAS ====================

/**
 * Fila de tabla de ventas por asesor
 */
export interface TablaVentasFila {
  id: string;
  asesor: string;
  bodega: string;
  ciudad: string;
  zona: string;
  unidades: number;
  valor: number;
  // Líneas de venta - unidades (columnas fijas)
  unidades_coleccion: number;
  unidades_basicos: number;
  unidades_promocion: number;
  // Líneas de venta - valores (columnas fijas)
  valor_coleccion: number;
  valor_basicos: number;
  valor_promocion: number;
  // Agrupaciones (columnas seleccionables)
  unidades_indigo: number;
  unidades_tela_liviana: number;
  unidades_calzado: number;
  unidades_complemento: number;
}

/**
 * Columna de tabla configurable
 */
export interface ColumnaTabla {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}
