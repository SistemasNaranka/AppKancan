import React, { useState, useMemo, useCallback } from "react";
import { TiendaResumen, Role, DirectusCargo } from "../types";
import { formatCurrency } from "../lib/utils";
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Paper,
  TextField,
  Typography,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Person as PersonIcon,
  Work as WorkIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as AttachMoneyIcon,
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  EmojiEvents,
  ThumbUp,
  Insights,
  RemoveCircleOutline,
} from "@mui/icons-material";
import { blue, green, orange, grey, red, teal } from "@mui/material/colors";

interface DataTableProps {
  /** Lista de tiendas con sus datos */
  tiendas: TiendaResumen[];
  /** Lista de cargos para ordenamiento */
  cargos?: DirectusCargo[];
  /** Mes actualmente seleccionado */
  selectedMonth: string;
  /** Callback para actualizar ventas */
  onVentasUpdate: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
  /** Si es true, el componente será de solo lectura */
  readOnly?: boolean;
  /** Estado de expansión de tiendas */
  expandedTiendas?: Set<string>;
  /** Callback para cambiar estado de expansión */
  onToggleAllStores?: () => void;
  /** Filtro de rol actualmente aplicado */
  filterRol?: Role | "all";
}

// Tipo para la fila de empleado
interface EmployeeRow {
  id: string; // Para DataGrid key
  tiendaName: string;
  tiendaFecha: string; // Para identificar el record de venta
  empleadoId: string; // ID del empleado
  nombre: string;
  rol: Role;
  presupuesto: number;
  ventasOriginales: number; // Ventas reportadas originalmente
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
  ventasActuales: number;
}

/**
 * Componente de Tabla Material-UI DataGrid
 * Mantiene la estructura organizada por tienda
 */
