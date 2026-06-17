import { useEffect, useState } from "react";
import type { ActiveCell, SelectionRange } from "./matrix.types";

export function useSelectionRange(
  columns: string[],
  setActiveCell: (c: ActiveCell | null) => void,
) {
  const [selection, setSelection] = useState<SelectionRange | null>(null);

  const handleMouseDown = (r: number, cName: string) => {
    const cIdx = columns.indexOf(cName);
    setSelection({
      startR: r,
      startCIdx: cIdx,
      endR: r,
      endCIdx: cIdx,
      isSelecting: true,
    });
    setActiveCell({ r, c: cName });
  };

  const handleMouseEnter = (r: number, cName: string) => {
    setSelection((prev) => {
      if (prev?.isSelecting) {
        return { ...prev, endR: r, endCIdx: columns.indexOf(cName) };
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    setSelection((prev) =>
      prev?.isSelecting ? { ...prev, isSelecting: false } : prev,
    );
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [selection]);

  return { selection, handleMouseDown, handleMouseEnter };
}
