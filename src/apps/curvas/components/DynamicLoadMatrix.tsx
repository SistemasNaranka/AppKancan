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
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popper,
  Fade,
  Zoom,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BusinessIcon from "@mui/icons-material/Business";

// API
import { getTiendas, getDefaultTiendas } from "../api/directus/read";
import { Tienda } from "../types";

export interface DynamicLoadMatrixHandle {
  addRow: () => void;
  addColumn: () => void;
  clearMatrix: () => void;
  referencia: string;
  setReferencia: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  grandTotal: number;
  type: "general" | "producto_a" | "producto_b";
}

interface DynamicLoadMatrixProps {
  onCancel: () => void;
  onChange?: (data: any) => void;
  type: "general" | "producto_a" | "producto_b";
}

const stickyActionColumnStyle = {
  position: "sticky",
  right: 0,
  bgcolor: "rgba(248, 250, 252, 0.8)",
  zIndex: 20, // Raised to stay above cell highlights
  boxShadow: "-4px 0 8px rgba(0,0,0,0.03)",
  borderLeft: "1px solid #e2e8f0",
};

const headerCellStyle = {
  bgcolor: "#1e293b",
  color: "white",
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.05em",
  py: 1.5,
  border: "1px solid rgba(255,255,255,0.1)",
};

