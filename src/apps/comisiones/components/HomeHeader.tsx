import React from "react";
import { Button } from "@mui/material";
import { Settings, Person } from "@mui/icons-material";
import { ExportButtons } from "./ExportButtons";
import { SimpleFilters } from "./SimpleFilters";
import { SummaryCards } from "./SummaryCards";
import { Role } from "../types";
import { useUserPolicies } from "../hooks/useUserPolicies";

interface HomeHeaderProps {
  selectedMonth: string;
  availableMonths: string[];
  selectedTiendas: string[];
  availableTiendas: string[];
  mesResumen: any;
  mesResumenFiltrado?: any;
  onMonthChange: (month: string) => void;
  onTiendaChange: (tiendas: string[]) => void;
  onShowConfigModal: () => void;
  onShowCodesModal: () => void;
  onToggleAllStores: () => void;
  expandedTiendas: Set<string>;
  filterRol: Role[];
  getFilteredComissionsForCards: (mesResumen: any) => {
    total_comisiones: number;
    comisiones_por_rol: Record<string, number>;
  };
  onRoleFilterToggle: (role: Role) => void;
  onRoleFilterClear: () => void;
  /** Callback para renderizar SummaryCards en móvil */
  renderMobileSummaryCards?: () => React.ReactNode;
  /** Indica si hay presupuesto diario asignado */
  hasBudgetData?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  selectedMonth,
  availableMonths,
  selectedTiendas,
  availableTiendas,
  mesResumen,
  mesResumenFiltrado,
  onMonthChange,
  onTiendaChange,
  onShowConfigModal,
  onShowCodesModal,
  onToggleAllStores,
  expandedTiendas,
  filterRol,
  getFilteredComissionsForCards,
  onRoleFilterToggle,
  onRoleFilterClear,
  renderMobileSummaryCards,
  hasBudgetData,
}) => {
  const { canSeeConfig, canAssignEmployees, canSeeStoreFilter } =
    useUserPolicies();

  // Determinar qué botones están visibles
  const hasVisibleButtons = (() => {
    const hasConfig = canSeeConfig();
    const hasAssign = canAssignEmployees() && hasBudgetData; // Solo mostrar botón ASIG si hay presupuesto
    const hasExport = Boolean(mesResumenFiltrado || mesResumen);

    return hasConfig || hasAssign || hasExport;
  })();

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full px-3 sm:px-6 lg:px-8 py-3">
          {/* Layout responsivo: Móvil siempre en columna, Desktop en fila */}
          <div className="flex flex-col gap-3 mb-3 lg:flex-row lg:items-end lg:gap-3">
            {/* Título + Filtros - Siempre ocupa todo el ancho en móvil, espacio disponible en desktop */}
            <div className="flex flex-col xl:flex-row xl:items-end gap-3 w-full lg:flex-1 lg:min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex-shrink-0 flex items-end">
                Comisiones
              </h1>
              <div className="flex-1 min-w-0">
                <SimpleFilters
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  selectedTiendas={selectedTiendas}
                  availableTiendas={availableTiendas}
                  onMonthChange={onMonthChange}
                  onTiendaChange={onTiendaChange}
                  showStoreFilter={canSeeStoreFilter()}
                />
              </div>
            </div>

            {/* Botones - Solo visibles en desktop o cuando hay botones disponibles */}
            {hasVisibleButtons && (
              <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0 lg:flex-row lg:items-end">
                {/* Botón Configuración - Solo para readComisionesAdmin */}
                {canSeeConfig() && (
                  <Button
                    onClick={onShowConfigModal}
                    variant="outlined"
                    startIcon={<Settings />}
                    size="small"
                    sx={{
                      minWidth: "auto",
                      px: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <span className="hidden xs:inline">Configuración</span>
                    <span className="xs:hidden">Conf</span>
                  </Button>
                )}
                {(mesResumenFiltrado || mesResumen) && (
                  <ExportButtons
                    mesResumen={mesResumenFiltrado || mesResumen}
                    mes={selectedMonth}
                  />
                )}
                {/* Botón ASIG - Solo para readComisionesAdmin y cuando hay presupuesto */}
                {canAssignEmployees() && hasBudgetData && (
                  <Button
                    onClick={onShowCodesModal}
                    variant="contained"
                    startIcon={<Person />}
                    size="small"
                    sx={{
                      minWidth: "auto",
                      px: { xs: 1.5, sm: 2 },
                      backgroundColor: "#1976d2",
                      color: "white",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "0 2px 4px rgba(25, 118, 210, 0.2)",
                      "&:hover": {
                        backgroundColor: "#1565c0",
                        boxShadow: "0 4px 8px rgba(25, 118, 210, 0.3)",
                        transform: "translateY(-1px)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    <span className="hidden xs:inline">ASIG PPTO</span>
                    <span className="xs:hidden">ASIG PPTO</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Summary Cards - Solo en desktop (md y superiores) */}
          <div className="hidden md:block mt-6">
            <SummaryCards
              mesResumen={mesResumenFiltrado || mesResumen}
              onToggleAllStores={onToggleAllStores}
              expandedTiendas={expandedTiendas}
              filterRol={filterRol}
              getFilteredComissionsForCards={getFilteredComissionsForCards}
              onRoleFilterToggle={onRoleFilterToggle}
              onRoleFilterClear={onRoleFilterClear}
            />
          </div>
        </div>
      </header>

      {/* Summary Cards - Solo en móvil (< md) - SIN STICKY para scroll normal */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="max-w-full px-3 sm:px-6 lg:px-8 py-4">
          {renderMobileSummaryCards ? (
            renderMobileSummaryCards()
          ) : (
            <SummaryCards
              mesResumen={mesResumenFiltrado || mesResumen}
              onToggleAllStores={onToggleAllStores}
              expandedTiendas={expandedTiendas}
              filterRol={filterRol}
              getFilteredComissionsForCards={getFilteredComissionsForCards}
              onRoleFilterToggle={onRoleFilterToggle}
              onRoleFilterClear={onRoleFilterClear}
            />
          )}
        </div>
      </div>
    </>
  );
};
