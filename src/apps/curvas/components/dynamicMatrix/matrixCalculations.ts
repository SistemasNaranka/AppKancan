import type { MatrixRowData } from "./matrix.types";

export function getRowTotal(rowValues: Record<string, number>): number {
  return Object.values(rowValues).reduce((acc, val) => acc + (Number(val) || 0), 0);
}

export function computeColumnTotals(
  rows: MatrixRowData[],
  columns: string[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  columns.forEach((col) => {
    totals[col] = rows.reduce((acc, row) => {
      const rowTotal = getRowTotal(row.values);
      const isValid = rowTotal > 0 && row.name && row.name.trim() !== "";
      return acc + (isValid ? Number(row.values[col]) || 0 : 0);
    }, 0);
  });
  return totals;
}

export function computeGrandTotal(columnTotals: Record<string, number>): number {
  return Object.values(columnTotals).reduce((a, b) => a + b, 0);
}
