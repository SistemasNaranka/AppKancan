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
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Días restantes hasta una fecha (negativo si ya venció) */
export const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Duración de una prórroga según su número:
 * - Prórrogas 0 a 3 → 4 meses
 * - Prórroga 4 en adelante → 12 meses
 */
export const getProrrogaDuration = (numero: number): number =>
  numero >= 4 ? 12 : 4;

/** Estado visual del contrato según días restantes */
export const getContractStatus = (fechaFin: string): ContractStatus => {
  const days = daysUntil(fechaFin);
  if (days < 0) return 'vencido';
  if (days <= 50) return 'proximo';
  return 'vigente';
};

/** Número de la próxima prórroga */
export const getNextProrrogaNumber = (prorrogas: Prorroga[]): number => {
  if (prorrogas.length === 0) return 0;
  return Math.max(...prorrogas.map((p) => p.numero)) + 1;
};

/** Porcentaje de avance de la prórroga activa (usa snake_case de Directus) */
export const getProrrogaProgress = (entry: Prorroga): number => {
  const total = new Date(entry.fecha_fin).getTime() - new Date(entry.fecha_inicio).getTime();
  const elapsed = Date.now() - new Date(entry.fecha_inicio).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};