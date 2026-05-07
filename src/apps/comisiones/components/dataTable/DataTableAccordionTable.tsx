import React, { useState, useCallback, useMemo } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, useMediaQuery, Chip, TableSortLabel } from "@mui/material";
import { Person as PersonIcon, Badge as BadgeIcon, AttachMoney as AttachMoneyIcon, TrendingUp as TrendingUpIcon, CheckCircle as CheckCircleIcon, Percent as PercentIcon, CalendarToday as CalendarTodayIcon, VpnKey as VpnKeyIcon } from "@mui/icons-material";
import { TiendaResumen, CommissionThreshold } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { formatProximaComision } from "../../lib/calculations.utils";
import { grey, blue } from "@mui/material/colors";

// IMPORTACIÓN DE TU LÓGICA EXTRAÍDA
import { 
  SortState, SortField, EmployeeRow, INITIAL_SORT_STATE, 
  getRowBackgroundColor, getRowHoverColor, processRowsWithSorting 
} from "./DataTableAccordion.utils";

interface DataTableAccordionTableProps {
  tienda: TiendaResumen;
  readOnly: boolean;
  getCumplimientoColor: (pct: number) => string;
  handleVentaChange: (tiendaName: string, fecha: string, asesorId: string, newValue: string) => void;
  thresholdConfig?: CommissionThreshold[];
}

