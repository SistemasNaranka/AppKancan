// ============================================
// COMPONENTES UI PARA ENVIOSPAGE
// ============================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Stack,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { CheckCircle, Lock, Close, Visibility } from "@mui/icons-material";
import {
  MONO_FONT,
  getValidationStyles,
  getRowLockInfo,
} from "./EnviosPage.utils";

// ─────────────────────────────────────────────
// DebouncedSearchInput Component
// ─────────────────────────────────────────────
interface DebouncedSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  sx?: any;
  disabled?: boolean;
}

export const DebouncedSearchInput = ({
  value,
  onChange,
  placeholder,
  sx,
  disabled,
}: DebouncedSearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <TextField
      size="small"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      InputProps={{
        endAdornment: localValue ? (
          <InputAdornment position="end">
            <IconButton
              onClick={() => {
                setLocalValue("");
                onChange("");
              }}
              size="small"
              sx={{ color: "rgba(255,255,255,0.7)", p: 0.2 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        ...sx,
        "& .MuiOutlinedInput-root": {
          color: "white",
          "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
          "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
          "&.Mui-focused fieldset": { borderColor: "white" },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.3)",
            "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
          },
        },
        "& .MuiInputBase-input": {
          color: "white",
          "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          "&::placeholder": {
            color: "rgba(255,255,255,0.5)",
            opacity: 1,
          },
        },
      }}
    />
  );
};

// ─────────────────────────────────────────────
// MemoizedTableRow Component
// ─────────────────────────────────────────────
interface MemoizedTableRowProps {
  fila: any;
  currentSheetId: string;
  currentRef: string;
  rowCols: Record<string, number>;
  rowValidation: Record<
    string,
    number | { cantidad: number; barcodes: string[] }
  >;
  activeCell: { filaId: string; col: string; sheetId: string } | null;
  columns: string[];
  bloqueosActivos: any[];
  user: any;
  desmarcarTienda: (tiendaId: string, ref: string) => Promise<void>;
  intentarBloquear: (tiendaId: string, ref: string) => Promise<boolean>;
  setSnackbar: (info: any) => void;
  setActiveCell: (cell: any) => void;
}

