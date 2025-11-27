import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats commission and sales values for display
 * Rounds to nearest 100, removes decimals, and adds Colombian thousands separator
 */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value / 100) * 100;
  return rounded.toLocaleString('es-CO');
}
