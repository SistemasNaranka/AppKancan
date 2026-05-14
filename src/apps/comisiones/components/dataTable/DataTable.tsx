import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import {
  TiendaResumen,
  Role,
  DirectusPosition,
  CommissionThreshold,
  CommissionThresholdConfig,
} from "../../types";
import { Paper, Typography, Box } from "@mui/material";
import { DataTableAccordion } from "./DataTableAccordion";
import { DataTableLoadingState } from "../ui/LoadingState";
import { green, blue, orange, grey, pink, red } from "@mui/material/colors";

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface DataTableProps {
  tiendas: TiendaResumen[];
  cargos?: DirectusPosition[];
  selectedMonth: string;
  onVentasUpdate: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>,
  ) => void;
  readOnly?: boolean;
  expandedTiendas: Set<string>;
  onToggleAllStores: () => void;
  toggleSingleStore: (tiendaKey: string) => void;
  filterRol?: Role[];
  isLoading?: boolean;
  isRefetching?: boolean;
  isFiltering?: boolean;
  thresholdConfig?: CommissionThresholdConfig | null;
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
  thresholdConfig,
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
    newValue: string,
  ) => void;
  hasManyExpandedStores: boolean;
  incrementallyLoadedCount: number;
  isIncrementallyLoading: boolean;
  tiendaKeys: string[];
  thresholdConfig?: CommissionThreshold[];
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
          thresholdConfig={thresholdConfig}
        />
      );
    });
  };

  // Si hay muchas tiendas expandidas, usar carga incremental
  if (hasManyExpandedStores && visibleTiendas.length > 20) {
    const tiendasToRender = visibleTiendas.slice(0, incrementallyLoadedCount);
    const remainingCount = visibleTiendas.length - incrementallyLoadedCount;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
              thresholdConfig={thresholdConfig}
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
      tienda.empleados.some((empleado) => filterRol.includes(empleado.rol)),
    );
  }, [tiendas, filterRol]);
};

