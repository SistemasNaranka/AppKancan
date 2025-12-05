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
  getCurrentMonth,
  calculateMesResumenAgrupado,
  calculateMesResumenMemoized,
} from "../lib/calculations";
import { VentasData } from "../types";
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
  const [refreshData, setRefreshData] = useState(0); // Para forzar recarga de datos

  // Filter states
  const [filterTienda, setFilterTienda] = useState<string[]>([]);
  const [filterRol, setFilterRol] = useState("all");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");

  // Estado para presupuestos diarios
  const [hasDailyBudgets, setHasDailyBudgets] = useState(false);
  const [checkingBudgets, setCheckingBudgets] = useState(false);

  // Estado para presupuestos empleados
  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);

  // Estado para cargos (para mapear IDs a nombres)
  const [cargos, setCargos] = useState<any[]>([]);

  // Estado para controlar carga de datos y evitar recargas innecesarias
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  // Control para evitar que useMemo se ejecute múltiples veces
  const mesResumenRef = useRef<any>(null);
  const lastMesResumenDepsRef = useRef<string>("");

  // Estado para controlar si ya se intentó cargar datos
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);

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
    return months.length > 0 ? months : ["Nov 2025"]; // Default to November if no data
  }, [state.budgets]); // ✅ Remover refreshData para evitar loops

  // Asegurar que el mes seleccionado sea válido - SOLO si hay datos cargados
  // COMENTADO: Esto puede causar loops infinitos con los useEffect
  /*
  useEffect(() => {
    if (
      state.budgets.length > 0 && // ✅ Solo cambiar si ya hay datos cargados
      availableMonths.length > 0 &&
      !availableMonths.includes(selectedMonth)
    ) {
      console.log(
        "🔄 [HOME] Cambiando mes seleccionado a:",
        availableMonths[0]
      );
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, state.budgets.length]); // ✅ Agregar state.budgets.length como dependencia
  */

  // Obtener configuración del mes
  const monthConfig = state.monthConfigs.find((c) => c.mes === selectedMonth);
  const porcentajeGerente = monthConfig?.porcentaje_gerente || 10;

  // Calcular resumen del mes
  // Calcular resumen del mes usando agrupación mensual
  const mesResumen = useMemo(() => {
    // Crear una clave única para las dependencias actuales
    const currentDepsKey = JSON.stringify({
      selectedMonth,
      budgetsLength: state.budgets.length,
      staffLength: state.staff.length,
      ventasLength: state.ventas.length,
      presupuestosEmpleadosLength: presupuestosEmpleados.length,
      porcentajeGerente,
    });

    // Si las dependencias no cambiaron, devolver el resultado anterior
    if (
      lastMesResumenDepsRef.current === currentDepsKey &&
      mesResumenRef.current !== null
    ) {
      console.log(
        "⚡ [HOME] useMemo mesResumen: dependencias no cambiaron, usando cache"
      );
      return mesResumenRef.current;
    }

    console.log("🔄 [HOME] useMemo mesResumen ejecutándose");
    console.log("🔄 [HOME] Datos disponibles:", {
      selectedMonth,
      budgets: state.budgets.length,
      staff: state.staff.length,
      ventas: state.ventas.length,
      presupuestosEmpleados: presupuestosEmpleados.length,
      porcentajeGerente,
    });

    if (state.budgets.length === 0) {
      console.warn("⚠️ [HOME] No hay budgets, no se puede calcular mesResumen");
      const result = null;
      mesResumenRef.current = result;
      lastMesResumenDepsRef.current = currentDepsKey;
      return result;
    }

    // ✅ USAR LA NUEVA FUNCIÓN DE AGRUPACIÓN MENSUAL
    const result = calculateMesResumenAgrupado(
      selectedMonth,
      state.budgets,
      state.staff,
      state.ventas,
      porcentajeGerente,
      presupuestosEmpleados
    );

    console.log("✅ [HOME] mesResumen calculado:", {
      mes: result.mes,
      tiendas: result.tiendas.length,
      total_comisiones: result.total_comisiones,
      comisiones_por_rol: result.comisiones_por_rol,
    });

    // Guardar en cache
    mesResumenRef.current = result;
    lastMesResumenDepsRef.current = currentDepsKey;

    return result;
  }, [
    selectedMonth,
    state.budgets,
    state.staff,
    state.ventas,
    porcentajeGerente,
    presupuestosEmpleados,
    // NO incluir refreshData aquí
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
    if (filterRol && filterRol !== "all") {
      tiendasFiltradas = tiendasFiltradas
        .map((tienda: any) => ({
          ...tienda,
          empleados: tienda.empleados.filter(
            (emp: any) => emp.rol === filterRol
          ),
        }))
        .filter((tienda: any) => tienda.empleados.length > 0); // Solo tiendas con empleados filtrados
    }

    // Filtrar por rango de fechas
    if (filterFechaInicio || filterFechaFin) {
      tiendasFiltradas = tiendasFiltradas
        .map((tienda: any) => ({
          ...tienda,
          empleados: tienda.empleados.filter((emp: any) => {
            // Si no hay fecha inicio, usar desde el inicio del mes
            const fechaInicioFiltro = filterFechaInicio || "2025-01-01";
            // Si no hay fecha fin, usar hasta el fin del mes
            const fechaFinFiltro = filterFechaFin || "2025-12-31";

            return (
              emp.fecha >= fechaInicioFiltro && emp.fecha <= fechaFinFiltro
            );
          }),
        }))
        .filter((tienda: any) => tienda.empleados.length > 0); // Solo tiendas con empleados en el rango
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
      logistico: 0, // Agregar logistico
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

  // Obtener tiendas únicas para filtros (basado en datos sin filtrar)
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

  // Resetear filtros cuando cambia el mes
  useEffect(() => {
    setFilterTienda([]);
    setFilterRol("all");
    setFilterFechaInicio("");
    setFilterFechaFin("");
  }, [selectedMonth]);

  // Verificar presupuestos diarios al cargar la página
  const checkDailyBudgets = async () => {
    try {
      setCheckingBudgets(true);
      const fechaActual = new Date().toISOString().split("T")[0];
      // Usar API para obtener presupuestos de empleados para la fecha actual
      const presupuestos = await obtenerPresupuestosEmpleados(
        undefined,
        fechaActual
      );
      setHasDailyBudgets(presupuestos.length > 0);

      // Si no hay presupuestos, mostrar el modal automáticamente
      if (presupuestos.length === 0) {
        setShowCodesModal(true);
      }
    } catch (error) {
      // En caso de error, asumir que no hay presupuestos para mostrar el modal
      setHasDailyBudgets(false);
      setShowCodesModal(true);
    } finally {
      setCheckingBudgets(false);
    }
  };

  // Mostrar modal de códigos automáticamente al iniciar - COMENTADO: Los datos ya están en BD
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCodesModal(true);
    }, 500); // Pequeño delay para que cargue la página primero
    return () => clearTimeout(timer);
  }, []);
  */

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

  // ============================================================================
  // REEMPLAZA TU FUNCIÓN handleLoadDemo CON ESTA VERSIÓN COMPLETA
  // ============================================================================

  const handleLoadDemo = async () => {
    try {
      console.log("🔄 [HOME] ============================================");
      console.log(`🔄 [HOME] Cargando datos para: ${selectedMonth}`);
      console.log("✅ [HOME] Usuario actual:", {
        tienda_id: user?.tienda_id,
        nombre: user?.nombre,
      });
      console.log(" [HOME] ============================================");

      // ========================================================================
      // PASO 1: Calcular rango de fechas del mes completo
      // ========================================================================
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

      console.log(`📅 [HOME] Rango de fechas: ${fechaInicio} a ${fechaFin}`);

      // ========================================================================
      // PASO 2: Cargar TODOS los datos del mes en paralelo
      // ========================================================================
      console.log("🔄 [HOME] Cargando datos desde BD...");

      const [
        tiendas,
        asesores,
        cargos,
        presupuestosDiarios, // Presupuestos de tiendas del mes
        porcentajesBD, // Configuración del mes
        presupuestosEmpleados, // Presupuestos asignados a empleados del mes
        ventasEmpleados, // Ventas de empleados del mes
      ] = await Promise.all([
        obtenerTiendas(),
        obtenerAsesores(),
        obtenerCargos(),
        obtenerPresupuestosDiarios(undefined, fechaInicio, fechaFin),
        obtenerPorcentajesMensuales(undefined, selectedMonth),
        obtenerPresupuestosEmpleados(undefined, fechaFin),
        obtenerVentasEmpleados(undefined, fechaFin),
      ]);

      console.log("✅ [HOME] Datos obtenidos de BD:", {
        tiendas: tiendas.length,
        asesores: asesores.length,
        cargos: cargos.length,
        presupuestosDiarios: presupuestosDiarios.length,
        porcentajesBD: porcentajesBD.length,
        presupuestosEmpleados: presupuestosEmpleados.length,
        ventasEmpleados: ventasEmpleados.length,
      });

      // Debug: mostrar tiendas disponibles
      console.log(
        "🏪 [HOME] Tiendas disponibles:",
        tiendas.map((t: any) => `${t.nombre} (ID: ${t.id})`)
      );

      // Debug: mostrar presupuestos por tienda
      const presupuestosPorTienda = presupuestosDiarios.reduce(
        (acc: any, p: any) => {
          const tienda = tiendas.find((t: any) => t.id === p.tienda_id);
          const nombreTienda = tienda?.nombre || `ID ${p.tienda_id}`;
          if (!acc[nombreTienda]) acc[nombreTienda] = 0;
          acc[nombreTienda]++;
          return acc;
        },
        {}
      );
      console.log(
        "📊 [HOME] Presupuestos diarios por tienda:",
        presupuestosPorTienda
      );

      // Debug: mostrar ventas por tienda
      const ventasPorTienda = ventasEmpleados.reduce((acc: any, v: any) => {
        const tienda = tiendas.find((t: any) => t.id === v.tienda_id);
        const nombreTienda = tienda?.nombre || `ID ${v.tienda_id}`;
        if (!acc[nombreTienda]) acc[nombreTienda] = 0;
        acc[nombreTienda]++;
        return acc;
      }, {});
      console.log("💰 [HOME] Ventas por tienda:", ventasPorTienda);

      // ========================================================================
      // VALIDACIONES CRÍTICAS
      // ========================================================================
      if (tiendas.length === 0) {
        alert(
          "❌ ERROR: No hay tiendas en la BD. Verifica la tabla 'util_tiendas'"
        );
        return;
      }

      if (presupuestosDiarios.length === 0) {
        console.warn(`⚠️ [HOME] No hay presupuestos para ${selectedMonth}`);
        alert(
          `⚠️ No se encontraron presupuestos para ${selectedMonth}.\n\nVerifica la tabla 'presupuestos_diario_tienda' entre ${fechaInicio} y ${fechaFin}`
        );
        // Continuar con datos vacíos para mostrar la UI
        setBudgets([]);
        setStaff([]);
        setMonthConfigs([]);
        setVentas([]);
        setPresupuestosEmpleados([]);
        setCargos(cargos);
        return;
      }

      // ========================================================================
      // PASO 3: Cargar TODOS los presupuestos sin restricciones
      // ========================================================================
      let presupuestosFiltrados = presupuestosDiarios;
      console.log(
        "✅ [HOME] Cargando TODOS los presupuestos sin restricciones"
      );

      // ========================================================================
      // PASO 4: Convertir presupuestos diarios a BudgetRecord
      // ========================================================================
      console.log("🔄 [HOME] Convirtiendo presupuestos diarios...");
      let budgets = presupuestosFiltrados.map((p: any) => {
        const tienda = tiendas.find((t: any) => t.id === p.tienda_id);
        const presupuesto = parseFloat(p.presupuesto) || 0;
        console.log(
          `📊 [HOME] Presupuesto diario: ${tienda?.nombre} - ${p.fecha} = ${presupuesto} (original: ${p.presupuesto})`
        );
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
        presupuestosFiltrados.map((p: any) => p.tienda_id)
      );

      tiendas.forEach((tienda: any) => {
        if (!tiendasConPresupuestos.has(tienda.id)) {
          // Agregar entrada con presupuesto 0 para el último día del mes
          budgets.push({
            tienda: tienda.nombre,
            tienda_id: tienda.id,
            empresa: tienda.empresa || "Empresa Desconocida",
            fecha: fechaFin,
            presupuesto_total: 0, // Sin presupuesto asignado
          });
        }
      });

      console.log(
        `✅ [HOME] ${budgets.length} presupuestos diarios procesados`
      );
      if (budgets.length > 0) {
        console.log("📋 [HOME] Ejemplo:", budgets[0]);
      }

      // ========================================================================
      // PASO 4: Crear STAFF basado en TODOS los empleados de la tienda
      // Y asignar presupuestos cuando existan
      // ========================================================================
      console.log("🔄 [HOME] Creando staff...");
      const staff: any[] = [];

      // Filtrar presupuestos de empleados que estén en el rango del mes
      let presupuestosDelMes = presupuestosEmpleados.filter((pe: any) => {
        return pe.fecha >= fechaInicio && pe.fecha <= fechaFin;
      });

      console.log(
        `📊 [HOME] Presupuestos de empleados en el mes: ${presupuestosDelMes.length}`
      );

      // Obtener empleados únicos que tienen presupuestos asignados
      const empleadosConPresupuestos = new Set(
        presupuestosDelMes.map((pe: any) => pe.asesor.toString())
      );

      // Crear staff basado en presupuestos asignados
      presupuestosDelMes.forEach((pe: any) => {
        const asesor = asesores.find((a: any) => a.id === pe.asesor);
        if (!asesor) {
          console.warn(`⚠️ [HOME] Asesor no encontrado: ID ${pe.asesor}`);
          return;
        }

        const tienda = tiendas.find((t: any) => t.id === pe.tienda_id);

        // Obtener nombre del cargo asignado ese día
        let cargoNombre = "asesor"; // Default
        if (typeof pe.cargo === "string") {
          // Ya viene como string desde BD
          cargoNombre = pe.cargo.toLowerCase();
        } else if (typeof pe.cargo === "number") {
          // Es un ID, buscar en cargos
          const cargo = cargos.find((c: any) => c.id === pe.cargo);
          cargoNombre = cargo ? cargo.nombre.toLowerCase() : "asesor";
        }

        // Mapear a roles estándar del sistema
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
          cargo_id: pe.cargo, // Incluir ID del cargo para ordenamiento
        });
      });

      // Agregar empleados adicionales de todas las tiendas
      console.log(
        "✅ [HOME] Agregando empleados adicionales de todas las tiendas"
      );

      // Agregar empleados que NO tienen presupuestos asignados
      asesores.forEach((asesor: any) => {
        if (!empleadosConPresupuestos.has(asesor.id.toString())) {
          const tiendaAsesor = tiendas.find(
            (t: any) => t.id === asesor.tienda_id
          );
          if (tiendaAsesor) {
            console.log(
              `⚠️ [HOME] Empleado sin presupuesto asignado: ${asesor.nombre} (${asesor.id}) - Tienda: ${tiendaAsesor.nombre}`
            );

            // Intentar determinar el rol basado en el cargo del asesor
            let rol = "asesor"; // Default
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

            // Agregar empleado sin presupuesto (usará fecha por defecto)
            staff.push({
              id: asesor.id.toString(),
              nombre: asesor.nombre || `Empleado ${asesor.id}`,
              tienda: tiendaAsesor.nombre,
              fecha: fechaFin, // Usar último día del mes como referencia
              rol: rol,
              cargo_id:
                typeof asesor.cargo_id === "object"
                  ? asesor.cargo_id.id
                  : asesor.cargo_id,
            });
          }
        }
      });

      // Agregar empleados de tiendas que NO tienen presupuestos diarios
      const tiendasConPresupuestosDiarios = new Set(
        presupuestosDiarios.map((p: any) => p.tienda_id)
      );

      tiendas.forEach((tienda: any) => {
        if (!tiendasConPresupuestosDiarios.has(tienda.id)) {
          console.log(
            `⚠️ [HOME] Tienda sin presupuestos diarios: ${tienda.nombre} - Agregando empleados`
          );

          // Agregar empleados de esta tienda
          asesores.forEach((asesor: any) => {
            if (asesor.tienda_id === tienda.id) {
              // Verificar si ya está en staff
              const yaEnStaff = staff.some(
                (s: any) => s.id === asesor.id.toString()
              );
              if (!yaEnStaff) {
                let rol = "asesor"; // Default
                if (asesor.cargo_id) {
                  const cargo = cargos.find(
                    (c: any) => c.id === asesor.cargo_id
                  );
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
                  tienda: tienda.nombre,
                  fecha: fechaFin,
                  rol: rol,
                });

                console.log(
                  `✅ [HOME] Agregado empleado de tienda sin presupuestos: ${asesor.nombre} - ${tienda.nombre}`
                );
              }
            }
          });
        }
      });

      console.log(`✅ [HOME] ${staff.length} registros de staff creados`);
      if (staff.length > 0) {
        console.log("📋 [HOME] Ejemplo de staff:", staff[0]);
      }

      // ========================================================================
      // PASO 5: Convertir configuraciones de porcentajes
      // ========================================================================
      console.log("🔄 [HOME] Convirtiendo configuraciones mensuales...");
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

      console.log(
        `✅ [HOME] ${monthConfigs.length} configuraciones procesadas`
      );

      // ========================================================================
      // PASO 6: Procesar VENTAS por empleado
      // IMPORTANTE: Filtrar solo ventas del mes seleccionado
      // ========================================================================
      console.log("🔄 [HOME] Procesando ventas de empleados...");

      // Filtrar ventas que estén en el rango del mes
      let ventasDelMes = ventasEmpleados.filter((ve: any) => {
        return ve.fecha >= fechaInicio && ve.fecha <= fechaFin;
      });

      console.log(
        `📊 [HOME] Ventas de empleados en el mes: ${ventasDelMes.length}`
      );

      const ventasMap = new Map<string, any>();

      ventasDelMes.forEach((ve: any) => {
        const tienda = tiendas.find((t: any) => t.id === ve.tienda_id);
        if (!tienda) {
          console.warn(
            `⚠️ [HOME] Tienda no encontrada para venta: tienda_id ${ve.tienda_id}`
          );
          return;
        }

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
      console.log(
        `✅ [HOME] ${ventas.length} registros de ventas diarias procesados`
      );
      if (ventas.length > 0) {
        console.log("📋 [HOME] Ejemplo de ventas:", ventas[0]);
      }

      // ========================================================================
      // PASO 7: GUARDAR TODO EN EL CONTEXTO
      // ========================================================================
      console.log("💾 [HOME] Guardando datos en contexto...");

      setBudgets(budgets);
      setStaff(staff);
      setMonthConfigs(monthConfigs);
      setVentas(ventas);
      setPresupuestosEmpleados(presupuestosEmpleados); // Mantener todos los presupuestos, no solo del mes filtrado
      setCargos(cargos);

      console.log("✅ [HOME] ============================================");
      console.log("✅ [HOME] DATOS CARGADOS EXITOSAMENTE");
      console.log("✅ [HOME] ============================================");
      console.log("📊 [HOME] Resumen final:", {
        budgets: budgets.length,
        staff: staff.length,
        ventas: ventas.length,
        monthConfigs: monthConfigs.length,
        presupuestosEmpleados: presupuestosEmpleados.length,
      });
    } catch (error: any) {
      console.error("❌ [HOME] ============================================");
      console.error("❌ [HOME] ERROR CRÍTICO AL CARGAR DATOS");
      console.error("❌ [HOME] ============================================");
      console.error("❌ [HOME] Error:", error);
      console.error("❌ [HOME] Stack:", error.stack);

      alert(
        `❌ ERROR AL CARGAR DATOS:\n\n${
          error.message || "Error desconocido"
        }\n\n` +
          `Revisa:\n` +
          `1. La consola del navegador (F12) para más detalles\n` +
          `2. La conexión a Directus\n` +
          `3. Los permisos de las tablas en Directus\n` +
          `4. Que existan datos para el mes seleccionado`
      );

      // Limpiar estado
      setBudgets([]);
      setStaff([]);
      setMonthConfigs([]);
      setVentas([]);
      setPresupuestosEmpleados([]);
    }
  };

  // ============================================================================
  // CARGA DE DATOS - SOLO UNA VEZ POR MES (EVITA RECARGAS INNECESARIAS)
  // ============================================================================

  useEffect(() => {
    // ✅ Evitar recargas innecesarias: solo cargar si no se ha cargado ya para este mes
    if (loadedMonthsRef.current.has(selectedMonth)) {
      console.log(
        "⚡ [HOME] Datos ya cargados para",
        selectedMonth,
        "- omitiendo recarga"
      );
      return;
    }

    // ✅ Evitar recargas durante la inicialización
    if (!user) {
      console.log("⚡ [HOME] Usuario no cargado aún - esperando");
      return;
    }

    const loadDataForMonth = async () => {
      try {
        console.log(
          "🔄 [HOME] Iniciando carga de datos para",
          selectedMonth,
          "- PRIMERA VEZ"
        );
        await handleLoadDemo();

        // ✅ Marcar este mes como cargado
        loadedMonthsRef.current.add(selectedMonth);
        // ✅ Marcar que se intentó cargar datos
        setDataLoadAttempted(true);

        console.log(
          "✅ [HOME] Datos cargados exitosamente para",
          selectedMonth,
          "- COMPLETADO"
        );
      } catch (error) {
        console.error(
          "❌ [HOME] Error cargando datos para",
          selectedMonth,
          ":",
          error
        );
        // ✅ Marcar que se intentó cargar datos incluso si falló
        setDataLoadAttempted(true);
        // Mostrar modal de error si hay problemas de conexión
        setShowNoDataModal(true);
      }
    };

    loadDataForMonth();
  }, [selectedMonth, user]);

  // Función para recargar datos del contexto con datos reales de BD
  const reloadContextData = async () => {
    try {
      console.log(
        "🔄 reloadContextData: Recargando datos reales de BD para",
        selectedMonth
      );

      // Calcular rango de fechas para el mes seleccionado
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
      const fechaInicio = `${anio}-${mesNumero}-01`;
      const fechaFin = `${anio}-${mesNumero}-31`;

      // Cargar todos los datos necesarios de BD en paralelo
      const [
        tiendas,
        asesores,
        cargos,
        presupuestosDiarios,
        porcentajesBD,
        presupuestosEmpleados,
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

      console.log("✅ reloadContextData: Datos obtenidos de BD:", {
        tiendas: tiendas.length,
        asesores: asesores.length,
        cargos: cargos.length,
        presupuestosDiarios: presupuestosDiarios.length,
        porcentajesBD: porcentajesBD.length,
        presupuestosEmpleados: presupuestosEmpleados.length,
        ventasEmpleados: ventasEmpleados.length,
        rangoFechas: `${fechaInicio} a ${fechaFin}`,
      });

      // Convertir presupuestos diarios a BudgetRecord
      const budgets = presupuestosDiarios.map((p: any) => ({
        tienda:
          tiendas.find((t: any) => t.id == p.tienda_id)?.nombre ||
          "Tienda Desconocida",
        tienda_id: p.tienda_id,
        empresa:
          tiendas.find((t: any) => t.id == p.tienda_id)?.empresa ||
          "Empresa Desconocida",
        fecha: p.fecha,
        presupuesto_total: parseFloat(p.presupuesto) || 0,
      }));

      // Crear staff basado en presupuestos diarios asignados
      const staff: any[] = [];
      presupuestosEmpleados.forEach((pe: any) => {
        const asesor = asesores.find((a: any) => a.id === pe.asesor);
        if (asesor) {
          const tienda = tiendas.find((t: any) => t.id === asesor.tienda_id);
          const cargo = cargos.find((c: any) => c.id == pe.cargo);
          const cargoNombre = cargo ? cargo.nombre.toLowerCase() : "asesor";
          const rol =
            cargoNombre.toLowerCase() === "gerente"
              ? "gerente"
              : cargoNombre.toLowerCase() === "asesor"
              ? "asesor"
              : cargoNombre.toLowerCase() === "cajero"
              ? "cajero"
              : "logistico";

          staff.push({
            id: asesor.id.toString(),
            nombre: asesor.nombre || `Empleado ${asesor.id}`,
            tienda: tienda?.nombre || "Tienda Desconocida",
            fecha: pe.fecha,
            rol: rol,
          });
        }
      });

      // Convertir porcentajes de BD al formato MonthConfig
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

      // Crear ventas data de BD
      const ventasMap = new Map<string, any>();
      ventasEmpleados.forEach((ve: any) => {
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

      console.log("✅ reloadContextData: Datos convertidos:", {
        budgets: budgets.length,
        staff: staff.length,
        monthConfigs: monthConfigs.length,
        ventas: ventas.length,
      });

      // Actualizar el contexto con datos reales
      setBudgets(budgets);
      setStaff(staff);
      setMonthConfigs(monthConfigs);
      setVentas(ventas);
      setPresupuestosEmpleados(presupuestosEmpleados);
      setCargos(cargos);
    } catch (error) {
      console.error("❌ Error recargando datos reales de BD:", error);
      // Fallback a datos vacíos
      setBudgets([]);
      setStaff([]);
      setMonthConfigs([]);
      setVentas([]);
    }
  };

  // Función para manejar cuando se complete la asignación
  const handleAssignmentComplete = (ventasData?: any[]) => {
    console.log(
      "🔄 handleAssignmentComplete: Recibiendo ventasData:",
      ventasData
    );
    // Recargar datos para mostrar las asignaciones guardadas
    reloadContextData();
    setRefreshData((prev) => prev + 1); // Forzar recarga de cálculos
  };

  // Recargar datos automáticamente cuando cambie refreshData
  // COMENTADO: Esto puede causar loops con otros useEffect
  /*
  useEffect(() => {
    if (refreshData > 0) {
      reloadContextData();
    }
  }, [refreshData]);
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
          {/* Título y estado */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Comisiones {selectedMonth}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
              <span>
                Estado:{" "}
                <span className={state.budgets.length > 0 ? "text-green-600" : "text-yellow-600"}>
                  {state.budgets.length > 0 ? "Datos cargados" : "Cargando datos..."}
                </span>
              </span>
              {(filterTienda.length > 0 ||
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
              )}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => setShowConfigModal(true)}
              variant="outlined"
              startIcon={<Settings />}
              size="small"
              sx={{ 
                minWidth: 'auto',
                px: { xs: 1.5, sm: 2 }
              }}
            >
              <span className="hidden xs:inline">Configuración</span>
              <span className="xs:hidden">Conf</span>
            </Button>
            {(mesResumenFiltrado || mesResumen) && (
              <ExportButtons
                mesResumen={mesResumenFiltrado || mesResumen}
                mes={selectedMonth}
              />
            )}
            <Button
              onClick={() => setShowCodesModal(true)}
              variant="outlined"
              startIcon={<Users />}
              size="small"
              sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
            >
              <span className="hidden xs:inline">Asignar</span>
              <span className="xs:hidden">Asig</span>
            </Button>
          </div>

          {/* Mobile Accordion Filters */}
          <MobileAccordionFilters
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onMonthChange={setSelectedMonth}
            filterTienda={filterTienda}
            onFilterTiendaChange={handleFilterTiendaChange}
            filterRol={filterRol}
            onFilterRolChange={setFilterRol}
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
          {/* Debug Info - COMENTADO PARA PRODUCCIÓN */}
          {/*
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">
              🔍 Debug - Estado de carga de datos:
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>📊 Budgets: {state.budgets.length} registros</p>
              <p>👥 Staff: {state.staff.length} empleados</p>
              <p>
                ⚙️ Month Configs: {state.monthConfigs.length} configuraciones
              </p>
              <p>💰 Ventas: {state.ventas.length} registros</p>
              <p>
                📋 Presupuestos Empleados: {presupuestosEmpleados.length}{" "}
                registros
              </p>
              <p>
                🧮 Mes Resumen:{" "}
                {mesResumen ? "✅ Calculado" : "❌ No calculado"}
              </p>
              <p>📅 Mes seleccionado: {selectedMonth}</p>
              <p>
                📅 Filtro fechas: {filterFechaInicio || "inicio mes"} -{" "}
                {filterFechaFin || "fin mes"}
              </p>
              <p>🏪 Tiendas disponibles: {uniqueTiendas.length}</p>
            </div>
          </section>
          */}

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

          {/* Sección de Datos - siempre visible */}
          <section className="space-y-8">
            {/* Resumen Ejecutivo - mostrar siempre para mobile y desktop */}
            <section className="space-y-4">
              <SummaryCards mesResumen={mesResumenFiltrado || mesResumen} />
            </section>

            {/* Tabla de Datos - mostrar siempre para mobile y desktop */}
            <section className="space-y-4 pt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Detalle de Comisiones
                </h2>
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
              />
            </section>

            {/* Gráficos - mostrar si hay mesResumen */}
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
            {/* Cargar Presupuestos - COMENTADO: Los datos ya vienen de BD */}
            {/*
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
                1. Cargar Presupuestos
              </h2>
              <CSVUpload />
            </div>
            */}

            {/* Panel de Configuración (solo si hay presupuestos cargados) */}
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
                  2. Configuración Avanzada
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
          handleAssignmentComplete(ventasData); // Pasar datos de ventas
          setHasDailyBudgets(true);
          setShowCodesModal(false); // Cerrar modal después de guardar
        }}
      />

      {/* No Data Modal */}
      <NoDataModal
        open={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        tiendaNombre="todas las tiendas"
        mesSeleccionado={selectedMonth}
      />
    </div>
  );
}
