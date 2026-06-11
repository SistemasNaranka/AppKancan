import type { MatrixVariant } from "./matrix.types";

export function nextColumnName(columns: string[], type: MatrixVariant): string {
  const usedNumbers = new Set(
    columns.filter((c) => !isNaN(Number(c))).map((c) => Number(c)),
  );

  if (type === "general") {
    let nextCol = 1;
    while (usedNumbers.has(nextCol)) nextCol++;
    return nextCol.toString();
  }

  const numericColumns = Array.from(usedNumbers).filter((n) => n >= 35);
  const maxTalla = numericColumns.length > 0 ? Math.max(...numericColumns) : 40;
  return (maxTalla + 1).toString();
}

export interface RenameResult {
  ok: boolean;
  newColumns?: string[];
  newName?: string;
  message?: string;
}

export function validateColumnRename(
  columns: string[],
  idx: number,
  inputValue: string,
): RenameResult {
  const current = columns[idx];
  const trimmed = inputValue.trim();

  if (!trimmed) return { ok: false };

  const cleanValue = trimmed.replace(/[^0-9]/g, "");
  if (cleanValue.length > 2) {
    return { ok: false, message: "La talla no puede tener más de 2 dígitos" };
  }

  const formattedValue = cleanValue.padStart(2, "0");
  if (formattedValue === current) return { ok: false };

  if (columns.includes(formattedValue)) {
    return {
      ok: false,
      message: `La talla ${formattedValue} ya existe en otra columna`,
    };
  }

  const newColumns = [...columns];
  newColumns[idx] = formattedValue;
  return { ok: true, newColumns, newName: formattedValue };
}
