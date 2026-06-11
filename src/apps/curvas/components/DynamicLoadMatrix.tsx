import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

import { getDefaultTiendas } from "../api/directus/read";
import type { Tienda } from "../types";

import type {
  ActiveCell,
  MatrixRowData,
  MatrixVariant,
  SnackbarMessage,
} from "./dynamicMatrix/matrix.types";
import {
  computeColumnTotals,
  computeGrandTotal,
  getRowTotal,
} from "./dynamicMatrix/matrixCalculations";
import { nextColumnName } from "./dynamicMatrix/columnHelpers";
import { useTiendasData } from "./dynamicMatrix/useTiendasData";
import { useSelectionRange } from "./dynamicMatrix/useSelectionRange";
import { useKeyboardNav } from "./dynamicMatrix/useKeyboardNav";
import { usePasteIntelligence } from "./dynamicMatrix/usePasteIntelligence";
import { useMatrixSync } from "./dynamicMatrix/useMatrixSync";
import { MatrixRow } from "./dynamicMatrix/MatrixRow";
import { MatrixHeader } from "./dynamicMatrix/MatrixHeader";
import { PasteConfirmDialog } from "./dynamicMatrix/PasteConfirmDialog";

export interface DynamicLoadMatrixHandle {
  addRow: () => void;
  addColumn: () => void;
  clearMatrix: () => void;
  referencia: string;
  setReferencia: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  grandTotal: number;
  type: MatrixVariant;
}

interface DynamicLoadMatrixProps {
  onCancel: () => void;
  onChange?: (data: any) => void;
  type: MatrixVariant;
  setSnackbar?: (snackbar: SnackbarMessage) => void;
  onTallaChange?: (oldTalla: string, newTalla: string, type: "curva" | "talla") => void;
}