// Hook para carga incremental
const useIncrementalLoading = (
  visibleTiendas: TiendaResumen[],
  hasManyExpandedStores: boolean,
) => {
  const [incrementallyLoadedCount, setIncrementallyLoadedCount] = useState(0);
  const [isIncrementallyLoading, setIsIncrementallyLoading] = useState(false);

  useEffect(() => {
    // Limpiar cualquier timer existente
    let firstTimer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (hasManyExpandedStores && visibleTiendas.length > 5) {
      setIsIncrementallyLoading(true);
      setIncrementallyLoadedCount(5);

      const loadNextBatch = () => {
        setIncrementallyLoadedCount((prev) => {
          const nextCount = prev + 2;
          if (nextCount >= visibleTiendas.length) {
            setIsIncrementallyLoading(false);
            if (interval) clearInterval(interval);
            return visibleTiendas.length;
          }
          return nextCount;
        });
      };

      firstTimer = setTimeout(loadNextBatch, 80);
      interval = setInterval(() => {
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
    } else {
      setIncrementallyLoadedCount(visibleTiendas.length);
      setIsIncrementallyLoading(false);
    }

    // Cleanup function más robusta
    return () => {
      if (firstTimer) clearTimeout(firstTimer);
      if (interval) clearInterval(interval);
    };
  }, [visibleTiendas.length, hasManyExpandedStores]);

  return { incrementallyLoadedCount, isIncrementallyLoading };
};

/**
 * 🚀 DataTable MODULARIZADO CON MATERIAL UI TABLE
 * - Elimina useTransition y Suspense para mejor performance
 * - Usa componentes modulares para mejor organización
 * - Filtrado simple sin lógica compleja
 */
export const DataTable: React.FC<DataTableProps> = memo(
  ({
    tiendas,
    onVentasUpdate,
    readOnly = false,
    expandedTiendas,
    toggleSingleStore,
    filterRol,
    isLoading = false,
    isRefetching = false,
    thresholdConfig,
  }) => {
    // Estados para inputs temporales de ventas
    const [, setVentasInputs] = useState<Record<string, number>>({});

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
        newValue: string,
      ) => {
        const val = parseFloat(newValue);
        const numericVal = isNaN(val) ? 0 : val;
        const key = `${tiendaName}|${fecha}|${asesorId}`;

        setVentasInputs((prev) => ({
          ...prev,
          [key]: numericVal,
        }));

        const tiendaActual = tiendas.find(
          (t) => t.tienda === tiendaName && t.fecha === fecha,
        );

        if (tiendaActual) {
          const ventasPorAsesorUpdated: Record<string, number> = {};

          tiendaActual.empleados.forEach((e) => {
            ventasPorAsesorUpdated[e.id] = e.ventas;
          });

          ventasPorAsesorUpdated[asesorId] = numericVal;

          const totalVentasTienda = Object.values(
            ventasPorAsesorUpdated,
          ).reduce((a, b) => a + b, 0);

          onVentasUpdate(
            tiendaName,
            fecha,
            totalVentasTienda,
            ventasPorAsesorUpdated,
          );
        }
      },
      [tiendas, onVentasUpdate],
    );

    // Handler simple para acordeones
    const handleAccordionChange = useCallback(
      (tiendaKey: string) => {
        toggleSingleStore(tiendaKey);
      },
      [toggleSingleStore],
    );

    const getCumplimientoColor = useCallback(
      (pct: number) => {
        // Valores por defecto si no hay configuración
        const DEFAULT_THRESHOLDS = [
          {
            min_compliance: 85,
            pct_commission: 0.002,
            name: "Básico",
            color: "red",
          },
          {
            min_compliance: 90,
            pct_commission: 0.0035,
            name: "Muy Regular",
            color: "pink",
          },
          {
            min_compliance: 95,
            pct_commission: 0.005,
            name: "Regular",
            color: "orange",
          },
          {
            min_compliance: 100,
            pct_commission: 0.007,
            name: "Buena",
            color: "blue",
          },
          {
            min_compliance: 110,
            pct_commission: 0.01,
            name: "Excelente",
            color: "green",
          },
        ];

        const umbrales =
          thresholdConfig?.compliance_values &&
          thresholdConfig.compliance_values.length > 0
            ? thresholdConfig.compliance_values
            : DEFAULT_THRESHOLDS;

        // Ordenar umbrales por min_compliance ascendente
        const umbralesOrdenados = [...umbrales].sort(
          (a, b) => a.min_compliance - b.min_compliance,
        );

        // Verificar si el cumplimiento está dentro de alguno de los umbrales configurados
        const isWithinThresholds = umbralesOrdenados.some((umbral) => {
          const nextUmbral =
            umbralesOrdenados[umbralesOrdenados.indexOf(umbral) + 1];
          return (
            pct >= umbral.min_compliance &&
            (!nextUmbral || pct < nextUmbral.min_compliance)
          );
        });

        // Asignar color SOLO si el cumplimiento está dentro de los umbrales configurados
        if (!isWithinThresholds) {
          return grey[600]; // Gris (sin color) para cumplimiento < umbral mínimo o fuera de rango
        }

        // Mapa de colores MUI a nombres de colores
        const colorMap: Record<string, string> = {
          red: red[300],
          pink: pink[300],
          orange: orange[600],
          blue: blue[600],
          green: green[600],
          purple: "#9c27b0",
          yellow: "#ffeb3b",
        };

        // Asignar color basado EN LOS UMBRALES CONFIGURADOS para el mes
        for (let i = 0; i < umbralesOrdenados.length; i++) {
          const umbral = umbralesOrdenados[i];
          const nextUmbral = umbralesOrdenados[i + 1];

          if (
            pct >= umbral.min_compliance &&
            (!nextUmbral || pct < nextUmbral.min_compliance)
          ) {
            // Si el umbral tiene un color configurado, usarlo
            if (umbral.color && colorMap[umbral.color]) {
              return colorMap[umbral.color];
            }

            // Si no, usar la lógica de color por defecto
            if (umbral.min_compliance >= 85 && umbral.min_compliance < 90) {
              return red[300]; // Rojo para umbrales 85-89%
            } else if (
              umbral.min_compliance >= 90 &&
              umbral.min_compliance < 95
            ) {
              return pink[300]; // Rosa para umbrales 90-94%
            } else if (
              umbral.min_compliance >= 95 &&
              umbral.min_compliance < 100
            ) {
              return orange[600]; // Naranja para umbrales 95-99%
            } else if (
              umbral.min_compliance >= 100 &&
              umbral.min_compliance < 110
            ) {
              return blue[600]; // Azul para umbrales 100-109%
            } else {
              return green[600]; // Verde para umbrales ≥110%
            }
          }
        }

        return grey[600]; // Default
      },
      [thresholdConfig],
    );

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
          thresholdConfig={thresholdConfig?.compliance_values}
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
  // Comparador personalizado más estricto para evitar re-renders innecesarios
  (prevProps, nextProps) => {
    // Comparaciones básicas
    const basicPropsEqual =
      prevProps.tiendas.length === nextProps.tiendas.length &&
      prevProps.expandedTiendas.size === nextProps.expandedTiendas.size &&
      prevProps.filterRol?.length === nextProps.filterRol?.length &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isRefetching === nextProps.isRefetching &&
      prevProps.isFiltering === nextProps.isFiltering &&
      prevProps.readOnly === nextProps.readOnly;

    if (!basicPropsEqual) return false;

    // Comparación más detallada de las tiendas
    return prevProps.tiendas.every((tienda, i) => {
      const nextTienda = nextProps.tiendas[i];
      if (!nextTienda) return false;

      return (
        tienda.tienda === nextTienda.tienda &&
        tienda.fecha === nextTienda.fecha &&
        tienda.total_comisiones === nextTienda.total_comisiones &&
        tienda.empleados.length === nextTienda.empleados.length &&
        tienda.presupuesto_tienda === nextTienda.presupuesto_tienda &&
        tienda.ventas_tienda === nextTienda.ventas_tienda
      );
    });
  },
);

DataTable.displayName = "DataTable";

export default DataTable;
