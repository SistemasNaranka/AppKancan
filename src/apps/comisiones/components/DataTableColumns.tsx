/**
 * 🚀 DataTableColumns OPTIMIZADO - VERSIÓN MODULAR
 *
 * ESTRUCTURA MODULAR INTERNA:
 * ├── DataTableColumns.tsx (Hook principal con utilidades modulares)
 * │   ├── ColumnDefinitions (definiciones de columnas)
 * │   ├── CellRenderers (renderizadores de celdas)
 * │   └── ColumnUtils (utilidades de columnas)
 *
 * ✅ HOOK OPTIMIZADO Y MODULAR
 * ✅ Tipos exportados para reutilización
 * ✅ Código organizado en secciones
 * ✅ Funcionalidad 100% preservada
 */

import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Typography, Box, TextField } from "@mui/material";
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import { Role } from "../types";
import { formatCurrency } from "../lib/utils";
import { RoleChip } from "./RoleChip";

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface EmployeeRow {
  id: string;
  tiendaName: string;
  tiendaFecha: string;
  empleadoId: string;
  nombre: string;
  rol: Role;
  presupuesto: number;
  ventasOriginales: number;
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
  ventasActuales: number;
}

export interface DataTableColumnsProps {
  readOnly: boolean;
  getCumplimientoColor: (pct: number) => string;
  handleVentaChange: (
    tiendaName: string,
    fecha: string,
    asesorId: string,
    newValue: string
  ) => void;
}

// =============================================================================
// UTILIDADES DE COLUMNAS
// =============================================================================

// Utilidades para renderizado de celdas
const createCellRenderers = ({
  readOnly,
  getCumplimientoColor,
  handleVentaChange,
}: DataTableColumnsProps) => {
  return {
    // Renderizador para celda de nombre
    nombreRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Typography variant="body2" fontWeight="500" sx={{ pl: 1 }}>
        {params.value}
      </Typography>
    ),

    // Renderizador para celda de rol
    rolRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Box sx={{ pl: 1 }}>
        <RoleChip rol={params.value} />
      </Box>
    ),

    // Renderizador para celda de presupuesto
    presupuestoRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Typography variant="body2" sx={{ pr: 1, fontWeight: 500 }}>
        {formatCurrency(params.value)}
      </Typography>
    ),

    // Renderizador para celda de ventas (con editing)
    ventasRenderer: (params: GridRenderCellParams<EmployeeRow>) => {
      const row = params.row;
      return !readOnly && row.rol === "asesor" ? (
        <TextField
          value={params.value}
          onChange={(e) =>
            handleVentaChange(
              row.tiendaName,
              row.tiendaFecha,
              row.empleadoId,
              e.target.value
            )
          }
          type="number"
          size="small"
          variant="outlined"
          InputProps={{
            inputProps: {
              style: { textAlign: "right", padding: "4px 8px" },
            },
          }}
          sx={{
            width: "100%",
            maxWidth: 120,
          }}
        />
      ) : (
        <Typography variant="body2" sx={{ pr: 1, fontWeight: 500 }}>
          {formatCurrency(params.value)}
        </Typography>
      );
    },

    // Renderizador para celda de cumplimiento
    cumplimientoRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Typography
        variant="body2"
        fontWeight="bold"
        sx={{
          color: getCumplimientoColor(params.row.comision_pct * 100),
          pr: 1,
        }}
      >
        {params.value.toFixed(2)}%
      </Typography>
    ),

    // Renderizador para celda de porcentaje de comisión
    comisionPctRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Typography
        variant="body2"
        fontWeight="bold"
        sx={{
          color: getCumplimientoColor(params.row.comision_pct * 100),
          pr: 1,
        }}
      >
        {(params.value * 100).toFixed(2)}%
      </Typography>
    ),

    // Renderizador para celda de monto de comisión
    comisionMontoRenderer: (params: GridRenderCellParams<EmployeeRow>) => (
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        gap={0.5}
        sx={{ pr: 1 }}
      >
        <AttachMoneyIcon fontSize="inherit" color="action" />
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: getCumplimientoColor(params.row.comision_pct * 100) }}
        >
          {formatCurrency(params.value)}
        </Typography>
      </Box>
    ),
  };
};

