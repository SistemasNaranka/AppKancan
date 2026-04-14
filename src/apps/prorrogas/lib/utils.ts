import { ContractStatus, Prorroga } from "../types/types";
import { addMonths as dfAddMonths, subDays, parseISO } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea un objeto Date como YYYY-MM-DD usando la zona horaria local.
 * Evita el bug de toISOString() que convierte a UTC y puede cambiar la fecha.
 */
export const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Suma N meses a una fecha en formato YYYY-MM-DD y resta 1 día.
 * Usa date-fns para manejo correcto de límites de mes y años bisiestos.
 *
 * REGLA DE NEGOCIO: Si una prórroga inicia el 02/02 y son 4 meses,
 * la fecha base sería 02/06, pero la fecha final real es 01/06 (un día menos).
 * Esta regla aplica para TODAS las prórrogas sin excepción.
 */
export const addMonths = (dateStr: string, months: number): string => {
  const base = parseISO(dateStr);
  const withMonths = dfAddMonths(base, months);
  const final = subDays(withMonths, 1);
  return toLocalDateStr(final);
};

/**
 * Calcula la fecha final de una prórroga a partir de su fecha de inicio y duración.
 * Aplica la regla: fecha_fin = fecha_inicio + duración_meses - 1 día.
 */
export const computeEndDate = (fechaInicio: string | Date | null | undefined, duracionMeses: number): string | null => {
  if (!fechaInicio) return null;
  const startStr = typeof fechaInicio === 'string' ? fechaInicio.split('T')[0] : toLocalDateStr(fechaInicio);
  if (!startStr || startStr === '—') return null;
  return addMonths(startStr, duracionMeses);
};

export const formatDate = (dateStr: string | Date | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/** Días restantes hasta una fecha (negativo si ya venció) */
export const daysUntil = (dateStr: string | undefined | null): number => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Duración de una prórroga según su número:
 * - Prórrogas 0 a 3 → 4 meses
 * - Prórroga 4 en adelante → 12 meses
 */
export const getProrrogaDuration = (numero: number | undefined): number =>
  (numero ?? 0) >= 4 ? 12 : 4;

/** Estado visual del contrato según días restantes */
export const getContractStatus = (fechaFin: string): ContractStatus => {
  const days = daysUntil(fechaFin);
  if (days < 0) return "vencido";
  if (days <= 50) return "proximo";
  return "vigente";
};

export const getNextProrrogaNumber = (prorrogas: Prorroga[]): number => {
  if (prorrogas.length === 0) return 0;
  return Math.max(...prorrogas.map((p) => p.numero ?? 0)) + 1;
};

/** Porcentaje de avance de la prórroga activa */
export const getProrrogaProgress = (entry: Prorroga): number => {
  const start = new Date(entry.fecha_ingreso).getTime();
  const end   = new Date(entry.fecha_final).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const elapsed = Date.now() - start;
  const total   = end - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

/**
 * Convierte un valor de tipo_contrato de la BD al formato legible.
 * Ejemplos:
 *   "obra_laboral"  → "Obra laboral"
 *   "TERMINO_FIJO"  → "Termino fijo"
 *   "termino-fijo"  → "Termino fijo"
 */
export const formatTipoContrato = (raw: string | undefined | null): string => {
  if (!raw) return '—';
  return raw
    .replace(/[_-]/g, ' ')                    // underscores y guiones → espacios
    .toLowerCase()                             // todo en minúsculas
    .replace(/^\w/, (c) => c.toUpperCase());   // primera letra mayúscula
};
