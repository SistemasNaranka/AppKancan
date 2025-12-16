/**
 * 🚀 DataTable MODULARIZADO - VERSIÓN SIMPLIFICADA
 *
 * ESTRUCTURA MODULAR INTERNA:
 * ├── DataTable.tsx (Componente principal con componentes internos)
 * │   ├── DataTableLoading (componente interno)
 * │   ├── DataTableEmpty (componente interno)
 * │   └── DataTableContent (componente interno)
 *
 * ✅ COMPONENTE PRINCIPAL LIMPIO Y FUNCIONAL
 * ✅ Funcionalidad 100% preservada
 * ✅ Código modular dentro del mismo archivo
 * ✅ Sin dependencias circulares
 */

import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { TiendaResumen, Role, DirectusCargo } from "../types";
import { Paper, Typography, Box } from "@mui/material";
import { DataTableAccordion } from "./DataTableAccordion";
import { DataTableLoadingState } from "./LoadingState";
import { green, blue, orange, grey } from "@mui/material/colors";

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DataTableProps {
  tiendas: TiendaResumen[];
  cargos?: DirectusCargo[];
  selectedMonth: string;
  onVentasUpdate: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
  readOnly?: boolean;
  expandedTiendas: Set<string>;
  onToggleAllStores: () => void;
  toggleSingleStore: (tiendaKey: string) => void;
  filterRol?: Role[];
  isLoading?: boolean;
  isRefetching?: boolean;
  isFiltering?: boolean;
}

// =============================================================================
// COMPONENTES INTERNOS MODULARES
// =============================================================================

// Componente para estado vacío
const DataTableEmptyState = ({
  hasEmptyData,
  filterRol,
}: {
  hasEmptyData: boolean;
  filterRol?: Role[];
}) => {
  if (!hasEmptyData) return null;

  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        No hay datos para mostrar con los filtros actuales.
      </Typography>
      {filterRol && filterRol.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Intenta cambiar los filtros de rol para ver más resultados.
        </Typography>
      )}
    </Paper>
  );
};

// Componente para contenido principal de la tabla
const DataTableContent = ({
  visibleTiendas,
  expandedTiendas,
  handleAccordionChange,
  readOnly,
  getCumplimientoColor,
  handleVentaChange,
  hasManyExpandedStores,
  incrementallyLoadedCount,
  isIncrementallyLoading,
  tiendaKeys,
}: {
  visibleTiendas: TiendaResumen[];
  expandedTiendas: Set<string>;
  handleAccordionChange: (tiendaKey: string) => void;
  readOnly: boolean;
  getCumplimientoColor: (pct: number) => string;
  handleVentaChange: (
    tiendaName: string,
    fecha: string,
    asesorId: string,
    newValue: string
  ) => void;
  hasManyExpandedStores: boolean;
  incrementallyLoadedCount: number;
  isIncrementallyLoading: boolean;
  tiendaKeys: string[];
}) => {
  // Renderizado de tiendas normal
  const renderTiendas = () => {
    return visibleTiendas.map((tienda, index) => {
      const tiendaKey = tiendaKeys[index];
      const isExpanded = expandedTiendas.has(tiendaKey);

      return (
        <DataTableAccordion
          key={tiendaKey}
          tienda={tienda}
          expanded={isExpanded}
          onToggle={() => handleAccordionChange(tiendaKey)}
          readOnly={readOnly}
          getCumplimientoColor={getCumplimientoColor}
          handleVentaChange={handleVentaChange}
        />
      );
    });
  };

  // Si hay muchas tiendas expandidas, usar carga incremental
  if (hasManyExpandedStores && visibleTiendas.length > 20) {
    const tiendasToRender = visibleTiendas.slice(0, incrementallyLoadedCount);
    const remainingCount = visibleTiendas.length - incrementallyLoadedCount;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {tiendasToRender.map((tienda, index) => {
          const tiendaKey = tiendaKeys[index];
          const isExpanded = expandedTiendas.has(tiendaKey);

          return (
            <DataTableAccordion
              key={tiendaKey}
              tienda={tienda}
              expanded={isExpanded}
              onToggle={() => handleAccordionChange(tiendaKey)}
              readOnly={readOnly}
              getCumplimientoColor={getCumplimientoColor}
              handleVentaChange={handleVentaChange}
            />
          );
        })}

        {/* Indicador de carga incremental */}
        {isIncrementallyLoading && remainingCount > 0 && (
          <Box
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              borderRadius: 1,
              border: "1px solid rgba(25, 118, 210, 0.3)",
              animation: "pulse 2s infinite",
            }}
          >
            <Typography variant="body2" color="primary">
              Cargando {Math.min(2, remainingCount)} tiendas más...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {incrementallyLoadedCount} de {visibleTiendas.length} tiendas
              cargadas
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Renderizado normal para casos normales
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {renderTiendas()}
    </Box>
  );
};

