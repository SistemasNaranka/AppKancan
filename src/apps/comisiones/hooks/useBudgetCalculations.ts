import { obtenerPresupuestosDiarios, obtenerPorcentajesMensuales } from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";

export const useBudgetCalculations = (tiendaSeleccionada: number | "") => {
  const recalculateBudgets = async (empleados: any[], targetDate: string) => {
    if (!tiendaSeleccionada || empleados.length === 0)
      return { empleados, calculated: false };

    try {
      const presupuestosTienda = await obtenerPresupuestosDiarios(
        tiendaSeleccionada as number,
        targetDate,
        targetDate
      );

      if (!presupuestosTienda || presupuestosTienda.length === 0) {
        return {
          empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })),
          calculated: false,
        };
      }

      const presupuestoTotal = presupuestosTienda[0].budget;
      let mesAnioParaAPI = "";
      let shouldUseApi = false;

      if (targetDate && targetDate.includes("-")) {
        const partes = targetDate.split("-");
        const mesesMap: { [key: string]: string } = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr", "05": "May", "06": "Jun",
          "07": "Jul", "08": "Ago", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
        };
        const mesNombre = mesesMap[partes[1]];
        if (mesNombre && partes[0]) {
          mesAnioParaAPI = `${mesNombre} ${partes[0]}`;
          shouldUseApi = true;
        }
      }

      if (!shouldUseApi) return { empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })), calculated: false };

      const porcentajes = await obtenerPorcentajesMensuales(undefined, mesAnioParaAPI);
      if (!porcentajes || porcentajes.length === 0) return { empleados: empleados.map((e) => ({ ...e, presupuesto: 0 })), calculated: false };

      const porcentajeConfig = porcentajes[0];

      const empleadosPorRol = {
        gerente: empleados.filter((e) => e.cargo_nombre.toLowerCase() === "gerente").length,
        asesor: empleados.filter((e) => e.cargo_nombre.toLowerCase() === "asesor").length,
        coadministrador: empleados.filter((e) => e.cargo_nombre.toLowerCase() === "coadministrador").length,
        cajero: empleados.filter((e) => e.cargo_nombre.toLowerCase() === "cajero").length,
        logistico: empleados.filter((e) => e.cargo_nombre.toLowerCase() === "logistico").length,
        gerente_online: empleados.filter((e) => e.cargo_nombre.toLowerCase().includes("online")).length,
      };

      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(presupuestoTotal, porcentajeConfig, empleadosPorRol);

      const empleadosCalculados = empleados.map((empleado) => {
        const rolLower = empleado.cargo_nombre.toLowerCase();
        let presupuestoNuevo = 0;

        if (["cajero", "logistico"].includes(rolLower) || rolLower.includes("online")) {
          presupuestoNuevo = 1;
        } else if (["gerente", "asesor", "coadministrador"].includes(rolLower)) {
          const cantidadEnRol = empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
          const totalRol = presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol];
          if (cantidadEnRol > 0) presupuestoNuevo = Math.round(totalRol / cantidadEnRol);
        }
        return { ...empleado, presupuesto: presupuestoNuevo };
      });

      return { empleados: empleadosCalculados, calculated: true };
    } catch (error) {
      console.error("Error al recalcular presupuestos:", error);
      return { empleados, calculated: false };
    }
  };

  return { recalculateBudgets };
};