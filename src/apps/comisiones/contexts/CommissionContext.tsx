import React, { createContext, useContext, useState, useCallback } from "react";
import {
  BudgetRecord,
  StaffMember,
  MonthConfig,
  VentasData,
  VentasMensualesData,
  AppState,
} from "../types";

interface CommissionContextType {
  state: AppState;
  setBudgets: (budgets: BudgetRecord[]) => void;
  setStaff: (staff: StaffMember[]) => void;
  setMonthConfigs: (configs: MonthConfig[]) => void;
  setVentas: (ventas: VentasData[]) => void;
  setVentasMensuales: (ventasMensuales: VentasMensualesData[]) => void;
  updateMonthConfig: (mes: string, porcentaje_gerente: number) => void;
  addStaffMember: (member: StaffMember) => void;
  removeStaffMember: (id: string) => void;
  updateVentas: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
  updateVentasMensuales: (
    tienda: string,
    mes: string,
    ventas_tienda_mensual: number,
    ventas_por_asesor_mensual: Record<string, number>
  ) => void;
  updatePresupuestosEmpleados: (presupuestos: any[]) => void;
  getMonthConfig: (mes: string) => MonthConfig | undefined;
  resetData: () => void;
}

const CommissionContext = createContext<CommissionContextType | undefined>(
  undefined
);

export const CommissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>({
    budgets: [],
    staff: [],
    monthConfigs: [],
    ventas: [],
    ventasMensuales: [],
    presupuestosEmpleados: [],
    thresholdConfig: null,
  });

  const setBudgets = useCallback((budgets: BudgetRecord[]) => {
    setState((prev) => ({ ...prev, budgets }));
  }, []);

  const setStaff = useCallback((staff: StaffMember[]) => {
    setState((prev) => ({ ...prev, staff }));
  }, []);

  const setMonthConfigs = useCallback((configs: MonthConfig[]) => {
    setState((prev) => ({ ...prev, monthConfigs: configs }));
  }, []);

  const setVentas = useCallback((ventas: VentasData[]) => {
    setState((prev) => ({ ...prev, ventas }));
  }, []);

  const setVentasMensuales = useCallback(
    (ventasMensuales: VentasMensualesData[]) => {
      setState((prev) => ({ ...prev, ventasMensuales }));
    },
    []
  );

  const updateVentasMensuales = useCallback(
    (
      tienda: string,
      mes: string,
      ventas_tienda_mensual: number,
      ventas_por_asesor_mensual: Record<string, number>
    ) => {
      setState((prev) => {
        const existingIndex = prev.ventasMensuales.findIndex(
          (v) => v.tienda === tienda && v.mes === mes
        );
        let newVentasMensuales = [...prev.ventasMensuales];

        if (existingIndex >= 0) {
          newVentasMensuales[existingIndex] = {
            tienda,
            mes,
            ventas_tienda_mensual,
            ventas_por_asesor_mensual,
          };
        } else {
          newVentasMensuales.push({
            tienda,
            mes,
            ventas_tienda_mensual,
            ventas_por_asesor_mensual,
          });
        }

        return { ...prev, ventasMensuales: newVentasMensuales };
      });
    },
    []
  );

  const updatePresupuestosEmpleados = useCallback((presupuestos: any[]) => {
    setState((prev) => ({ ...prev, presupuestosEmpleados: presupuestos }));
  }, []);

  const updateMonthConfig = useCallback(
    (mes: string, porcentaje_gerente: number) => {
      setState((prev) => {
        const existingIndex = prev.monthConfigs.findIndex((c) => c.mes === mes);
        let newConfigs = [...prev.monthConfigs];

        if (existingIndex >= 0) {
          newConfigs[existingIndex] = { mes, porcentaje_gerente };
        } else {
          newConfigs.push({ mes, porcentaje_gerente });
        }

        return { ...prev, monthConfigs: newConfigs };
      });
    },
    []
  );

  const addStaffMember = useCallback((member: StaffMember) => {
    setState((prev) => ({
      ...prev,
      staff: [...prev.staff, member],
    }));
  }, []);

  const removeStaffMember = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== id),
    }));
  }, []);

  const updateVentas = useCallback(
    (
      tienda: string,
      fecha: string,
      ventas_tienda: number,
      ventas_por_asesor: Record<string, number>
    ) => {
      setState((prev) => {
        const existingIndex = prev.ventas.findIndex(
          (v) => v.tienda === tienda && v.fecha === fecha
        );
        let newVentas = [...prev.ventas];

        if (existingIndex >= 0) {
          newVentas[existingIndex] = {
            tienda,
            fecha,
            ventas_tienda,
            ventas_por_asesor,
          };
        } else {
          newVentas.push({ tienda, fecha, ventas_tienda, ventas_por_asesor });
        }

        return { ...prev, ventas: newVentas };
      });
    },
    []
  );

  const getMonthConfig = useCallback(
    (mes: string): MonthConfig | undefined => {
      return state.monthConfigs.find((c) => c.mes === mes);
    },
    [state.monthConfigs]
  );

  const resetData = useCallback(() => {
    setState({
      budgets: [],
      staff: [],
      monthConfigs: [],
      ventas: [],
      ventasMensuales: [],
      presupuestosEmpleados: [],
      thresholdConfig: null,
    });
  }, []);

  const value: CommissionContextType = {
    state,
    setBudgets,
    setStaff,
    setMonthConfigs,
    setVentas,
    setVentasMensuales,
    updateMonthConfig,
    addStaffMember,
    removeStaffMember,
    updateVentas,
    updateVentasMensuales,
    updatePresupuestosEmpleados,
    getMonthConfig,
    resetData,
  };

  return (
    <CommissionContext.Provider value={value}>
      {children}
    </CommissionContext.Provider>
  );
};

export const useCommission = (): CommissionContextType => {
  const context = useContext(CommissionContext);
  if (!context) {
    throw new Error("useCommission must be used within CommissionProvider");
  }
  return context;
};
