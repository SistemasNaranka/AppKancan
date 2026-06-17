import React, { useState } from "react";
import {
  TableRow,
  TableCell,
  Box,
  IconButton,
  Autocomplete,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  alpha,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import type { ActiveCell, MatrixRowData, SelectionRange } from "./matrix.types";
import type { Tienda } from "../../types";
import { stickyActionColumnStyle } from "./matrix.styles";

interface MatrixRowProps {
  row: MatrixRowData;
  rowIndex: number;
  columns: string[];
  activeCell: ActiveCell | null;
  selection: SelectionRange | null;
  tiendasLista: Tienda[];
  loadingTiendas: boolean;
  getRowTotal: (rowValues: Record<string, number>) => number;
  handleValueChange: (rowIndex: number, colName: string, value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, r: number, cName: string) => void;
  handleMouseDown: (r: number, cName: string) => void;
  handleMouseEnter: (r: number, cName: string) => void;
  setActiveCell: (c: ActiveCell | null) => void;
  removeRow: (id: string) => void;
  setRows: React.Dispatch<React.SetStateAction<MatrixRowData[]>>;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

export const MatrixRow = React.memo(
  ({
    row,
    rowIndex,
    columns,
    activeCell,
    selection,
    tiendasLista,
    loadingTiendas,
    getRowTotal,
    handleValueChange,
    handleKeyDown,
    handleMouseDown,
    handleMouseEnter,
    setActiveCell,
    removeRow,
    setRows,
    inputRefs,
  }: MatrixRowProps) => {
    const minR = selection ? Math.min(selection.startR, selection.endR) : -1;
    const maxR = selection ? Math.max(selection.startR, selection.endR) : -1;
    const isRowActive =
      activeCell?.r === rowIndex || (rowIndex >= minR && rowIndex <= maxR);
    const rowTotal = getRowTotal(row.values);

    const [tiendaOpen, setTiendaOpen] = useState(false);

    const isCellInSelection = (r: number, cIdx: number) => {
      if (!selection) return false;
      const minC = Math.min(selection.startCIdx, selection.endCIdx);
      const maxC = Math.max(selection.startCIdx, selection.endCIdx);
      return r >= minR && r <= maxR && cIdx >= minC && cIdx <= maxC;
    };

    return (
      <TableRow hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fbfcfd" } }}>
        <TableCell
          sx={{
            p: 0,
            borderRight: "1px solid #f1f5f9",
            bgcolor: isRowActive ? alpha("#10b981", 0.04) : "#ffffff",
            borderLeft: isRowActive ? "4px solid #10b981" : "none",
            transition: "background-color 0.15s ease",
            position: "sticky",
            left: 0,
            zIndex: 20,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <IconButton
              size="small"
              onClick={() => removeRow(row.id)}
              sx={{
                ml: 1,
                opacity: 0.2,
                "&:hover": { opacity: 1, color: "#ef4444" },
              }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Autocomplete
              fullWidth
              open={tiendaOpen}
              onOpen={() => setTiendaOpen(true)}
              onClose={() => setTiendaOpen(false)}
              options={tiendasLista}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.nombre
              }
              value={tiendasLista.find((t) => t.nombre === row.name) || null}
              onChange={(_, newValue) => {
                setRows((prev) => {
                  if (newValue) {
                    const updatedRow = {
                      ...row,
                      name: newValue.nombre,
                      tiendaData: newValue,
                    };
                    const nr = prev.filter((_, idx) => idx !== rowIndex);
                    let insertIndex = nr.length;
                    for (let i = 0; i < nr.length; i++) {
                      if (nr[i].name && nr[i].name > newValue.nombre) {
                        insertIndex = i;
                        break;
                      }
                      if (!nr[i].name && insertIndex === nr.length) {
                        insertIndex = i;
                      }
                    }
                    nr.splice(insertIndex, 0, updatedRow);
                    return nr;
                  } else {
                    const nr = [...prev];
                    nr[rowIndex] = { ...nr[rowIndex], name: "", tiendaData: null };
                    return nr;
                  }
                });
                setTiendaOpen(false);
              }}
              onFocus={() => setActiveCell(null)}
              loading={loadingTiendas}
              PaperComponent={({ children, ...props }) => (
                <Paper
                  {...props}
                  sx={{
                    mt: 1,
                    border: "2px solid #e2e8f0",
                    borderRadius: 3,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1,
                      bgcolor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.7rem" }}
                    >
                      Seleccionar Tienda
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setTiendaOpen(false)}
                      sx={{
                        color: "#94a3b8",
                        "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  {children}
                </Paper>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="Buscar tienda..."
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      disableUnderline: true,
                      startAdornment: (
                        <BusinessIcon
                          sx={{
                            fontSize: 16,
                            color: "text.disabled",
                            mr: 1,
                            ml: 1,
                          }}
                        />
                      ),
                      endAdornment: (
                        <>
                          {loadingTiendas ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: isRowActive ? 800 : 500,
                        color: isRowActive ? "#059669" : "#475569",
                        fontFamily: "'Inter', sans-serif",
                      },
                    },
                  }}
                />
              )}
              sx={{
                "& .MuiAutocomplete-inputRoot": { p: "4px 0" },
                "& .MuiAutocomplete-endAdornment": { top: "calc(50% - 11px)" },
              }}
            />
          </Box>
        </TableCell>

        {columns.map((col, colIndex) => {
          const isCellActive =
            activeCell?.r === rowIndex && activeCell?.c === col;
          const isInRange = isCellInSelection(rowIndex, colIndex);

          const minC = selection
            ? Math.min(selection.startCIdx, selection.endCIdx)
            : -1;
          const maxC = selection
            ? Math.max(selection.startCIdx, selection.endCIdx)
            : -1;

          const isTop = rowIndex === minR && isInRange;
          const isBottom = rowIndex === maxR && isInRange;
          const isLeft = colIndex === minC && isInRange;
          const isRight = colIndex === maxC && isInRange;

          return (
            <TableCell
              key={`${row.id}-${col}`}
              align="center"
              onMouseDown={() => handleMouseDown(rowIndex, col)}
              onMouseEnter={() => handleMouseEnter(rowIndex, col)}
              sx={{
                p: 0,
                position: "relative",
                userSelect: "none",
                bgcolor: isCellActive
                  ? "#ffffff"
                  : isInRange
                    ? alpha("#10b981", 0.1)
                    : "transparent",
                borderTop: isTop ? "2px solid #059669 !important" : undefined,
                borderBottom: isBottom ? "2px solid #059669 !important" : undefined,
                borderLeft: isLeft ? "2px solid #059669 !important" : undefined,
                borderRight: isRight
                  ? "2px solid #059669 !important"
                  : "1px solid #f1f5f9",
                boxShadow: isCellActive
                  ? "0 0 0 2px #059669, 0 4px 12px rgba(16, 185, 129, 0.2)"
                  : "none",
                zIndex: isCellActive ? 10 : isInRange ? 5 : 1,
                transition: "background-color 0.1s ease, box-shadow 0.1s ease",
              }}
            >
              <input
                ref={(el) => (inputRefs.current[`${rowIndex}-${col}`] = el)}
                type="text"
                value={row.values[col] || ""}
                placeholder="0"
                onChange={(e) => handleValueChange(rowIndex, col, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, rowIndex, col)}
                onFocus={() => {
                  if (activeCell?.r !== rowIndex || activeCell?.c !== col) {
                    setActiveCell({ r: rowIndex, c: col });
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(rowIndex, col);
                }}
                style={{
                  width: "100%",
                  height: "44px",
                  border: "none",
                  background: "transparent",
                  textAlign: "center",
                  fontWeight: (row.values[col] || 0) > 0 ? 800 : 400,
                  outline: "none",
                  fontSize: "0.9rem",
                  color:
                    isCellActive || (row.values[col] || 0) > 0
                      ? "#065f46"
                      : "#94a3b8",
                  transition: "color 0.1s ease",
                  cursor: "cell",
                  fontFamily: "'Inter', sans-serif",
                  position: "relative",
                  zIndex: 2,
                }}
              />
            </TableCell>
          );
        })}

        <TableCell
          align="center"
          sx={{
            fontWeight: 800,
            color: rowTotal > 0 ? "#1e293b" : alpha("#000", 0.2),
            fontSize: "0.85rem",
            ...stickyActionColumnStyle,
          }}
        >
          {rowTotal > 0 ? rowTotal.toLocaleString() : "0"}
        </TableCell>
      </TableRow>
    );
  },
  (prev, next) => {
    if (prev.row !== next.row) return false;

    const isRowInSelection = (r: number, sel: SelectionRange | null) => {
      if (!sel) return false;
      return (
        r >= Math.min(sel.startR, sel.endR) &&
        r <= Math.max(sel.startR, sel.endR)
      );
    };

    const wasTouched =
      isRowInSelection(prev.rowIndex, prev.selection) ||
      prev.activeCell?.r === prev.rowIndex;
    const isTouched =
      isRowInSelection(next.rowIndex, next.selection) ||
      next.activeCell?.r === next.rowIndex;

    if (wasTouched || isTouched) return false;

    if (prev.columns.length !== next.columns.length) return false;

    return true;
  },
);