export const MemoizedTableRow = React.memo(
  ({
    fila,
    currentSheetId,
    currentRef,
    rowCols,
    rowValidation,
    activeCell,
    columns,
    bloqueosActivos,
    user,
    desmarcarTienda,
    intentarBloquear,
    setSnackbar,
    setActiveCell,
  }: MemoizedTableRowProps) => {
    const mirrorRowTotal = Object.values(rowValidation).reduce(
      (a: number, b: any) =>
        a + (typeof b === "object" ? Number(b.cantidad || 0) : Number(b || 0)),
      0,
    );
    const rowComplete = mirrorRowTotal === fila.total && fila.total > 0;

    const { isLockedByMe, isLockedByOther, lockUserName } = getRowLockInfo(
      fila,
      currentRef,
      bloqueosActivos,
      user,
    );

    const handleToggleLock = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLockedByOther) {
        setSnackbar({
          open: true,
          message: `Esta tienda está siendo usada por ${lockUserName}`,
          severity: "warning",
        });
        return;
      }
      if (isLockedByMe) {
        await desmarcarTienda(String(fila.tienda?.id), currentRef);
      } else {
        const success = await intentarBloquear(
          String(fila.tienda?.id),
          currentRef,
        );
        if (!success)
          setSnackbar({
            open: true,
            message: "La tienda acaba de ser ocupada por alguien más",
            severity: "error",
          });
      }
    };

    return (
      <TableRow
        sx={{
          cursor: isLockedByOther ? "not-allowed" : "pointer",
          opacity: isLockedByOther ? 0.6 : 1,
          "&:hover": {
            bgcolor: isLockedByOther
              ? "transparent !important"
              : "#f0f4ff !important",
            "& td": { bgcolor: "inherit !important" },
            "& td:nth-of-type(2)": {
              borderLeft: isLockedByOther
                ? "3px solid transparent"
                : "3px solid #6366f1",
            },
          },
          bgcolor: isLockedByMe
            ? "rgba(56, 189, 248, 0.08)"
            : rowComplete && !isLockedByOther
              ? "rgba(209,250,229,0.12)"
              : "transparent",
          transition: "background-color 0.12s",
        }}
      >
        {/* Selector (Lock Button) */}
        <TableCell
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 2,
            bgcolor: isLockedByMe
              ? "#e0f2fe"
              : isLockedByOther
                ? "#f8fafc"
                : "#ffffff",
            borderRight: "1px solid #e2e8f0",
            p: 0,
            width: 44,
            textAlign: "center",
            borderLeft: "none",
          }}
        >
          <Tooltip
            title={
              isLockedByMe
                ? "Soltar tienda"
                : isLockedByOther
                  ? `Bloqueada por ${lockUserName}`
                  : "Trabajar esta tienda"
            }
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <Button
                onClick={handleToggleLock}
                disabled={isLockedByOther}
                sx={{
                  minWidth: 0,
                  width: 28,
                  height: 28,
                  borderRadius: "6px",
                  p: 0,
                  bgcolor: isLockedByMe ? "#38bdf8" : "transparent",
                  color: isLockedByMe ? "white" : "#cbd5e1",
                  border: isLockedByMe ? "none" : "2px dashed #cbd5e1",
                  "&:hover": {
                    bgcolor: isLockedByMe ? "#0284c7" : "#f1f5f9",
                    borderColor: "#94a3b8",
                    color: "#64748b",
                  },
                }}
              >
                {isLockedByMe ? (
                  <CheckCircle sx={{ fontSize: 18 }} />
                ) : isLockedByOther ? (
                  <Lock sx={{ fontSize: 16, color: "#ef4444" }} />
                ) : (
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 900 }}>
                    SEL
                  </Typography>
                )}
              </Button>
            </Box>
          </Tooltip>
        </TableCell>

        {/* Store name — sticky */}
        <TableCell
          sx={{
            fontWeight: 800,
            fontSize: "0.85rem",
            position: "sticky",
            left: 44,
            bgcolor: isLockedByMe
              ? "#e0f2fe"
              : rowComplete && !isLockedByOther
                ? "#f0fdf4"
                : isLockedByOther
                  ? "#f8fafc"
                  : "#ffffff",
            zIndex: 1,
            borderRight: "2px solid #e2e8f0",
            whiteSpace: "nowrap",
            color: isLockedByOther ? "#94a3b8" : "#334155",
            py: 0.5,
            borderLeft: isLockedByMe
              ? "3px solid #38bdf8"
              : "3px solid transparent",
            transition: "border-left-color 0.12s",
          }}
        >
          <Stack direction="row" spacing={0.4} alignItems="center">
            {rowComplete && !isLockedByOther && (
              <CheckCircle
                sx={{ fontSize: 11, color: "#22c55e", flexShrink: 0 }}
              />
            )}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                textDecoration: isLockedByOther ? "line-through" : "none",
              }}
            >
              {fila.tienda?.nombre || fila.tienda?.codigo || "—"}
            </span>
          </Stack>
        </TableCell>

        {/* Vertical cells */}
        {columns.map((col) => {
          const valRef = rowCols[col] || 0;
          const rawInput = rowValidation[col];
          const valInput =
            typeof rawInput === "object"
              ? rawInput?.cantidad || 0
              : rawInput || 0;
          const barcodesCount =
            typeof rawInput === "object" && Array.isArray(rawInput?.barcodes)
              ? rawInput.barcodes.length
              : 0;
          const vs = getValidationStyles(valRef, valInput);
          const isActive =
            activeCell &&
            String(activeCell.filaId) === String(fila.id) &&
            String(activeCell.col) === String(col) &&
            String(activeCell.sheetId) === currentSheetId;

          return (
            <TableCell
              key={col}
              id={`cell-${fila.id}-${col}`}
              align="center"
              tabIndex={isLockedByMe && valRef > 0 ? 0 : -1}
              onMouseDown={(e) => {
                if (valRef === 0) return;
                if (isLockedByOther) return;
                if (!isLockedByMe) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={() => {
                if (valRef === 0) return;
                if (isLockedByOther) return;
                if (!isLockedByMe) {
                  setSnackbar({
                    open: true,
                    message:
                      'Debes seleccionar la tienda (Clic en "SEL") para comenzar a escanear',
                    severity: "warning",
                  });
                  return;
                }
                setActiveCell({
                  filaId: String(fila.id),
                  col: String(col),
                  sheetId: currentSheetId,
                });
              }}
              onFocus={(e) => {
                if (valRef === 0) return;
                if (isLockedByOther) {
                  e.preventDefault();
                  e.target.blur();
                  return;
                }
                if (!isLockedByMe) {
                  e.preventDefault();
                  e.target.blur();
                  return;
                }
                setActiveCell({
                  filaId: String(fila.id),
                  col: String(col),
                  sheetId: currentSheetId,
                });
              }}
              onKeyDown={(e) => {
                if (valRef === 0) return;
                if (isLockedByOther) return;
                if (!isLockedByMe) {
                  setSnackbar({
                    open: true,
                    message:
                      'Debes seleccionar la tienda (Clic en "SEL") para comenzar a escanear',
                    severity: "warning",
                  });
                  return;
                }
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveCell({
                    filaId: String(fila.id),
                    col: String(col),
                    sheetId: currentSheetId,
                  });
                }
              }}
              sx={{
                py: 0.3,
                px: 0.5,
                cursor: valRef > 0 ? "pointer" : "not-allowed",
                opacity: valRef === 0 ? 0.3 : isLockedByOther ? 0.5 : 1,
                borderLeft: "1px solid #f1f5f9",
                bgcolor:
                  valRef === 0
                    ? "#f9fafb"
                    : isActive
                      ? "#e0f2fe"
                      : valInput > 0
                        ? vs.bgcolor
                        : "transparent",
                border: isActive
                  ? "4px solid #2563eb"
                  : "1px solid transparent",
                outline: "none",
                borderRadius: "6px",
                transition: "all 0.05s ease",
                "&:hover": {
                  bgcolor:
                    valRef === 0
                      ? "#f9fafb"
                      : isActive
                        ? "#dbeafe"
                        : valInput > 0
                          ? vs.bgcolor
                          : "#f8fafc",
                  filter: valRef > 0 ? "brightness(0.98)" : "none",
                },
                "&:focus": { outline: "none" },
                position: "relative",
                zIndex: isActive ? 10 : 1,
              }}
            >
              {/* REF (Reference) on top */}
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: "15px",
                  lineHeight: 1,
                  color: "#94a3b8",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {valRef || 0}
              </Typography>
              {/* ING (Scanned) on bottom */}
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: "25px",
                  lineHeight: 1,
                  fontWeight: 800,
                  color: valInput > 0 ? vs.color : "#cbd5e1",
                }}
              >
                {valInput || "—"}
              </Typography>
              {/* Exact indicator */}
              {vs.indicator === "exact" && valInput > 0 && (
                <CheckCircle
                  sx={{
                    fontSize: 12,
                    color: "#22c55e",
                    position: "absolute",
                    top: 1,
                    right: 1,
                  }}
                />
              )}
              {/* Badge de códigos de barra cuando hay barcodes */}
              {barcodesCount > 0 && (
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          mb: 0.5,
                          color: "white",
                        }}
                      >
                        CÓDIGOS ESCANEADOS
                      </Typography>
                      <Stack spacing={0.2}>
                        {Object.entries(
                          (rawInput as any)?.barcodes?.reduce(
                            (acc: Record<string, number>, bc: string) => {
                              acc[bc] = (acc[bc] || 0) + 1;
                              return acc;
                            },
                            {},
                          ) || {},
                        ).map(([bc, count]) => {
                          const c = count as number;
                          return (
                            <Typography
                              key={bc}
                              sx={{
                                fontFamily: MONO_FONT,
                                fontSize: "0.7rem",
                                color: "rgba(255,255,255,0.8)",
                              }}
                            >
                              {bc} {c > 1 ? `(x${c})` : ""}
                            </Typography>
                          );
                        })}
                      </Stack>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      bgcolor: "#1e3a8a",
                      color: "white",
                      borderRadius: "10px",
                      px: 0.5,
                      py: 0.15,
                      minWidth: 20,
                      textAlign: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.25,
                      "&:hover": {
                        bgcolor: "#1e40af",
                      },
                    }}
                  >
                    <Visibility sx={{ fontSize: 10 }} />
                    {barcodesCount}
                  </Box>
                </Tooltip>
              )}
            </TableCell>
          );
        })}

        {/* TOTAL */}
        <TableCell
          align="center"
          sx={{ borderLeft: "2px solid #e2e8f0", py: 0.2 }}
        >
          <Typography
            sx={{
              fontFamily: MONO_FONT,
              fontSize: "12px",
              lineHeight: 1,
              color: "#64748b",
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            {fila.total}
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO_FONT,
              fontSize: "20px",
              lineHeight: 1,
              fontWeight: 800,
              color:
                mirrorRowTotal === 0
                  ? "#cbd5e1"
                  : mirrorRowTotal === fila.total
                    ? "#15803d"
                    : mirrorRowTotal > fila.total
                      ? "#dc2626"
                      : "#d97706",
            }}
          >
            {mirrorRowTotal > 0 ? mirrorRowTotal : "—"}
          </Typography>
        </TableCell>
      </TableRow>
    );
  },
  (prev, next) => {
    if (prev.fila !== next.fila) return false;
    if (prev.currentSheetId !== next.currentSheetId) return false;
    if (prev.currentRef !== next.currentRef) return false;

    const wasActive =
      prev.activeCell?.filaId === String(prev.fila.id) &&
      prev.activeCell?.sheetId === prev.currentSheetId;
    const isNowActive =
      next.activeCell?.filaId === String(next.fila.id) &&
      next.activeCell?.sheetId === next.currentSheetId;
    if (
      wasActive &&
      isNowActive &&
      prev.activeCell?.col !== next.activeCell?.col
    )
      return false;
    if (wasActive !== isNowActive) return false;

    if (
      JSON.stringify(prev.rowValidation) !== JSON.stringify(next.rowValidation)
    )
      return false;
    if (JSON.stringify(prev.rowCols) !== JSON.stringify(next.rowCols))
      return false;

    const prevLock = prev.bloqueosActivos?.find(
      (b: any) =>
        String(b.tienda_id) === String(prev.fila.tienda?.id) &&
        String(b.referencia) === prev.currentRef,
    );
    const nextLock = next.bloqueosActivos?.find(
      (b: any) =>
        String(b.tienda_id) === String(next.fila.tienda?.id) &&
        String(b.referencia) === next.currentRef,
    );
    if (JSON.stringify(prevLock) !== JSON.stringify(nextLock)) return false;

    return true;
  },
);

