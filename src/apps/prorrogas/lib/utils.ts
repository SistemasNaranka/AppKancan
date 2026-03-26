import { ContractStatus } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Suma N meses a una fecha en formato YYYY-MM-DD */
export const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};

/** Formatea una fecha para mostrar en español colombiano */
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Días restantes hasta una fecha (negativo si ya venció) */
export const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS RULES
// ─────────────────────────────────────────────────────────────────────────────

/** Estado visual del contrato según días restantes */
export const getContractStatus = (fechaFin: string): ContractStatus => {
  const days = daysUntil(fechaFin);
  if (days < 0) return "vencido";
  if (days <= 50) return "proximo";
  return "vigente";
};
