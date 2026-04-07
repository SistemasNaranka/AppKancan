// ============================================
// TIPOS PARA EL MÓDULO DE CURVAS DE DISTRIBUCIÓN
// ============================================

/**
 * Roles de usuario en el sistema
 */
export type UserRole = 'admin' | 'bodega' | 'produccion';

/**
 * Permisos por rol
 */
export interface RolePermissions {
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageShipments: boolean;
  canScan: boolean;
  canViewReports: boolean;
  canCompare: boolean;
}

/**
 * Configuración de permisos por rol
 */
export const PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canUpload: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageShipments: true,
    canScan: true,
    canViewReports: true,
    canCompare: true,
  },
  bodega: {
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canManageShipments: true,
    canScan: true,
    canViewReports: true,
    canCompare: true,
  },
  produccion: {
    canUpload: true, // Permitir carga para Practicante
    canEdit: true,   // Habilitar edición para Bug 3
    canDelete: false,
    canExport: true,
    canManageShipments: true,
    canScan: true,
    canViewReports: true,
    canCompare: true,
  },
};

/**
 * Representa una tienda en el sistema
 */
export interface Tienda {
  id: string;
  codigo: string;
  nombre: string;
  region?: string;
  ciudad?: string;
}

/**
 * Tipo de curva de distribución (01, 03, 05, etc.)
 */
export type TipoCurva = string;

/**
 * Representa una celda en la matriz de curvas
 * con soporte para formato condicional
 */
export interface CeldaCurva {
  valor: number;
  esCero: boolean;
  esMayorQueCero: boolean;
}

/**
 * Fila de datos en la Matriz General de Curvas
 * Donde las columnas son las curvas y hay un total
 */
export interface FilaMatrizGeneral {
  id: string;
  tienda: Tienda;
  curvas: Record<TipoCurva, CeldaCurva>;
  total: number;
}

/**
 * Matriz General de Curvas (Archivo 1)
 * Filas = Tiendas, Columnas = Curvas (01, 03, 05, etc.) + Total
 */
export interface MatrizGeneralCurvas {
  id?: string;
  nombreHoja: string;
  referencia: string;
  filas: FilaMatrizGeneral[];
  curvas: TipoCurva[];
  totalesPorCurva: Record<TipoCurva, number>;
  totalGeneral: number;
  fechaCarga?: Date;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  /** Estado del lote: borrador | confirmado */
  estado?: 'borrador' | 'confirmado';
}

/**
 * Metadatos de producto (comunes para archivos 2 y 3)
 */
export interface MetadatosProducto {
  referencia: string;
  imagen: string;
  color: string;
  material?: string;
  marca?: string;
  proveedor: string;
  precio: number;
  linea: string;
  categoria?: string;
  subcategoria?: string;
}

/**
 * Tipo de talla (35, 36, 37, etc.)
 */
export type Talla = string;

/**
 * Representa una celda en el detalle de producto
 * con soporte para formato condicional
 */
export interface CeldaTalla {
  valor: number;
  esCero: boolean;
  esMayorQueCero: boolean;
}

/**
 * Fila de datos en el Detalle de Producto
 * Donde las columnas son las tallas y hay un total
 */
export interface FilaDetalleProducto {
  id: string;
  tienda: Tienda;
  tallas: Record<Talla, CeldaTalla>;
  total: number;
}

/**
 * Detalle de Producto (Archivos 2 y 3)
 * Metadatos + Filas = Tiendas, Columnas = Tallas + Total
 */
export interface DetalleProducto {
  id?: string;
  nombreHoja: string;
  metadatos: MetadatosProducto;
  filas: FilaDetalleProducto[];
  tallas: Talla[];
  totalesPorTalla: Record<Talla, number>;
  totalGeneral: number;
  fechaCarga?: Date;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  /** Estado del lote: borrador | confirmado */
  estado?: 'borrador' | 'confirmado';
}

/**
 * Estados posibles de carga de archivos
 */
export type EstadoCarga = 'vacio' | 'cargando' | 'procesando' | 'exito' | 'error';

/**
 * Resultado de procesamiento de un archivo Excel
 */
export interface ResultadoProcesamiento {
  archivo: string;
  estado: EstadoCarga;
  progreso: number;
  errores: ErrorProcesamiento[];
  datos?: MatrizGeneralCurvas[] | DetalleProducto[];
}

/**
 * Error específico en el procesamiento de celdas
 */
export interface ErrorProcesamiento {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
  severidad: 'warning' | 'error';
}

/**
 * Archivo subido con su información de procesamiento
 */
export interface ArchivoSubido {
  id: string;
  nombre: string;
  tipo: 'matriz_general' | 'detalle_producto_a' | 'detalle_producto_b';
  estado: EstadoCarga;
  progreso: number;
  errores: ErrorProcesamiento[];
  fechaSubida: Date;
  datos?: MatrizGeneralCurvas[] | DetalleProducto[];
}

/**
 * Datos completos del módulo después de procesar los archivos
 */
export interface DatosCurvas {
  matrizGeneral: MatrizGeneralCurvas[];
  productos: DetalleProducto[];
  fechaCarga: Date;
  datosValidacion?: Record<string, Record<string, Record<string, number>>>; // { sheetId: { filaId: { columna: valor } } }
}

/**
 * Configuración para el DataGrid de curvas
 */
export interface ConfiguracionDataGrid {
  stickyColumn: boolean;
  stickyHeader: boolean;
  paginacion: boolean;
  filtrable: boolean;
  ordenable: boolean;
  seleccionable: boolean;
  editable: boolean;
  alturaFija?: number;
}

/**
 * Opciones de exportación
 */
