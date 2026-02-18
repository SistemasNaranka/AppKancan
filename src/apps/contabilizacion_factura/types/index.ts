/**
 * Tipos e interfaces para el módulo de Contabilización de Facturas
 */

// ============ TIPOS PARA FACTURA EXTRAÍDA DE PDF ============

/**
 * Representa un concepto/ítem de la factura
 */
export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

/**
 * Representa un impuesto desglosado
 */
export interface ImpuestosDetalle {
  base: number;
  tipo: number; // Porcentaje (ej: 21 para 21%)
  importe: number;
}

/**
 * Datos extraídos de una factura PDF
 */
export interface DatosFacturaPDF {
  // Información general
  numeroFactura: string;
  serie?: string;
  fechaEmision: string;
  fechaVencimiento?: string;

  // Proveedor
  proveedor: {
    nombre: string;
    nif?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };

  // Cliente (si aplica)
  cliente?: {
    nombre: string;
    nif?: string;
    direccion?: string;
  };

  // Conceptos/Items
  conceptos: ConceptoFactura[];

  // Desglose de impuestos
  impuestos: ImpuestosDetalle[];

  // Totales
  subtotal: number;
  totalImpuestos: number;
  total: number;

  // Metadatos
  moneda: string;
  formaPago?: string;
  observaciones?: string;

  // Información del archivo
  archivo: {
    nombre: string;
    tamaño: number;
    fechaCarga: string;
  };
}

// ============ ESTADOS DEL PROCESO ============

export type EstadoProceso =
  | "idle" // Esperando archivo
  | "cargando" // Cargando archivo
  | "procesando" // Extrayendo datos del PDF
  | "validando" // Validando datos extraídos
  | "completado" // Datos extraídos exitosamente
  | "error"; // Error en el proceso

// ============ ERRORES ============

export type TipoErrorPDF =
  | "archivo_invalido"
  | "pdf_protegido"
  | "extraccion_fallida"
  | "formato_no_reconocido"
  | "datos_incompletos"
  | "error_desconocido";

export interface ErrorProcesamientoPDF {
  tipo: TipoErrorPDF;
  mensaje: string;
  detalles?: string;
}

// ============ PROPS DE COMPONENTES ============

export interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export interface InvoiceDisplayProps {
  datosFactura: DatosFacturaPDF;
  onLimpiar: () => void;
  onGuardar?: () => void;
}

export interface LoadingOverlayProps {
  message: string;
  progress?: number;
}

// ============ FILTROS DE BÚSQUEDA (mantenidos para compatibilidad) ============

export interface FacturaFilters {
  estado?: EstadoFactura;
  fecha_desde?: string;
  fecha_hasta?: string;
  cliente?: string;
}

// Estados posibles de una factura (mantenidos para compatibilidad)
export enum EstadoFactura {
  PENDIENTE = "pendiente",
  PAGADA = "pagada",
  VENCIDA = "vencida",
  CANCELADA = "cancelada",
}

// ============ UTILIDADES ============

export function formatCurrency(
  amount: number,
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ============ CONFIGURACIÓN OLLAMA ============

/**
 * Configuración para el extractor de Ollama
 */
export interface OllamaConfig {
  modelo: string;
  host: string;
}

/**
 * Modelos de Ollama recomendados para visión
 */
export const MODELOS_VISION_OLLAMA = [
  {
    id: "llama3.2-vision:latest",
    nombre: "Llama 3.2 Vision",
    recomendado: true,
  },
  { id: "llava:latest", nombre: "LLaVA", recomendado: false },
  { id: "bakllava:latest", nombre: "BakLLaVA", recomendado: false },
  { id: "moondream:latest", nombre: "Moondream", recomendado: false },
  {
    id: "gemini-3-flash-preview:latest",
    nombre: "Gemini 3 Flash (Cloud)",
    recomendado: false,
  },
] as const;

/**
 * Tipo de método de extracción
 */
export type MetodoExtraccion = "ollama" | "pdfjs";