const MemoizedMatrixRow = React.memo(
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
  }: any) => {
    const minR = selection ? Math.min(selection.startR, selection.endR) : -1;
    const maxR = selection ? Math.max(selection.startR, selection.endR) : -1;
    const isRowActive =
      activeCell?.r === rowIndex || (rowIndex >= minR && rowIndex <= maxR);
    const rowTotal = getRowTotal(row.values);

    // Estado local para controlar si el autocomplete de esta fila está abierto
    const [tiendaOpen, setTiendaOpen] = useState(false);

    // Helpers to detect selection boundaries
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
            bgcolor: isRowActive ? alpha("#10b981", 0.04) : "#ffffff", // Solid white to hide background bleed
            borderLeft: isRowActive ? "4px solid #10b981" : "none",
            transition: "background-color 0.15s ease",
            position: "sticky",
            left: 0,
            zIndex: 20, // Stay above scrolling cells horizontally
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
              value={
                tiendasLista.find((t: any) => t.nombre === row.name) || null
              }
              onChange={(_, newValue) => {
                setRows((prev: any[]) => {
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
                    nr[rowIndex] = {
                      ...nr[rowIndex],
                      name: "",
                      tiendaData: null,
                    };
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
                  {/* Botón de cerrar en la parte superior */}
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
                      sx={{
                        fontWeight: 700,
                        color: "#64748b",
                        fontSize: "0.7rem",
                      }}
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
        {columns.map((col: string, colIndex: number) => {
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
              onMouseDown={() => {
                handleMouseDown(rowIndex, col);
              }}
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
                borderBottom: isBottom
                  ? "2px solid #059669 !important"
                  : undefined,
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
                onChange={(e) =>
                  handleValueChange(rowIndex, col, e.target.value)
                }
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
    // Custom comparator to prevent row re-renders if selection/active cell didn't touch it
    if (prev.row !== next.row) return false;

    // Check if row changed bounds in selection or activeCell
    const isRowInSelection = (r: number, sel: any) => {
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

    // Check if total changed (but rows values change triggers row change, so it's already caught)
    // Same format columns
    if (prev.columns.length !== next.columns.length) return false;

    return true; // Skip render!
  },
);

/**
 * Plantilla de Carga Dinámica Profesional
 * Implementa "Paste Intelligence" y cálculos en tiempo real.
 * Ahora optimizada para ser la vista principal.
 */
const DynamicLoadMatrix = forwardRef<
  DynamicLoadMatrixHandle,
  DynamicLoadMatrixProps
>(({ onChange, type }, ref) => {
  // ── ESTADO ──────────────────────────────────────────

  // Lista de tiendas desde DB
  const [tiendasLista, setTiendasLista] = useState<Tienda[]>([]);
  const [loadingTiendas, setLoadingTiendas] = useState(false);

  // Columnas (Tallas/Curvas) - Resetear o cargar según tipo
  const [columns, setColumns] = useState<string[]>([
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
  ]);

  // Generar 40 filas iniciales
  const initialRows = Array.from({ length: 40 }, (_, i) => ({
    id: (i + 1).toString(),
    name: "",
    values: {},
  }));

  // Filas (Establecimientos)
  const [rows, setRows] = useState<any[]>(initialRows);

  const [referencia, setReferencia] = useState("");
  const [color, setColor] = useState("");

  // Fetch tiendas on mount
  useEffect(() => {
    const fetchTiendas = async () => {
      setLoadingTiendas(true);
      try {
        const data = await getTiendas();
        setTiendasLista(data);
      } catch (error) {
        console.error("Error fetching tiendas:", error);
      } finally {
        setLoadingTiendas(false);
      }
    };
    fetchTiendas();
  }, []);

  // Refs para navegación tipo Excel
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seguimiento de celda activa para pegado global
  const [activeCell, setActiveCell] = useState<{ r: number; c: string } | null>(
    null,
  );

  // Selección de Rango (Tipo Excel)
  const [selection, setSelection] = useState<{
    startR: number;
    startCIdx: number;
    endR: number;
    endCIdx: number;
    isSelecting: boolean;
  } | null>(null);

  // Estado para "Paste Intelligence"
  const [confirmPasteOpen, setConfirmPasteOpen] = useState(false);
  const [pendingPasteData, setPendingPasteData] = useState<{
    newRows: any[];
    newColumns: string[];
  } | null>(null);

  // Reiniciar estado si el tipo cambia dramáticamente
  useEffect(() => {
    if (type === "general") {
      setColumns(["01", "03", "05", "07", "09"]);
    } else {
      setColumns(["35", "36", "37", "38", "39", "40"]);
    }

    // Si ya tenemos tiendas, las cargamos automáticamente (usando la configuración de la API)
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
      // Solo poner filas vacías si no hay tiendas (posiblemente aún cargando)
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

  // ── CÁLCULOS EN TIEMPO REAL ─────────────────────────

  // Total por fila
  const getRowTotal = useCallback((rowValues: Record<string, number>) => {
    return Object.values(rowValues).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0,
    );
  }, []);

  // Totales por columna - Filtrar para incluir solo lo que se enviará (con tienda y >0)
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    columns.forEach((col) => {
      totals[col] = rows.reduce((acc, row) => {
        const rowTotal = Object.values(row.values).reduce(
          (sum: number, v) => sum + (Number(v) || 0),
          0 as number,
        );
        const isValid = rowTotal > 0 && row.name && row.name.trim() !== "";
        return acc + (isValid ? Number(row.values[col]) || 0 : 0);
      }, 0);
    });
    return totals;
  }, [rows, columns]);

  // Gran Total (Suma de totales de columnas filtradas)
  const grandTotal = useMemo(() => {
    return Object.values(columnTotals).reduce((a, b) => a + b, 0);
  }, [columnTotals]);

  // ── VALIDACIÓN Y SANITIZACIÓN ────────────────────────

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

  // ── HANDLERS DE ESTRUCTURA ──────────────────────────

  const addColumn = () => {
    const lastCol = columns[columns.length - 1];
    const nextCol = !isNaN(Number(lastCol))
      ? (Number(lastCol) + 1).toString()
      : "NUEVA";
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

  // Auto-enfocar cuando la celda activa cambia
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
    // Crear nueva fila vacía
    const newRow = { id: Date.now().toString(), name: "", values: {} };

    // Encontrar la posición correcta para insertar manteniendo el orden alfabético
    // Las filas vacías (name === '') van al final
    let insertIndex = rows.length;

    // Buscar la primera fila cuyo nombre sea mayor alfabéticamente que ''
    // Como name está vacío, lo insertamos después de todas las filas con nombre
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].name === "") {
        insertIndex = i;
        break;
      }
    }

    // Insertar en la posición encontrada
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

  // ── LÓGICA DE SELECCIÓN DE RANGO (MOUSE) ───────────

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
        return {
          ...prev,
          endR: r,
          endCIdx: columns.indexOf(cName),
        };
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    setSelection((prev) =>
      prev?.isSelecting ? { ...prev, isSelecting: false } : prev,
    );
  };

  // Limpiar selección al hacer click fuera
  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [selection]);

  // ── NAVEGACIÓN TIPO EXCEL ──────────────────────────

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

    // Enfocar después del render
    setTimeout(() => {
      const refKey = `${nextR}-${nextCName}`;
      inputRefs.current[refKey]?.focus();
      inputRefs.current[refKey]?.select();
    }, 10);
  };

  const handlePaste = (
    e: React.ClipboardEvent,
    startRowIndex: number,
    startColName: string,
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");

    // Obtener líneas, preservando las vacías para mantener el orden
    const allLines = pasteData.split(/\r?\n/);

    // Filtrar solo líneas con contenido para procesar
    const lines = allLines.filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      return;
    }

    let newRows = [...rows];
    let tempColumns = [...columns];
    let needsNewDialog = false;
    let totalValuesPasted = 0;

    const startColIdx = tempColumns.indexOf(startColName);
    if (startColIdx === -1) {
      return;
    }

    // Detectar si los datos tienen nombres de tiendas o son solo números
    // Analizamos la primera línea para determinar el formato
    const firstLineValues = lines[0].split("\t");
    const isFirstValueNumeric =
      firstLineValues.length > 0 && !isNaN(Number(firstLineValues[0].trim()));

    // Si el primer valor es numérico, asumimos que TODOS los datos son solo valores
    // y que se deben pegar empezando desde la primera columna
    const effectiveStartColIdx = isFirstValueNumeric ? 0 : startColIdx;

    // Procesar cada línea
    lines.forEach((line, lineIdx) => {
      const values = line.split("\t");

      if (values.length === 0) return;

      // Calcular el índice de fila objetivo
      // Usamos lineIdx para mantener el orden secuencial desde la fila inicial
      let targetRowIdx = startRowIndex + lineIdx;
      let dataValueStartIndex = 0;

      // Solo buscar tienda si el primer valor NO es numérico
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

      // Asegurar que haya suficientes filas
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

      // Pegar los valores numéricos
      // Si los datos son solo números (sin nombres de tienda), pegamos desde el inicio
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

        if (!isNaN(numVal) && numVal > 0) {
          totalValuesPasted++;
        }

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

  // Ref para evitar ciclos infinitos si el padre no memoiza bien el onChange
  const lastPayloadRef = useRef<string>("");

  // ── SINCRONIZACIÓN DEBOUNCED CON EL PADRE ───────────
  useEffect(() => {
    if (!onChange) return;

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const isGeneral = type === "general";
      const dataKey = isGeneral ? "curvas" : "tallas";
      const totalsKey = isGeneral ? "totalesPorCurva" : "totalesPorTalla";

      const payload = {
        id: `sheet-${referencia || "NUEVA"}`,
        nombreHoja: referencia || "",
        filas: rows
          .filter((r) => {
            const rowTotal = Object.values(r.values).reduce(
              (sum: number, v) => sum + (Number(v) || 0),
              0 as number,
            );
            return rowTotal > 0 && r.name && r.name.trim() !== "";
          })
          .map((r) => ({
            id: r.tiendaData?.id || r.id,
            tienda: {
              id: r.tiendaData?.id || r.id,
              nombre: r.name || "Sin Nombre",
              codigo: r.tiendaData?.codigo || r.id,
              zona: r.tiendaData?.region || "Principal",
            },
            [dataKey]: Object.entries(r.values).reduce(
              (acc, [k, v]) => ({
                ...acc,
                [k]: {
                  valor: Number(v) || 0,
                  esCero: (Number(v) || 0) === 0,
                  esMayorQueCero: (Number(v) || 0) > 0,
                },
              }),
              {},
            ),
            total: Object.values(r.values).reduce(
              (sum: number, v: any) => sum + (Number(v) || 0),
              0,
            ),
          })),
        [isGeneral ? "curvas" : "tallas"]: columns,
        [totalsKey]: columns.reduce(
          (acc, c) => ({
            ...acc,
            [c]: rows.reduce((sum, r) => sum + (Number(r.values[c]) || 0), 0),
          }),
          {},
        ),
        totalGeneral: grandTotal,
        estado: "borrador",
        referencia: referencia,
        referenciaBase: referencia,
        ...(!isGeneral
          ? {
              metadatos: {
                referencia: referencia || "",
                color: color || "UNICO",
                imagen: "",
                proveedor: "MANUAL",
                precio: 0,
                linea: type === "producto_a" ? "BOLSOS" : "ZAPATOS",
              },
            }
          : {}),
      };

      const currentPayloadStr = JSON.stringify({
        rows: rows.map((r) => ({ id: r.id, values: r.values, name: r.name })),
        columns,
        referencia,
        color,
        grandTotal,
        type,
      });

      if (lastPayloadRef.current !== currentPayloadStr) {
        lastPayloadRef.current = currentPayloadStr;
        onChange(payload);
      }
    }, 400); // Debounce de 400ms

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rows, columns, referencia, color, grandTotal, onChange, type]);

  // Expose controls to parent via ref
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
      {/* Matrix Container */}
      <TableContainer
        component={Paper}
        onPaste={(e) => {
          // Solo activar Paste Intelligence si hay una celda de tallas activa
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
                      ...headerCellStyle,
                      minWidth: 70,
                      bgcolor: isColActive ? "#10b981" : "#0f172a",
                      color: "#fff",
                      boxShadow: isColActive
                        ? "inset 0 -4px 0 rgba(255,255,255,0.8)"
                        : "none",
                      transition:
                        "background-color 0.15s ease, box-shadow 0.15s ease",
                      fontWeight: isColActive ? 900 : 600,
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
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
                      {col}
                      <IconButton
                        size="small"
                        onClick={() => removeColumn(col)}
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
          <TableBody>
            {rows.map((row, rowIndex) => (
              <MemoizedMatrixRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                activeCell={activeCell}
                selection={selection}
                tiendasLista={tiendasLista}
                loadingTiendas={loadingTiendas}
                getRowTotal={getRowTotal}
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

            {/* Totals Footer Row */}
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
                  sx={{ bgcolor: "#f1f5f9", color: "#4f46e5", fontWeight: 900 }}
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

      <Dialog
        open={confirmPasteOpen}
        onClose={() => setConfirmPasteOpen(false)}
        TransitionComponent={Zoom}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "#4f46e5",
            fontWeight: 900,
          }}
        >
          <ErrorOutlineIcon color="primary" />
          PASTE INTELLIGENCE
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: "#334155", mt: 1 }}>
            Los datos superan las columnas actuales. ¿Deseas crear las{" "}
            {(pendingPasteData?.newColumns.length || 0) - columns.length}{" "}
            columnas adicionales automáticamente?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setConfirmPasteOpen(false)}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmAutoColumns}
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 900, px: 4, bgcolor: "#4f46e5" }}
          >
            Sí, Crear y Pegar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default DynamicLoadMatrix;
