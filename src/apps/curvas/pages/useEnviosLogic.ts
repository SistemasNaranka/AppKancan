// ============================================
// CUSTOM HOOKS PARA ENVIOSPAGE
// ============================================

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { playBeep, checkIsLockedByOther, checkIsLockedByMe, cleanRefStr } from './EnviosPage.utils';

// ─────────────────────────────────────────────
// useEnviosKeyboard - Manejo de teclado/escáner
// ─────────────────────────────────────────────
interface UseEnviosKeyboardProps {
  current: any | undefined;
  activeCell: { filaId: string; col: string; sheetId: string } | null;
  setActiveCell: (cell: any) => void;
  validationData: Record<string, any>;
  actualizarValorValidacion: (sheetId: string, filaId: string, col: string, val: number) => void;
  bloqueosActivos: any[];
  user: any;
  confirmedEntries: any[];
  safeIndex: number;
  setSelectedEntry: (v: number) => void;
  setSnackbar: (info: any) => void;
  extractRef: (sheet: any) => string;
  intentarBloquear: (tiendaId: string, ref: string) => Promise<boolean>;
}

export const useEnviosKeyboard = ({
  current,
  activeCell,
  setActiveCell,
  validationData,
  actualizarValorValidacion,
  bloqueosActivos,
  user,
  confirmedEntries,
  safeIndex,
  setSelectedEntry,
  setSnackbar,
  extractRef,
  intentarBloquear,
}: UseEnviosKeyboardProps) => {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const autoCursorRef = useRef<{ filaId: string; col: string } | null>(null);
  const activeCellRef = useRef<typeof activeCell>(activeCell);

  // Sync activeCell ref
  useEffect(() => {
    activeCellRef.current = activeCell;
    
    if (activeCell && current) {
      const cellElement = document.getElementById(
        `cell-${activeCell.filaId}-${activeCell.col}`
      );
      if (cellElement) {
        cellElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        cellElement.focus();
      }
    }
  }, [activeCell, current]);

  // Auto-cursor initialization when sheet changes
  useEffect(() => {
    if (current && current.sheet.id && current.sheet.filas.length > 0) {
      const currentRef = extractRef(current.sheet);
      let targetFilaId = null;
      let targetCol = current.columns[0];

      // Find first unlocked row
      for (const fila of current.sheet.filas) {
        const rowLock = bloqueosActivos?.find(
          (b: any) => String(b.tienda_id) === String(fila.tienda?.id) && String(b.referencia) === currentRef
        );
        const lockUserId = rowLock ? String(rowLock.usuario_id) : null;
        const isLockedByOther = rowLock && user && String(lockUserId) !== String(user.id);

        if (isLockedByOther) continue;

        const rowCols = current.getRowColumns(fila);
        const foundCol = current.columns.find((c: string) => rowCols[c] > 0);
        if (foundCol) {
          targetFilaId = fila.id;
          targetCol = foundCol;
          break;
        }
      }

      if (!targetFilaId && current.sheet.filas.length > 0) {
        targetFilaId = current.sheet.filas[0]?.id;
        targetCol = current.columns[0];
      }

      if (targetFilaId) {
        const newActive = { filaId: String(targetFilaId), col: targetCol, sheetId: String(current.sheet.id!) };
        autoCursorRef.current = { filaId: String(targetFilaId), col: targetCol };
        setActiveCell(newActive);
        activeCellRef.current = newActive;
      }
    }
  }, [current, bloqueosActivos, user, extractRef, setActiveCell]);

  // Main keyboard handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentActiveCell = activeCellRef.current;
      if (!current || !currentActiveCell || !user) return;

      const currentRef = extractRef(current.sheet);
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      const isRapidInput = timeSinceLastKey < 150;
      const shiftPressed = e.shiftKey;

      // Scanner input handling
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length > 2) {
          e.preventDefault();

          const codeWithoutLeadingZeros = scannedCode.replace(/^0+/, "");
          const extractedRef = codeWithoutLeadingZeros.substring(0, 5);

          let targetEntryIndex = -1;
          for (let i = 0; i < confirmedEntries.length; i++) {
            const entry = confirmedEntries[i];
            const entrySheetRef = (entry.sheet as any).referencia || entry.sheet.nombreHoja || "";
            const eRef = cleanRefStr(entrySheetRef);
            if (
              extractedRef === eRef ||
              codeWithoutLeadingZeros.includes(eRef) ||
              scannedCode.includes(eRef)
            ) {
              targetEntryIndex = i;
              break;
            }
          }

          if (targetEntryIndex !== -1) {
            if (targetEntryIndex !== safeIndex) {
              setSelectedEntry(targetEntryIndex);
              playBeep("success");
              setSnackbar({
                open: true,
                message: `Cambiando a lote: ${confirmedEntries[targetEntryIndex].label}`,
                severity: "info",
              });
              bufferRef.current = "";
              lastKeyTimeRef.current = now;
              return;
            }

            const targetFilaId = String(currentActiveCell.filaId);

            if (!checkIsLockedByMe(targetFilaId, current.sheet.filas, bloqueosActivos, currentRef, user)) {
              playBeep("error");
              setSnackbar({
                open: true,
                message: 'Debes seleccionar la tienda (Clic en "SEL") para escanear',
                severity: "warning",
              });
              bufferRef.current = "";
              lastKeyTimeRef.current = now;
              return;
            }

            const targetCol = String(currentActiveCell.col);
            const currentSheetValidation = validationData[String(current.sheet.id!)] || {};
            const currentValidation = currentSheetValidation[targetFilaId] || {};
            const currentValue = currentValidation[targetCol] || 0;
            const row = current.sheet.filas.find((f: any) => String(f.id) === targetFilaId);
            const rowCols = row ? current.getRowColumns(row) : {};
            const refValue = rowCols[targetCol] || 0;
            const newValue = currentValue + 1;

            if (refValue > 0 && newValue > refValue) {
              playBeep("error");
              setSnackbar({
                open: true,
                message: `Excedido: ${targetCol} (${newValue}/${refValue})`,
                severity: "warning",
              });
            } else {
              playBeep("success");
              actualizarValorValidacion(String(current.sheet.id!), targetFilaId, targetCol, newValue);
              setSnackbar({
                open: true,
                message: `${targetCol}: ${newValue}${refValue > 0 ? `/${refValue}` : ''}`,
                severity: "success",
              });
            }

            bufferRef.current = "";
            lastKeyTimeRef.current = now;
            return;
          }
        }

        bufferRef.current = "";
        lastKeyTimeRef.current = now;
        return;
      }

      // Accumulate potential scanner input
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isRapidInput && timeSinceLastKey > 1000) {
          bufferRef.current = "";
        }
        bufferRef.current += e.key;
        lastKeyTimeRef.current = now;
        return;
      }

      // Navigation keys
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        if (e.key === 'Tab') e.preventDefault();

        const filas = current.sheet.filas;
        const cols = current.columns;
        const currentFilaIndex = filas.findIndex((f: any) => String(f.id) === currentActiveCell.filaId);
        const currentColIndex = cols.indexOf(currentActiveCell.col);
        let nextFilaId = currentActiveCell.filaId;
        let nextCol = currentActiveCell.col;
        let foundNext = false;

        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !shiftPressed)) {
          if (currentColIndex < cols.length - 1) {
            nextCol = cols[currentColIndex + 1];
            foundNext = true;
          } else if (currentFilaIndex < filas.length - 1) {
            nextFilaId = filas[currentFilaIndex + 1].id;
            nextCol = cols[0];
            foundNext = true;
          }
        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && shiftPressed)) {
          if (currentColIndex > 0) {
            nextCol = cols[currentColIndex - 1];
            foundNext = true;
          } else if (currentFilaIndex > 0) {
            nextFilaId = filas[currentFilaIndex - 1].id;
            nextCol = cols[cols.length - 1];
            foundNext = true;
          }
        } else if (e.key === 'ArrowRight') {
          if (currentColIndex < cols.length - 1) {
            nextCol = cols[currentColIndex + 1];
            foundNext = true;
          } else if (currentFilaIndex < filas.length - 1) {
            nextFilaId = filas[currentFilaIndex + 1].id;
            nextCol = cols[0];
            foundNext = true;
          }
        } else if (e.key === 'ArrowLeft') {
          if (currentColIndex > 0) {
            nextCol = cols[currentColIndex - 1];
            foundNext = true;
          } else if (currentFilaIndex > 0) {
            nextFilaId = filas[currentFilaIndex - 1].id;
            nextCol = cols[cols.length - 1];
            foundNext = true;
          }
        }

        if (foundNext) {
          let nextFilaObj = filas.find((f: any) => String(f.id) === String(nextFilaId));
          // Skip if locked by other
          while (nextFilaObj && checkIsLockedByOther(String(nextFilaId), filas, bloqueosActivos, currentRef, user)) {
            const nextRowIndex = filas.indexOf(nextFilaObj);
            if (shiftPressed) {
              if (nextRowIndex > 0) nextFilaId = filas[nextRowIndex - 1].id;
              else break;
            } else {
              if (nextRowIndex < filas.length - 1)
                nextFilaId = filas[nextRowIndex + 1].id;
              else break;
            }
            nextFilaObj = filas.find((f: any) => String(f.id) === String(nextFilaId));
          }

          const newActive = {
            filaId: String(nextFilaId),
            col: String(nextCol),
            sheetId: String(current.sheet.id!),
          };
          autoCursorRef.current = {
            filaId: String(nextFilaId),
            col: String(nextCol),
          };
          setActiveCell(newActive);
          activeCellRef.current = newActive;
        }
        bufferRef.current = "";
        lastKeyTimeRef.current = now;
        return;
      }

      // Clear buffer on Escape
      if (e.key === 'Escape') {
        bufferRef.current = "";
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [current, activeCellRef, validationData, actualizarValorValidacion, bloqueosActivos, user, confirmedEntries, safeIndex, setSelectedEntry, setSnackbar, extractRef, intentarBloquear]);

  return {
    bufferRef,
    lastKeyTimeRef,
    autoCursorRef,
    activeCellRef,
  };
};

