import React, { useState, useMemo, useEffect, useRef } from "react";
import { useCommission } from "../contexts/CommissionContext";
import { useAuth } from "@/auth/hooks/useAuth";
import { CSVUpload } from "../components/CSVUpload";
import { ConfigurationPanel } from "../components/ConfigurationPanel";
import { MobileAccordionFilters } from "../components/MobileAccordionFilters";
import { DataTable } from "../components/DataTable";
import { SummaryCards } from "../components/SummaryCards";
import { Charts } from "../components/Charts";
import { ExportButtons } from "../components/ExportButtons";
import { CodesModal } from "../components/CodesModal";
import { NoDataModal } from "../components/NoDataModal";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  Fade,
} from "@mui/material";
import {
  getAvailableMonths,
  calculateMesResumenAgrupado,
} from "../lib/calculations";
import { VentasData, Role } from "../types";
import {
  obtenerTiendas,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
  obtenerVentasEmpleados,
} from "../api/directus/read";
import { validateStaffAssignment } from "../lib/validation";
import { Settings, AlertTriangle, Users } from "lucide-react";

export default function Home() {
  const { state, setBudgets, setStaff, setMonthConfigs, setVentas } =
    useCommission();
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState("Nov 2025");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Filter states
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState<Role | "all">("all");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");
  const [expandedTiendas, setExpandedTiendas] = useState<Set<string>>(
    new Set()
  );

  // Estados para datos adicionales
  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);

  // Control para evitar recargas innecesarias
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  // Mostrar modal cuando no hay datos después de cargar
  useEffect(() => {
    if (
      dataLoadAttempted &&
      state.budgets.length === 0 &&
      state.staff.length === 0
    ) {
      setShowNoDataModal(true);
    }
  }, [dataLoadAttempted, state.budgets.length, state.staff.length]);

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
    if (!mesResumen) return null;

    let tiendasFiltradas = mesResumen.tiendas;

    // Filtrar por tienda
    if (filterTienda && filterTienda.length > 0) {
      tiendasFiltradas = tiendasFiltradas.filter((t: any) =>
        filterTienda.includes(t.tienda)
      );
    }

    // Filtrar empleados por rol dentro de cada tienda
    if (filterRol !== "all") {
      tiendasFiltradas = tiendasFiltradas
        .map((tienda: any) => ({
          ...tienda,
          empleados: tienda.empleados.filter(
            (emp: any) => emp.rol === filterRol
          ),
        }))
        .filter((tienda: any) => tienda.empleados.length > 0);
    }

    // Filtrar por rango de fechas
    if (filterFechaInicio || filterFechaFin) {
      tiendasFiltradas = tiendasFiltradas
        .map((tienda: any) => ({
          ...tienda,
          empleados: tienda.empleados.filter((emp: any) => {
            const fechaInicioFiltro = filterFechaInicio || "2025-01-01";
            const fechaFinFiltro = filterFechaFin || "2025-12-31";
            return (
              emp.fecha >= fechaInicioFiltro && emp.fecha <= fechaFinFiltro
            );
          }),
        }))
        .filter((tienda: any) => tienda.empleados.length > 0);
    }

    // Recalcular totales
    const total_comisiones = tiendasFiltradas.reduce(
      (sum: number, t: any) => sum + t.total_comisiones,
      0
    );

    // Recalcular comisiones por rol
    const comisiones_por_rol: Record<string, number> = {
      gerente: 0,
      asesor: 0,
      cajero: 0,
      logistico: 0,
    };

    tiendasFiltradas.forEach((tienda: any) => {
      tienda.empleados.forEach((empleado: any) => {
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
  }, [mesResumen, filterTienda, filterRol, filterFechaInicio, filterFechaFin]);

  // Obtener tiendas únicas para filtros
  const uniqueTiendas = useMemo((): string[] => {
    if (!mesResumen) return [];
    const tiendas = mesResumen.tiendas.map((t: any): string => t.tienda);
    return Array.from(new Set(tiendas)).sort() as string[];
  }, [mesResumen]);

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFilterTienda([]);
    setFilterRol("all");
    setFilterFechaInicio("");
    setFilterFechaFin("");
  };

  // Handler para cambios en filtro de tienda
  const handleFilterTiendaChange = (value: string | string[]) => {
    const tiendaArray = Array.isArray(value) ? value : [value].filter(Boolean);
    setFilterTienda(tiendaArray);
  };

  // Handler wrapper para cambios en filtro de rol
  const handleFilterRolChangeWrapper = (rol: string) => {
    setFilterRol(rol as Role | "all");
  };

  // Handler para cambios en filtro de rol desde las cards
  const handleFilterRolChange = (rol: Role | "all" | "") => {
    setFilterRol(rol as Role | "all");

    if (rol !== "all") {
      setExpandedTiendas(
        new Set(
          (mesResumenFiltrado || mesResumen)?.tiendas.map(
            (t: any) => t.tienda
          ) || []
        )
      );
    } else {
      if (expandedTiendas.size > 0) {
        setExpandedTiendas(new Set());
      }
    }
  };

  // Handler para toggle de todas las tiendas
  const handleToggleAllStores = () => {
    const allTiendas =
      (mesResumenFiltrado || mesResumen)?.tiendas.map((t: any) => t.tienda) ||
      [];
    if (expandedTiendas.size === 0) {
      setExpandedTiendas(new Set(allTiendas));
    } else {
      setExpandedTiendas(new Set());
    }
  };

  // Resetear filtros cuando cambia el mes
  useEffect(() => {
    setFilterTienda([]);
    setFilterRol("all");
    setFilterFechaInicio("");
    setFilterFechaFin("");
  }, [selectedMonth]);

  // Validar asignación de personal
  const staffValidationErrors = useMemo(() => {
    return validateStaffAssignment(state.staff);
  }, [state.staff]);

  // Función auxiliar para convertir nombre de mes a número
  const getMonthNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      Ene: "01",
      Feb: "02",
      Mar: "03",
      Abr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Ago: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dic: "12",
    };
    return months[monthName] || "01";
  };

  // Función para cargar datos
  const loadDataForMonth = async () => {
    try {
      const [mesNombre, anio] = selectedMonth.split(" ");
      const mesMap: { [key: string]: string } = {
        Ene: "01",
        Feb: "02",
        Mar: "03",
        Abr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Ago: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dic: "12",
      };
      const mesNumero = mesMap[mesNombre];

      // Obtener último día del mes
      const ultimoDia = new Date(
        parseInt(anio),
        parseInt(mesNumero),
        0
      ).getDate();
      const fechaInicio = `${anio}-${mesNumero}-01`;
      const fechaFin = `${anio}-${mesNumero}-${ultimoDia}`;

      // Cargar todos los datos en paralelo
      const [
        tiendas,
        asesores,
        cargos,
        presupuestosDiarios,
        porcentajesBD,
        presupuestosEmpleadosData,
        ventasEmpleados,
      ] = await Promise.all([
        obtenerTiendas(),
        obtenerAsesores(),
        obtenerCargos(),
        obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin),
        obtenerPorcentajesMensuales(undefined, selectedMonth),
        obtenerPresupuestosEmpleados(undefined, fechaFin),
        obtenerVentasEmpleados(undefined, fechaFin),
      ]);

      // Validaciones críticas
      if (tiendas.length === 0) {
        setModalTitle("Sin Tiendas Asociadas");
        setModalMessage(
          "No tienes tiendas asociadas en el sistema. Contacta al administrador para asignarte permisos de acceso a las tiendas correspondientes."
        );
        setShowNoDataModal(true);
        return;
      }

      if (presupuestosDiarios.length === 0) {
        setShowNoDataModal(true);
        setBudgets([]);
        setStaff([]);
        setMonthConfigs([]);
        setVentas([]);
        setPresupuestosEmpleados([]);
        setCargos(cargos);
        return;
      }

      // Convertir presupuestos diarios a BudgetRecord
      const budgets = presupuestosDiarios.map((p: any) => {
        const tienda = tiendas.find((t: any) => t.id === p.tienda_id);
        const presupuesto = parseFloat(p.presupuesto) || 0;
        return {
          tienda: tienda?.nombre || `Tienda ID ${p.tienda_id}`,
          tienda_id: p.tienda_id,
          empresa: tienda?.empresa || "Empresa Desconocida",
          fecha: p.fecha,
          presupuesto_total: presupuesto,
        };
      });

      // Agregar tiendas sin presupuestos diarios con presupuesto 0
      const tiendasConPresupuestos = new Set(
        presupuestosDiarios.map((p: any) => p.tienda_id)
      );

      tiendas.forEach((tienda: any) => {
        if (!tiendasConPresupuestos.has(tienda.id)) {
          budgets.push({
            tienda: tienda.nombre,
            tienda_id: tienda.id,
            empresa: tienda.empresa || "Empresa Desconocida",
            fecha: fechaFin,
            presupuesto_total: 0,
          });
        }
      });

      // Crear staff basado en presupuestos asignados
      const staff: any[] = [];
      let presupuestosDelMes = presupuestosEmpleadosData.filter((pe: any) => {
        return pe.fecha >= fechaInicio && pe.fecha <= fechaFin;
      });

      // Crear staff basado en presupuestos asignados
      presupuestosDelMes.forEach((pe: any) => {
        const asesor = asesores.find((a: any) => a.id === pe.asesor);
        if (!asesor) return;

        const tienda = tiendas.find((t: any) => t.id === pe.tienda_id);

        // Obtener nombre del cargo
        let cargoNombre = "asesor";
        if (typeof pe.cargo === "string") {
          cargoNombre = pe.cargo.toLowerCase();
        } else if (typeof pe.cargo === "number") {
          const cargo = cargos.find((c: any) => c.id === pe.cargo);
          cargoNombre = cargo ? cargo.nombre.toLowerCase() : "asesor";
        }

        // Mapear a roles estándar
        const rol =
          cargoNombre === "gerente"
            ? "gerente"
            : cargoNombre === "asesor"
            ? "asesor"
            : cargoNombre === "cajero"
            ? "cajero"
            : "logistico";

        staff.push({
          id: asesor.id.toString(),
          nombre: asesor.nombre || `Empleado ${asesor.id}`,
          tienda: tienda?.nombre || `Tienda ID ${pe.tienda_id}`,
          fecha: pe.fecha,
          rol: rol,
          cargo_id: pe.cargo,
        });
      });

      // Agregar empleados adicionales de todas las tiendas
      const empleadosConPresupuestos = new Set(
        presupuestosDelMes.map((pe: any) => pe.asesor.toString())
      );

      asesores.forEach((asesor: any) => {
        if (!empleadosConPresupuestos.has(asesor.id.toString())) {
          const tiendaAsesor = tiendas.find(
            (t: any) => t.id === asesor.tienda_id
          );
          if (tiendaAsesor) {
            let rol = "asesor";
            if (asesor.cargo_id) {
              const cargo = cargos.find((c: any) => c.id === asesor.cargo_id);
              if (cargo) {
                const cargoNombre = cargo.nombre.toLowerCase();
                rol =
                  cargoNombre === "gerente"
                    ? "gerente"
                    : cargoNombre === "asesor"
                    ? "asesor"
                    : cargoNombre === "cajero"
                    ? "cajero"
                    : "logistico";
              }
            }

            staff.push({
              id: asesor.id.toString(),
              nombre: asesor.nombre || `Empleado ${asesor.id}`,
              tienda: tiendaAsesor.nombre,
              fecha: fechaFin,
              rol: rol,
              cargo_id:
                typeof asesor.cargo_id === "object"
                  ? asesor.cargo_id.id
                  : asesor.cargo_id,
            });
          }
        }
      });

      // Convertir configuraciones de porcentajes
      const monthConfigs = porcentajesBD.map((p: any) => {
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
          porcentaje_gerente: p.gerente_porcentaje,
        };
      });

      // Procesar ventas por empleado
      let ventasDelMes = ventasEmpleados.filter((ve: any) => {
        return ve.fecha >= fechaInicio && ve.fecha <= fechaFin;
      });

      const ventasMap = new Map<string, any>();

      ventasDelMes.forEach((ve: any) => {
        const tienda = tiendas.find((t: any) => t.id === ve.tienda_id);
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
        ventaData.ventas_por_asesor[ve.asesor_id.toString()] = ve.venta;
        ventaData.ventas_tienda += ve.venta;
      });

      const ventas = Array.from(ventasMap.values());

      // Guardar todo en el contexto
      setBudgets(budgets);
      setStaff(staff);
      setMonthConfigs(monthConfigs);
      setVentas(ventas);
      setPresupuestosEmpleados(presupuestosEmpleadosData);
      setCargos(cargos);
    } catch (error: any) {
      setShowNoDataModal(true);
      setBudgets([]);
      setStaff([]);
      setMonthConfigs([]);
      setVentas([]);
      setPresupuestosEmpleados([]);
    }
  };

  // Cargar datos solo una vez por mes
  useEffect(() => {
    if (loadedMonthsRef.current.has(selectedMonth)) {
      return;
    }

    if (!user) {
      return;
    }

    const loadData = async () => {
      try {
        await loadDataForMonth();
        loadedMonthsRef.current.add(selectedMonth);
        setDataLoadAttempted(true);
      } catch (error) {
        setDataLoadAttempted(true);
        setShowNoDataModal(true);
      }
    };

    loadData();
  }, [selectedMonth, user]);

  // Función para recargar datos
  const reloadContextData = async () => {
    await loadDataForMonth();
  };

  const handleAssignmentComplete = () => {
    reloadContextData();
  };

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

              {/* {(filterTienda.length > 0 ||
                filterRol !== "all" ||
                filterFechaInicio ||
                filterFechaFin) && (
                <span className="text-blue-600">
                  • Filtrado por:{" "}
                  {filterTienda.length > 0
                    ? `Tiendas: ${filterTienda.join(", ")}`
                    : ""}
                  {filterTienda.length > 0 &&
                  (filterRol !== "all" || filterFechaInicio || filterFechaFin)
                    ? " • "
                    : ""}
                  {filterRol !== "all" ? `Rol "${filterRol}"` : ""}
                  {filterRol !== "all" && (filterFechaInicio || filterFechaFin)
                    ? " • "
                    : ""}
                  {filterFechaInicio || filterFechaFin
                    ? `Fechas: ${filterFechaInicio || "..."} - ${
                        filterFechaFin || "..."
                      }`
                    : ""}
                </span>
              )} */}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* <Button
              onClick={() => setShowConfigModal(true)}
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
            </Button> */}
            {(mesResumenFiltrado || mesResumen) && (
              <ExportButtons
                mesResumen={mesResumenFiltrado || mesResumen}
                mes={selectedMonth}
              />
            )}
            {/*  <Button
              onClick={() => setShowCodesModal(true)}
              variant="outlined"
              startIcon={<Users />}
              size="small"
              sx={{ minWidth: "auto", px: { xs: 1.5, sm: 2 } }}
            >
              <span className="hidden xs:inline">Asignar</span>
              <span className="xs:hidden">Asig</span>
            </Button> */}
          </div>

          {/* Mobile Accordion Filters */}
          <MobileAccordionFilters
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onFilterRolChange={handleFilterRolChangeWrapper}
            onMonthChange={setSelectedMonth}
            filterTienda={filterTienda}
            onFilterTiendaChange={handleFilterTiendaChange}
            filterRol={filterRol}
            filterFechaInicio={filterFechaInicio}
            onFilterFechaInicioChange={setFilterFechaInicio}
            filterFechaFin={filterFechaFin}
            onFilterFechaFinChange={setFilterFechaFin}
            onClearFilters={handleClearFilters}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
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
          <section className="space-y-8">
            {/* Resumen Ejecutivo */}
            <section className="space-y-4">
              <SummaryCards
                mesResumen={mesResumenFiltrado || mesResumen}
                onFilterRolChange={handleFilterRolChange}
                onToggleAllStores={handleToggleAllStores}
                currentFilterRol={filterRol}
                expandedTiendas={expandedTiendas}
              />
            </section>

            {/* Tabla de Datos */}
            <section className="space-y-4 pt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Detalle de Comisiones</h2>
                <div className="text-sm text-gray-500">
                  Empleados: {state.staff.length} | Tiendas:{" "}
                  {uniqueTiendas.length}
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

      {/* Configuration Modal */}
      <Dialog
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Configuración de Comisiones</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Configure los presupuestos y parámetros de comisiones para el mes
            seleccionado.
          </DialogContentText>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Panel de Configuración */}
            {state.budgets.length > 0 && (
              <div
                style={{
                  padding: "24px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}
                >
                  Configuración Avanzada
                </h2>
                <ConfigurationPanel mes={selectedMonth} />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Codes Modal */}
      <CodesModal
        isOpen={showCodesModal}
        onClose={() => setShowCodesModal(false)}
        selectedMonth={selectedMonth}
        onAssignmentComplete={(ventasData) => {
          handleAssignmentComplete();
          setShowCodesModal(false);
        }}
      />

      {/* No Data Modal */}
      <NoDataModal
        open={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        tiendaNombre="todas las tiendas"
        mesSeleccionado={selectedMonth}
        title={modalTitle}
        message={modalMessage}
      />
    </div>
  );
}
