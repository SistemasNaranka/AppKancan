import { useState, useEffect, useRef, useCallback } from "react";
import { useCommission } from "../contexts/CommissionContext";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  obtenerTiendas,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
  obtenerPresupuestosEmpleados,
  obtenerVentasEmpleados,
} from "../api/directus/read";

export interface CommissionDataState {
  presupuestosEmpleados: any[];
  cargos: any[];
  dataLoadAttempted: boolean;
  modalState: {
    showNoDataModal: boolean;
    modalTitle: string;
    modalMessage: string;
  };
}

export const useCommissionData = (selectedMonth: string) => {
  const { state, setBudgets, setStaff, setMonthConfigs, setVentas } =
    useCommission();
  const { user } = useAuth();

  const [presupuestosEmpleados, setPresupuestosEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Control para evitar recargas innecesarias
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  // Función auxiliar para convertir nombre de mes a número
  const getMonthNumber = useCallback((monthName: string): string => {
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
  }, []);

  // Función para cargar datos
  const loadDataForMonth = useCallback(async () => {
    try {
      const [mesNombre, anio] = selectedMonth.split(" ");
      const mesNumero = getMonthNumber(mesNombre);

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
  }, [
    selectedMonth,
    getMonthNumber,
    setBudgets,
    setStaff,
    setMonthConfigs,
    setVentas,
  ]);

  // Función para recargar datos
  const reloadContextData = useCallback(async () => {
    await loadDataForMonth();
  }, [loadDataForMonth]);

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
  }, [selectedMonth, user, loadDataForMonth]);

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

  return {
    // Data states
    presupuestosEmpleados,
    cargos,
    dataLoadAttempted,

    // Modal states
    showNoDataModal,
    modalTitle,
    modalMessage,

    // Actions
    reloadContextData,
    setShowNoDataModal,
    setModalTitle,
    setModalMessage,
  };
};