// ─────────────────────────────────────────────
// useEnviosValidation - Validaciones y totales
// ─────────────────────────────────────────────
interface UseEnviosValidationProps {
  current: any | undefined;
  validationData: Record<string, any>;
}

export const useEnviosValidation = ({ current, validationData }: UseEnviosValidationProps) => {
  const mirrorColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    if (!current || !current.sheet?.id) return totals;

    const currentSheetValidation = validationData[String(current.sheet.id)] || {};
    current.columns.forEach((col: string) => {
      totals[col] = 0;
      current.sheet.filas.forEach((fila: any) => {
        const val = currentSheetValidation[fila.id]?.[col] || 0;
        totals[col] += val;
      });
    });
    return totals;
  }, [current, validationData]);

  const mirrorGrandTotal = Object.values(mirrorColumnTotals).reduce(
    (a, b) => a + b, 0
  );

  const stats = useMemo(() => {
    if (!current || !current.sheet?.id) {
      return { percent: 0, matched: 0, total: current?.sheet.filas.length || 0 };
    }
    let matched = 0;
    const currentSheetValidation = validationData[String(current.sheet.id)] || {};
    
    current.sheet.filas.forEach((fila: any) => {
      const rowTotal = Object.values(currentSheetValidation[fila.id] || {}).reduce(
        (a: number, b: any) => a + Number(b), 0
      );
      if (rowTotal === fila.total) matched++;
    });
    
    return {
      percent: current.sheet.filas.length
        ? Math.round((matched / current.sheet.filas.length) * 100)
        : 0,
      matched,
      total: current.sheet.filas.length,
    };
  }, [current, validationData]);

  const isEverythingValid = stats.percent === 100;

  return {
    mirrorColumnTotals,
    mirrorGrandTotal,
    stats,
    isEverythingValid,
  };
};
