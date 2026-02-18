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

// Lista de códigos de moneda ISO 4217 más comunes
const CODIGOS_MONEDA_VALIDOS = [
  "EUR",
  "USD",
  "COP",
  "MXN",
  "ARS",
  "CLP",
  "PEN",
  "BRL",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "KRW",
  "VEF",
  "CRC",
  "DOP",
  "GTQ",
  "HNL",
  "NIO",
  "PAB",
  "PYG",
  "UYU",
  "BOB",
  "SVC",
];

// Mapa de nombres comunes a códigos ISO
const MAPA_MONEDAS: Record<string, string> = {
  pesos: "COP",
  peso: "COP",
  "pesos colombianos": "COP",
  "peso colombiano": "COP",
  dolares: "USD",
  dolar: "USD",
  dólares: "USD",
  dólar: "USD",
  euros: "EUR",
  euro: "EUR",
  bolivares: "VES",
  bolívar: "VES",
  soles: "PEN",
  sol: "PEN",
  "pesos mexicanos": "MXN",
  "peso mexicano": "MXN",
};

/**
 * Normaliza un código de moneda a un código ISO 4217 válido
 */
function normalizarMoneda(currency: string): string {
  if (!currency) return "COP"; // Default para Colombia

  const upperCurrency = currency.toUpperCase().trim();

  // Si ya es un código ISO válido, usarlo
  if (CODIGOS_MONEDA_VALIDOS.includes(upperCurrency)) {
    return upperCurrency;
  }

  // Buscar en el mapa de nombres comunes
  const lowerCurrency = currency.toLowerCase().trim();
  if (MAPA_MONEDAS[lowerCurrency]) {
    return MAPA_MONEDAS[lowerCurrency];
  }

  // Buscar coincidencia parcial en el mapa
  for (const [nombre, codigo] of Object.entries(MAPA_MONEDAS)) {
    if (lowerCurrency.includes(nombre) || nombre.includes(lowerCurrency)) {
      return codigo;
    }
  }

  // Default a COP si no se reconoce
  console.warn(`Moneda no reconocida "${currency}", usando COP como default`);
  return "COP";
}

export function formatCurrency(
  amount: number,
  currency: string = "COP",
): string {
  const monedaNormalizada = normalizarMoneda(currency);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: monedaNormalizada,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback si aún falla
    return `${amount.toLocaleString("es-CO")} ${monedaNormalizada}`;
  }
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
