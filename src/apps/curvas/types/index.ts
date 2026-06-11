export type UserRole = 'admin' | 'bodega' | 'produccion';

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
    canUpload: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canManageShipments: true,
    canScan: true,
    canViewReports: true,
    canCompare: true,
  },
};

export interface Tienda {
  id: string;
  codigo: string;
  nombre: string;
  region?: string;
  ciudad?: string;
}

export type TipoCurva = string;

export interface CeldaCurva {
  valor: number;
  esCero: boolean;
  esMayorQueCero: boolean;
}


export interface FilaMatrizGeneral {
  id: string;
  tienda: Tienda;
  curvas: Record<TipoCurva, CeldaCurva>;
  total: number;
}

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
  estado?: 'borrador' | 'confirmado';
}

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

export type Talla = string;

export interface CeldaTalla {
  valor: number;
  esCero: boolean;
  esMayorQueCero: boolean;
}

export interface FilaDetalleProducto {
  id: string;
  tienda: Tienda;
  tallas: Record<Talla, CeldaTalla>;
  total: number;
}

export interface DetalleProducto {
  id?: string;
  nombreHoja: string;
  referencia?: string;
  metadatos: MetadatosProducto;
  filas: FilaDetalleProducto[];
  tallas: Talla[];
  totalesPorTalla: Record<Talla, number>;
  totalGeneral: number;
  fechaCarga?: Date;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  estado?: 'borrador' | 'confirmado';
}

export type EstadoCarga = 'vacio' | 'cargando' | 'procesando' | 'exito' | 'error';


export interface ResultadoProcesamiento {
  archivo: string;
  estado: EstadoCarga;
  progreso: number;
  errores: ErrorProcesamiento[];
  datos?: MatrizGeneralCurvas[] | DetalleProducto[];
}


export interface ErrorProcesamiento {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
  severidad: 'warning' | 'error';
}


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


export interface DatosCurvas {
  matrizGeneral: MatrizGeneralCurvas[];
  productos: DetalleProducto[];
  fechaCarga: Date;
  datosValidacion?: Record<string, Record<string, Record<string, number>>>;
}

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


export interface OpcionesExportacion {
  formato: 'pdf' | 'excel' | 'csv';
  incluirTotales: boolean;
  incluirEncabezados: boolean;
  orientation?: 'portrait' | 'landscape';
}


export interface FiltrosCurvas {
  referencia?: string;
  tienda?: string;
  curva?: TipoCurva;
  rangoTallas?: [Talla, Talla];
  soloCeros?: boolean;
  soloMayoresQueCero?: boolean;
}


export type TipoAnalisis = 'general' | 'producto_a' | 'producto_b'

export interface ResumenMetricas {
  totalTiendas: number;
  totalProductos: number;
  tiendasConStock: number;
  tiendasSinStock: number;
  promedioPorTienda: number;
  curvaConMasStock: TipoCurva;
  tallaConMasStock: Talla;
}


export interface ValidacionArchivo {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  estructuraValida: boolean;
  columnasEsperadas: string[];
  columnasEncontradas: string[];
}


export type EstadoEnvio = 'pendiente' | 'en_proceso' | 'despachado' | 'entregado' | 'cancelado';


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

export interface FiltrosEnvio {
  tienda?: string;
  estado?: EstadoEnvio;
  fechaDesde?: Date;
  fechaHasta?: Date;
  referencia?: string;
}

export interface CeldaEditada {
  sheetId: string;
  filaId: string;
  columna: string;
  valorAnterior: number;
  valorNuevo: number;
  fechaEdicion: Date;
  usuarioEdicion: string;
}

export interface HistorialCambios {
  id: string;
  entidad: 'matriz_general' | 'detalle_producto';
  entidadId: string;
  cambios: CeldaEditada[];
  fechaModificacion: Date;
  usuarioModificacion: string;
}

export type TipoPlantilla = 'matriz_general' | 'productos';
export type TipoPlantillaDB = 'textil' | 'calzado_bolso';
export interface CantidadTallaItem {
  talla: number;
  codigo_barra: string;
  cantidad: number;
}

export interface LogCurvas {
  id?: string;
  store_id: string;
  store_name?: string;
  template: TipoPlantillaDB;
  log_date: string;
  size_quantity: string;
  reference?: string;
  status?: 'borrador' | 'confirmado';
  date_created?: string;
}

export interface EnvioCurva {
  id?: string;
  store_id: string;
  template: string;
  shipment_date: string;
  size_quantity: string;
  reference: string;
  store_name?: string;
  user_id?: string;
  status?: 'borrador' | 'confirmado';
}


export interface BloqueoEscaner {
  id?: string;
  reference: string;
  store_id: string;
  user_id: string;
  last_activity_at: string;
}
