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
import { useBudgetValidation } from "../hooks/useBudgetValidation";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { Alert, Button, Box, Typography } from "@mui/material";

// 🚀 HOOK OPTIMIZADO - ELIMINA CONGELAMIENTO
import { useFiltersOptimized } from "../hooks/useFilters.optimized";
import { Role } from "../types";

export default function Home() {
  const { state, setVentas, setBudgets, setStaff, setMonthConfigs } =
    useCommission();

  // 🚀 NUEVO: Hook para obtener todos los meses disponibles
  const { availableMonths, currentMonth, isLoadingMonths, changeMonth } =
    useAvailableMonths();

  // 🚀 NUEVO: Hook para validar presupuesto diario de empleados
  const {
    hasBudgetData,
    validationCompleted: budgetValidationCompleted,
    error: budgetError,
    revalidateBudgetData,
  } = useBudgetValidation();

  // Estados locales
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);

  // 🚀 NUEVO: Estado para pantalla de carga de guardado
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

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

  // 🚀 NUEVO: Obtener fecha actual formateada
  const getCurrentFormattedDate = useCallback(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return now.toLocaleDateString("es-ES", options);
  }, []);

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
      return calculationCacheRef.current.get(cacheKey);
    }

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

  const handleAssignmentComplete = async () => {
    // Primero actualizar los datos de comisiones
    await refetch();

    // Luego revalidar el presupuesto para verificar si se guardó correctamente
    await revalidateBudgetData();
  };

  // 🚀 NUEVO: Función para mostrar pantalla de carga (usada directamente desde el modal)
  const onShowSaveLoading = (error?: any) => {
    handleCodesModalSave(error);
  };

  // 🚀 NUEVO: Manejar guardado desde el modal
  const handleCodesModalSave = async (originalError?: any) => {
    console.log("🚀 Iniciando guardado desde modal...");
    setShowSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(false);

    try {
      // Si hubo error en el guardado original, mostrar error directamente
      if (originalError) {
        console.log("❌ Error en guardado original:", originalError);
        setSaveError(true);

        // Mostrar error y ocultar pantalla de carga
        setTimeout(() => {
          setShowSaveLoading(false);
          setSaveError(false);
        }, 3000); // 3 segundos para mostrar el error
        return;
      }

      // Si no hay error, actualizar datos en segundo plano
      await handleAssignmentComplete();

      // Una vez completada la operación real, mostrar éxito
      setSaveSuccess(true);

      // Ocultar pantalla de carga después de mostrar éxito brevemente
      setTimeout(() => {
        setShowSaveLoading(false);
        setSaveSuccess(false);
      }, 1000); // 1 segundo para el mensaje de éxito
    } catch (error: any) {
      console.error("❌ Error durante guardado:", error);
      setSaveError(true);

      // Mostrar mensaje de error más claro
      const errorMessage =
        error?.message || "Error de permisos - No se pudo guardar";
      console.log("Mostrando mensaje de error:", errorMessage);

      // Mostrar error y ocultar pantalla de carga
      setTimeout(() => {
        setShowSaveLoading(false);
        setSaveError(false);
      }, 3000); // 3 segundos para mostrar el error
    }
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
      setModalMessage((error as any)?.message || "Ocurrió un error inesperado");
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

  // 🚀 NUEVO: Determinar si debe mostrar el estado de carga
  const shouldShowLoading = useMemo(() => {
    // Si la validación de presupuesto no se ha completado, mostrar carga
    if (!budgetValidationCompleted) {
      return true;
    }
    // Usar el loading normal en otros casos
    return isLoading || isLoadingMonths;
  }, [budgetValidationCompleted, isLoading, isLoadingMonths]);

  // 🚀 NUEVO: Determinar si mostrar contenido principal o aviso de presupuesto
  const shouldShowMainContent = useMemo(() => {
    // Solo mostrar contenido si hay presupuesto diario asignado
    return hasBudgetData !== false;
  }, [hasBudgetData]);

  // 🚀 NUEVO: Props condicionales para HomeHeader - solo mostrar SummaryCards si hay presupuesto
  const homeHeaderProps = useMemo(() => {
    const baseProps = {
      selectedMonth,
      availableMonths: availableMonthsFinal,
      selectedTiendas: filterTienda,
      availableTiendas,
      mesResumen: shouldShowMainContent ? mesResumen : null,
      mesResumenFiltrado: shouldShowMainContent ? mesResumenFiltrado : null,
      onMonthChange: handleMonthChange,
      onTiendaChange: setFilterTienda,
      onShowConfigModal: () => setShowConfigModal(true),
      onShowCodesModal: () => setShowCodesModal(true),
      onToggleAllStores: handleToggleAllStoresWrapper,
      expandedTiendas,
      filterRol,
      getFilteredComissionsForCards: shouldShowMainContent
        ? getFilteredComissionsForCards
        : () => ({
            total_comisiones: 0,
            comisiones_por_rol: {},
          }),
      onRoleFilterToggle: handleRoleFilterToggleWithExpansion,
      onRoleFilterClear: handleRoleFilterClear,
      hasBudgetData: hasBudgetData !== false, // Pasar información de presupuesto al header
    };

    // Solo agregar renderMobileSummaryCards si hay presupuesto
    if (shouldShowMainContent) {
      return {
        ...baseProps,
        renderMobileSummaryCards: () => (
          <SummaryCards
            mesResumen={mesResumenFiltrado || mesResumen}
            onToggleAllStores={handleToggleAllStoresWrapper}
            expandedTiendas={expandedTiendas}
            filterRol={filterRol}
            getFilteredComissionsForCards={getFilteredComissionsForCards}
            onRoleFilterToggle={handleRoleFilterToggleWithExpansion}
            onRoleFilterClear={handleRoleFilterClear}
          />
        ),
      };
    }

    return baseProps;
  }, [
    selectedMonth,
    availableMonthsFinal,
    filterTienda,
    availableTiendas,
    mesResumen,
    mesResumenFiltrado,
    handleMonthChange,
    setFilterTienda,
    handleToggleAllStoresWrapper,
    expandedTiendas,
    filterRol,
    getFilteredComissionsForCards,
    handleRoleFilterToggleWithExpansion,
    handleRoleFilterClear,
    shouldShowMainContent,
    hasBudgetData,
  ]);

  // 🚀 NUEVO: Componente de pantalla de carga para guardado
  const SaveLoadingScreen = () => {
    if (!showSaveLoading) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
          {saveSuccess ? (
            // Mensaje de éxito
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Guardado Correctamente!
              </h3>
              <p className="text-gray-600">
                Los empleados han sido asignados exitosamente.
              </p>
            </div>
          ) : saveError ? (
            // Mensaje de error
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error de Permisos
              </h3>
              <p className="text-gray-600">
                No tiene permisos para guardar asignaciones. Contacte al
                administrador.
              </p>
            </div>
          ) : (
            // Pantalla de carga
            <div>
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Guardando...
              </h3>
              <p className="text-gray-600">
                Procesando asignación de empleados.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <LoadingState
      isLoading={shouldShowLoading}
      isRefetching={isRefetching}
      error={error}
      hasDataAttempted={dataLoadAttempted}
    >
      <div className="min-h-screen px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="max-w-full sm:max-w-[calc(100vw-4rem)] lg:max-w-[calc(100vw-8rem)] xl:max-w-[calc(100vw-12rem)] mx-auto">
          {/* Header */}
          <HomeHeader {...homeHeaderProps} />

          {/* Contenido con borde - Optimizado para móvil */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* 🚀 NUEVO: Aviso de presupuesto diario o contenido principal */}
                {budgetValidationCompleted && hasBudgetData === false ? (
                  /* Aviso de presupuesto diario no asignado */
                  <section className="space-y-6">
                    <div className="text-center py-12">
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <AssignmentIcon
                          sx={{
                            fontSize: 64,
                            color: "error.main",
                            opacity: 0.6,
                          }}
                        />
                        <Box sx={{ textAlign: "center", maxWidth: 500 }}>
                          <Typography
                            variant="h5"
                            component="h2"
                            sx={{
                              fontWeight: 600,
                              mb: 3,
                              color: "#c62828", // Rojo no tan brillante
                            }}
                          >
                            Presupuesto Diario No Asignado
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontSize: "1.1rem",
                            }}
                          >
                            No tiene presupuesto del día{" "}
                            <strong>{getCurrentFormattedDate()}</strong>{" "}
                            asignado.
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              fontSize: "1rem",
                              mb: 4,
                            }}
                          >
                            Para continuar debe asignar el presupuesto diario de
                            empleados.
                          </Typography>

                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<AssignmentIcon />}
                            onClick={() => setShowCodesModal(true)}
                            sx={{
                              px: 4,
                              py: 1.5,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                              color: "white",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "1.1rem",
                              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                              "&:hover": {
                                background:
                                  "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                                boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                                transform: "translateY(-1px)",
                              },
                              "&:active": {
                                transform: "translateY(0)",
                              },
                            }}
                          >
                            Asignar Presupuesto Diario
                          </Button>
                        </Box>
                      </Box>
                    </div>
                  </section>
                ) : (
                  /* Contenido principal cuando hay presupuesto asignado */
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
                              {(
                                mesResumenFiltrado || mesResumen
                              )?.tiendas.reduce(
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
                        filterRol={debouncedFilterRol}
                        isLoading={isLoading}
                        isRefetching={isRefetching}
                        isFiltering={isFiltering}
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
                )}
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
          hasSavedData={hasBudgetData === true} // Solo mostrar X si ya hay datos guardados
          onShowSaveLoading={onShowSaveLoading}
          onCloseConfigModal={() => setShowConfigModal(false)}
          onCloseCodesModal={() => {
            setShowCodesModal(false);
            // Solo cerrar, no ejecutar pantalla de carga automáticamente
          }}
          onCloseNoDataModal={() => setShowNoDataModal(false)}
          onAssignmentComplete={handleAssignmentComplete}
        />

        {/* 🚀 NUEVO: Pantalla de carga para guardado */}
        <SaveLoadingScreen />
      </div>
    </LoadingState>
  );
}
