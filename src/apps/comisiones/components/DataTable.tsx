import React, { useState, useMemo, useCallback } from "react";
import { TiendaResumen, Role, DirectusCargo } from "../types";
import { StoreExpandableCard } from "./StoreExpandableCard";

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
  /** Filtros de rol actualmente aplicados */
  filterRol?: Role[];
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
  cargos = [],
  selectedMonth,
  onVentasUpdate,
  readOnly = false,
  expandedTiendas: externalExpandedTiendas,
  onToggleAllStores,
  filterRol,
}) => {
  // Estados para expansión de tiendas
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    externalExpandedTiendas || new Set()
  );

  // Actualizar estado interno cuando cambia el estado externo
  React.useEffect(() => {
    if (externalExpandedTiendas) {
      setExpandedTiendas(externalExpandedTiendas);
    }
  }, [externalExpandedTiendas]);

  // Estados para inputs temporales de ventas
  const [ventasTiendaInputs, setVentasTiendaInputs] = useState<
    Record<string, number>
  >({});
  const [ventasAsesorInputs, setVentasAsesorInputs] = useState<
    Record<string, Record<string, number>>
  >({});

  /**
   * Filtra las tiendas - ahora sin filtros de tienda/rol ya que están en controles principales
   */
  const filteredTiendas = useMemo(() => {
    return tiendas.filter((tienda) => tienda.empleados.length > 0);
  }, [tiendas]);

  // Expandir/colapsar todas las tiendas según el filtro de rol
  React.useEffect(() => {
    if (filterRol && filterRol.length > 0 && externalExpandedTiendas) {
      // Si hay filtros de rol específicos y se pasó el estado externo,
      // actualizar el estado interno para reflejar la expansión
      setExpandedTiendas(externalExpandedTiendas);
    }
  }, [filterRol, externalExpandedTiendas]);
  // Expandir/colapsar todas las tiendas según el filtro de rol
  React.useEffect(() => {
    if (filterRol && filterRol.length > 0) {
      // Si hay filtros de rol específicos, expandir todas las tiendas
      setExpandedTiendas(new Set(filteredTiendas.map((t) => t.tienda)));
    }
    // Si no hay filtros de rol, mantener el estado actual
    // (no expandir ni colapsar automáticamente)
  }, [filterRol, filteredTiendas]);

  /**
   * Toggle la expansión de una tienda específica
   */
  const toggleTienda = useCallback((tienda: string) => {
    setExpandedTiendas((prev) => {
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
  const handleVentasTiendaChange = useCallback(
    (tienda: string, fecha: string, value: number) => {
      const key = `${tienda}|${fecha}`;
      setVentasTiendaInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Maneja el cambio de ventas de asesor en el input temporal
   */
  const handleVentasAsesorChange = useCallback(
    (tienda: string, fecha: string, asesorId: string, value: number) => {
      const key = `${tienda}|${fecha}`;
      setVentasAsesorInputs((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [asesorId]: value,
        },
      }));
    },
    []
  );

  /**
   * Obtiene el valor temporal de ventas de tienda
   */
  const getVentasTiendaInput = useCallback(
    (tienda: string, fecha: string, currentValue: number) => {
      const key = `${tienda}|${fecha}`;
      return ventasTiendaInputs[key] ?? currentValue;
    },
    [ventasTiendaInputs]
  );

  /**
   * Obtiene los valores temporales de ventas por asesor
   */
  const getVentasAsesorInputs = useCallback(
    (tienda: string, fecha: string) => {
      const key = `${tienda}|${fecha}`;
      return ventasAsesorInputs[key] || {};
    },
    [ventasAsesorInputs]
  );

  /**
   * Limpia los inputs temporales después de guardar
   */
  const clearVentasInputs = useCallback((tienda: string, fecha: string) => {
    const key = `${tienda}|${fecha}`;
    setVentasTiendaInputs((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setVentasAsesorInputs((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Controles de Filtro - Movidos a la sección de controles en Home.tsx */}
      {/* <FilterControls /> */}

      {/* Mensajes de Estado */}
      {filteredTiendas.length === 0 && tiendas.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg font-medium">
            No hay tiendas que coincidan con los filtros aplicados
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Ajusta los filtros de tienda, rol o fecha para ver resultados
          </p>
        </div>
      )}

      {tiendas.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay datos de comisiones disponibles
          </h3>
          <p className="text-gray-600">
            No se encontraron tiendas con información para el período
            seleccionado.
          </p>
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
          {filteredTiendas.map((tienda) => (
            <StoreExpandableCard
              key={`${tienda.tienda}|${tienda.fecha}`}
              tienda={tienda}
              cargos={cargos}
              isExpanded={expandedTiendas.has(tienda.tienda)}
              onToggleExpand={() => toggleTienda(tienda.tienda)}
              onVentasUpdate={(
                tiendaName,
                fecha,
                ventasTienda,
                ventasAsesor
              ) => {
                onVentasUpdate(tiendaName, fecha, ventasTienda, ventasAsesor);
                clearVentasInputs(tiendaName, fecha);
              }}
              ventasTiendaInput={getVentasTiendaInput(
                tienda.tienda,
                tienda.fecha,
                tienda.ventas_tienda
              )}
              onVentasTiendaChange={(value) =>
                handleVentasTiendaChange(tienda.tienda, tienda.fecha, value)
              }
              ventasAsesorInput={getVentasAsesorInputs(
                tienda.tienda,
                tienda.fecha
              )}
              onVentasAsesorChange={(asesorId, value) =>
                handleVentasAsesorChange(
                  tienda.tienda,
                  tienda.fecha,
                  asesorId,
                  value
                )
              }
              readOnly={readOnly}
              filterRol={filterRol}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DataTable = React.memo(DataTableComponent);
