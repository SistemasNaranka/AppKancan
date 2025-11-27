import React, { useState, useMemo, useCallback } from 'react';
import { TiendaResumen, Role } from '../types';
import { StoreExpandableCard } from './StoreExpandableCard';

interface DataTableProps {
  /** Lista de tiendas con sus datos */
  tiendas: TiendaResumen[];
  /** Mes actualmente seleccionado */
  selectedMonth: string;
  /** Callback para actualizar ventas */
  onVentasUpdate: (tienda: string, fecha: string, ventas_tienda: number, ventas_por_asesor: Record<string, number>) => void;
  /** Si es true, el componente será de solo lectura */
  readOnly?: boolean;
}

/**
 * Componente principal que organiza y muestra los datos de tiendas en formato de tabla expandible.
 * Maneja el estado de filtros, expansión de tiendas y edición de ventas.
 *
 * @example
 * <DataTable
 *   tiendas={tiendasData}
 *   selectedMonth="Nov 2025"
 *   availableMonths={["Sep 2025", "Oct 2025", "Nov 2025"]}
 *   onMonthChange={(month) => setSelectedMonth(month)}
 *   onVentasUpdate={handleVentasUpdate}
 * />
 */
const DataTableComponent: React.FC<DataTableProps> = ({
   tiendas,
   selectedMonth,
   onVentasUpdate,
   readOnly = false,
 }) => {
  // Estados para expansión de tiendas
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(new Set());

  // Estados para inputs temporales de ventas
  const [ventasTiendaInputs, setVentasTiendaInputs] = useState<Record<string, number>>({});
  const [ventasAsesorInputs, setVentasAsesorInputs] = useState<Record<string, Record<string, number>>>({});

  /**
   * Filtra las tiendas - ahora sin filtros de tienda/rol ya que están en controles principales
   */
  const filteredTiendas = useMemo(() => {
    return tiendas
      .filter(tienda => tienda.empleados.length > 0);
  }, [tiendas]);

  /**
   * Toggle la expansión de una tienda específica
   */
  const toggleTienda = useCallback((tienda: string) => {
    setExpandedTiendas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tienda)) {
        newSet.delete(tienda);
      } else {
        newSet.add(tienda);
      }
      return newSet;
    });
  }, []);

  /**
   * Maneja el cambio de ventas de tienda en el input temporal
   */
  const handleVentasTiendaChange = useCallback((tienda: string, fecha: string, value: number) => {
    const key = `${tienda}|${fecha}`;
    setVentasTiendaInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Maneja el cambio de ventas de asesor en el input temporal
   */
  const handleVentasAsesorChange = useCallback((tienda: string, fecha: string, asesorId: string, value: number) => {
    const key = `${tienda}|${fecha}`;
    setVentasAsesorInputs(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [asesorId]: value
      }
    }));
  }, []);

  /**
   * Obtiene el valor temporal de ventas de tienda
   */
  const getVentasTiendaInput = useCallback((tienda: string, fecha: string, currentValue: number) => {
    const key = `${tienda}|${fecha}`;
    return ventasTiendaInputs[key] ?? currentValue;
  }, [ventasTiendaInputs]);

  /**
   * Obtiene los valores temporales de ventas por asesor
   */
  const getVentasAsesorInputs = useCallback((tienda: string, fecha: string) => {
    const key = `${tienda}|${fecha}`;
    return ventasAsesorInputs[key] || {};
  }, [ventasAsesorInputs]);

  /**
   * Limpia los inputs temporales después de guardar
   */
  const clearVentasInputs = useCallback((tienda: string, fecha: string) => {
    const key = `${tienda}|${fecha}`;
    setVentasTiendaInputs(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setVentasAsesorInputs(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Controles de Filtro - Movidos a la sección de controles en Home.tsx */}
      {/*
      <FilterControls />
      */}

      {/* Mensajes de Estado */}
      {filteredTiendas.length === 0 && tiendas.length > 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="text-gray-500 mb-2">🔍</div>
          <p className="text-gray-600 text-lg font-medium">No hay datos que coincidan con los filtros aplicados</p>
          <p className="text-gray-500 text-sm mt-1">Intenta ajustar los filtros o limpiar todos</p>
        </div>
      )}

      {tiendas.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-blue-500 mb-4 text-4xl">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Bienvenido a la Calculadora de Comisiones!</h3>
          <p className="text-gray-600">No hay datos disponibles. Carga un CSV de presupuestos para comenzar.</p>
        </div>
      )}

      {/* Lista de Tiendas */}
      {filteredTiendas.length > 0 && (
        <div className="space-y-4">
          {/* Tarjetas de Tiendas - Implementación virtualizada */}
          {/* <VirtualizedStoreTable
            tiendas={filteredTiendas}
            selectedMonth={selectedMonth}
            onVentasUpdate={onVentasUpdate}
          /> */}

          {/* Versión actual (sin virtualización) */}
          {filteredTiendas.map(tienda => (
            <StoreExpandableCard
              key={`${tienda.tienda}|${tienda.fecha}`}
              tienda={tienda}
              isExpanded={expandedTiendas.has(tienda.tienda)}
              onToggleExpand={() => toggleTienda(tienda.tienda)}
              onVentasUpdate={(tiendaName, fecha, ventasTienda, ventasAsesor) => {
                onVentasUpdate(tiendaName, fecha, ventasTienda, ventasAsesor);
                clearVentasInputs(tiendaName, fecha);
              }}
              ventasTiendaInput={getVentasTiendaInput(tienda.tienda, tienda.fecha, tienda.ventas_tienda)}
              onVentasTiendaChange={(value) => handleVentasTiendaChange(tienda.tienda, tienda.fecha, value)}
              ventasAsesorInput={getVentasAsesorInputs(tienda.tienda, tienda.fecha)}
              onVentasAsesorChange={(asesorId, value) => handleVentasAsesorChange(tienda.tienda, tienda.fecha, asesorId, value)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DataTable = React.memo(DataTableComponent);
