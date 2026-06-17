import type { Tienda } from "../../types";

export type MatrixVariant = "general" | "producto_a" | "producto_b";

export interface MatrixRowData {
  id: string;
  name: string;
  tiendaData?: Tienda | null;
  values: Record<string, number>;
}

export interface ActiveCell {
  r: number;
  c: string;
}

export interface SelectionRange {
  startR: number;
  startCIdx: number;
  endR: number;
  endCIdx: number;
  isSelecting: boolean;
}

export interface PendingPaste {
  newRows: MatrixRowData[];
  newColumns: string[];
}

export interface SnackbarMessage {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}
