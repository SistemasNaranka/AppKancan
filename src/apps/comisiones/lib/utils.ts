import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats commission and sales values for display
 * US format: commas for thousands, dots for decimals
 */
export function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