const DataTableComponent: React.FC<DataTableProps> = ({
  tiendas,
  cargos = [],
  selectedMonth,
  onVentasUpdate,
  readOnly = false,
  filterRol,
}) => {
  // --- Estados para inputs temporales de ventas ---
  const [ventasInputs, setVentasInputs] = useState<Record<string, number>>({});

  // --- Handlers ---
  const handleVentaChange = useCallback(
    (tiendaName: string, fecha: string, asesorId: string, newValue: string) => {
      const val = parseFloat(newValue);
      const numericVal = isNaN(val) ? 0 : val;
      const key = `${tiendaName}|${fecha}|${asesorId}`;

      setVentasInputs((prev) => ({
        ...prev,
        [key]: numericVal,
      }));

      // Encontramos la tienda actual para obtener sus ventas actuales
      const tiendaActual = tiendas.find(
        (t) => t.tienda === tiendaName && t.fecha === fecha
      );

      if (tiendaActual) {
        // Construimos el mapa de ventas actualizado para esta tienda
        const ventasPorAsesorUpdated: Record<string, number> = {};

        // Llenamos con valores actuales (del prop)
        tiendaActual.empleados.forEach(e => {
          ventasPorAsesorUpdated[e.id] = e.ventas;
        });

        // Sobreescribimos con inputs locales pendientes
        ventasPorAsesorUpdated[asesorId] = numericVal;

        // Recalcular total tienda
        const totalVentasTienda = Object.values(ventasPorAsesorUpdated).reduce((a, b) => a + b, 0);

        onVentasUpdate(tiendaName, fecha, totalVentasTienda, ventasPorAsesorUpdated);
      }
    },
    [tiendas, onVentasUpdate]
  );

  // --- Helpers renderizado ---
  const getRoleIcon = (rol: Role) => {
    switch (rol) {
      case "gerente": return <PersonIcon fontSize="small" color="action" />;
      case "asesor": return <WorkIcon fontSize="small" color="action" />;
      case "cajero": return <CreditCardIcon fontSize="small" color="action" />;
      default: return <PersonIcon fontSize="small" color="action" />;
    }
  };

  const getRoleColor = (rol: Role): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (rol) {
      case "gerente": return "primary";
      case "asesor": return "secondary";
      case "cajero": return "info";
      default: return "default";
    }
  };

  const getCumplimientoColor = (pct: number) => {
    if (pct >= 110) return green[700];
    if (pct >= 100) return blue[700];
    if (pct >= 95) return orange[700];
    return red[700];
  };

  const getCumplimientoBadge = (c: number) => {
    if (c >= 110)
      return (
        <span
          style={{
            color: green[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <EmojiEvents sx={{ fontSize: 18 }} /> Excelente desempeño
        </span>
      );

    if (c >= 100)
      return (
        <span
          style={{
            color: blue[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ThumbUp sx={{ fontSize: 18 }} /> Muy buen trabajo
        </span>
      );

    if (c >= 95)
      return (
        <span
          style={{
            color: orange[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Insights sx={{ fontSize: 18 }} /> Buen progreso
        </span>
      );

    return (
      <span
        style={{
          color: grey[700],
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <RemoveCircleOutline sx={{ fontSize: 18 }} /> Sin comisión
      </span>
    );
  };

  // --- Columnas para DataGrid ---
  const columns: GridColDef<EmployeeRow>[] = [
    {
      field: 'nombre',
      headerName: 'Empleado',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Typography variant="body2" fontWeight="500">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'rol',
      headerName: 'Rol',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Chip
          icon={getRoleIcon(params.value)}
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          size="small"
          variant="outlined"
          color={getRoleColor(params.value)}
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: 'presupuesto',
      headerName: 'Presupuesto',
      flex: 1,
      minWidth: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Typography variant="body2">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'ventasActuales',
      headerName: 'Ventas',
      flex: 1,
      minWidth: 120,
      align: 'right',
      editable: !readOnly,
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => {
        const row = params.row;
        return !readOnly && row.rol === "asesor" ? (
          <TextField
            value={params.value}
            onChange={(e) =>
              handleVentaChange(row.tiendaName, row.tiendaFecha, row.empleadoId, e.target.value)
            }
            type="number"
            size="small"
            variant="outlined"
            InputProps={{
              inputProps: {
                style: { textAlign: "right", padding: "4px 8px" }
              }
            }}
            sx={{
              width: "100%",
              maxWidth: 120
            }}
          />
        ) : (
          <Typography variant="body2">
            {formatCurrency(params.value)}
          </Typography>
        );
      },
    },
    {
      field: 'cumplimiento_pct',
      headerName: 'Cumplimiento',
      flex: 1,
      minWidth: 100,
      align: 'center',
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: getCumplimientoColor(params.value) }}
        >
          {params.value.toFixed(2)}%
        </Typography>
      ),
    },
    {
      field: 'comision_pct',
      headerName: '% Com.',
      flex: 0.8,
      minWidth: 80,
      align: 'right',
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: getCumplimientoColor(params.row.cumplimiento_pct) }}
        >
          {(params.value * 100).toFixed(2)}%
        </Typography>
      ),
    },
    {
      field: 'comision_monto',
      headerName: '$ Comisión',
      flex: 1,
      minWidth: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={0.5}>
          <AttachMoneyIcon fontSize="inherit" color="action" />
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      ),
    },
  ];

  if (tiendas.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No hay datos para mostrar con los filtros actuales.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tiendas.map((tienda) => {
        // Convertir empleados de la tienda a filas para DataGrid
        const storeRows: EmployeeRow[] = tienda.empleados.map((emp, index) => {
          const inputKey = `${tienda.tienda}|${tienda.fecha}|${emp.id}`;
          const ventaTemp = ventasInputs[inputKey];
          const ventasActuales = ventaTemp !== undefined ? ventaTemp : emp.ventas;

          return {
            id: `${tienda.tienda}-${tienda.fecha}-${emp.id}`, // ID único para DataGrid
            tiendaName: tienda.tienda,
            tiendaFecha: tienda.fecha,
            empleadoId: emp.id,
            nombre: emp.nombre,
            rol: emp.rol,
            presupuesto: emp.presupuesto,
            ventasOriginales: emp.ventas,
            cumplimiento_pct: emp.cumplimiento_pct,
            comision_pct: emp.comision_pct,
            comision_monto: emp.comision_monto,
            ventasActuales: ventasActuales,
          };
        });

        return (
          <Accordion key={`${tienda.tienda}-${tienda.fecha}`} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${tienda.tienda}-content`}
              id={`panel-${tienda.tienda}-header`}
              sx={{
                backgroundColor: 'action.hover',
                '&.Mui-expanded': {
                  backgroundColor: 'action.selected',
                },
                px: { xs: 1, md: 2 },
                py: { xs: 1, md: 1.5 }
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={{ xs: 1, md: 2 }}
                width="100%"
              >
                <StoreIcon
                  color="action"
                  sx={{ fontSize: { xs: 20, md: 24 }, flexShrink: 0 }}
                />
                <Box sx={{
                  minWidth: 0,
                  flex: 1,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: { xs: 0.5, md: 0 }
                }}>
                  <Typography
                    variant={{ xs: "body1", md: "h6" }}
                    fontWeight="bold"
                    sx={{
                      color: "grey.900",
                      fontSize: { xs: "1rem", md: "1.25rem" },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {tienda.tienda}
                  </Typography>
                  
                  {/* Métricas de la tienda - Responsive */}
                  <Box
                    sx={{
                      display: { xs: 'flex', md: 'flex' },
                      flexWrap: { xs: 'wrap', md: 'wrap' },
                      gap: { xs: 1, md: 1.4 },
                      fontSize: { xs: '0.75rem', md: '0.85rem' },
                      color: 'grey.700',
                      mt: { xs: 0.5, md: 0 },
                      ml: { xs: 0, md: 2 }
                    }}
                  >
                    <span>
                      Ppto: {formatCurrency(tienda.presupuesto_tienda)}
                    </span>
                    <span>|</span>
                    <span>Ventas: {formatCurrency(tienda.ventas_tienda)}</span>
                    <span>|</span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: { xs: '0.75rem', md: '0.85rem' },
                        color: 'grey.700',
                      }}
                    >
                      Cumpl:
                    </span>
                    <span
                      style={{
                        color: getCumplimientoColor(tienda.cumplimiento_tienda_pct),
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', md: '0.85rem' },
                      }}
                    >
                      {tienda.cumplimiento_tienda_pct.toFixed(1)}%
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: { xs: '0.7rem', md: '0.85rem' }
                    }}>
                      {getCumplimientoBadge(tienda.cumplimiento_tienda_pct)}
                    </span>
                  </Box>
                </Box>
                <Box sx={{
                  textAlign: "right",
                  ml: "auto",
                  minWidth: { xs: "100px", md: "400px" },
                  flexShrink: 0
                }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: "green",
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: { xs: "0.8rem", md: "1rem" }
                    }}
                  >
                    <AttachMoneyIcon sx={{ fontSize: { xs: 14, md: 20 } }} />
                    {formatCurrency(tienda.total_comisiones)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                  >
                    ({tienda.empleados.length} empleados)
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Paper sx={{ width: '100%' }}>
                <DataGrid
                  rows={storeRows}
                  columns={columns}
                  disableRowSelectionOnClick
                  autoHeight
                  slots={{
                    pagination: null,
                  }}
                  sx={{
                    border: 0,
                    width: '100%',
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f5f5f5',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      display: 'none',
                    },
                  }}
                />
              </Paper>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export const DataTable = React.memo(DataTableComponent);
