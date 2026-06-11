// Hook con la navegación tipo Excel (flechas, Enter) entre celdas de la matriz.

import type React from "react";
import type { ActiveCell, MatrixRowData } from "./matrix.types";

interface Params {
  rows: MatrixRowData[];
  columns: string[];
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  setActiveCell: (c: ActiveCell | null) => void;
}

export function useKeyboardNav({ rows, columns, inputRefs, setActiveCell }: Params) {
  const handleKeyDown = (e: React.KeyboardEvent, r: number, cName: string) => {
    const cIdx = columns.indexOf(cName);
    let nextR = r;
    let nextCIdx = cIdx;

    switch (e.key) {
      case "ArrowUp":
        nextR = Math.max(0, r - 1);
        e.preventDefault();
        break;
      case "ArrowDown":
        nextR = Math.min(rows.length - 1, r + 1);
        e.preventDefault();
        break;
      case "ArrowLeft":
        nextCIdx = Math.max(0, cIdx - 1);
        e.preventDefault();
        break;
      case "ArrowRight":
        nextCIdx = Math.min(columns.length - 1, cIdx + 1);
        e.preventDefault();
        break;
      case "Enter":
        nextR = Math.min(rows.length - 1, r + 1);
        e.preventDefault();
        break;
      default:
        return;
    }

    const nextCName = columns[nextCIdx];
    setActiveCell({ r: nextR, c: nextCName });

    setTimeout(() => {
      const refKey = `${nextR}-${nextCName}`;
      inputRefs.current[refKey]?.focus();
      inputRefs.current[refKey]?.select();
    }, 10);
  };

  return { handleKeyDown };
}
