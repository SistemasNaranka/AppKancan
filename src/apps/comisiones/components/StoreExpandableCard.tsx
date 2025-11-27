import React, { useState, useCallback, useMemo } from 'react';
import { TiendaResumen } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmployeeRow } from './EmployeeRow';
import { VentasEditor } from './VentasEditor';
import { formatCurrency } from '../lib/utils';

interface StoreExpandableCardProps {
  /** Datos de la tienda a renderizar */
  tienda: TiendaResumen;
  /** Estado de expansión de la tienda */
  isExpanded: boolean;
  /** Callback para cambiar el estado de expansión */
  onToggleExpand: () => void;
  /** Callback para actualizar ventas */
  onVentasUpdate: (tienda: string, fecha: string, ventas_tienda: number, ventas_por_asesor: Record<string, number>) => void;
  /** Estado temporal de ventas de la tienda */
  ventasTiendaInput: number;
  /** Callback para cambiar ventas de tienda temporal */
  onVentasTiendaChange: (value: number) => void;
  /** Estado temporal de ventas por asesor */
  ventasAsesorInput: Record<string, number>;
  /** Callback para cambiar ventas de asesor temporal */
  onVentasAsesorChange: (asesorId: string, value: number) => void;
}

/**
 * Componente que representa una tienda expandible con sus empleados.
 * Maneja la visualización, expansión y edición de datos de una tienda específica.
 */
const StoreExpandableCardComponent: React.FC<StoreExpandableCardProps> = ({
   tienda,
   isExpanded,
   onToggleExpand,
   onVentasUpdate,
   ventasTiendaInput,
   onVentasTiendaChange,
   ventasAsesorInput,
   onVentasAsesorChange,
 }) => {
  /**
   * Formatea el color del cumplimiento según el porcentaje
   */
  const getCumplimientoColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return 'text-green-600';
    if (cumplimiento >= 100) return 'text-blue-600';
    if (cumplimiento >= 95) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  /**
   * Formatea el badge de cumplimiento para mostrar visualmente el estado
   */
  const getCumplimientoBadge = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return '🎯 Excelente';
    if (cumplimiento >= 100) return '✅ Cumplido';
    if (cumplimiento >= 95) return '⚠️ Cerca';
    return '❌ Bajo';
  }, []);

  /**
   * Memoized empleados para evitar recálculos innecesarios
   */
  const empleadosConVentas = useMemo(() => {
    return tienda.empleados.map(empleado => ({
      ...empleado,
      ventasTemporales: ventasAsesorInput[empleado.id] ?? empleado.ventas
    }));
  }, [tienda.empleados, ventasAsesorInput]);

  /**
   * Maneja el guardado de ventas
   */
  const handleSaveVentas = useCallback(() => {
    onVentasUpdate(
      tienda.tienda,
      tienda.fecha,
      ventasTiendaInput,
      Object.fromEntries(
        Object.entries(ventasAsesorInput).map(([asesorId, valor]) => [
          asesorId,
          valor
        ])
      )
    );
  }, [onVentasUpdate, tienda.tienda, tienda.fecha, ventasTiendaInput, ventasAsesorInput]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header de Tienda */}
      <button
        onClick={onToggleExpand}
        className="w-full bg-blue-50 hover:bg-blue-100 px-4 py-3 flex items-center justify-between border-b border-gray-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tienda.tienda}</p>
            <p className="text-sm text-gray-600">
              Presupuesto: ${formatCurrency(tienda.presupuesto_tienda)} |
              Ventas: ${formatCurrency(tienda.ventas_tienda)} |
              <span className={`font-semibold ${getCumplimientoColor(tienda.cumplimiento_tienda_pct)}`}>
                Cumplimiento: {getCumplimientoBadge(tienda.cumplimiento_tienda_pct)}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-green-600">
            💰 Comisiones: ${formatCurrency(tienda.total_comisiones)}
          </p>
          <p className="text-xs text-gray-500">
            {empleadosConVentas.length} empleado{empleadosConVentas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </button>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="bg-white">
          {/* Editor de Ventas */}
          <VentasEditor
            tienda={tienda}
            ventasTiendaInput={ventasTiendaInput}
            onVentasTiendaChange={onVentasTiendaChange}
            onSaveVentas={handleSaveVentas}
          />

          {/* Tabla de Empleados */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">👤 Empleado</th>
                  <th className="px-4 py-3 text-left font-semibold">🏷️ Rol</th>
                  <th className="px-4 py-3 text-right font-semibold">💼 Presupuesto</th>
                  <th className="px-4 py-3 text-right font-semibold">💰 Ventas</th>
                  <th className="px-4 py-3 text-right font-semibold">📈 Cumplimiento</th>
                  <th className="px-4 py-3 text-right font-semibold">🎯 Comisión %</th>
                  <th className="px-4 py-3 text-right font-semibold">💵 Comisión $</th>
                </tr>
              </thead>
              <tbody>
                {empleadosConVentas.map((empleado, idx) => (
                  <EmployeeRow
                    key={empleado.id}
                    empleado={empleado}
                    index={idx}
                    ventasAsesorInput={ventasAsesorInput[empleado.id] ?? empleado.ventas}
                    onVentasAsesorChange={onVentasAsesorChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer con resumen */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                📊 Total empleados: <strong>{empleadosConVentas.length}</strong>
              </span>
              <span>
                💰 Total comisiones: <strong className="text-green-600">${formatCurrency(tienda.total_comisiones)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StoreExpandableCard = React.memo(StoreExpandableCardComponent);
