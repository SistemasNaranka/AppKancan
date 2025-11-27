import React, { useCallback } from 'react';
import { EmployeeCommission } from '../types';
import { formatCurrency } from '../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TableRow, TableCell } from '@/components/ui/table';

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
  const getRoleBadgeVariant = useCallback((rol: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (rol) {
      case 'gerente':
        return 'default';
      case 'asesor':
        return 'secondary';
      case 'cajero':
        return 'outline';
      default:
        return 'outline';
    }
  }, []);

  /**
   * Obtiene el color del badge para el rol
   */
  const getRoleBadgeStyle = useCallback((rol: string): string => {
    switch (rol) {
      case 'gerente':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'asesor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cajero':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  /**
   * Obtiene el emoji del rol
   */
  const getRoleEmoji = useCallback((rol: string): string => {
    switch (rol) {
      case 'gerente':
        return '👔';
      case 'asesor':
        return '💼';
      case 'cajero':
        return '💳';
      default:
        return '👤';
    }
  }, []);

  /**
   * Obtiene el color del cumplimiento
   */
  const getCumplimientoColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return 'text-green-600';
    if (cumplimiento >= 100) return 'text-blue-600';
    if (cumplimiento >= 95) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  /**
   * Obtiene el emoji del cumplimiento
   */
  const getCumplimientoEmoji = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return '🎯';
    if (cumplimiento >= 100) return '✅';
    if (cumplimiento >= 95) return '⚠️';
    return '❌';
  }, []);

  /**
   * Maneja el cambio de ventas para asesores
   */
  const handleVentasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onVentasAsesorChange(empleado.id, value);
  }, [onVentasAsesorChange, empleado.id]);

  return (
    <TableRow className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50 transition-colors'}>
      {/* Nombre del Empleado */}
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getRoleEmoji(empleado.rol)}</span>
          <span className="font-medium text-gray-900">{empleado.nombre}</span>
        </div>
      </TableCell>

      {/* Rol */}
      <TableCell className="py-3">
        <Badge 
          className={getRoleBadgeStyle(empleado.rol)}
          variant="outline"
        >
          {empleado.rol.charAt(0).toUpperCase() + empleado.rol.slice(1)}
        </Badge>
      </TableCell>

      {/* Presupuesto */}
      <TableCell className="py-3 text-right">
        <span className="font-semibold text-gray-900">
          ${formatCurrency(empleado.presupuesto)}
        </span>
      </TableCell>

      {/* Ventas */}
      <TableCell className="py-3 text-right">
        {empleado.rol === 'asesor' ? (
          readOnly ? (
            <span className="font-semibold text-green-600">
              ${formatCurrency(ventasAsesorInput || empleado.ventas)}
            </span>
          ) : (
            <div className="flex items-center justify-end">
              <span className="text-gray-400 mr-1">$</span>
              <Input
                type="number"
                value={ventasAsesorInput || ''}
                onChange={handleVentasChange}
                className="w-24 text-right"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          )
        ) : (
          <span className="font-semibold text-green-600">
            ${formatCurrency(empleado.ventas)}
          </span>
        )}
      </TableCell>

      {/* Cumplimiento */}
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <span>{getCumplimientoEmoji(empleado.cumplimiento_pct)}</span>
          <span className={`font-bold ${getCumplimientoColor(empleado.cumplimiento_pct)}`}>
            {empleado.cumplimiento_pct.toFixed(1)}%
          </span>
        </div>
      </TableCell>

      {/* Porcentaje de Comisión */}
      <TableCell className="py-3 text-right">
        <span className="font-semibold text-blue-600">
          {empleado.comision_pct.toFixed(2)}%
        </span>
      </TableCell>

      {/* Monto de Comisión */}
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-green-500">💰</span>
          <span className="font-bold text-green-600">
            ${formatCurrency(empleado.comision_monto)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const EmployeeRow = React.memo(EmployeeRowComponent);
