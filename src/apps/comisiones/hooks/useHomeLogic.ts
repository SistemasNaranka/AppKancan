import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommission } from "../contexts/CommissionContext";
import { getAvailableMonths } from "../lib/calculations.utils";
import { calculateMesResumenAgrupado } from "../lib/calculations.summary";
import { useOptimizedCommissionData } from "../hooks/useOptimizedCommissionData";
import { useAvailableMonths } from "../hooks/useAvailableMonths";
import { useBudgetValidation } from "../hooks/useBudgetValidation";
import { useUserPolicies } from "../hooks/useUserPolicies";
import { useFiltersOptimized } from "../hooks/useFilters.optimized";
import { Role } from "../types";

export const useHomeLogic = () => {
  const { state, setVentas, setBudgets, setStaff, setMonthConfigs, updatePresupuestosEmpleados } = useCommission();
  const { availableMonths, currentMonth, isLoadingMonths } = useAvailableMonths();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth || "");
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [showTabsConfigModal, setShowTabsConfigModal] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [showEditStoreBudgetModal, setShowEditStoreBudgetModal] = useState(false);
  const [headerKey, setHeaderKey] = useState(0);

  const skipEffectRef = useRef(false);
  const calculationCacheRef = useRef<Map<string, any>>(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentMonth && (currentMonth !== selectedMonth || !selectedMonth)) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth, selectedMonth]);

  const { data: commissionData, isLoading, isRefetching, isError, error, dataLoadAttempted, hasData, refetch } = useOptimizedCommissionData(selectedMonth);

  const { budgets = [], staff = [], monthConfigs: monthConfigsData = [], ventas = [], presupuestosEmpleados = [], cargos = [], thresholdConfig } = commissionData || {};

  const setPresupuestosEmpleados = useCallback((presupuestos: any[]) => {
    updatePresupuestosEmpleados(presupuestos);
  }, [updatePresupuestosEmpleados]);

  useEffect(() => {
    if (commissionData) {
      setBudgets(budgets);
      setStaff(staff);
      setMonthConfigs(monthConfigsData);
      setVentas(ventas);
      setPresupuestosEmpleados(presupuestosEmpleados);
    }
  }, [commissionData, setBudgets, setStaff, setMonthConfigs, setVentas, presupuestosEmpleados, setPresupuestosEmpleados, budgets, staff, monthConfigsData, ventas]);

  const filters = useFiltersOptimized();
  const hasSingleStoreSelected = filters.filterTienda.length === 1;

  const budgetValidation = useBudgetValidation(hasSingleStoreSelected ? filters.filterTienda[0] : undefined);
  const { hasPolicy } = useUserPolicies();

  const getCurrentFormattedDate = useCallback(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return now.toLocaleDateString("es-ES", options);
  }, []);

  const availableMonthsFinal = useMemo(() => {
    if (availableMonths && availableMonths.length > 0) return availableMonths;
    const months = getAvailableMonths(budgets);
    return months.length > 0 ? months : [selectedMonth];
  }, [availableMonths, budgets, selectedMonth]);

  const monthConfig = useMemo(() => monthConfigsData.find((c: any) => c.mes === selectedMonth), [monthConfigsData, selectedMonth]);
  const porcentajeGerente = useMemo(() => monthConfig?.porcentaje_gerente || 10, [monthConfig]);

  const shouldShowLoading = useMemo(() => {
    if (!budgetValidation.validationCompleted) return true;
    return isLoading || isLoadingMonths;
  }, [budgetValidation.validationCompleted, isLoading, isLoadingMonths]);

  const mesResumen = useMemo(() => {
    if (budgets.length === 0 || staff.length === 0 || ventas.length === 0) return null;
    const presupuestosEmpleadosState = presupuestosEmpleados || [];

    const createDataHash = () => {
      const budgetsHash = budgets.reduce((acc: number, b: any) => acc + Math.round(b.presupuesto_total * 100), 0);
      const staffHash = staff.reduce((acc: number, s: any) => acc + parseInt(s.id.replace(/\D/g, "")) + s.tienda.length, 0);
      const ventasHash = ventas.reduce((acc: number, v: any) => acc + Math.round(v.ventas_tienda * 100), 0);
      const presupuestosHash = presupuestosEmpleadosState.reduce((acc, p) => acc + Math.round((p.budget || 0) * 100), 0);
      const presupuestosCount = presupuestosEmpleadosState.length;
      const thresholdHash = thresholdConfig?.compliance_values ? thresholdConfig.compliance_values.reduce((acc, t) => acc + Math.round(t.min_compliance * 1000) + Math.round(t.pct_commission * 100000), 0) : 0;
      return `${budgetsHash}_${staffHash}_${ventasHash}_${presupuestosHash}_${presupuestosCount}_${thresholdHash}`;
    };

    const dataHash = createDataHash();
    const cacheKey = `mesResumen_${selectedMonth}_${dataHash}_${porcentajeGerente}`;

    if (calculationCacheRef.current.has(cacheKey)) return calculationCacheRef.current.get(cacheKey);

    const result = calculateMesResumenAgrupado(selectedMonth, budgets, staff, ventas, porcentajeGerente, presupuestosEmpleadosState, thresholdConfig);

    if (!result || !result.tiendas || result.tiendas.length === 0) return null;

    if (calculationCacheRef.current.size > 15) {
      const firstKey = calculationCacheRef.current.keys().next().value;
      if (firstKey) calculationCacheRef.current.delete(firstKey);
    }
    calculationCacheRef.current.set(cacheKey, result);

    return result;
  }, [selectedMonth, budgets, staff, ventas, porcentajeGerente, presupuestosEmpleados, thresholdConfig]);

  const mesResumenFiltrado = useMemo(() => {
    if (!mesResumen) return null;
    return filters.applyFilters(mesResumen);
  }, [mesResumen, filters.filterRol, filters.filterTienda, filters.applyFilters]);

  const availableTiendas = useMemo(() => filters.getUniqueTiendas(mesResumen), [mesResumen, filters.getUniqueTiendas]);

  const handleAssignmentComplete = async () => {
    calculationCacheRef.current.clear();
    filters.clearFilterCache();
    queryClient.clear();
    await budgetValidation.revalidateBudgetData();
    await refetch();
    await new Promise((resolve) => setTimeout(resolve, 100));
    setHeaderKey((prev) => prev + 1);
    setShowCodesModal(false);
  };

  const handleCodesModalSave = async (originalError?: any) => {
    setShowSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(false);

    try {
      if (originalError) {
        setSaveError(true);
        setTimeout(() => { setShowSaveLoading(false); setSaveError(false); }, 3000);
        return;
      }
      await handleAssignmentComplete();
      setSaveSuccess(true);
      setTimeout(() => { setShowSaveLoading(false); setSaveSuccess(false); }, 1000);
    } catch (error: any) {
      setSaveError(true);
      setTimeout(() => { setShowSaveLoading(false); setSaveError(false); }, 3000);
    }
  };

  useEffect(() => {
    if (skipEffectRef.current) { skipEffectRef.current = false; return; }
    if (filters.filterRol.length === 0) {
      filters.handleToggleAllStores([], false, true);
      return;
    }
    if (mesResumen && mesResumen.tiendas) {
      const tiendasAExpandir: string[] = [];
      const roleSet = new Set(filters.filterRol);
      mesResumen.tiendas.forEach((tienda: any) => {
        const tiendaKey = `${tienda.tienda}-${tienda.fecha}`;
        const tieneEmpleadosConRoles = tienda.empleados.some((empleado: any) => roleSet.has(empleado.rol));
        if (tieneEmpleadosConRoles) tiendasAExpandir.push(tiendaKey);
      });
      filters.handleToggleAllStores(tiendasAExpandir, true, false);
    }
  }, [filters.filterRol, mesResumen, filters.handleToggleAllStores]);

  const handleToggleAllStoresWrapper = useCallback(() => {
    if (!mesResumen) return;
    if (filters.expandedTiendas.size > 0) {
      filters.handleToggleAllStores([], false, true);
    } else {
      const allTiendas = mesResumen.tiendas.map((tienda: any) => `${tienda.tienda}-${tienda.fecha}`);
      filters.handleToggleAllStores(allTiendas, true, false);
    }
  }, [mesResumen, filters.expandedTiendas.size, filters.handleToggleAllStores]);

  const handleRoleFilterToggleWithExpansion = useCallback((role: Role) => { filters.toggleFilterRol(role); }, [filters.toggleFilterRol]);
  const handleRoleFilterClear = useCallback(() => { skipEffectRef.current = true; filters.clearFilterRol(); }, [filters.clearFilterRol]);

  const handleMonthChange = useCallback((month: string) => {
    if (availableMonthsFinal.includes(month)) {
      setSelectedMonth(month);
      return true;
    }
    return false;
  }, [availableMonthsFinal]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isError && error) {
      setShowNoDataModal(true);
      setModalTitle("Error al cargar datos");
      setModalMessage((error as any)?.message || "Ocurrió un error inesperado");
    } else if (dataLoadAttempted && !hasData && !isLoading && !commissionData) {
      timeoutId = setTimeout(() => {
        setShowNoDataModal(true);
        setModalTitle("Sin datos disponibles");
        setModalMessage("No se encontraron datos para el período seleccionado.");
      }, 500);
    } else {
      setShowNoDataModal(false);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isError, error, dataLoadAttempted, hasData, isLoading, commissionData]);

  const shouldShowMainContent = useMemo(() => {
    if (!budgetValidation.validationCompleted) return true;
    if (hasPolicy("crud_commission_stores")) return budgetValidation.hasBudgetData !== false;
    return true;
  }, [budgetValidation.validationCompleted, budgetValidation.hasBudgetData, hasPolicy]);

  return {
    state: { selectedMonth, showCodesModal, showTabsConfigModal, showSaveLoading, saveSuccess, saveError, showNoDataModal, modalTitle, modalMessage, showEditStoreModal, showEditStoreBudgetModal, headerKey },
    actions: { setShowCodesModal, setShowTabsConfigModal, setShowEditStoreModal, setShowEditStoreBudgetModal, setShowNoDataModal, handleAssignmentComplete, handleCodesModalSave, setVentas, handleMonthChange, handleToggleAllStoresWrapper, handleRoleFilterToggleWithExpansion, handleRoleFilterClear },
    computed: { shouldShowLoading, shouldShowMainContent, getCurrentFormattedDate, availableMonthsFinal, availableTiendas },
    data: { commissionData, mesResumen, mesResumenFiltrado, cargos, thresholdConfig, isRefetching, error, dataLoadAttempted, isLoading },
    contextState: state,
    filters,
    budgetValidation,
    hasPolicy,
    refetch
  };
};