import React from "react";
import {
  TableHead,
  TableRow,
  TableCell,
  Box,
  TextField,
  IconButton,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ActiveCell, MatrixVariant, SelectionRange, SnackbarMessage } from "./matrix.types";
import { headerCellStyle } from "./matrix.styles";
import { validateColumnRename } from "./columnHelpers";

interface MatrixHeaderProps {
  columns: string[];
  setColumns: React.Dispatch<React.SetStateAction<string[]>>;
  activeCell: ActiveCell | null;
  selection: SelectionRange | null;
  inputResetCounter: number;
  setInputResetCounter: React.Dispatch<React.SetStateAction<number>>;
  removeColumn: (colName: string) => void;
  setSnackbar?: (snackbar: SnackbarMessage) => void;
  onTallaChange?: (oldTalla: string, newTalla: string, type: "curva" | "talla") => void;
  type: MatrixVariant;
}

export const MatrixHeader: React.FC<MatrixHeaderProps> = ({
  columns,
  setColumns,
  activeCell,
  selection,
  inputResetCounter,
  setInputResetCounter,
  removeColumn,
  setSnackbar,
  onTallaChange,
  type,
}) => {
  const applyRename = (idx: number, value: string, col: string) => {
    const result = validateColumnRename(columns, idx, value);
    setInputResetCounter((prev) => prev + 1);

    if (!result.ok) {
      if (result.message) {
        setSnackbar?.({ open: true, message: result.message, severity: "warning" });
      }
      return;
    }

    if (result.newColumns && result.newName) {
      setColumns(result.newColumns);
      onTallaChange?.(col, result.newName, type === "general" ? "curva" : "talla");
    }
  };

  const restoreOriginal = (idx: number, col: string) => {
    const newColumns = [...columns];
    newColumns[idx] = col;
    setColumns(newColumns);
    setInputResetCounter((prev) => prev + 1);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell
          sx={{
            ...headerCellStyle,
            minWidth: 220,
            zIndex: 40,
            bgcolor: "#111827",
            transition: "all 0.3s",
            position: "sticky",
            left: 0,
          }}
        >
          ESTABLECIMIENTO / TIENDA
        </TableCell>

        {columns.map((col, idx) => {
          const minC = selection
            ? Math.min(selection.startCIdx, selection.endCIdx)
            : -1;
          const maxC = selection
            ? Math.max(selection.startCIdx, selection.endCIdx)
            : -1;
          const isColActive =
            activeCell?.c === col || (idx >= minC && idx <= maxC);

          return (
            <TableCell
              key={col}
              align="center"
              sx={{
                bgcolor: isColActive ? "#10b981" : "#0f172a",
                color: "#fff",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                py: 1.5,
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: 70,
                boxShadow: isColActive
                  ? "inset 0 -4px 0 rgba(255,255,255,0.8)"
                  : "none",
                transition:
                  "background-color 0.15s ease, box-shadow 0.15s ease",
                fontWeight: isColActive ? 900 : 600,
                zIndex: 35,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <TextField
                  size="small"
                  key={`col-${idx}-${col}-${inputResetCounter}`}
                  defaultValue={col}
                  onBlur={(e) => applyRename(idx, e.target.value, col)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      restoreOriginal(idx, col);
                      e.currentTarget.blur();
                    }
                  }}
                  inputProps={{
                    style: {
                      textAlign: "center",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      padding: "2px 4px",
                      height: "auto",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { border: "none" },
                      "&:hover fieldset": {
                        border: "1px solid rgba(255,255,255,0.3)",
                      },
                      "&.Mui-focused fieldset": {
                        border: "1px solid #10b981",
                      },
                    },
                    "& .MuiOutlinedInput-input": { padding: "2px 4px" },
                    minWidth: 35,
                    maxWidth: 45,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeColumn(col);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    color: alpha("#fff", 0.4),
                    "&:hover": { color: "#ef4444" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            </TableCell>
          );
        })}

        <TableCell
          align="center"
          sx={{
            ...headerCellStyle,
            minWidth: 100,
            position: "sticky",
            right: 0,
            zIndex: 40,
            bgcolor: "#0f172a",
          }}
        >
          TOTAL FILA
        </TableCell>
      </TableRow>
    </TableHead>
  );
};
