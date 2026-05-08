import { useMemo } from "react";
import { HomeHeader } from "../components/ui/HomeHeader";
import { HomeModals } from "../components/modals/HomeModals";
import { DataTable } from "../components/dataTable/DataTable";
import { Charts } from "../components/Charts";
import { LoadingState } from "../components/ui/LoadingState";
import { ConfigurationTabsPanel } from "../components/ConfigurationTabsPanel";
import { SaveLoadingScreen } from "../components/ui/SaveLoadingScreen";
import { SummaryCards } from "../components/SummaryCards";
import { useHomeLogic } from "../hooks/useHomeLogic";
import StorefrontIcon from "@mui/icons-material/Storefront";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { Button, Box, Typography } from "@mui/material";

export default function Home() {
  const { 
    state, actions, computed, data, contextState, filters, budgetValidation, hasPolicy, refetch 
  } = useHomeLogic();

  
  const homeHeaderProps = useMemo(() => {
    const baseProps = {
      selectedMonth: state.selectedMonth,
      availableMonths: computed.availableMonthsFinal,
      selectedTiendas: filters.filterTienda,
      availableTiendas: computed.availableTiendas,
      mesResumen: computed.shouldShowMainContent ? data.mesResumen : null,
      mesResumenFiltrado: computed.shouldShowMainContent ? data.mesResumenFiltrado : null,
      onMonthChange: actions.handleMonthChange,
      onTiendaChange: filters.setFilterTienda,
      onShowConfigModal: () => actions.setShowTabsConfigModal(true),
      onShowCodesModal: () => actions.setShowCodesModal(true),
      onShowEditStoreModal: () => actions.setShowEditStoreModal(true),
      onShowEditStoreBudgetModal: () => actions.setShowEditStoreBudgetModal(true),
      onToggleAllStores: actions.handleToggleAllStoresWrapper,
      expandedTiendas: filters.expandedTiendas,
      filterRol: filters.filterRol,
      getFilteredComissionsForCards: computed.shouldShowMainContent ? filters.getFilteredComissionsForCards : () => ({ total_comisiones: 0, comisiones_por_rol: {} }),
      onRoleFilterToggle: actions.handleRoleFilterToggleWithExpansion,
      onRoleFilterClear: actions.handleRoleFilterClear,
      hasBudgetData: budgetValidation.hasBudgetData ?? undefined,
      missingDaysCount: budgetValidation.missingDaysCount,
    };

    if (computed.shouldShowMainContent) {
      return {
        ...baseProps,
        renderMobileSummaryCards: () => (
          <SummaryCards 
            mesResumen={data.mesResumen} 
            onToggleAllStores={actions.handleToggleAllStoresWrapper}
            expandedTiendas={filters.expandedTiendas} 
            filterRol={filters.filterRol}
            getFilteredComissionsForCards={filters.getFilteredComissionsForCards}
            onRoleFilterToggle={actions.handleRoleFilterToggleWithExpansion} 
            onRoleFilterClear={actions.handleRoleFilterClear}
          />
        ),
      };
    }
    return baseProps;
  }, [state.selectedMonth, computed.availableMonthsFinal, filters, computed.availableTiendas, data.mesResumen, data.mesResumenFiltrado, actions, computed.shouldShowMainContent, budgetValidation]);

  return (
    <LoadingState
      isLoading={computed.shouldShowLoading}
      isRefetching={data.isRefetching}
      error={data.error}
      hasDataAttempted={data.dataLoadAttempted}
    >
      <div className="min-h-screen px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="max-w-full sm:max-w-[calc(100vw-4rem)] lg:max-w-[calc(100vw-8rem)] xl:max-w-[calc(100vw-12rem)] mx-auto">
          
          <HomeHeader key={state.headerKey} {...homeHeaderProps} />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                
                {budgetValidation.validationCompleted &&
                budgetValidation.hasBudgetData === false &&
                hasPolicy("readComisionesTienda") ? (
                  <section className="space-y-6">
                    <div className="text-center py-12">
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <AssignmentIcon sx={{ fontSize: 64, color: "error.main", opacity: 0.6 }} />
                        <Box sx={{ textAlign: "center", maxWidth: 500 }}>
                          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3, color: "#c62828" }}>
                            Presupuesto Diario No Asignado
                          </Typography>
                          <Typography variant="body1" sx={{ color: "text.secondary", mb: 1, fontSize: "1.1rem" }}>
                            No tiene presupuesto del día <strong>{computed.getCurrentFormattedDate()}</strong> asignado.
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "1rem", mb: 4 }}>
                            Para continuar debe asignar el presupuesto diario de empleados.
                          </Typography>

                          <Button
                            variant="contained" size="large" startIcon={<AssignmentIcon />}
                            onClick={() => actions.setShowCodesModal(true)}
                            sx={{
                              px: 4, py: 1.5, borderRadius: 2,
                              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)", color: "white",
                              textTransform: "none", fontWeight: 600, fontSize: "1.1rem",
                              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                              "&:hover": {
                                background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                                boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)", transform: "translateY(-1px)",
                              },
                              "&:active": { transform: "translateY(0)" },
                            }}
                          >
                            Asignar Presupuesto Diario
                          </Button>
                        </Box>
                      </Box>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-4 sm:space-y-6 lg:space-y-8">
                    <section className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-lg sm:text-xl font-semibold">Detalle de Comisiones</h2>
                        <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1.5 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm">
                            <StorefrontIcon className="text-blue-600" fontSize="small" />
                            <span className="font-medium">{(data.mesResumenFiltrado || data.mesResumen)?.tiendas.length || 0} Tiendas</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm">
                            <GroupsIcon className="text-green-600" fontSize="small" />
                            <span className="font-medium">
                              {(data.mesResumenFiltrado || data.mesResumen)?.tiendas.reduce((total: number, tienda: any) => total + tienda.empleados.length, 0) || 0} Empleados
                            </span>
                          </div>
                        </div>
                      </div>

                      <DataTable
                        tiendas={(data.mesResumenFiltrado || data.mesResumen)?.tiendas || []}
                        cargos={data.cargos}
                        selectedMonth={state.selectedMonth}
                        onVentasUpdate={(tienda: string, fecha, ventas_tienda, ventas_por_asesor) => {
                          actions.setVentas([...contextState.ventas.filter((v: any) => !(v.tienda === tienda && v.fecha === fecha)), { tienda, fecha, ventas_tienda, ventas_por_asesor }]);
                        }}
                        readOnly={true}
                        expandedTiendas={filters.expandedTiendas}
                        onToggleAllStores={actions.handleToggleAllStoresWrapper}
                        toggleSingleStore={filters.toggleSingleStore}
                        filterRol={filters.filterRol}
                        isLoading={data.isLoading}
                        isRefetching={data.isRefetching}
                        isFiltering={filters.isFiltering}
                        thresholdConfig={data.thresholdConfig}
                      />
                    </section>

                    {(data.mesResumenFiltrado || data.mesResumen) && (
                      <section className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 lg:pt-8">
                        <h2 className="text-lg sm:text-xl font-semibold">Análisis Visual</h2>
                        <Charts mesResumen={data.mesResumenFiltrado || data.mesResumen} />
                      </section>
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>

        <HomeModals
          showCodesModal={state.showCodesModal}
          showEditStoreModal={state.showEditStoreModal}
          showEditStoreBudgetModal={state.showEditStoreBudgetModal}
          showNoDataModal={state.showNoDataModal}
          modalTitle={state.modalTitle}
          modalMessage={state.modalMessage}
          selectedMonth={state.selectedMonth}
          hasSavedData={budgetValidation.hasBudgetData === true}
          onShowSaveLoading={(error?: any) => actions.handleCodesModalSave(error)}
          onCloseCodesModal={() => actions.setShowCodesModal(false)}
          onCloseEditStoreModal={() => actions.setShowEditStoreModal(false)}
          onCloseEditStoreBudgetModal={() => actions.setShowEditStoreBudgetModal(false)}
          onCloseNoDataModal={() => actions.setShowNoDataModal(false)}
          onAssignmentComplete={actions.handleAssignmentComplete}
          onSaveComplete={actions.handleAssignmentComplete}
        />

        <SaveLoadingScreen 
          showSaveLoading={state.showSaveLoading} 
          saveSuccess={state.saveSuccess} 
          saveError={state.saveError} 
        />

        <ConfigurationTabsPanel
          open={state.showTabsConfigModal}
          onClose={() => actions.setShowTabsConfigModal(false)}
          initialMonth={state.selectedMonth}
          onThresholdSaved={refetch}
        />
      </div>
    </LoadingState>
  );
}