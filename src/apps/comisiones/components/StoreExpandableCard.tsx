import React, { useState, useCallback, useMemo } from 'react';
import { TiendaResumen } from '../types';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { EmployeeRow } from './EmployeeRow';
import { VentasEditor } from './VentasEditor';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  /** Si es true, el componente será de solo lectura */
  readOnly?: boolean;
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
   readOnly = false,
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
    <Card className="overflow-hidden">
      {/* Header de Tienda */}
      <Button
        onClick={onToggleExpand}
        variant="ghost"
        className="w-full bg-blue-50 hover:bg-blue-100 px-4 py-3 flex items-center justify-between border-b border-gray-200 transition-colors justify-start"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ExpandLess className="w-5 h-5 text-gray-600" />
          ) : (
            <ExpandMore className="w-5 h-5 text-gray-600" />
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
        <div className="text-right ml-auto">
          <p className="font-semibold text-green-600">
            💰 Comisiones: ${formatCurrency(tienda.total_comisiones)}
          </p>
          <p className="text-xs text-gray-500">
            {empleadosConVentas.length} empleado{empleadosConVentas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Button>

      {/* Contenido Expandido */}
      {isExpanded && (
        <CardContent className="p-0">
          {/* Editor de Ventas */}
          <VentasEditor
            tienda={tienda}
            ventasTiendaInput={ventasTiendaInput}
            onVentasTiendaChange={onVentasTiendaChange}
            onSaveVentas={handleSaveVentas}
            readOnly={readOnly}
          />

          {/* Tabla de Empleados */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">👤 Empleado</TableHead>
                  <TableHead className="px-4 py-3">🏷️ Rol</TableHead>
                  <TableHead className="px-4 py-3 text-right">💼 Presupuesto</TableHead>
                  <TableHead className="px-4 py-3 text-right">💰 Ventas</TableHead>
                  <TableHead className="px-4 py-3 text-right">📈 Cumplimiento</TableHead>
                  <TableHead className="px-4 py-3 text-right">🎯 Comisión %</TableHead>
                  <TableHead className="px-4 py-3 text-right">💵 Comisión $</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleadosConVentas.map((empleado, idx) => (
                  <EmployeeRow
                    key={empleado.id}
                    empleado={empleado}
                    index={idx}
                    ventasAsesorInput={ventasAsesorInput[empleado.id] ?? empleado.ventas}
                    onVentasAsesorChange={onVentasAsesorChange}
                    readOnly={readOnly}
                  />
                ))}
              </TableBody>
            </Table>
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
        </CardContent>
      )}
    </Card>
  );
};

export const StoreExpandableCard = React.memo(StoreExpandableCardComponent);
