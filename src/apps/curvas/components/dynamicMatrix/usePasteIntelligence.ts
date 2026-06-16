import type React from "react";
import { useState } from "react";
import type { MatrixRowData, PendingPaste } from "./matrix.types";
import type { Tienda } from "../../types";

interface Params {
  rows: MatrixRowData[];
  columns: string[];
  tiendasLista: Tienda[];
  setRows: React.Dispatch<React.SetStateAction<MatrixRowData[]>>;
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

export function usePasteIntelligence({
  rows,
  columns,
  tiendasLista,
  setRows,
  setColumns,
}: Params) {
  const [confirmPasteOpen, setConfirmPasteOpen] = useState(false);
  const [pendingPasteData, setPendingPasteData] = useState<PendingPaste | null>(null);

  const handlePaste = (
    e: React.ClipboardEvent,
    startRowIndex: number,
    startColName: string,
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");

    const allLines = pasteData.split(/\r?\n/);
    const lines = allLines.filter((line) => line.trim() !== "");
    if (lines.length === 0) return;

    let newRows = [...rows];
    const tempColumns = [...columns];
    let needsNewDialog = false;

    const startColIdx = tempColumns.indexOf(startColName);
    if (startColIdx === -1) return;

    const firstLineValues = lines[0].split("\t");
    const isFirstValueNumeric =
      firstLineValues.length > 0 && !isNaN(Number(firstLineValues[0].trim()));

    const effectiveStartColIdx = isFirstValueNumeric ? 0 : startColIdx;

    lines.forEach((line, lineIdx) => {
      const values = line.split("\t");
      if (values.length === 0) return;

      let targetRowIdx = startRowIndex + lineIdx;
      let dataValueStartIndex = 0;

      if (!isFirstValueNumeric) {
        const firstColValue = values[0].trim();
        const matchedStore = tiendasLista.find(
          (t) =>
            t.nombre.toLowerCase() === firstColValue.toLowerCase() ||
            t.codigo.toLowerCase() === firstColValue.toLowerCase(),
        );

        if (matchedStore) {
          const existingRowIdx = newRows.findIndex(
            (r) => r.name === matchedStore.nombre,
          );
          if (existingRowIdx !== -1) {
            targetRowIdx = existingRowIdx;
            dataValueStartIndex = 1;
          }
        }
      }

      if (targetRowIdx >= newRows.length) {
        const extraRowsCount = targetRowIdx - newRows.length + 1;
        const extraRows = Array.from({ length: extraRowsCount }, (_, i) => ({
          id: (newRows.length + i + 1).toString(),
          name: "",
          values: {},
        }));
        newRows = [...newRows, ...extraRows];
      }

      const rowToUpdate = { ...newRows[targetRowIdx] };
      rowToUpdate.values = { ...rowToUpdate.values };

      const valuesToPaste = values.slice(dataValueStartIndex);
      const startIdx = isFirstValueNumeric ? 0 : effectiveStartColIdx;

      valuesToPaste.forEach((val, valIdx) => {
        const cleanVal = val.trim();
        if (cleanVal === "") return;

        const targetColIdx = startIdx + valIdx;

        if (targetColIdx >= tempColumns.length) {
          needsNewDialog = true;
          const lastCol = tempColumns[tempColumns.length - 1];
          const nextVal = !isNaN(Number(lastCol))
            ? (Number(lastCol) + 1).toString()
            : (tempColumns.length + 1).toString();
          tempColumns.push(nextVal);
        }

        const colName = tempColumns[targetColIdx];
        const parsedVal = cleanVal.replace(/[^\d]/g, "");
        const numVal = parsedVal === "" ? 0 : parseInt(parsedVal, 10);

        rowToUpdate.values[colName] = numVal;
      });

      newRows[targetRowIdx] = rowToUpdate;
    });

    if (needsNewDialog) {
      setPendingPasteData({ newRows, newColumns: tempColumns });
      setConfirmPasteOpen(true);
    } else {
      setRows(newRows);
      if (tempColumns.length > columns.length) {
        setColumns(tempColumns);
      }
    }
  };

  const confirmAutoColumns = () => {
    if (pendingPasteData) {
      setColumns(pendingPasteData.newColumns);
      setRows(pendingPasteData.newRows);
    }
    setConfirmPasteOpen(false);
    setPendingPasteData(null);
  };

  return {
    handlePaste,
    confirmPasteOpen,
    setConfirmPasteOpen,
    pendingPasteData,
    confirmAutoColumns,
  };
}
