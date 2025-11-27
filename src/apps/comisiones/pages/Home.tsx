import React, { useState, useMemo, useEffect } from "react";
import { useCommission } from "../contexts/CommissionContext";
import { CSVUpload } from "../components/CSVUpload";
import { ConfigurationPanel } from "../components/ConfigurationPanel";
import { CompactFilters } from "../components/CompactFilters";
import { DataTable } from "../components/DataTable";
import { SummaryCards } from "../components/SummaryCards";
import { Charts } from "../components/Charts";
import { ExportButtons } from "../components/ExportButtons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getAvailableMonths,
  getCurrentMonth,
  calculateMesResumenMemoized,
} from "../lib/calculations";
import {
  demoBudgets,
  demoStaff,
  demoMonthConfigs,
  demoVentas,
} from "../lib/demoData";
import { validateStaffAssignment } from "../lib/validation";
import { Settings, AlertTriangle } from "lucide-react";

export default function Home() {
  const {
    state,
    setBudgets,
    setStaff,
    setMonthConfigs,
    setVentas,
  } = useCommission();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  
  // Filter states
  const [filterTienda, setFilterTienda] = useState("all");
  const [filterRol, setFilterRol] = useState("all");

  // Obtener meses disponibles
  const availableMonths = useMemo(() => {
    const months = getAvailableMonths(state.budgets);
    return months.length > 0 ? months : [getCurrentMonth()];
  }, [state.budgets]);

  // Asegurar que el mes seleccionado sea válido
  useEffect(() => {
    if (
      availableMonths.length > 0 &&
      !availableMonths.includes(selectedMonth)
    ) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // Obtener configuración del mes
  const monthConfig = state.monthConfigs.find((c) => c.mes === selectedMonth);
  const porcentajeGerente = monthConfig?.porcentaje_gerente || 10;

  // Calcular resumen del mes
  const mesResumen = useMemo(() => {
    if (state.budgets.length === 0) return null;
    return calculateMesResumenMemoized(
      selectedMonth,
      state.budgets,
      state.staff,
      state.ventas,
      porcentajeGerente,
      [
        selectedMonth,
        state.budgets,
        state.staff,
        state.ventas,
        porcentajeGerente,
      ]
    );
  }, [
    selectedMonth,
    state.budgets,
    state.staff,
    state.ventas,
    porcentajeGerente,
  ]);

  // Obtener tiendas únicas para filtros
  const uniqueTiendas = useMemo(() => {
    if (!mesResumen) return [];
    const tiendas = mesResumen.tiendas.map(t => t.tienda);
    return [...new Set(tiendas)].sort();
  }, [mesResumen]);

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFilterTienda('all');
    setFilterRol('all');
    if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  };

  // Validar asignación de personal
  const staffValidationErrors = useMemo(() => {
    return validateStaffAssignment(state.staff);
  }, [state.staff]);

  // Manejar carga de datos de demo
  const handleLoadDemo = () => {
    setBudgets(demoBudgets);
    setStaff(demoStaff);
    setMonthConfigs(demoMonthConfigs);
    setVentas(demoVentas);
    setSelectedMonth(getCurrentMonth());
    setShowDemo(false);
  };

  // Cargar datos de demo al iniciar
  useEffect(() => {
    handleLoadDemo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Comisiones {selectedMonth}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfigModal(true)}
                variant="outline"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </Button>
              {mesResumen && (
                <ExportButtons mesResumen={mesResumen} mes={selectedMonth} />
              )}
            </div>
          </div>
          
          {/* Compact Filters */}
          {state.budgets.length > 0 && (
            <CompactFilters
              selectedMonth={selectedMonth}
              availableMonths={availableMonths}
              onMonthChange={setSelectedMonth}
              filterTienda={filterTienda}
              onFilterTiendaChange={setFilterTienda}
              filterRol={filterRol}
              onFilterRolChange={setFilterRol}
              uniqueTiendas={uniqueTiendas}
              onClearFilters={handleClearFilters}
            />
          )}
        </div>
      </header>

      {/* Modal de Demo */}
      {showDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4">Cargar Datos de Demo</h2>
            <p className="text-gray-600 mb-6">
              Esto cargará datos de ejemplo con 3 tiendas, empleados y ventas
              para el mes actual.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleLoadDemo}
                variant="default"
                className="flex-1"
              >
                Cargar Demo
              </Button>
              <Button
                onClick={() => setShowDemo(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Sección de Configuración - MOVED TO MODAL */}
          {/* {showConfig && (
            <section>
              Controles de Filtro
              <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">1. Filtros y Mes</h2>
                <FilterControls
                  selectedMonth={selectedMonth}
                  availableMonths={availableMonths}
                  onMonthChange={setSelectedMonth}
                  filterTienda={""}
                  onFilterTiendaChange={() => {}}
                  filterRol={""}
                  onFilterRolChange={() => {}}
                  uniqueTiendas={[]}
                  totalTiendas={mesResumen?.tiendas.length || 0}
                />
              </div>

              Cargar Presupuestos dentro de Configuración
              <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  2. Cargar Presupuestos
                </h2>
                <CSVUpload />
              </div>

              Panel de Configuración (solo si hay presupuestos cargados)
              {state.budgets.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">
                    3. Configuración Avanzada
                  </h2>
                  <ConfigurationPanel mes={selectedMonth} />
                </div>
              )}
            </section>
          )} */}

          {/* Alertas de Validación */}
          {staffValidationErrors.length > 0 && (
            <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Advertencias de Configuración
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {staffValidationErrors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Sección de Datos */}
          {state.budgets.length > 0 && mesResumen && (
            <>
              {/* Resumen Ejecutivo */}
              <section className="space-y-4">
                <SummaryCards mesResumen={mesResumen} />
              </section>

              {/* Tabla de Datos */}
              <section className="space-y-4 pt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Detalle de Comisiones
                  </h2>
                </div>
                <DataTable
                  tiendas={mesResumen.tiendas}
                  selectedMonth={selectedMonth}
                  onVentasUpdate={(
                    tienda,
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
                />
              </section>

              {/* Gráficos */}
              <section className="space-y-4 pt-8">
                <h2 className="text-xl font-semibold">Análisis Visual</h2>
                <Charts mesResumen={mesResumen} />
              </section>
            </>
          )}
        </div>
      </main>

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="w-[95vw] max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración de Comisiones</DialogTitle>
            <DialogDescription>
              Configure los presupuestos y parámetros de comisiones para el mes seleccionado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cargar Presupuestos */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">
                1. Cargar Presupuestos
              </h2>
              <CSVUpload />
            </div>

            {/* Panel de Configuración (solo si hay presupuestos cargados) */}
            {state.budgets.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">
                  2. Configuración Avanzada
                </h2>
                <ConfigurationPanel mes={selectedMonth} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

