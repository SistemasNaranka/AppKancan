import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from "@mui/material";
import { MemoizedTableRow } from "./EnviosPage.components";
import { MONO_FONT } from "./EnviosPage.utils";
import type { ConfirmedEntry } from "./EnviosPage.utils";

interface EnviosDataTableProps {
  current: ConfirmedEntry;
  validationData: Record<string, any>;
  validationMirrorTotals: Record<string, number>;
  validationMirrorGrandTotal: number;
  activeCell: any;
  bloqueosActivos: any;
  user: any;
  desmarcarTienda: any;
  intentarBloquear: any;
  setSnackbar: any;
  setActiveCell: any;
}

export const EnviosDataTable = ({
  current, validationData, validationMirrorTotals, validationMirrorGrandTotal,
  activeCell, bloqueosActivos, user, desmarcarTienda, intentarBloquear, setSnackbar, setActiveCell
}: EnviosDataTableProps) => {
  return (
    <TableContainer className="tour-curvas-scan" sx={{ flex: 1, overflow: "auto" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, bgcolor: "#f8fafc", width: 44, position: "sticky", left: 0, zIndex: 5, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", p: 0 }} />
            <TableCell sx={{ fontWeight: 800, bgcolor: "#f8fafc", width: 150, position: "sticky", left: 44, zIndex: 4, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", py: 0.5 }}>
              ESTABLECIMIENTO
            </TableCell>
            {current.columns.map((col: string) => (
              <TableCell key={col} align="center" sx={{ fontFamily: MONO_FONT, fontWeight: 900, bgcolor: "#f8fafc", fontSize: "1rem", borderBottom: "1px solid #e2e8f0", px: 1, minWidth: 70 }}>
                {col}
                <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, mt: -0.2 }}>REF / ING</Typography>
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: "#f8fafc", width: 60, borderLeft: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#64748b" }}>TOTAL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {current.sheet.filas.map((fila: any) => {
            const sheetId = String(current.sheet.id);
            const rowCols: any = {};
            (fila.columnas || []).forEach((c: any) => (rowCols[c.talla] = c.cantidad));
            const sheetValidation = validationData[sheetId] || {};
            const rowValidation = sheetValidation[fila.id] || sheetValidation[String(fila.tienda?.id)] || {};

            return (
              <MemoizedTableRow
                key={`${sheetId}-${fila.id}`}
                fila={fila}
                currentSheetId={sheetId}
                currentRef={current.ref}
                rowCols={rowCols}
                rowValidation={rowValidation}
                activeCell={activeCell}
                columns={current.columns}
                bloqueosActivos={bloqueosActivos}
                user={user}
                desmarcarTienda={desmarcarTienda}
                intentarBloquear={intentarBloquear}
                setSnackbar={setSnackbar}
                setActiveCell={setActiveCell}
              />
            );
          })}
          {/* Fila de Totales */}
          <TableRow sx={{ bgcolor: "#f8fafc", "& .MuiTableCell-root": { fontWeight: 900, py: 0.5, borderTop: "2px solid #e2e8f0" } }}>
            <TableCell sx={{ position: "sticky", left: 0, bgcolor: "#f8fafc", zIndex: 5, borderRight: "1px solid #e2e8f0" }} />
            <TableCell sx={{ position: "sticky", left: 44, bgcolor: "#f8fafc", zIndex: 4, borderRight: "1px solid #e2e8f0", color: "#475569", fontSize: "0.9rem", textTransform: "uppercase" }}>TOTALES:</TableCell>
            {current.columns.map((col: string) => {
              const refVal = current.columnTotals[col] || 0;
              const scanVal = validationMirrorTotals[col] || 0;
              const isComplete = refVal > 0 && scanVal === refVal;
              const isOver = refVal > 0 && scanVal > refVal;
              return (
                <TableCell key={col} align="center" sx={{ borderLeft: "1px solid #f1f5f9", bgcolor: isComplete ? "#f0fdf4" : "transparent", transition: "background-color 0.3s ease" }}>
                  <Stack spacing={0}>
                    <Typography sx={{ fontSize: "15px", color: isComplete ? "#16a34a" : "#3b82f6", fontWeight: 700, mb: 0.5 }}>{refVal}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: "25px", color: isOver ? "#ef4444" : isComplete ? "#15803d" : scanVal > 0 ? "#475569" : "#cbd5e1" }}>{scanVal || "—"}</Typography>
                  </Stack>
                </TableCell>
              );
            })}
            <TableCell align="center" sx={{ borderLeft: "1px solid #e2e8f0", bgcolor: validationMirrorGrandTotal === current.sheet.totalGeneral && current.sheet.totalGeneral > 0 ? "#f0fdf4" : "transparent" }}>
              <Stack spacing={0}>
                <Typography sx={{ fontSize: "12px", color: validationMirrorGrandTotal === current.sheet.totalGeneral && current.sheet.totalGeneral > 0 ? "#16a34a" : "#3b82f6", fontWeight: 800, mb: 0.2 }}>{current.sheet.totalGeneral}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "20px", color: validationMirrorGrandTotal > current.sheet.totalGeneral ? "#ef4444" : validationMirrorGrandTotal === current.sheet.totalGeneral && current.sheet.totalGeneral > 0 ? "#15803d" : validationMirrorGrandTotal > 0 ? "#1e293b" : "#cbd5e1" }}>
                  {validationMirrorGrandTotal > 0 ? validationMirrorGrandTotal : "—"}
                </Typography>
              </Stack>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};