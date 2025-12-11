import { useState, useMemo } from "react";
import { useCommission } from "../contexts/CommissionContext";
import { HomeHeader } from "../components/HomeHeader";
import { HomeModals } from "../components/HomeModals";
import { SummaryCards } from "../components/SummaryCards";
import { DataTable } from "../components/DataTable";
import { Charts } from "../components/Charts";
import {
  getAvailableMonths,
  calculateMesResumenAgrupado,
} from "../lib/calculations";
import { useCommissionData } from "../hooks/useCommissionData";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GroupsIcon from "@mui/icons-material/Groups";

import { useFilters } from "../hooks/useFilters";

export default function Home() {
  const { state, setVentas } = useCommission();

  // Estados locales
  const [selectedMonth, setSelectedMonth] = useState("Nov 2025");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);

  // Hooks personalizados
  const {
    presupuestosEmpleados,
    cargos,

    showNoDataModal,
    modalTitle,
    modalMessage,
    reloadContextData,
    setShowNoDataModal,
  } = useCommissionData(selectedMonth);

  const {
    filterTienda,
    filterRol,
    expandedTiendas,
    setFilterTienda,

    toggleFilterRol,
    clearFilterRol,

    handleToggleAllStores,
    applyFilters,
    getUniqueTiendas,
    getFilteredComissionsForCards,
  } = useFilters();

  // Obtener meses disponibles
  const availableMonths = useMemo(() => {
    const months = getAvailableMonths(state.budgets);
    return months.length > 0 ? months : ["Nov 2025"];
  }, [state.budgets]);

  // Obtener configuración del mes
  const monthConfig = state.monthConfigs.find((c) => c.mes === selectedMonth);
  const porcentajeGerente = monthConfig?.porcentaje_gerente || 10;

  // Calcular resumen del mes
  const mesResumen = useMemo(() => {
    if (state.budgets.length === 0) {
      return null;
    }

    const result = calculateMesResumenAgrupado(
      selectedMonth,
      state.budgets,
      state.staff,
      state.ventas,
      porcentajeGerente,
      presupuestosEmpleados
    );

    return result;
  }, [
    selectedMonth,
    state.budgets,
    state.staff,
    state.ventas,
    porcentajeGerente,
    presupuestosEmpleados,
  ]);

  // Aplicar filtros al resumen mensual
  const mesResumenFiltrado = useMemo(() => {
    return applyFilters(mesResumen);
  }, [mesResumen, applyFilters]);

  // Obtener tiendas únicas para filtros
  const availableTiendas = useMemo(() => {
    return getUniqueTiendas(mesResumen);
  }, [mesResumen, getUniqueTiendas]);

  const handleAssignmentComplete = () => {
    reloadContextData();
  };

  // Handler para toggle de tiendas con filtro inteligente por rol
  const handleToggleAllStoresWrapper = () => {
    let tiendasToToggle = availableTiendas;

    // Si hay filtros de rol activos, solo mostrar tiendas que tienen empleados con esos roles
    if (filterRol.length > 0 && mesResumen) {
      const tiendasConRol = mesResumen.tiendas
        .filter((tienda: any) =>
          tienda.empleados.some((empleado: any) =>
            filterRol.includes(empleado.rol)
          )
        )
        .map((tienda: any) => tienda.tienda);

      tiendasToToggle = tiendasConRol;
    }

    handleToggleAllStores(tiendasToToggle);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <HomeHeader
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        selectedTiendas={filterTienda}
        availableTiendas={availableTiendas}
        mesResumen={mesResumen}
        mesResumenFiltrado={mesResumenFiltrado}
        onMonthChange={setSelectedMonth}
        onTiendaChange={setFilterTienda}
        onShowConfigModal={() => setShowConfigModal(true)}
        onShowCodesModal={() => setShowCodesModal(true)}
        onToggleAllStores={handleToggleAllStoresWrapper}
        expandedTiendas={expandedTiendas}
        filterRol={filterRol}
        getFilteredComissionsForCards={getFilteredComissionsForCards}
        onRoleFilterToggle={toggleFilterRol}
        onRoleFilterClear={clearFilterRol}
        renderMobileSummaryCards={() => (
          <SummaryCards
            mesResumen={mesResumenFiltrado || mesResumen}
            onToggleAllStores={handleToggleAllStoresWrapper}
            expandedTiendas={expandedTiendas}
            filterRol={filterRol}
            getFilteredComissionsForCards={getFilteredComissionsForCards}
            onRoleFilterToggle={toggleFilterRol}
            onRoleFilterClear={clearFilterRol}
          />
        )}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Sección de Datos */}
          <section className="space-y-8">
            {/* Tabla de Datos */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Detalle de Comisiones</h2>
                <div className="flex items-center gap-3">
                  {/* Número de tiendas */}
                  <div className="flex items-center gap-1.5 bg-white shadow-sm px-3 py-1.5 rounded-xl border text-sm">
                    <StorefrontIcon
                      className="text-blue-600"
                      fontSize="small"
                    />
                    <span className="font-medium">
                      {availableTiendas.length} Tiendas
                    </span>
                  </div>

                  {/* Número de empleados */}
                  <div className="flex items-center gap-1.5 bg-white shadow-sm px-3 py-1.5 rounded-xl border text-sm">
                    <GroupsIcon className="text-green-600" fontSize="small" />
                    <span className="font-medium">
                      {state.staff.length} Empleados
                    </span>
                  </div>
                </div>
              </div>
              <DataTable
                tiendas={(mesResumenFiltrado || mesResumen)?.tiendas || []}
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
                filterRol={filterRol}
              />
            </section>

            {/* Gráficos */}
            {(mesResumenFiltrado || mesResumen) && (
              <section className="space-y-4 pt-8">
                <h2 className="text-xl font-semibold">Análisis Visual</h2>
                <Charts mesResumen={mesResumenFiltrado || mesResumen} />
              </section>
            )}
          </section>
        </div>
      </main>

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
  );
}