export const DataTableAccordionTable: React.FC<DataTableAccordionTableProps> = ({ tienda, getCumplimientoColor, thresholdConfig }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  const [sortState, setSortState] = useState<SortState>(INITIAL_SORT_STATE);

  const handleSortChange = useCallback((field: SortField) => {
    setSortState((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  const processedRows = useMemo(() => {
    return processRowsWithSorting(tienda.empleados, sortState, {
      tienda: tienda.tienda,
      fecha: tienda.fecha,
    });
  }, [tienda.empleados, tienda.tienda, tienda.fecha, sortState, thresholdConfig]);

  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => row.presupuesto > 0 || row.ventasActuales > 0);
  }, [processedRows]);

  const commonCellProps = {
    fontWeight: 600,
    fontSize: isMobile ? "0.7rem" : "0.875rem",
    color: "#6b7280",
    whiteSpace: "nowrap",
  };

  const sortLabelProps = (field: SortField) => ({
    active: sortState.field === field,
    direction: sortState.field === field ? sortState.order : "asc" as const,
    onClick: () => handleSortChange(field),
    sx: {
      "& .MuiTableSortLabel-icon": { color: "#6b7280 !important" },
      "&.Mui-active .MuiTableSortLabel-icon": { color: "primary.main !important" },
      "&:hover": { color: "primary.main" },
    },
  });

  const renderSortHeader = (field: SortField, label: string, icon?: React.ReactNode) => (
    <TableSortLabel {...sortLabelProps(field)}>
      <Box display="flex" alignItems="center" gap={0.5}>
        {icon}
        {label}
      </Box>
    </TableSortLabel>
  );

  return (
    <Paper sx={{ width: "100%", maxWidth: "100%", borderRadius: 0, border: "1px solid #e0e0e0", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", margin: 0 }}>
      <TableContainer sx={{ maxWidth: "100%", width: "100%", overflowX: "auto" }}>
        <Table stickyHeader size="small" sx={{ minWidth: isMobile ? 420 : isTablet ? 580 : "auto", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...commonCellProps, position: "sticky", left: 0, zIndex: 3, width: isMobile ? 140 : 220 }}>
                {renderSortHeader("nombre", "Empleado", <Box display="flex" alignItems="center" gap={0.5}><VpnKeyIcon sx={{ fontSize: 14 }}/><PersonIcon sx={{ fontSize: 14 }}/></Box>)}
              </TableCell>
              <TableCell sx={{ ...commonCellProps, width: isMobile ? 70 : 100 }}>
                {renderSortHeader("rol", "Rol", <BadgeIcon sx={{ fontSize: 14 }}/>)}
              </TableCell>
              <TableCell align="center" sx={{ ...commonCellProps, width: isMobile ? 50 : 85 }}>
                {renderSortHeader("dias_laborados", "Días Labor", <CalendarTodayIcon sx={{ fontSize: 12 }}/>)}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 85 : 115 }}>
                {renderSortHeader("presupuesto", "Presupuesto", <AttachMoneyIcon sx={{ fontSize: 14 }}/>)}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 85 : 115 }}>
                {renderSortHeader("ventasActuales", "Ventas", <TrendingUpIcon sx={{ fontSize: 14 }}/>)}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 70 : 100 }}>
                {renderSortHeader("cumplimiento_pct", "Cumplimiento", <CheckCircleIcon sx={{ fontSize: 12 }}/>)}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 60 : 85 }}>
                {renderSortHeader("comision_pct", "Comisión", <PercentIcon sx={{ fontSize: 12 }}/>)}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 85 : 115 }}>
                {renderSortHeader("comision_monto", "Comisión")}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 85 : 115 }}>
                {renderSortHeader("proxima_venta", "Proxima Venta")}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 65 : 90 }}>
                {renderSortHeader("proxima_comision", "Prox. %Comision")}
              </TableCell>
              <TableCell align="right" sx={{ ...commonCellProps, width: isMobile ? 85 : 120 }}>
                {renderSortHeader("proximo_monto_comision", "Prox. Comisión")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row: EmployeeRow) => {
              const backgroundColor = getRowBackgroundColor(row.cumplimiento_pct / 100, thresholdConfig);
              const hoverColor = getRowHoverColor(row.cumplimiento_pct / 100, thresholdConfig);
              return (
                <TableRow key={row.id} sx={{ backgroundColor, "&:hover": { backgroundColor: hoverColor } }}>
                  <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "inherit" }}>
                    <Typography component="span" variant="body2" sx={{ fontWeight: 500, fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                      <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>{row.empleadoId}</Typography>
                      {" - "}{row.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.rol} size="small" color="primary" variant="outlined" sx={{ fontSize: isMobile ? "0.7rem" : "0.75rem", backgroundColor: blue[50], height: 20 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>{row.dias_laborados}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: getCumplimientoColor(row.comision_pct * 100) }}>
                    <Typography variant="body2">{formatCurrency(row.presupuesto)}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: getCumplimientoColor(row.comision_pct * 100) }}>
                    <Typography variant="body2">{formatCurrency(row.ventasActuales)}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: getCumplimientoColor(row.comision_pct * 100) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.cumplimiento_pct.toFixed(2)}%</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: getCumplimientoColor(row.comision_pct * 100) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{(row.comision_pct * 100).toFixed(2)}%</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: getCumplimientoColor(row.comision_pct * 100) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}><AttachMoneyIcon sx={{ fontSize: 14 }}/>{formatCurrency(row.comision_monto)}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: "#ffffff" }}>
                    <Typography variant="body2" sx={{ color: "#374151", fontWeight: 600 }}>
                      {row.proxima_venta !== undefined && row.proxima_venta !== null ? formatCurrency(row.proxima_venta) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: "#ffffff" }}>
                    {(() => {
                      const textoFormateado = formatProximaComision(row.proxima_comision);
                      const esMaxima = row.proxima_comision === "NN";
                      return (
                        <Typography component="span" variant="body2" sx={{ color: esMaxima ? "#666" : "#374151", fontWeight: 600, fontStyle: esMaxima ? "italic" : "normal" }}>
                          {textoFormateado}
                        </Typography>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="right" sx={{ backgroundColor: "#ffffff" }}>
                    <Typography variant="body2" sx={{ color: "#374151", fontWeight: 600 }}>
                      <AttachMoneyIcon sx={{ fontSize: 14 }}/>
                      {row.proximo_monto_comision !== undefined && row.proximo_monto_comision !== null ? formatCurrency(row.proximo_monto_comision) : "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredRows.length === 0 && (
        <Box sx={{ p: 3, textAlign: "center", color: "text.secondary", borderTop: "1px solid #e0e0e0" }}>
          <Typography variant="body2">No hay empleados con presupuesto o ventas para mostrar.</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DataTableAccordionTable;