// ─────────────────────────────────────────────
// CustomDay component for DatePicker
// ─────────────────────────────────────────────
import { Dayjs } from "dayjs";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { Badge } from "@mui/material";

interface CustomDayProps {
  day: Dayjs;
  outsideCurrentMonth: boolean;
  fechasConDatos: Record<string, "pendiente" | "enviado">;
  selected?: boolean;
  onClick?: () => void;
  onDaySelect: (day: Dayjs | Date) => void;
  isFirstVisibleCell: boolean;
  isLastVisibleCell: boolean;
  [key: string]: any;
}

export const CustomDay = ({
  day,
  outsideCurrentMonth,
  fechasConDatos,
  selected,
  onClick,
  onDaySelect,
  isFirstVisibleCell,
  isLastVisibleCell,
  ...other
}: CustomDayProps) => {
  const dateStr = day.format("YYYY-MM-DD");
  const estado = fechasConDatos[dateStr];

  const baseContent = (
    <PickersDay
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      selected={selected}
      onClick={onClick}
      onDaySelect={onDaySelect}
      isFirstVisibleCell={isFirstVisibleCell}
      isLastVisibleCell={isLastVisibleCell}
      {...other}
    />
  );

  if (estado && !outsideCurrentMonth) {
    if (estado === "enviado") {
      return (
        <Badge
          overlap="circular"
          badgeContent={
            <CheckCircle
              sx={{
                fontSize: 12,
                color: "#22c55e",
                bgcolor: "#ffffff",
              }}
            />
          }
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {baseContent}
        </Badge>
      );
    } else {
      return (
        <Badge
          color="warning"
          variant="dot"
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            "& .MuiBadge-badge": {
              width: 6,
              height: 6,
              minWidth: 6,
              right: 2,
              bottom: 2,
            },
          }}
        >
          {baseContent}
        </Badge>
      );
    }
  }

  return baseContent;
};
