import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useCommission } from "../contexts/CommissionContext";
import { HomeHeader } from "../components/HomeHeader";
import { HomeModals } from "../components/HomeModals";
import { SummaryCards } from "../components/SummaryCards";
import { DataTable } from "../components/DataTable";
import { Charts } from "../components/Charts";
import { LoadingState } from "../components/LoadingState";
import {
  getAvailableMonths,
  calculateMesResumenAgrupado,
} from "../lib/calculations";
import { useOptimizedCommissionData } from "../hooks/useOptimizedCommissionData";
import { useAvailableMonths } from "../hooks/useAvailableMonths";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GroupsIcon from "@mui/icons-material/Groups";

// 🚀 HOOK OPTIMIZADO - ELIMINA CONGELAMIENTO
import { useFiltersOptimized } from "../hooks/useFilters.optimized";
import { Role } from "../types";

export default function Home() {
  const { state, setVentas, setBudgets, setStaff, setMonthConfigs } =
    useCommission();

  // 🚀 NUEVO: Hook para obtener todos los meses disponibles
  const { availableMonths, currentMonth, isLoadingMonths, changeMonth } =
    useAvailableMonths();

  // Estados locales
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);

  // 🔄 SINCRONIZAR con el hook de meses disponibles
  useEffect(() => {
    if (currentMonth && currentMonth !== selectedMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth]);

  // Flag para evitar que useEffect interfiera cuando hacemos clic en "Total Comisiones"
  const skipEffectRef = useRef(false);

  // Hook optimizado para datos de comisiones
  const {
    data: commissionData,
    isLoading,
    isRefetching,
    isError,
    error,
    dataLoadAttempted,
    hasData,
    refetch,
  } = useOptimizedCommissionData(selectedMonth);

  // Estados legacy para compatibilidad temporal
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Extraer datos del hook optimizado
  const {
    budgets = [],
    staff = [],
    monthConfigs: monthConfigsData = [],
    ventas = [],
    presupuestosEmpleados = [],
    cargos = [],
  } = commissionData || {};

  // Sincronizar datos con el contexto
  useEffect(() => {
    if (commissionData) {
      setBudgets(budgets);
      setStaff(staff);
      setMonthConfigs(monthConfigsData);
    }
  }, [commissionData, setBudgets, setStaff, setMonthConfigs]);

  const {
    filterTienda,
    filterRol,
    debouncedFilterRol, // Valor debounced optimizado
    expandedTiendas,
    isFiltering, // Indicador de filtrado activo
    setFilterTienda,
    toggleFilterRol,
    clearFilterRol,
    handleToggleAllStores,
    toggleSingleStore,
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
  } = useFiltersOptimized(50); // 50ms de debounce más responsivo

  // Cache para cálculos costosos (optimizado)
  const calculationCacheRef = useRef<Map<string, any>>(new Map());

  // 🚀 NUEVO: Usar los meses disponibles del hook en lugar de extraer de budgets
  const availableMonthsFinal = useMemo(() => {
    // Si el hook ya cargó los meses, usarlos
    if (availableMonths && availableMonths.length > 0) {
      return availableMonths;
    }

    // Fallback: usar la lógica original solo si el hook no ha cargado aún
    const months = getAvailableMonths(budgets);
    return months.length > 0 ? months : [selectedMonth];
  }, [availableMonths, budgets, selectedMonth]);

  // Obtener configuración del mes
  const monthConfig = useMemo(
    () => monthConfigsData.find((c) => c.mes === selectedMonth),
    [monthConfigsData, selectedMonth]
  );
  const porcentajeGerente = useMemo(
    () => monthConfig?.porcentaje_gerente || 10,
    [monthConfig]
  );

  const mesResumen = useMemo(() => {
    if (budgets.length === 0) {
      return null;
    }

    // Crear hash robusto basado en contenido real de los datos
    const createDataHash = () => {
      const budgetsHash = budgets.reduce(
        (acc, b) => acc + Math.round(b.presupuesto_total * 100),
        0
      );
      const staffHash = staff.reduce(
        (acc, s) => acc + parseInt(s.id.replace(/\D/g, "")) + s.tienda.length,
        0
      );
      const ventasHash = ventas.reduce(
        (acc, v) => acc + Math.round(v.ventas_tienda * 100),
        0
      );
      const presupuestosHash = presupuestosEmpleados.reduce(
        (acc, p) => acc + Math.round((p.presupuesto || 0) * 100),
        0
      );

      return `${budgetsHash}_${staffHash}_${ventasHash}_${presupuestosHash}`;
    };

    const dataHash = createDataHash();
    const cacheKey = `mesResumen_${selectedMonth}_${dataHash}_${porcentajeGerente}`;

    // Verificar cache primero
    if (calculationCacheRef.current.has(cacheKey)) {
      console.log("🚀 [CACHE HIT] Usando datos en caché para", selectedMonth);
      return calculationCacheRef.current.get(cacheKey);
    }

    console.log("🔄 [CACHE MISS] Recalculando datos para", selectedMonth);

    // Calcular solo si no está en cache
    const result = calculateMesResumenAgrupado(
      selectedMonth,
      budgets,
      staff,
      ventas,
      porcentajeGerente,
      presupuestosEmpleados
    );

    // Guardar en cache (limitar tamaño a 15)
    if (calculationCacheRef.current.size > 15) {
      const firstKey = calculationCacheRef.current.keys().next().value;
      if (firstKey) {
        calculationCacheRef.current.delete(firstKey);
      }
    }
    calculationCacheRef.current.set(cacheKey, result);
    console.log(
      `💾 [CACHE SAVE] ${selectedMonth} - Cache size: ${calculationCacheRef.current.size}/15`
    );

    return result;
  }, [
    selectedMonth,
    budgets,
    staff,
    ventas,
    porcentajeGerente,
    presupuestosEmpleados,
  ]);

  const mesResumenFiltrado = useMemo(() => {
    if (!mesResumen) return null;
    // Usar el filtrado optimizado del hook
    return applyFilters(mesResumen);
  }, [mesResumen, debouncedFilterRol, filterTienda, applyFilters]);

  // Obtener tiendas únicas para filtros
  const availableTiendas = useMemo(() => {
    return getUniqueTiendas(mesResumen);
  }, [mesResumen, getUniqueTiendas]);

  const handleAssignmentComplete = () => {
    refetch();
  };

  useEffect(() => {
    // Si el flag está activo, no ejecutar lógica automática
    if (skipEffectRef.current) {
      skipEffectRef.current = false;
      return;
    }

    // Si no hay filtros de rol activos, contraer todas las tiendas
    if (debouncedFilterRol.length === 0) {
      handleToggleAllStores([], false, true);
      return;
    }

    // Si hay filtros de rol activos, expandir tiendas relevantes
    if (mesResumen && mesResumen.tiendas) {
      const tiendasAExpandir: string[] = [];

      // 🚀 USAR SET PARA FILTRADO O(1) EN LUGAR DE some()
      const roleSet = new Set(debouncedFilterRol);
      mesResumen.tiendas.forEach((tienda: any) => {
        const tiendaKey = `${tienda.tienda}-${tienda.fecha}`;

        // Optimización: usar .some() con Set es más rápido
        const tieneEmpleadosConRoles = tienda.empleados.some((empleado: any) =>
          roleSet.has(empleado.rol)
        );

        if (tieneEmpleadosConRoles) {
          tiendasAExpandir.push(tiendaKey);
        }
      });

      handleToggleAllStores(tiendasAExpandir, true, false);
    }
  }, [debouncedFilterRol, mesResumen, handleToggleAllStores]);

  const handleToggleAllStoresWrapper = useCallback(() => {
    if (!mesResumen) return;

    if (expandedTiendas.size > 0) {
      handleToggleAllStores([], false, true);
    } else {
      const allTiendas = mesResumen.tiendas.map(
        (tienda: any) => `${tienda.tienda}-${tienda.fecha}`
      );
      handleToggleAllStores(allTiendas, true, false);
    }
  }, [mesResumen, expandedTiendas.size, handleToggleAllStores]);

  const handleRoleFilterToggleWithExpansion = useCallback(
    (role: Role) => {
      toggleFilterRol(role);
    },
    [toggleFilterRol]
  );

  const handleRoleFilterClear = useCallback(() => {
    skipEffectRef.current = true;
    clearFilterRol();
  }, [clearFilterRol]);

  // 🚀 NUEVO: Manejar cambio de mes con validación
  const handleMonthChange = useCallback(
    (month: string) => {
      if (availableMonthsFinal.includes(month)) {
        setSelectedMonth(month);
        return true;
      }
      return false;
    },
    [availableMonthsFinal]
  );

  // Manejar errores y estados vacíos - Optimizado para evitar flashes del modal
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isError && error) {
      setShowNoDataModal(true);
      setModalTitle("Error al cargar datos");
      setModalMessage(error.message || "Ocurrió un error inesperado");
    } else if (dataLoadAttempted && !hasData && !isLoading && !commissionData) {
      // Delay para evitar flashes del modal cuando se carga desde caché
      timeoutId = setTimeout(() => {
        setShowNoDataModal(true);
        setModalTitle("Sin datos disponibles");
        setModalMessage(
          "No se encontraron datos para el período seleccionado."
        );
      }, 500); // 500ms de delay para dar tiempo al caché
    } else {
      setShowNoDataModal(false);
    }

    // Cleanup timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isError, error, dataLoadAttempted, hasData, isLoading, commissionData]);

  return (
    <LoadingState
      isLoading={isLoading || isLoadingMonths}
      isRefetching={isRefetching}
      error={error}
      hasDataAttempted={dataLoadAttempted}
    >
      <div className="min-h-screen px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="max-w-full sm:max-w-[calc(100vw-4rem)] lg:max-w-[calc(100vw-8rem)] xl:max-w-[calc(100vw-12rem)] mx-auto">
          {/* Header */}
          <HomeHeader
            selectedMonth={selectedMonth}
            availableMonths={availableMonthsFinal}
            selectedTiendas={filterTienda}
            availableTiendas={availableTiendas}
            mesResumen={mesResumen}
            mesResumenFiltrado={mesResumenFiltrado}
            onMonthChange={handleMonthChange}
            onTiendaChange={setFilterTienda}
            onShowConfigModal={() => setShowConfigModal(true)}
            onShowCodesModal={() => setShowCodesModal(true)}
            onToggleAllStores={handleToggleAllStoresWrapper}
            expandedTiendas={expandedTiendas}
            filterRol={filterRol}
            getFilteredComissionsForCards={getFilteredComissionsForCards}
            onRoleFilterToggle={handleRoleFilterToggleWithExpansion}
            onRoleFilterClear={handleRoleFilterClear}
            renderMobileSummaryCards={() => (
              <SummaryCards
                mesResumen={mesResumenFiltrado || mesResumen}
                onToggleAllStores={handleToggleAllStoresWrapper}
                expandedTiendas={expandedTiendas}
                filterRol={filterRol}
                getFilteredComissionsForCards={getFilteredComissionsForCards}
                onRoleFilterToggle={handleRoleFilterToggleWithExpansion}
                onRoleFilterClear={handleRoleFilterClear}
              />
            )}
          />

          {/* Contenido con borde - Optimizado para móvil */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Sección de Datos */}
                <section className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Tabla de Datos */}
                  <section className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Detalle de Comisiones
                      </h2>
                      <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm">
                          <StorefrontIcon
                            className="text-blue-600"
                            fontSize="small"
                          />
                          <span className="font-medium">
                            {(mesResumenFiltrado || mesResumen)?.tiendas
                              .length || 0}{" "}
                            Tiendas
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm">
                          <GroupsIcon
                            className="text-green-600"
                            fontSize="small"
                          />
                          <span className="font-medium">
                            {(mesResumenFiltrado || mesResumen)?.tiendas.reduce(
                              (total: number, tienda: any) =>
                                total + tienda.empleados.length,
                              0
                            ) || 0}{" "}
                            Empleados
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 🚀 COMPONENTE OPTIMIZADO CON isFiltering */}
                    <DataTable
                      tiendas={
                        (mesResumenFiltrado || mesResumen)?.tiendas || []
                      }
                      cargos={cargos}
                      selectedMonth={selectedMonth}
                      onVentasUpdate={(
                        tienda: string,
                        fecha,
                        ventas_tienda,
                        ventas_por_asesor
                      ) => {
                        setVentas([
                          ...state.ventas.filter(
                            (v) => !(v.tienda === tienda && v.fecha === fecha)
                          ),
                          { tienda, fecha, ventas_tienda, ventas_por_asesor },
                        ]);
                      }}
                      readOnly={true}
                      expandedTiendas={expandedTiendas}
                      onToggleAllStores={handleToggleAllStoresWrapper}
                      toggleSingleStore={toggleSingleStore}
                      filterRol={debouncedFilterRol} // SOLO usar debouncedFilterRol
                      isLoading={isLoading}
                      isRefetching={isRefetching}
                      isFiltering={isFiltering} // Pasar indicador
                    />
                  </section>

                  {/* Gráficos */}
                  {(mesResumenFiltrado || mesResumen) && (
                    <section className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 lg:pt-8">
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Análisis Visual
                      </h2>
                      <Charts mesResumen={mesResumenFiltrado || mesResumen} />
                    </section>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Modales */}
        <HomeModals
          showConfigModal={showConfigModal}
          showCodesModal={showCodesModal}
          showNoDataModal={showNoDataModal}
          modalTitle={modalTitle}
          modalMessage={modalMessage}
          selectedMonth={selectedMonth}
          onCloseConfigModal={() => setShowConfigModal(false)}
          onCloseCodesModal={() => setShowCodesModal(false)}
          onCloseNoDataModal={() => setShowNoDataModal(false)}
          onAssignmentComplete={handleAssignmentComplete}
        />
      </div>
    </LoadingState>
  );
}
