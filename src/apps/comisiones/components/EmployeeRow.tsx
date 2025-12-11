import React, { useCallback } from "react";
import { EmployeeCommission } from "../types";
import { formatCurrency } from "../lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
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
  /**
   * Obtiene el variant del Badge basado en el rol
   */
  const getRoleBadgeVariant = useCallback(
    (rol: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (rol) {
        case "gerente":
          return "default";
        case "asesor":
          return "secondary";
        case "cajero":
          return "outline";
        default:
          return "outline";
      }
    },
    []
  );

  /**
   * Obtiene el color del badge para el rol
   */
  const getRoleBadgeStyle = useCallback((rol: string): string => {
    switch (rol) {
      case "gerente":
        return "bg-gray-100 text-black border-gray-200";
      case "asesor":
        return "bg-gray-100 text-black border-gray-200";
      case "cajero":
        return "bg-gray-100 text-black border-gray-200";
      default:
        return "bg-gray-100 text-black border-gray-200";
    }
  }, []);

  /**
   * Obtiene el icono del rol (muted)
   */
  const getRoleIcon = useCallback((rol: string): JSX.Element => {
    switch (rol) {
      case "gerente":
        return <PersonIcon className="text-gray-400" />;
      case "asesor":
        return <WorkIcon className="text-gray-400" />;
      case "cajero":
        return <CreditCardIcon className="text-gray-400" />;
      default:
        return <PersonIcon className="text-gray-400" />;
    }
  }, []);

  /**
   * Obtiene el color del cumplimiento (fuerte para métricas de rendimiento)
   */
  const getCumplimientoColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return "text-emerald-700 font-bold";
    if (cumplimiento >= 100) return "text-green-700 font-bold";
    if (cumplimiento >= 95) return "text-orange-700 font-bold";
    return "text-red-700 font-bold";
  }, []);

  const getColorByCumplimiento = (cumplimiento: number): string => {
    if (cumplimiento >= 1.1) return "text-emerald-700 font-medium"; // verde fuerte
    if (cumplimiento >= 1.0) return "text-blue-700 font-medium"; // verde
    if (cumplimiento >= 0.95) return "text-yellow-700 font-medium"; // naranja
    return "text-black-700 font-medium"; // rojo
  };
  const getRowBackgroundColor = useCallback((comisionPct: number): string => {
    // comisionPct viene como decimal (0.01 = 1%)
    if (comisionPct >= 0.01) return "bg-emerald-50"; // ≥ 1.00%
    if (comisionPct >= 0.007) return "bg-blue-50"; // ≥ 0.70%
    if (comisionPct >= 0.0035) return "bg-yellow-50"; // ≥ 0.35%
    return "bg-white"; // < 0.35%
  }, []);

  /**
   * Obtiene el color de fondo de la fila basado en el cumplimiento
   */
  /* const getRowBackgroundColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return "bg-emerald-50"; // Sobresaliente
    if (cumplimiento >= 100) return "bg-blue-50"; // Excelente
    if (cumplimiento >= 95) return "bg-yellow-50"; // Próximo Meta
    return "bg-white-50"; // En Desarrollo
  }, []); */

  const getColorByComisionPct = (pct: number): string => {
    // pct viene como decimal — ej: 0.01 = 1%
    if (pct >= 0.01) return "text-emerald-700 font-medium"; // ≥ 1.00%
    if (pct >= 0.007) return "text-blue-700 font-medium"; // ≥ 0.70%
    if (pct >= 0.0035) return "text-yellow-700 font-medium"; // ≥ 0.35%
    return "text-gray-700 font-medium"; // < 0.35%
  };

  /**
   * Obtiene el color fuerte para métricas de rendimiento
   */
  const getPerformanceColor = useCallback((value: number): string => {
    if (value >= 1) return "text-emerald-700 font-bold";
    if (value >= 0.7) return "text-blue-700 font-bold";
    if (value >= 0.35) return "text-orange-700 font-bold";
    return "text-red-700 font-bold";
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
      className={`${getRowBackgroundColor(
        empleado.comision_pct
      )} hover:bg-opacity-80 transition-colors`}
    >
      {/* Nombre del Empleado */}
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          {getRoleIcon(empleado.rol)}
          <span className="font-medium text-black">{empleado.nombre}</span>
        </div>
      </TableCell>

      {/* Rol */}
      <TableCell className="py-3">
        <Badge
          className={`${getRoleBadgeStyle(empleado.rol)} text-black`}
          variant="outline"
        >
          {empleado.rol.charAt(0).toUpperCase() + empleado.rol.slice(1)}
        </Badge>
      </TableCell>

      {/* Presupuesto */}
      <TableCell className="py-3 text-right">
        <span className="font-medium text-black">
          ${formatCurrency(empleado.presupuesto)}
        </span>
      </TableCell>

      {/* Ventas */}
      <TableCell className="py-3 text-right">
        {empleado.rol === "asesor" ? (
          readOnly ? (
            <span className="font-medium text-black">
              ${formatCurrency(ventasAsesorInput || empleado.ventas)}
            </span>
          ) : (
            <div className="flex items-center justify-end">
              <span className="text-gray-400 mr-1">$</span>
              <Input
                type="number"
                value={ventasAsesorInput || ""}
                onChange={handleVentasChange}
                className="w-24 text-right"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          )
        ) : (
          <span className="font-medium text-black">
            ${formatCurrency(empleado.ventas)}
          </span>
        )}
      </TableCell>

      {/* Cumplimiento */}
      <TableCell className="py-3 text-right">
        <span
          className={getColorByCumplimiento(empleado.cumplimiento_pct / 100)}
        >
          {empleado.cumplimiento_pct.toFixed(2)}%
        </span>
      </TableCell>

      {/* Porcentaje de Comisión */}
      <TableCell className="py-3 text-right">
        <span className={getColorByComisionPct(empleado.comision_pct)}>
          {(empleado.comision_pct * 100).toFixed(2)}%
        </span>
      </TableCell>

      {/* Monto de Comisión */}
      <TableCell className="py-3 text-right">
        <div
          className={`flex items-center justify-end gap-1 ${getColorByComisionPct(
            empleado.comision_pct
          )}`}
        >
          <AttachMoneyIcon />
          <span>${formatCurrency(empleado.comision_monto)}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const EmployeeRow = React.memo(EmployeeRowComponent);