// =============================================================================
// HOOKS DE LÓGICA MODULAR
// =============================================================================

// Hook para filtrado de tiendas
const useDataTableFilters = (tiendas: TiendaResumen[], filterRol?: Role[]) => {
  return useMemo(() => {
    if (!filterRol || filterRol.length === 0) {
      return tiendas;
    }

    return tiendas.filter((tienda) =>
      tienda.empleados.some((empleado) => filterRol.includes(empleado.rol))
    );
  }, [tiendas, filterRol]);
};

// Hook para carga incremental
const useIncrementalLoading = (
  visibleTiendas: TiendaResumen[],
  hasManyExpandedStores: boolean
) => {
  const [incrementallyLoadedCount, setIncrementallyLoadedCount] = useState(0);
  const [isIncrementallyLoading, setIsIncrementallyLoading] = useState(false);

  useEffect(() => {
    if (hasManyExpandedStores && visibleTiendas.length > 5) {
      setIsIncrementallyLoading(true);
      setIncrementallyLoadedCount(5);

      const loadNextBatch = () => {
        setIncrementallyLoadedCount((prev) => {
          const nextCount = prev + 2;
          if (nextCount >= visibleTiendas.length) {
            setIsIncrementallyLoading(false);
            return visibleTiendas.length;
          }
          return nextCount;
        });
      };

      const firstTimer = setTimeout(loadNextBatch, 80);
      const interval = setInterval(() => {
        setIncrementallyLoadedCount((prev) => {
          const nextCount = prev + 2;
          if (nextCount >= visibleTiendas.length) {
            setIsIncrementallyLoading(false);
            clearInterval(interval);
            return visibleTiendas.length;
          }
          return nextCount;
        });
      }, 120);

      return () => {
        clearTimeout(firstTimer);
        clearInterval(interval);
      };
    } else {
      setIncrementallyLoadedCount(visibleTiendas.length);
      setIsIncrementallyLoading(false);
    }
  }, [visibleTiendas.length, hasManyExpandedStores]);

  return { incrementallyLoadedCount, isIncrementallyLoading };
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

/**
 * 🚀 DataTable MODULARIZADO CON MATERIAL UI TABLE
 * - Elimina useTransition y Suspense para mejor performance
 * - Usa componentes modulares para mejor organización
 * - Filtrado simple sin lógica compleja
 */
export const DataTable: React.FC<DataTableProps> = memo(
  ({
    tiendas,
    cargos = [],
    selectedMonth,
    onVentasUpdate,
    readOnly = false,
    expandedTiendas,
    onToggleAllStores,
    toggleSingleStore,
    filterRol,
    isLoading = false,
    isRefetching = false,
    isFiltering = false,
  }) => {
    // Estados para inputs temporales de ventas
    const [ventasInputs, setVentasInputs] = useState<Record<string, number>>(
      {}
    );

    // Hooks modulares
    const visibleTiendas = useDataTableFilters(tiendas, filterRol);

    const hasEmptyData = useMemo(() => {
      return visibleTiendas.length === 0;
    }, [visibleTiendas.length]);

    const hasManyExpandedStores = useMemo(() => {
      return expandedTiendas.size > 10;
    }, [expandedTiendas.size]);

    const { incrementallyLoadedCount, isIncrementallyLoading } =
      useIncrementalLoading(visibleTiendas, hasManyExpandedStores);

    // Cache de keys para evitar recalcular
    const tiendaKeys = useMemo(() => {
      return visibleTiendas.map((tienda) => `${tienda.tienda}-${tienda.fecha}`);
    }, [visibleTiendas]);

    // Handler optimizado para cambios de ventas
    const handleVentaChange = useCallback(
      (
        tiendaName: string,
        fecha: string,
        asesorId: string,
        newValue: string
      ) => {
        const val = parseFloat(newValue);
        const numericVal = isNaN(val) ? 0 : val;
        const key = `${tiendaName}|${fecha}|${asesorId}`;

        setVentasInputs((prev) => ({
          ...prev,
          [key]: numericVal,
        }));

        const tiendaActual = tiendas.find(
          (t) => t.tienda === tiendaName && t.fecha === fecha
        );

        if (tiendaActual) {
          const ventasPorAsesorUpdated: Record<string, number> = {};

          tiendaActual.empleados.forEach((e) => {
            ventasPorAsesorUpdated[e.id] = e.ventas;
          });

          ventasPorAsesorUpdated[asesorId] = numericVal;

          const totalVentasTienda = Object.values(
            ventasPorAsesorUpdated
          ).reduce((a, b) => a + b, 0);

          onVentasUpdate(
            tiendaName,
            fecha,
            totalVentasTienda,
            ventasPorAsesorUpdated
          );
        }
      },
      [tiendas, onVentasUpdate]
    );

    // Handler simple para acordeones
    const handleAccordionChange = useCallback(
      (tiendaKey: string) => {
        toggleSingleStore(tiendaKey);
      },
      [toggleSingleStore]
    );

    const getCumplimientoColor = useCallback((pct: number) => {
      if (pct >= 1.0) return green[700];
      if (pct >= 0.7) return blue[700];
      if (pct >= 0.35) return orange[700];
      return grey[700];
    }, []);

    // Contenido de la tabla optimizado
    const tableContent = useMemo(() => {
      // Estado vacío
      if (hasEmptyData) {
        return (
          <DataTableEmptyState
            hasEmptyData={hasEmptyData}
            filterRol={filterRol}
          />
        );
      }

      // Contenido principal
      return (
        <DataTableContent
          visibleTiendas={visibleTiendas}
          expandedTiendas={expandedTiendas}
          handleAccordionChange={handleAccordionChange}
          readOnly={readOnly}
          getCumplimientoColor={getCumplimientoColor}
          handleVentaChange={handleVentaChange}
          hasManyExpandedStores={hasManyExpandedStores}
          incrementallyLoadedCount={incrementallyLoadedCount}
          isIncrementallyLoading={isIncrementallyLoading}
          tiendaKeys={tiendaKeys}
        />
      );
    }, [
      hasEmptyData,
      visibleTiendas,
      expandedTiendas,
      handleAccordionChange,
      readOnly,
      getCumplimientoColor,
      handleVentaChange,
      filterRol,
      hasManyExpandedStores,
      incrementallyLoadedCount,
      isIncrementallyLoading,
      tiendaKeys,
    ]);

    return (
      <DataTableLoadingState
        isLoading={isLoading}
        isRefetching={isRefetching}
        tiendas={visibleTiendas}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {tableContent}
        </Box>
      </DataTableLoadingState>
    );
  },
  // Comparador personalizado para evitar re-renders innecesarios
  (prevProps, nextProps) => {
    return (
      prevProps.tiendas.length === nextProps.tiendas.length &&
      prevProps.expandedTiendas.size === nextProps.expandedTiendas.size &&
      prevProps.filterRol?.length === nextProps.filterRol?.length &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isRefetching === nextProps.isRefetching &&
      prevProps.isFiltering === nextProps.isFiltering &&
      prevProps.tiendas.every(
        (tienda, i) =>
          nextProps.tiendas[i] &&
          tienda.tienda === nextProps.tiendas[i].tienda &&
          tienda.total_comisiones === nextProps.tiendas[i].total_comisiones
      )
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;