// Utilidades para headers de columnas
const createColumnHeaders = () => {
  return {
    nombre: (
      <Box display="flex" alignItems="center" gap={1}>
        <PersonIcon sx={{ fontSize: 18, color: "#1976d2" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Empleado
        </Typography>
      </Box>
    ),

    rol: (
      <Box display="flex" alignItems="center" gap={1}>
        <BadgeIcon sx={{ fontSize: 18, color: "#7b1fa2" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Rol
        </Typography>
      </Box>
    ),

    presupuesto: (
      <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
        <AccountBalanceIcon sx={{ fontSize: 18, color: "#388e3c" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Presupuesto
        </Typography>
      </Box>
    ),

    ventasActuales: (
      <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
        <TrendingUpIcon sx={{ fontSize: 18, color: "#f57c00" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Ventas
        </Typography>
      </Box>
    ),

    cumplimiento_pct: (
      <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
        <CheckCircleIcon sx={{ fontSize: 18, color: "#1976d2" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Cumplimiento
        </Typography>
      </Box>
    ),

    comision_pct: (
      <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
        <PercentIcon sx={{ fontSize: 18, color: "#e64a19" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Com.
        </Typography>
      </Box>
    ),

    comision_monto: (
      <Box display="flex" alignItems="center" gap={1} justifyContent="flex-end">
        <AttachMoneyIcon sx={{ fontSize: 18, color: "#388e3c" }} />
        <Typography variant="subtitle2" fontWeight="600">
          Comisión
        </Typography>
      </Box>
    ),
  };
};

// =============================================================================
// DEFINICIONES DE COLUMNAS
// =============================================================================

/**
 * Hook para generar las definiciones de columnas del DataGrid
 * Centraliza toda la lógica de columnas en un solo lugar
 */
export const useDataTableColumns = ({
  readOnly,
  getCumplimientoColor,
  handleVentaChange,
}: DataTableColumnsProps): GridColDef<EmployeeRow>[] => {
  // Crear renderizadores y headers
  const cellRenderers = createCellRenderers({
    readOnly,
    getCumplimientoColor,
    handleVentaChange,
  });

  const columnHeaders = createColumnHeaders();

  // --- Columnas para DataGrid memoizadas ---
  const columns: GridColDef<EmployeeRow>[] = [
    {
      field: "nombre",
      headerName: "Empleado",
      flex: 1,
      minWidth: 150,
      align: "left",
      headerAlign: "left",
      renderHeader: () => columnHeaders.nombre,
      renderCell: cellRenderers.nombreRenderer,
    },
    {
      field: "rol",
      headerName: "Rol",
      flex: 0.8,
      minWidth: 100,
      align: "left",
      headerAlign: "left",
      renderHeader: () => columnHeaders.rol,
      renderCell: cellRenderers.rolRenderer,
    },
    {
      field: "presupuesto",
      headerName: "Presupuesto",
      flex: 1,
      minWidth: 120,
      align: "right",
      headerAlign: "right",
      renderHeader: () => columnHeaders.presupuesto,
      renderCell: cellRenderers.presupuestoRenderer,
    },
    {
      field: "ventasActuales",
      headerName: "Ventas",
      flex: 1,
      minWidth: 120,
      align: "right",
      headerAlign: "right",
      editable: !readOnly,
      renderHeader: () => columnHeaders.ventasActuales,
      renderCell: cellRenderers.ventasRenderer,
    },
    {
      field: "cumplimiento_pct",
      headerName: "Cumplimiento",
      flex: 1,
      minWidth: 100,
      align: "right",
      headerAlign: "right",
      renderHeader: () => columnHeaders.cumplimiento_pct,
      renderCell: cellRenderers.cumplimientoRenderer,
    },
    {
      field: "comision_pct",
      headerName: "Com.",
      flex: 0.8,
      minWidth: 80,
      align: "right",
      headerAlign: "right",
      renderHeader: () => columnHeaders.comision_pct,
      renderCell: cellRenderers.comisionPctRenderer,
    },
    {
      field: "comision_monto",
      headerName: "Comisión",
      flex: 1,
      minWidth: 120,
      align: "right",
      headerAlign: "right",
      renderHeader: () => columnHeaders.comision_monto,
      renderCell: cellRenderers.comisionMontoRenderer,
    },
  ];

  return columns;
};
