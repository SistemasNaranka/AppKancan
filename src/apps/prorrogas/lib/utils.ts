import { ContractStatus, Prorroga } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Suma N meses a una fecha en formato YYYY-MM-DD */
export const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

/** Formatea una fecha para mostrar en español colombiano */
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
  if (days < 0) return 'vencido';
  if (days <= 50) return 'proximo';
  return 'vigente';
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