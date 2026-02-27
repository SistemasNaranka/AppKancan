import React from "react";
import { Button, Box } from "@mui/material";
import {
  Settings,
  Person,
  Store,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { ExportButtons } from "./ExportButtons";
import { SimpleFilters } from "./SimpleFilters";
import { SummaryCards } from "../SummaryCards";
import { Role } from "../../types";
import { useUserPolicies } from "../../hooks/useUserPolicies";

interface HomeHeaderProps {
  selectedMonth: string;
  availableMonths: string[];
  selectedTiendas: string[];
  availableTiendas: string[];
  mesResumen: any;
  mesResumenFiltrado?: any;
  onMonthChange: (month: string) => void;
  onTiendaChange: (tiendas: string[]) => void;
  onShowCodesModal: () => void;
  onShowConfigModal: () => void;
  onShowEditStoreModal: () => void;
  onShowEditStoreBudgetModal: () => void;
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
  /** Indica si hay presupuesto diario asignado para el día de hoy */
  hasBudgetData?: boolean;
  /** Cantidad de días sin presupuesto asignado en el mes */
  missingDaysCount?: number;
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
  onShowCodesModal,
  onShowConfigModal,
  onShowEditStoreModal,
  onShowEditStoreBudgetModal,
  onToggleAllStores,
  expandedTiendas,
  filterRol,
  getFilteredComissionsForCards,
  onRoleFilterToggle,
  onRoleFilterClear,
  renderMobileSummaryCards,
  hasBudgetData,
  missingDaysCount = 0,
}) => {
  const { canSeeConfig, canAssignEmployees, canSeeStoreFilter, hasPolicy } =
    useUserPolicies();

  // 🚀 LOG: Verificar valor de missingDaysCount
  React.useEffect(() => {}, [missingDaysCount]);

  // Determinar qué botones están visibles
  const hasVisibleButtons = (() => {
    const hasConfig = canSeeConfig();
    const hasEditBudget = canAssignEmployees(); // Botón EDITAR PRESUPUESTO siempre visible para quienes pueden asignar
    const hasExport = Boolean(mesResumenFiltrado || mesResumen);

    return hasConfig || hasEditBudget || hasExport;
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
                  <>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onShowConfigModal();
                      }}
                      variant="outlined"
                      startIcon={<Settings />}
                      size="small"
                      sx={{
                        lineHeight: 2.2,
                        minWidth: "auto",
                        px: { xs: 1.5, sm: 2 },
                      }}
                    >
                      <span className="hidden xs:inline">Configuración</span>
                      <span className="xs:hidden">Conf</span>
                    </Button>
                  </>
                )}
                {(mesResumenFiltrado || mesResumen) && (
                  <ExportButtons
                    mesResumen={mesResumenFiltrado || mesResumen}
                    mes={selectedMonth}
                  />
                )}
                {/* Botón EDITAR PRESUPUESTO - Dependiendo del rol y si hay presupuesto del día */}
                {canAssignEmployees() && (
                  <Box sx={{ position: "relative" }}>
                    {/* Aviso de días pendientes - Para Tiendas y Admins cuando hay filtro */}
                    {/* Mostrar aviso cuando hay días pendientes O cuando no hay presupuesto para el día de hoy */}
                    {(missingDaysCount > 0 || hasBudgetData === false) && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          left: "50%",
                          transform: "translateX(-50%)",
                          bgcolor: "#fff4e5",
                          color: "#663000",
                          px: 1.75,
                          py: 0.4,
                          borderRadius: 1.5,
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          border: "1.5px solid #ffb74d",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          zIndex: 10,
                          animation: "bounce 2s infinite",
                          "@keyframes bounce": {
                            "0%, 20%, 50%, 80%, 100%": {
                              transform: "translateX(-50%) translateY(0)",
                            },
                            "40%": {
                              transform: "translateX(-50%) translateY(-6px)",
                            },
                            "60%": {
                              transform: "translateX(-50%) translateY(-3px)",
                            },
                          },
                        }}
                      >
                        <AssignmentIcon
                          sx={{
                            fontSize: 16,
                            color: "#f57c00",
                          }}
                        />
                        {missingDaysCount === 1
                          ? "1 día pendiente"
                          : missingDaysCount === 0 && hasBudgetData === false
                            ? "1 día pendiente"
                            : `${missingDaysCount} días pendientes`}
                      </Box>
                    )}

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Si es tienda:
                        // - Si NO hay presupuesto del día de hoy, abre CodesModal (asignación inicial)
                        // - Si SÍ hay presupuesto del día de hoy, abre EditStoreBudgetModal (edición con fecha)
                        if (hasPolicy("readComisionesTienda")) {
                          if (hasBudgetData === false) {
                            // No hay presupuesto del día de hoy, abrir CodesModal
                            onShowCodesModal();
                          } else {
                            // Hay presupuesto del día de hoy, abrir EditStoreBudgetModal
                            onShowEditStoreBudgetModal();
                          }
                        } else if (hasPolicy("readComisionesAdmin")) {
                          // Admin siempre abre EditStoreModal
                          onShowEditStoreModal();
                        }
                      }}
                      variant="contained"
                      startIcon={
                        hasPolicy("readComisionesTienda") ? (
                          <Person />
                        ) : (
                          <Store />
                        )
                      }
                      size="small"
                      sx={{
                        lineHeight: 2.2,
                        minWidth: "auto",
                        px: { xs: 1.5, sm: 2 },
                        backgroundColor: "#1976d2",
                        color: "white",
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        "&:hover": {
                          backgroundColor: "#1565c0",
                          boxShadow: "0 4px 8px rgba(25, 118, 210, 0.3)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      EDITAR PRESUPUESTO
                    </Button>
                  </Box>
                )}
              </div>
            )}
          </div>

          {/* Summary Cards - Solo en desktop (md y superiores) */}
          <div className="hidden md:block mt-6">
            <SummaryCards
              mesResumen={mesResumen}
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
              mesResumen={mesResumen}
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
