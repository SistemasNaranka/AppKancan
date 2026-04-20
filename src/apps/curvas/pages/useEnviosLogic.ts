// ============================================
// CUSTOM HOOKS PARA ENVIOSPAGE
// ============================================

import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  playBeep,
  checkIsLockedByOther,
  checkIsLockedByMe,
  cleanRefStr,
} from "./EnviosPage.utils";



// ─────────────────────────────────────────────
// useEnviosKeyboard - Manejo de teclado/escáner
// ─────────────────────────────────────────────
interface UseEnviosKeyboardProps {
  current: any | undefined;
  activeCell: { filaId: string; col: string; sheetId: string } | null;
  setActiveCell: (cell: any) => void;
  validationData: Record<
    string,
    Record<
      string,
      Record<string, number | { cantidad: number; barcodes: string[] }>
    >
  >;
  actualizarValorValidacion: (
    sheetId: string,
    filaId: string,
    col: string,
    val: number,
    codigoBarra?: string | null,
  ) => void;
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
      const currentRef = extractRef(current.sheet);
      const isLockedByMe = checkIsLockedByMe(
        activeCell.filaId,
        current.sheet.filas,
        bloqueosActivos,
        currentRef,
        user,
      );
      
      // Only focus if the row is locked by current user
      if (isLockedByMe) {
        const cellElement = document.getElementById(
          `cell-${activeCell.filaId}-${activeCell.col}`,
        );
        if (cellElement) {
          cellElement.scrollIntoView({ block: "nearest", inline: "nearest" });
          cellElement.focus();
        }
      }
    }
  }, [activeCell, current, bloqueosActivos, user, extractRef]);

  // Auto-cursor initialization when sheet changes
  useEffect(() => {
    if (current && current.sheet.id && current.sheet.filas.length > 0) {
      // Usar un ID único para la hoja para detectar cambios reales de pestaña
      const currentSheetId = String(current.sheet.id);
      const prevSheetId = activeCellRef.current?.sheetId;

      // SOLO inicializar si no hay una celda activa O si realmente cambiamos de hoja (ID distinto)
      if (!activeCellRef.current || String(prevSheetId) !== currentSheetId) {
        const currentRef = extractRef(current.sheet);
        let targetFilaId = null;
        let targetCol = current.columns[0];

        // Find first unlocked row
        for (const fila of current.sheet.filas) {
          const rowLock = bloqueosActivos?.find(
            (b: any) =>
              String(b.tienda_id) === String(fila.tienda?.id) &&
              String(b.referencia) === currentRef,
          );
          const lockUserId = rowLock ? String(rowLock.usuario_id) : null;
          const isLockedByOther =
            rowLock && user && String(lockUserId) !== String(user.id);

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
          const newActive = {
            filaId: String(targetFilaId),
            col: targetCol,
            sheetId: String(current.sheet.id!),
          };
          autoCursorRef.current = {
            filaId: String(targetFilaId),
            col: targetCol,
          };
          setActiveCell(newActive);
          activeCellRef.current = newActive;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.sheet?.id]); // Solo disparar cuando cambia el ID de la hoja

  // Main keyboard handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: any) => {

      const currentActiveCell = activeCellRef.current;
      if (!current || !currentActiveCell || !user) {

        return;
      }

      const currentRef = extractRef(current.sheet);

      // Check if current cell is locked by current user
      const isCurrentCellLockedByMe = checkIsLockedByMe(
        currentActiveCell.filaId,
        current.sheet.filas,
        bloqueosActivos,
        currentRef,
        user,
      );

      // Si no está bloqueado por ti, ignorar teclas de navegación (excepto Enter para escaneo)
      const isNavigationKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Tab";

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      const isRapidInput = timeSinceLastKey < 150;
      const shiftPressed = e.shiftKey;

      // Scanner input handling
      if (e.key === "Enter" || e.key === "Tab") {
        const scannedCode = bufferRef.current.trim();

        if (scannedCode.length > 2) {
          if (e.key === "Tab") e.preventDefault();

          const codeWithoutLeadingZeros = scannedCode.replace(/^0+/, "");
          const extractedRef = codeWithoutLeadingZeros.substring(0, 5);

           // Solo validar códigos que pertenezcan a la referencia actual
           const currentEntry = confirmedEntries[safeIndex];
           const currentEntryRef =
             (currentEntry.sheet as any).referencia || currentEntry.sheet.nombreHoja || "";
           const currentRefClean = cleanRefStr(currentEntryRef);


           // Verificar si el código pertenece a la referencia actual
           const belongsToCurrentRef =
             extractedRef === currentRefClean ||
             codeWithoutLeadingZeros.includes(currentRefClean) ||
             scannedCode.includes(currentRefClean);


           if (!belongsToCurrentRef) {
             // Código pertenece a otra referencia - rechazar
             playBeep("error");
             setSnackbar({
               open: true,
               message: `Código inválido: pertenece a otra referencia (${extractedRef})`,
               severity: "error",
             });
             bufferRef.current = "";
             lastKeyTimeRef.current = now;
             return;
           }

          const targetFilaId = String(currentActiveCell.filaId);
          const isLocked = checkIsLockedByMe(
            targetFilaId,
            current.sheet.filas,
            bloqueosActivos,
            currentRef,
            user,
          );


          if (!isLocked) {
            playBeep("error");
            setSnackbar({
              open: true,
              message:
                'Debes seleccionar la tienda (Clic en "SEL") para escanear',
              severity: "warning",
            });
            bufferRef.current = "";
            lastKeyTimeRef.current = now;
            return;
          }

          const targetCol = String(currentActiveCell.col);

           // Validar que el código contenga la talla correcta después de la referencia
           // Formato esperado: REFERENCIA(5) + TALLA(2) + EXTRA
           const expectedTalla = targetCol.padStart(2, '0'); // Siempre 2 dígitos: "01", "03", "10"


           // Extraer parte después de la referencia (posiciones 6+)
           const codeAfterReference = codeWithoutLeadingZeros.substring(5);


           // Extraer talla del código (primeros 2 dígitos después de referencia)
           const codeTalla = codeAfterReference.substring(0, 2);


           // Verificar si coincide con la talla esperada
           if (codeTalla !== expectedTalla) {
             playBeep("error");
             setSnackbar({
               open: true,
               message: `Código inválido, talla no coincide: código tiene ${codeTalla}, esperado ${expectedTalla}`,
               severity: "error",
             });
             bufferRef.current = "";
             lastKeyTimeRef.current = now;
             return;
           }

          const currentSheetValidation =
            validationData[String(current.sheet.id!)] || {};
          const currentValidation =
            currentSheetValidation[targetFilaId] || {};
          const existingVal = currentValidation[targetCol];
          const currentNum =
            typeof existingVal === "object"
              ? existingVal?.cantidad || 0
              : existingVal || 0;

          const row = current.sheet.filas.find(
            (f: any) => String(f.id) === targetFilaId,
          );
          const rowCols = row ? current.getRowColumns(row) : {};
          const refValue = rowCols[targetCol] || 0;
          const nuevoRecuento = currentNum + 1;

          if (refValue > 0 && nuevoRecuento > refValue) {
            playBeep("error");
            setSnackbar({
              open: true,
              message: `Excedido: ${targetCol} (${nuevoRecuento}/${refValue})`,
              severity: "warning",
            });
          } else {
            playBeep("success");

            actualizarValorValidacion(
              String(current.sheet.id!),
              targetFilaId,
              targetCol,
              1,
              codeWithoutLeadingZeros,
            );
            setSnackbar({
              open: true,
              message: `${targetCol}: ${nuevoRecuento}${refValue > 0 ? `/${refValue}` : ""}`,
              severity: "success",
            });
          }

          bufferRef.current = "";
          lastKeyTimeRef.current = now;
          return;
        } else {
          // Referencia no encontrada en lotes activos

          playBeep("error");
          setSnackbar({
            open: true,
            message: `Error: Código muy corto`,
            severity: "error",
          });
        }

        bufferRef.current = "";
        lastKeyTimeRef.current = now;
        return;
      }

      // Accumulate potential scanner input
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        e.key !== 'Enter' &&
        e.key !== 'Tab' &&
        e.key !== 'Escape' &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        if (!isRapidInput && timeSinceLastKey > 1000) {

          bufferRef.current = "";
        }
        bufferRef.current += e.key;

        lastKeyTimeRef.current = now;
        return;
      }

      // Navigation keys
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
          "Delete",
          "Backspace",
        ].includes(e.key)
      ) {
        if (e.key === "Tab") e.preventDefault();

        if (!isCurrentCellLockedByMe && isNavigationKey) {
          setSnackbar({
            open: true,
            message:
              'Debes seleccionar la tienda (Clic en "SEL") para comenzar a escanear',
            severity: "warning",
          });
          return;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const targetFilaId = String(currentActiveCell.filaId);
          const targetCol = String(currentActiveCell.col);

          if (
            !checkIsLockedByMe(
              targetFilaId,
              current.sheet.filas,
              bloqueosActivos,
              currentRef,
              user,
            )
          ) {
            playBeep("error");
            setSnackbar({
              open: true,
              message:
                "Debes seleccionar la tienda (Clic en 'SEL') para borrar",
              severity: "warning",
            });
            return;
          }

          playBeep("success");
          actualizarValorValidacion(
            String(current.sheet.id!),
            targetFilaId,
            targetCol,
            -1,
            null,
          );
          return;
        }

        const filas = current.sheet.filas;
        const cols = current.columns;
        const currentFilaIndex = filas.findIndex(
          (f: any) => String(f.id) === currentActiveCell.filaId,
        );
        const currentColIndex = cols.indexOf(currentActiveCell.col);
        let nextFilaId = currentActiveCell.filaId;
        let nextCol = currentActiveCell.col;
        let foundNext = false;

        if (e.key === "ArrowDown" || (e.key === "Tab" && !shiftPressed)) {
          if (currentColIndex < cols.length - 1) {
            nextCol = cols[currentColIndex + 1];
            foundNext = true;
          } else if (currentFilaIndex < filas.length - 1) {
            nextFilaId = filas[currentFilaIndex + 1].id;
            nextCol = cols[0];
            foundNext = true;
          }
        } else if (e.key === "ArrowUp" || (e.key === "Tab" && shiftPressed)) {
          if (currentColIndex > 0) {
            nextCol = cols[currentColIndex - 1];
            foundNext = true;
          } else if (currentFilaIndex > 0) {
            nextFilaId = filas[currentFilaIndex - 1].id;
            nextCol = cols[cols.length - 1];
            foundNext = true;
          }
        } else if (e.key === "ArrowRight") {
          if (currentColIndex < cols.length - 1) {
            nextCol = cols[currentColIndex + 1];
            foundNext = true;
          } else if (currentFilaIndex < filas.length - 1) {
            nextFilaId = filas[currentFilaIndex + 1].id;
            nextCol = cols[0];
            foundNext = true;
          }
        } else if (e.key === "ArrowLeft") {
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
          let nextFilaObj = filas.find(
            (f: any) => String(f.id) === String(nextFilaId),
          );
          // Skip if locked by other
          while (
            nextFilaObj &&
            checkIsLockedByOther(
              String(nextFilaId),
              filas,
              bloqueosActivos,
              currentRef,
              user,
            )
          ) {
            const nextRowIndex = filas.indexOf(nextFilaObj);
            if (shiftPressed) {
              if (nextRowIndex > 0) nextFilaId = filas[nextRowIndex - 1].id;
              else break;
            } else {
              if (nextRowIndex < filas.length - 1)
                nextFilaId = filas[nextRowIndex + 1].id;
              else break;
            }
            nextFilaObj = filas.find(
              (f: any) => String(f.id) === String(nextFilaId),
            );
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

          bufferRef.current = "";
          lastKeyTimeRef.current = now;
          return;
        }
      }

      // Clear buffer on Escape
      if (e.key === "Escape") {
        bufferRef.current = "";
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    current,
    activeCellRef,
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
  ]);

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

