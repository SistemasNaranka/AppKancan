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
  mockTiendas,
  mockAsesores,
  mockPresupuestosDiarios,
  mockPorcentajesMensuales,
  mockPresupuestosEmpleados,
  mockVentasEmpleados,
  mockVentasTienda,
} from "../lib/mockData";
import { validateStaffAssignment } from "../lib/validation";
import { Settings, AlertTriangle } from "lucide-react";

export default function Home() {
  const { state, setBudgets, setStaff, setMonthConfigs, setVentas } =
    useCommission();
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

  // Aplicar filtros al resumen mensual
  const mesResumenFiltrado = useMemo(() => {
    if (!mesResumen) return null;

    let tiendasFiltradas = mesResumen.tiendas;

    // Filtrar por tienda
    if (filterTienda && filterTienda !== "all") {
      tiendasFiltradas = tiendasFiltradas.filter(
        (t) => t.tienda === filterTienda
      );
    }

    // Filtrar empleados por rol dentro de cada tienda
    if (filterRol && filterRol !== "all") {
      tiendasFiltradas = tiendasFiltradas
        .map((tienda) => ({
          ...tienda,
          empleados: tienda.empleados.filter((emp) => emp.rol === filterRol),
        }))
        .filter((tienda) => tienda.empleados.length > 0); // Solo tiendas con empleados filtrados
    }

    // Recalcular totales
    const total_comisiones = tiendasFiltradas.reduce(
      (sum, t) => sum + t.total_comisiones,
      0
    );

    // Recalcular comisiones por rol
    const comisiones_por_rol: Record<string, number> = {
      gerente: 0,
      asesor: 0,
      cajero: 0,
    };

    tiendasFiltradas.forEach((tienda) => {
      tienda.empleados.forEach((empleado) => {
        comisiones_por_rol[empleado.rol] += empleado.comision_monto;
      });
    });

    Object.keys(comisiones_por_rol).forEach((role) => {
      comisiones_por_rol[role as keyof typeof comisiones_por_rol] =
        Math.round(
          comisiones_por_rol[role as keyof typeof comisiones_por_rol] * 100
        ) / 100;
    });

    return {
      ...mesResumen,
      tiendas: tiendasFiltradas,
      total_comisiones: Math.round(total_comisiones * 100) / 100,
      comisiones_por_rol,
    };
  }, [mesResumen, filterTienda, filterRol]);

  // Obtener tiendas únicas para filtros (basado en datos sin filtrar)
  const uniqueTiendas = useMemo(() => {
    if (!mesResumen) return [];
    const tiendas = mesResumen.tiendas.map((t) => t.tienda);
    return [...new Set(tiendas)].sort();
  }, [mesResumen]);

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFilterTienda("all");
    setFilterRol("all");
  };

  // Resetear filtros cuando cambia el mes
  useEffect(() => {
    setFilterTienda("all");
    setFilterRol("all");
  }, [selectedMonth]);

  // Validar asignación de personal
  const staffValidationErrors = useMemo(() => {
    return validateStaffAssignment(state.staff);
  }, [state.staff]);

  // Función para convertir datos mock al formato del contexto
  const convertMockDataToContext = () => {
    // Convertir presupuestos diarios a BudgetRecord
    const budgets = mockPresupuestosDiarios.map((p) => ({
      tienda:
        mockTiendas.find((t) => t.id === p.tienda_id)?.nombre ||
        "Tienda Desconocida",
      fecha: p.fecha,
      presupuesto_total: p.presupuesto,
    }));

    // Convertir asesores a StaffMember - usar fechas de presupuestos empleados
    const staff: any[] = [];
    mockPresupuestosEmpleados.forEach((pe) => {
      const asesor = mockAsesores.find((a) => a.id === pe.asesor_id);
      if (asesor) {
        staff.push({
          id: asesor.id.toString(),
          nombre: asesor.nombre || `Empleado ${asesor.codigo_asesor}`,
          tienda:
            mockTiendas.find((t) => t.id === asesor.tienda_id)?.nombre ||
            "Tienda Desconocida",
          fecha: pe.fecha,
          rol: (asesor.cargo_id === 1
            ? "gerente"
            : asesor.cargo_id === 2
            ? "asesor"
            : "cajero") as any,
        });
      }
    });

    // Convertir porcentajes a MonthConfig
    const monthConfigs = mockPorcentajesMensuales.map((p) => {
      // Convertir fecha YYYY-MM a formato "MMM YYYY"
      const [year, month] = p.fecha.split("-");
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const monthName = monthNames[parseInt(month) - 1];
      return {
        mes: `${monthName} ${year}`,
        porcentaje_gerente: p.porcentaje_gerente,
      };
    });

    // Crear ventas data agrupadas por tienda y fecha
    const ventasMap = new Map<string, any>();

    mockVentasEmpleados.forEach((ve) => {
      const asesor = mockAsesores.find((a) => a.id === ve.asesor_id);
      if (!asesor) return;

      const tienda = mockTiendas.find((t) => t.id === asesor.tienda_id);
      if (!tienda) return;

      const key = `${tienda.nombre}-${ve.fecha}`;

      if (!ventasMap.has(key)) {
        ventasMap.set(key, {
          tienda: tienda.nombre,
          fecha: ve.fecha,
          ventas_tienda: 0,
          ventas_por_asesor: {},
        });
      }

      const ventaData = ventasMap.get(key);
      ventaData.ventas_por_asesor[ve.asesor_id.toString()] = ve.ventas;
      ventaData.ventas_tienda += ve.ventas;
    });

    const ventas = Array.from(ventasMap.values());

    return { budgets, staff, monthConfigs, ventas };
  };

  // Manejar carga de datos de demo
  const handleLoadDemo = () => {
    const { budgets, staff, monthConfigs, ventas } = convertMockDataToContext();
    setBudgets(budgets);
    setStaff(staff);
    setMonthConfigs(monthConfigs);
    setVentas(ventas);
    setSelectedMonth("Nov 2025");
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
              {(filterTienda !== "all" || filterRol !== "all") && (
                <p className="text-sm text-gray-600 mt-1">
                  Filtrado por:{" "}
                  {filterTienda !== "all" ? `Tienda "${filterTienda}"` : ""}
                  {filterTienda !== "all" && filterRol !== "all" ? " • " : ""}
                  {filterRol !== "all" ? `Rol "${filterRol}"` : ""}
                </p>
              )}
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
              {(mesResumenFiltrado || mesResumen) && (
                <ExportButtons
                  mesResumen={mesResumenFiltrado || mesResumen}
                  mes={selectedMonth}
                />
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
              Esto cargará datos de ejemplo con la nueva lógica de comisiones:
              <br />• 3 tiendas con presupuestos diarios
              <br />• Empleados con códigos de identificación
              <br />• Cálculos automáticos: Ventas ÷ Presupuesto = Cumplimiento
              <br />• Comisiones basadas en porcentaje de cumplimiento
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
          {state.budgets.length > 0 && (mesResumenFiltrado || mesResumen) && (
            <>
              {/* Resumen Ejecutivo */}
              <section className="space-y-4">
                <SummaryCards mesResumen={mesResumenFiltrado || mesResumen} />
              </section>

              {/* Tabla de Datos */}
              <section className="space-y-4 pt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Detalle de Comisiones
                  </h2>
                </div>
                <DataTable
                  tiendas={(mesResumenFiltrado || mesResumen)?.tiendas || []}
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
                <Charts mesResumen={mesResumenFiltrado || mesResumen} />
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
              Configure los presupuestos y parámetros de comisiones para el mes
              seleccionado.
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
