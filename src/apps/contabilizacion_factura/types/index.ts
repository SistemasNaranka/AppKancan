export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface ImpuestosDetalle {
  base: number;
  tipo: number;
  importe: number;
}

export interface DatosFacturaPDF {
  numeroFactura: string;
  numeroSinPrefijo: string;
  automatico: string;
  fechaEmision: string;
  fechaVencimiento?: string;

  proveedor: {
    nombre: string;
    nif?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };

  cliente?: {
    nombre: string;
    nif?: string;
    direccion?: string;
  };

  conceptos: ConceptoFactura[];

  impuestos: ImpuestosDetalle[];

  subtotal: number;
  totalImpuestos: number;
  total: number;

  moneda: string;
  formaPago?: string;
  observaciones?: string;

  archivo: {
    nombre: string;
    tamaño: number;
    fechaCarga: string;
  };

  automaticoAsignado?: string;

  entrada?: string;
}


export type EstadoProceso =
  | "idle" 
  | "cargando" 
  | "procesando"
  | "validando"
  | "completado"
  | "error";


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

function normalizeCurrency(currency: string): string {
  if (!currency) return "COP";

  const upperCurrency = currency.toUpperCase().trim();

  if (CODIGOS_MONEDA_VALIDOS.includes(upperCurrency)) {
    return upperCurrency;
  }

  const lowerCurrency = currency.toLowerCase().trim();
  if (MAPA_MONEDAS[lowerCurrency]) {
    return MAPA_MONEDAS[lowerCurrency];
  }

  for (const [nombre, codigo] of Object.entries(MAPA_MONEDAS)) {
    if (lowerCurrency.includes(nombre) || nombre.includes(lowerCurrency)) {
      return codigo;
    }
  }

  console.warn(`Moneda no reconocida "${currency}", usando COP como default`);
  return "COP";
}

export function formatCurrency(
  amount: number,
  currency: string = "COP",
): string {
  const monedaNormalizada = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: monedaNormalizada,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("es-CO")} ${monedaNormalizada}`;
  }
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  try {
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    const date = new Date(year, month - 1, day);
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

export function getNitSinDv(nit?: string): string {
  if (!nit) return "";
  const trimmed = nit.trim();
  const parts = trimmed.split("-");
  return parts[0].trim();
}

