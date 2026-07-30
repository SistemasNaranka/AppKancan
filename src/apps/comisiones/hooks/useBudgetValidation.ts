import { useState, useEffect } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { useUserPolicies } from "./useUserPolicies";
import {
  getStores,
  obtenerPresupuestosEmpleados,
  obtenerPresupuestosDiarios,
} from "../api/directus/read";
import { DirectusTienda } from "../types/modal";

interface BudgetValidationState {
  hasBudgetData: boolean | null;
  currentStore: DirectusTienda | null;
  todayBudgetCount: number;
  missingDaysCount: number;
  validationCompleted: boolean;
  error: string | null;
}

interface UseBudgetValidationReturn extends BudgetValidationState {
  validateBudgetData: () => Promise<void>;
  resetState: () => void;
  revalidateBudgetData: () => Promise<void>;
}

export const useBudgetValidation = (
  selectedTiendaName?: string,
): UseBudgetValidationReturn => {
  const { user } = useAuth();
  const { hasPolicy } = useUserPolicies();

  const [hasBudgetData, setHasBudgetData] = useState<boolean | null>(null);
  const [currentStore, setCurrentStore] = useState<DirectusTienda | null>(null);
  const [todayBudgetCount, setTodayBudgetCount] = useState(0);
  const [missingDaysCount, setMissingDaysCount] = useState(0);
  const [validationCompleted, setValidationCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonth = (): string => {
    const now = new Date();
    const months = [
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
    const mesNombre = months[now.getMonth()];
    const anio = now.getFullYear();
    return `${mesNombre} ${anio}`;
  };

  const validateBudgetData = async () => {
    try {
      setValidationCompleted(false);
      setError(null);
      setHasBudgetData(null);

      const hasStorePolicy = hasPolicy("crud_commission_stores");

      if (!hasStorePolicy && !selectedTiendaName) {
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      const tiendas = await getStores();
      let targetStore: DirectusTienda | undefined;

      if (selectedTiendaName) {
        targetStore = tiendas.find((t) => t.name === selectedTiendaName);
      } else if (tiendas.length === 1) {
        targetStore = tiendas[0];
      } else if (tiendas.length > 1 && hasStorePolicy) {
        targetStore = tiendas[0];
      }

      if (!targetStore) {
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      setCurrentStore(targetStore);
      const storeId = targetStore.id;

      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();

      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        storeId,
        undefined,
        currentMonth,
      );

      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.store_id === storeId && pe.date === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      const ahora = new Date();
      const startOfMonth = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
      const endOfMonth = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const presupuestosCasa = await obtenerPresupuestosDiarios(
        storeId,
        startOfMonth,
        endOfMonth,
      );

      const diasConMetaValida = new Set(
        presupuestosCasa
          .filter((p: any) => (p.budget || 0) > 0)
          .map((p: any) => p.date),
      );

      const diasPasadosSet = new Set();
      presupuestosEmpleados.forEach((pe: any) => {
        diasPasadosSet.add(pe.date);
      });

      let missingCount = 0;
      for (let i = 1; i <= ahora.getDate(); i++) {
        const diaStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        if (!diasPasadosSet.has(diaStr) && diasConMetaValida.has(diaStr)) {
          missingCount++;
        }
      }
      setMissingDaysCount(missingCount);

      const hasBudget = budgetCount > 0;
      setHasBudgetData(hasBudget);

      if (!hasBudget) {
        setError(
          "No hay presupuesto diario asignado para ningún empleado en el día de hoy",
        );
      }

      setValidationCompleted(true);
    } catch (err) {
      console.error("Error validando presupuesto diario:", err);
      setError("Error al validar presupuesto diario");
      setHasBudgetData(false);
      setValidationCompleted(true);
    }
  };

  const resetState = () => {
    setHasBudgetData(null);
    setCurrentStore(null);
    setTodayBudgetCount(0);
    setMissingDaysCount(0);
    setValidationCompleted(false);
    setError(null);
  };

  const revalidateBudgetData = async () => {
    try {
      setValidationCompleted(false);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const hasStorePolicy = hasPolicy("crud_commission_stores");

      if (!hasStorePolicy && !selectedTiendaName) {
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      const tiendas = await getStores();

      let targetStore: DirectusTienda | undefined;

      if (selectedTiendaName) {
        targetStore = tiendas.find((t) => t.name === selectedTiendaName);
      } else if (tiendas.length === 1) {
        targetStore = tiendas[0];
      } else if (tiendas.length > 1 && hasStorePolicy) {
        targetStore = tiendas[0];
      }

      if (!targetStore) {
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      setCurrentStore(targetStore);
      const storeId = targetStore.id;

      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();
      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        storeId,
        undefined,
        currentMonth,
      );

      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.store_id === storeId && pe.date === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      const ahora = new Date();
      const startOfMonth = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
      const endOfMonth = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const presupuestosCasa = await obtenerPresupuestosDiarios(
        storeId,
        startOfMonth,
        endOfMonth,
      );

      const diasConMetaValida = new Set(
        presupuestosCasa
          .filter((p: any) => (p.budget || 0) > 0)
          .map((p: any) => p.date),
      );

      const diasPasadosSet = new Set();
      presupuestosEmpleados.forEach((pe: any) => {
        diasPasadosSet.add(pe.date);
      });

      let missingCount = 0;
      for (let i = 1; i <= ahora.getDate(); i++) {
        const diaStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        if (!diasPasadosSet.has(diaStr) && diasConMetaValida.has(diaStr)) {
          missingCount++;
        }
      }

      setMissingDaysCount(missingCount);

      const hasBudget = budgetCount > 0;
      setHasBudgetData(hasBudget);

      if (!hasBudget) {
        setError(
          "No hay presupuesto diario asignado para ningún empleado en el día de hoy",
        );
      }

      setValidationCompleted(true);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al revalidar presupuesto diario");
      setHasBudgetData(false);
      setValidationCompleted(true);
    }
  };
  
  useEffect(() => {
    if (user) {
      validateBudgetData();
    }
  }, [user, selectedTiendaName]);

  return {
    hasBudgetData,
    currentStore,
    todayBudgetCount,
    missingDaysCount,
    validationCompleted,
    error,
    validateBudgetData,
    revalidateBudgetData,
    resetState,
  };
};