export interface OpcionesExportacion {
  formato: 'pdf' | 'excel' | 'csv';
  incluirTotales: boolean;
  incluirEncabezados: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Filtros para el análisis de curvas
 */
export interface FiltrosCurvas {
  referencia?: string;
  tienda?: string;
  curva?: TipoCurva;
  rangoTallas?: [Talla, Talla];
  soloCeros?: boolean;
  soloMayoresQueCero?: boolean;
}

/**
 * Tipo de análisis seleccionado en los tabs
 */
export type TipoAnalisis = 'general' | 'producto_a' | 'producto_b';

/**
 * Résumen ejecutivo para tarjetas de métricas
 */
export interface ResumenMetricas {
  totalTiendas: number;
  totalProductos: number;
  tiendasConStock: number;
  tiendasSinStock: number;
  promedioPorTienda: number;
  curvaConMasStock: TipoCurva;
  tallaConMasStock: Talla;
}

/**
 * Resultado de validación de archivo
 */
export interface ValidacionArchivo {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  estructuraValida: boolean;
  columnasEsperadas: string[];
  columnasEncontradas: string[];
}

// ============================================
// TIPOS PARA ENVÍOS Y DESPACHOS
// ============================================

/**
 * Estado de un envío
 */
export type EstadoEnvio = 'pendiente' | 'en_proceso' | 'despachado' | 'entregado' | 'cancelado';

/**
 * Artículo escaneado para envío
 */
export interface ArticuloEscaneado {
  id: string;
  codigo: string;
  referencia: string;
  talla: Talla;
  cantidad: number;
  tiendaDestino: Tienda;
  fechaEscaneo: Date;
  usuarioEscaneo: string;
  estado: 'escaneado' | 'confirmado' | 'discrepancia';
}

/**
 * Registro de envío a tienda
 */
export interface EnvioTienda {
  id: string;
  tienda: Tienda;
  articulos: ArticuloEscaneado[];
  totalArticulos: number;
  estado: EstadoEnvio;
  fechaCreacion: Date;
  fechaDespacho?: Date;
  usuarioCreacion: string;
  usuarioDespacho?: string;
  observaciones?: string;
}

/**
 * Comparación entre planificado y escaneado
 */
export interface ComparacionEnvio {
  id: string;
  tienda: Tienda;
  referencia: string;
  talla: Talla;
  cantidadPlanificada: number;
  cantidadEscaneada: number;
  diferencia: number;
  estado: 'coincide' | 'sobrante' | 'faltante';
}

/**
 * Reporte de discrepancias
 */
export interface ReporteDiscrepancias {
  id: string;
  fechaGeneracion: Date;
  envio: EnvioTienda;
  comparaciones: ComparacionEnvio[];
  totalCoincidencias: number;
  totalSobrantes: number;
  totalFaltantes: number;
  resumen: string;
}

/**
 * Filtros para envíos
 */
export interface FiltrosEnvio {
  tienda?: string;
  estado?: EstadoEnvio;
  fechaDesde?: Date;
  fechaHasta?: Date;
  referencia?: string;
}

// ============================================
// TIPOS PARA EDICIÓN EN DATAGRID
// ============================================

/**
 * Celda editada en el DataGrid
 */
export interface CeldaEditada {
  sheetId: string;
  filaId: string;
  columna: string;
  valorAnterior: number;
  valorNuevo: number;
  fechaEdicion: Date;
  usuarioEdicion: string;
}

/**
 * Historial de cambios
 */
export interface HistorialCambios {
  id: string;
  entidad: 'matriz_general' | 'detalle_producto';
  entidadId: string;
  cambios: CeldaEditada[];
  fechaModificacion: Date;
  usuarioModificacion: string;
}

// ============================================
// TIPOS PARA LOG DE CURVAS (Tabla log_curvas)
// ============================================

/**
 * Tipo de plantilla en el sistema de curvas
 */
export type TipoPlantilla = 'matriz_general' | 'productos';

/**
 * Registro de log de curvas para guardar en Directus
 * Guarda la información de cada aplicación/guardado de plantillas
 */
export interface LogCurvas {
  id?: string;
  /** ID de la tienda en la base de datos */
  tienda_id: string;
  /** Nombre de la tienda (para referencia visual) */
  tienda_nombre?: string;
  /** Tipo de plantilla: matriz_general (textil) o productos (calzado/bolsos) */
  plantilla: TipoPlantilla;
  /** Fecha de registro */
  fecha: string;
  /** JSON con array de objetos {talla: number, cantidad: number} */
  cantidad_talla: string;
  /** Referencia del producto (opcional) */
  referencia?: string;
  /** Estado del registro: borrador | confirmado */
  estado?: 'borrador' | 'confirmado';
  /** Fecha de creación en el sistema */
  fecha_creacion?: string;
}
/**
 * Registro de envío a despacho para guardar en Directus (tabla envios_curvas)
 * Guarda lo que bodega "pistoleó" o escaneó
 */
export interface EnvioCurva {
  id?: string;
  /** ID de la tienda en la base de datos */
  tienda_id: string;
  /** Tipo de plantilla: matriz_general | productos */
  plantilla: TipoPlantilla;
  /** Fecha de despacho */
  fecha: string;
  /** JSON con array de objetos {talla: number, cantidad: number} */
  cantidad_talla: string;
  /** Referencia del producto */
  referencia: string;
  /** ID del usuario que realiza el despacho */
  usuario_id?: string;
}

/**
 * Registro de bloqueo de concurrencia para la vista de envíos (tabla escaner_curvas)
 */
export interface BloqueoEscaner {
  id?: string;
  referencia: string;
  tienda_id: string;
  usuario_id: string;
  ultima_actividad: string; // ISO string
}
