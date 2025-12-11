import React, { useCallback } from "react";
import { EmployeeCommission } from "../types";
import { formatCurrency } from "../lib/utils";
import {
  Box,
  Typography,
  Chip,
  TextField,
  TableRow,
  TableCell,
  IconButton,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface EmployeeRowProps {
  /** Datos del empleado */
  empleado: EmployeeCommission & { ventasTemporales?: number };
  /** Índice para alternar colores de fila */
  index: number;
  /** Valor temporal de ventas del asesor */
  ventasAsesorInput: number;
  /** Callback para cambiar ventas de asesor */
  onVentasAsesorChange: (asesorId: string, value: number) => void;
  /** Si es true, el componente será de solo lectura */
  readOnly?: boolean;
}

/**
 * Componente que representa una fila individual de empleado en la tabla.
 * Maneja la visualización de datos del empleado y la edición de ventas para asesores.
 */
const EmployeeRowComponent: React.FC<EmployeeRowProps> = ({
  empleado,
  index,
  ventasAsesorInput,
  onVentasAsesorChange,
  readOnly = false,
}) => {
  const theme = useTheme();

  /**
   * Obtiene el color del badge para el rol
   */
  const getRoleBadgeColor = useCallback((rol: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (rol) {
      case "gerente":
        return "primary";
      case "asesor":
        return "secondary";
      case "cajero":
        return "info";
      default:
        return "default";
    }
  }, []);

  /**
   * Obtiene el icono del rol
   */
  const getRoleIcon = useCallback((rol: string) => {
    switch (rol) {
      case "gerente":
        return <PersonIcon sx={{ color: "text.secondary" }} />;
      case "asesor":
        return <WorkIcon sx={{ color: "text.secondary" }} />;
      case "cajero":
        return <CreditCardIcon sx={{ color: "text.secondary" }} />;
      default:
        return <PersonIcon sx={{ color: "text.secondary" }} />;
    }
  }, []);

  /**
   * Obtiene el color del cumplimiento basado en el porcentaje
   */
  const getCumplimientoColor = useCallback((cumplimiento: number): "success.main" | "primary.main" | "warning.main" | "error.main" => {
    if (cumplimiento >= 110) return "success.main"; // Verde fuerte
    if (cumplimiento >= 100) return "primary.main"; // Azul/Verde
    if (cumplimiento >= 95) return "warning.main"; // Naranja
    return "error.main"; // Rojo
  }, []);

  /**
   * Obtiene el color de fondo de la fila basado en el cumplimiento
   */
  const getRowBackgroundColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return "success.light"; // Sobresaliente
    if (cumplimiento >= 100) return "primary.light"; // Excelente
    if (cumplimiento >= 95) return "warning.light"; // Próximo Meta
    return "background.default"; // En Desarrollo
  }, []);

  /**
   * Maneja el cambio de ventas para asesores
   */
  const handleVentasChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      onVentasAsesorChange(empleado.id, value);
    },
    [onVentasAsesorChange, empleado.id]
  );

  return (
    <TableRow
      sx={{
        backgroundColor: getRowBackgroundColor(empleado.cumplimiento_pct),
        "&:hover": {
          backgroundColor: `${getRowBackgroundColor(empleado.cumplimiento_pct)} !important`,
          opacity: 0.9,
        },
        transition: "background-color 0.2s ease-in-out",
      }}
    >
      {/* Nombre del Empleado */}
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRoleIcon(empleado.rol)}
          <Typography variant="body2" fontWeight="500">
            {empleado.nombre}
          </Typography>
        </Box>
      </TableCell>

      {/* Rol */}
      <TableCell sx={{ py: 2 }}>
        <Chip
          label={empleado.rol.charAt(0).toUpperCase() + empleado.rol.slice(1)}
          size="small"
          variant="outlined"
          color={getRoleBadgeColor(empleado.rol)}
          sx={{ textTransform: "capitalize" }}
        />
      </TableCell>

      {/* Presupuesto */}
      <TableCell sx={{ py: 2, textAlign: 'right' }}>
        <Typography variant="body2" fontWeight="500">
          ${formatCurrency(empleado.presupuesto)}
        </Typography>
      </TableCell>

      {/* Ventas */}
      <TableCell sx={{ py: 2, textAlign: 'right' }}>
        {empleado.rol === "asesor" ? (
          readOnly ? (
            <Typography variant="body2" fontWeight="500">
              ${formatCurrency(ventasAsesorInput || empleado.ventas)}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">$</Typography>
              <TextField
                type="number"
                value={ventasAsesorInput || ""}
                onChange={handleVentasChange}
                size="small"
                variant="outlined"
                placeholder="0"
                inputProps={{
                  min: 0,
                  step: 0.01,
                  style: { textAlign: 'right', width: 100 }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: 32,
                  },
                }}
              />
            </Box>
          )
        ) : (
          <Typography variant="body2" fontWeight="500">
            ${formatCurrency(empleado.ventas)}
          </Typography>
        )}
      </TableCell>

      {/* Cumplimiento */}
      <TableCell sx={{ py: 2, textAlign: 'right' }}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: getCumplimientoColor(empleado.cumplimiento_pct) }}
        >
          {empleado.cumplimiento_pct.toFixed(2)}%
        </Typography>
      </TableCell>

      {/* Porcentaje de Comisión */}
      <TableCell sx={{ py: 2, textAlign: 'right' }}>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: getCumplimientoColor(empleado.cumplimiento_pct) }}
        >
          {(empleado.comision_pct * 100).toFixed(2)}%
        </Typography>
      </TableCell>

      {/* Monto de Comisión */}
      <TableCell sx={{ py: 2, textAlign: 'right' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <AttachMoneyIcon sx={{ color: getCumplimientoColor(empleado.cumplimiento_pct) }} />
          <Typography 
            variant="body2" 
            fontWeight="bold"
            sx={{ color: getCumplimientoColor(empleado.cumplimiento_pct) }}
          >
            ${formatCurrency(empleado.comision_monto)}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export const EmployeeRow = React.memo(EmployeeRowComponent);
