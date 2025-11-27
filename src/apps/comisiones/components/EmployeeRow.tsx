import React, { useCallback } from 'react';
import { EmployeeCommission } from '../types';
import { formatCurrency } from '../lib/utils';

interface EmployeeRowProps {
  /** Datos del empleado */
  empleado: EmployeeCommission & { ventasTemporales?: number };
  /** Índice para alternar colores de fila */
  index: number;
  /** Valor temporal de ventas del asesor */
  ventasAsesorInput: number;
  /** Callback para cambiar ventas de asesor */
  onVentasAsesorChange: (asesorId: string, value: number) => void;
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
 }) => {
  /**
   * Obtiene el color y estilo del badge del rol
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
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50 transition-colors'}>
      {/* Nombre del Empleado */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getRoleEmoji(empleado.rol)}</span>
          <span className="font-medium text-gray-900">{empleado.nombre}</span>
        </div>
      </td>

      {/* Rol */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeStyle(empleado.rol)}`}>
          {empleado.rol.charAt(0).toUpperCase() + empleado.rol.slice(1)}
        </span>
      </td>

      {/* Presupuesto */}
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-gray-900">
          ${formatCurrency(empleado.presupuesto)}
        </span>
      </td>

      {/* Ventas */}
      <td className="px-4 py-3 text-right">
        {empleado.rol === 'asesor' ? (
          <div className="flex items-center justify-end">
            <span className="text-gray-400 mr-1">$</span>
            <input
              type="number"
              value={ventasAsesorInput || ''}
              onChange={handleVentasChange}
              className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        ) : (
          <span className="font-semibold text-green-600">
            ${formatCurrency(empleado.ventas)}
          </span>
        )}
      </td>

      {/* Cumplimiento */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <span>{getCumplimientoEmoji(empleado.cumplimiento_pct)}</span>
          <span className={`font-bold ${getCumplimientoColor(empleado.cumplimiento_pct)}`}>
            {empleado.cumplimiento_pct.toFixed(1)}%
          </span>
        </div>
      </td>

      {/* Porcentaje de Comisión */}
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-blue-600">
          {empleado.comision_pct.toFixed(2)}%
        </span>
      </td>

      {/* Monto de Comisión */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-green-500">💰</span>
          <span className="font-bold text-green-600">
            ${formatCurrency(empleado.comision_monto)}
          </span>
        </div>
      </td>
    </tr>
  );
};

export const EmployeeRow = React.memo(EmployeeRowComponent);