export const useEnviosValidation = ({
  current,
  validationData,
}: UseEnviosValidationProps) => {
  const mirrorColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    if (!current || !current.sheet?.id) return totals;

    const currentSheetValidation =
      validationData[String(current.sheet.id)] || {};
    current.columns.forEach((col: string) => {
      totals[col] = 0;
      current.sheet.filas.forEach((fila: any) => {
        const rawVal = currentSheetValidation[fila.id]?.[col];
        // Soporta número directo o objeto {cantidad, barcodes}
        const val =
          typeof rawVal === "object" ? rawVal?.cantidad || 0 : rawVal || 0;
        totals[col] += val;
      });
    });
    return totals;
  }, [current, validationData]);

  const mirrorGrandTotal = Object.values(mirrorColumnTotals).reduce(
    (a, b) => a + b,
    0,
  );

  const stats = useMemo(() => {
    if (!current || !current.sheet?.id) {
      return {
        percent: 0,
        matched: 0,
        total: current?.sheet.filas.length || 0,
      };
    }
    let matched = 0;
    const currentSheetValidation =
      validationData[String(current.sheet.id)] || {};

    current.sheet.filas.forEach((fila: any) => {
      const rowData = currentSheetValidation[fila.id] || {};
      const rowTotal = Object.values(rowData).reduce(
        (acc: number, val: any) => {
          const num = typeof val === "object" ? val?.cantidad || 0 : val || 0;
          return acc + Number(num);
        },
        0,
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