const DynamicLoadMatrix = forwardRef<DynamicLoadMatrixHandle, DynamicLoadMatrixProps>(
  ({ onChange, type, setSnackbar, onTallaChange }, ref) => {
    const { tiendasLista, loadingTiendas } = useTiendasData();

    const [columns, setColumns] = useState<string[]>([
      "35", "36", "37", "38", "39", "40",
    ]);

    const initialRows: MatrixRowData[] = Array.from({ length: 40 }, (_, i) => ({
      id: (i + 1).toString(),
      name: "",
      values: {},
    }));

    const [rows, setRows] = useState<MatrixRowData[]>(initialRows);
    const [referencia, setReferencia] = useState("");
    const [color, setColor] = useState("");

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
    const [inputResetCounter, setInputResetCounter] = useState(0);

    const { selection, handleMouseDown, handleMouseEnter } = useSelectionRange(
      columns,
      setActiveCell,
    );

    useEffect(() => {
      if (type === "general") {
        setColumns(["01", "03", "05", "07", "09"]);
      } else {
        setColumns(["35", "36", "37", "38", "39", "40"]);
      }

      if (tiendasLista && tiendasLista.length > 0) {
        const defaultTiendas = getDefaultTiendas(tiendasLista);
        setRows(
          defaultTiendas.map((t: Tienda) => ({
            id: t.id,
            name: t.nombre,
            tiendaData: t,
            values: {},
          })),
        );
      } else if (
        rows.length === 0 ||
        (rows.length === 40 && rows[0].name === "")
      ) {
        setRows(
          Array.from({ length: 40 }, (_, i) => ({
            id: (i + 1).toString(),
            name: "",
            values: {},
          })),
        );
      }

      setActiveCell(null);
    }, [type, tiendasLista]);

    const getRowTotalCb = useCallback(getRowTotal, []);

    const columnTotals = useMemo(
      () => computeColumnTotals(rows, columns),
      [rows, columns],
    );

    const grandTotal = useMemo(
      () => computeGrandTotal(columnTotals),
      [columnTotals],
    );

    useMatrixSync({
      rows,
      columns,
      referencia,
      color,
      grandTotal,
      type,
      onChange,
    });

    const handleValueChange = (
      rowIndex: number,
      colName: string,
      value: string,
    ) => {
      const val = parseInt(value, 10) || 0;
      setRows((prevRows) =>
        prevRows.map((r, idx) =>
          idx === rowIndex
            ? { ...r, values: { ...r.values, [colName]: val } }
            : r,
        ),
      );
    };

    const addColumn = () => {
      const nextCol = nextColumnName(columns, type);
      setColumns([...columns, nextCol]);
    };

    const removeColumn = (colName: string) => {
      if (columns.length <= 1) return;
      setColumns(columns.filter((c) => c !== colName));
      setRows((prev) =>
        prev.map((r) => {
          const newValues = { ...r.values };
          delete newValues[colName];
          return { ...r, values: newValues };
        }),
      );
    };

    useEffect(() => {
      if (activeCell) {
        const refKey = `${activeCell.r}-${activeCell.c}`;
        const el = inputRefs.current[refKey];
        if (el && document.activeElement !== el) {
          el.focus();
          el.select();
        }
      }
    }, [activeCell]);

    const addRow = () => {
      const newRow: MatrixRowData = {
        id: Date.now().toString(),
        name: "",
        values: {},
      };

      let insertIndex = rows.length;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].name === "") {
          insertIndex = i;
          break;
        }
      }

      const newRows = [...rows];
      newRows.splice(insertIndex, 0, newRow);
      setRows(newRows);
    };

    const removeRow = (id: string) => {
      if (rows.length <= 1) return;
      setRows(rows.filter((r) => r.id !== id));
    };

    const clearMatrix = () => {
      setRows(rows.map((r) => ({ ...r, values: {} })));
    };

    const { handleKeyDown } = useKeyboardNav({
      rows,
      columns,
      inputRefs,
      setActiveCell,
    });

    const {
      handlePaste,
      confirmPasteOpen,
      setConfirmPasteOpen,
      pendingPasteData,
      confirmAutoColumns,
    } = usePasteIntelligence({
      rows,
      columns,
      tiendasLista,
      setRows,
      setColumns,
    });

    useImperativeHandle(
      ref,
      () => ({
        addRow,
        addColumn,
        clearMatrix,
        referencia,
        setReferencia,
        color,
        setColor,
        grandTotal,
        type,
      }),
      [addRow, addColumn, clearMatrix, referencia, color, grandTotal, type],
    );

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 2.5,
        }}
      >
        <TableContainer
          component={Paper}
          onPaste={(e) => {
            if (activeCell) {
              handlePaste(e, activeCell.r, activeCell.c);
            }
          }}
          sx={{
            flexGrow: 1,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            maxHeight: "calc(100vh - 220px)",
            bgcolor: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(8px)",
            overflow: "auto",
            position: "relative",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            "&:focus-within": {
              borderColor: "#4f46e5",
              boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.08)",
            },
            "&::-webkit-scrollbar": { width: 8, height: 8 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#cbd5e1",
              borderRadius: 4,
              "&:hover": { bgcolor: "#94a3b8" },
            },
          }}
        >
          <Table stickyHeader size="small">
            <MatrixHeader
              columns={columns}
              setColumns={setColumns}
              activeCell={activeCell}
              selection={selection}
              inputResetCounter={inputResetCounter}
              setInputResetCounter={setInputResetCounter}
              removeColumn={removeColumn}
              setSnackbar={setSnackbar}
              onTallaChange={onTallaChange}
              type={type}
            />
            <TableBody>
              {rows.map((row, rowIndex) => (
                <MatrixRow
                  key={row.id}
                  row={row}
                  rowIndex={rowIndex}
                  columns={columns}
                  activeCell={activeCell}
                  selection={selection}
                  tiendasLista={tiendasLista}
                  loadingTiendas={loadingTiendas}
                  getRowTotal={getRowTotalCb}
                  handleValueChange={handleValueChange}
                  handleKeyDown={handleKeyDown}
                  handleMouseDown={handleMouseDown}
                  handleMouseEnter={handleMouseEnter}
                  setActiveCell={setActiveCell}
                  removeRow={removeRow}
                  setRows={setRows}
                  inputRefs={inputRefs}
                />
              ))}

              <TableRow sx={{ position: "sticky", bottom: 0, zIndex: 30 }}>
                <TableCell
                  sx={{
                    bgcolor: "#f1f5f9",
                    color: "#475569",
                    fontWeight: 900,
                    py: 1.5,
                    position: "sticky",
                    left: 0,
                    zIndex: 40,
                  }}
                >
                  TOTALES POR {type === "general" ? "CURVA" : "TALLA"}
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    align="center"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#4f46e5",
                      fontWeight: 900,
                    }}
                  >
                    {columnTotals[col] || 0}
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{
                    bgcolor: "#4f46e5",
                    color: "white",
                    fontWeight: 900,
                    py: 1.5,
                    fontSize: "1rem",
                    position: "sticky",
                    right: 0,
                    zIndex: 40,
                  }}
                >
                  {grandTotal.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <PasteConfirmDialog
          open={confirmPasteOpen}
          onClose={() => setConfirmPasteOpen(false)}
          onConfirm={confirmAutoColumns}
          extraColumnsCount={
            (pendingPasteData?.newColumns.length || 0) - columns.length
          }
        />
      </Box>
    );
  },
);

export default DynamicLoadMatrix;
