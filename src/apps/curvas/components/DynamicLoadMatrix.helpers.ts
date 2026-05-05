import { Tienda } from "../types";

export const parsePasteData = (text: string, currentColumns: any[]) => {
  const lines = text.trim().split("\n");
  const data = lines.map((line) => line.split("\t"));

  if (data.length === 0) return null;

  const newColumns = [...currentColumns];
  // Lógica para detectar si vienen más columnas de las que hay
  const maxColsInPaste = Math.max(...data.map((row) => row.length));

  return {
    data,
    newColumnsNeeded: maxColsInPaste > currentColumns.length,
    maxColsInPaste
  };
};

export const calculateGrandTotal = (rows: any[]) => {
  return rows.reduce((acc, row) => {
    const rowSum = Object.values(row.values).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    return acc + rowSum;
  }, 0);
};