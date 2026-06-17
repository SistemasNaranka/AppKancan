// Hook con el handler de pegado tabulado en el DataGrid del dashboard.

import { useCallback } from "react";
import type { GridColDef } from "@mui/x-data-grid";

interface UseDashboardPasteParams {
  isToday: boolean;
  canEdit: boolean;
  focusedCell: { rowId: string; field: string } | null;
  datosActuales: any | null;
  columnas: GridColDef[];
  filas: any[];
  editarCelda: (
    sheetId: string,
    rowId: string,
    itemKey: string,
    valor: number,
  ) => void;
  setSnackbar: (s: {
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }) => void;
}

export function useDashboardPaste({
  isToday,
  canEdit,
  focusedCell,
  datosActuales,
  columnas,
  filas,
  editarCelda,
  setSnackbar,
}: UseDashboardPasteParams) {
  return useCallback(
    (event: React.ClipboardEvent) => {
      if (!isToday || !canEdit || !focusedCell || !datosActuales) return;
      const text = event.clipboardData.getData("text");
      if (!text) return;
      const rows = text.split(/\r?\n/).filter((r) => r.trim() !== "");
      if (rows.length === 0) return;
      const data = rows.map((r) => r.split("\t"));
      const startRowId = focusedCell.rowId;
      const startField = focusedCell.field;
      if (!startField.startsWith("val_")) return;
      const editColumns = columnas
        .filter((c) => c.field.startsWith("val_"))
        .map((c) => c.field);
      const startColIdx = editColumns.indexOf(startField);
      if (startColIdx === -1) return;
      const gridRows = filas.filter((r) => r.id !== "row-total-final");
      const startRowIdx = gridRows.findIndex(
        (r) => String(r.id) === String(startRowId),
      );
      if (startRowIdx === -1) return;
      data.forEach((pastedRow, rOffset) => {
        const targetRow = gridRows[startRowIdx + rOffset];
        if (!targetRow) return;
        pastedRow.forEach((value, cOffset) => {
          const targetField = editColumns[startColIdx + cOffset];
          if (!targetField) return;
          const val = Number(value.trim().replace(/[^0-9.-]+/g, "")) || 0;
          const itemKey = targetField.replace("val_", "");
          editarCelda(datosActuales.id!, String(targetRow.id), itemKey, val);
        });
      });
      setSnackbar({
        open: true,
        message: "📋 Datos pegados correctamente",
        severity: "success",
      });
    },
    [
      isToday,
      canEdit,
      focusedCell,
      datosActuales,
      columnas,
      filas,
      editarCelda,
      setSnackbar,
    ],
  );
}
