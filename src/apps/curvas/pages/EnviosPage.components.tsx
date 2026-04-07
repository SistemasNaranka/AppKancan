// ============================================
// COMPONENTES UI PARA ENVIOSPAGE
// ============================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material";
import { CheckCircle, Lock } from "@mui/icons-material";
import {
  BRAND,
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
}

export const DebouncedSearchInput = ({
  value,
  onChange,
  placeholder,
  sx,
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
      label="Referencia"
      size="small"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      sx={sx}
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
  rowValidation: Record<string, number>;
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
      (a: number, b: any) => a + Number(b),
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
            fontWeight: 600,
            fontSize: "0.74rem",
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
          const valInput = rowValidation[col] || 0;
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
              tabIndex={isLockedByOther ? -1 : 0}
              onClick={() => {
                if (!isLockedByMe) {
                  setSnackbar({
                    open: true,
                    message:
                      'Debes seleccionar la tienda (Clic en "SEL") para editar',
                    severity: "warning",
                  });
                  if (!isLockedByOther)
                    setActiveCell({
                      filaId: String(fila.id),
                      col: String(col),
                      sheetId: currentSheetId,
                    });
                  return;
                }
                setActiveCell({
                  filaId: String(fila.id),
                  col: String(col),
                  sheetId: currentSheetId,
                });
              }}
              onFocus={() => {
                if (isLockedByOther) return;
                setActiveCell({
                  filaId: String(fila.id),
                  col: String(col),
                  sheetId: currentSheetId,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isLockedByMe) {
                    setSnackbar({
                      open: true,
                      message:
                        'Debes seleccionar la tienda (Clic en "SEL") para editar',
                      severity: "warning",
                    });
                    return;
                  }
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
                cursor: "pointer",
                borderLeft: "1px solid #f1f5f9",
                bgcolor: isActive
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
                  bgcolor: isActive
                    ? "#dbeafe"
                    : valInput > 0
                      ? vs.bgcolor
                      : "#f8fafc",
                  filter: "brightness(0.98)",
                },
                "&:focus": { outline: "none" },
                position: "relative",
                zIndex: isActive ? 10 : 1,
              }}
            >
              {/* REF */}
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: "15px",
                  lineHeight: 1.2,
                  color: valRef > 0 ? "#64748b" : "#cbd5e1",
                  fontWeight: 600,
                }}
              >
                {valRef}
              </Typography>
              {/* ING */}
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontSize: "24px",
                  lineHeight: 1.2,
                  fontWeight: valInput > 0 ? 900 : 500,
                  color: valInput > 0 ? vs.color : "#94a3b8",
                  mt: -0.1,
                }}
              >
                {valInput || (valRef > 0 ? "—" : "")}
              </Typography>
              {/* Exact indicator */}
              {vs.indicator === "exact" && valInput > 0 && (
                <CheckCircle
                  sx={{
                    fontSize: 7,
                    color: "#22c55e",
                    position: "absolute",
                    top: 1,
                    right: 1,
                  }}
                />
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
              fontSize: "15px",
              lineHeight: 1.2,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            {fila.total}
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO_FONT,
              fontSize: "24px",
              lineHeight: 1.2,
              fontWeight: 900,
              mt: -0.1,
              color:
                mirrorRowTotal === 0
                  ? "#94a3b8"
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
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { Badge } from "@mui/material";

interface CustomDayProps extends Omit<PickersDayProps<any>, "onDaySelect"> {
  fechasConDatos: Record<string, "pendiente" | "enviado">;
}

export const CustomDay = ({
  day,
  outsideCurrentMonth,
  fechasConDatos,
  ...other
}: CustomDayProps) => {
  const dateStr = day.format("YYYY-MM-DD");
  const estado = fechasConDatos[dateStr];

  let content = <PickersDay {...{ day, outsideCurrentMonth, ...other }} />;

  if (estado && !outsideCurrentMonth) {
    if (estado === "enviado") {
      content = (
        <Badge
          overlap="circular"
          badgeContent={
            <CheckCircle
              sx={{
                fontSize: 12,
                color: "#22c55e",
                bgcolor: "white",
                borderRadius: "50%",
              }}
            />
          }
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {content}
        </Badge>
      );
    } else {
      content = (
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
          {content}
        </Badge>
      );
    }
  }

  return content;
};
