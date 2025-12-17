import { useState, useEffect } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { useUserPolicies } from "./useUserPolicies";
import {
  obtenerTiendas,
  obtenerPresupuestosEmpleados,
} from "../api/directus/read";
import { DirectusTienda } from "../types/modal";

interface BudgetValidationState {
  hasBudgetData: boolean | null; // null = cargando, true = tiene datos, false = no tiene datos
  currentStore: DirectusTienda | null;
  todayBudgetCount: number;
  validationCompleted: boolean;
  error: string | null;
}

interface UseBudgetValidationReturn extends BudgetValidationState {
  validateBudgetData: () => Promise<void>;
  resetState: () => void;
  // NUEVO: Función para revalidar después de guardar presupuesto
  revalidateBudgetData: () => Promise<void>;
}

/**
 * Hook para validar si existe presupuesto diario de empleados asignado para la tienda del usuario
 * Retorna true si hay al menos un registro de presupuesto diario para la tienda del día actual
 */
export const useBudgetValidation = (): UseBudgetValidationReturn => {
  const { user } = useAuth();
  const { hasPolicy } = useUserPolicies();

  const [hasBudgetData, setHasBudgetData] = useState<boolean | null>(null);
  const [currentStore, setCurrentStore] = useState<DirectusTienda | null>(null);
  const [todayBudgetCount, setTodayBudgetCount] = useState(0);
  const [validationCompleted, setValidationCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener la fecha actual en formato YYYY-MM-DD
   */
  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /**
   * Verificar si un mes es el mes actual
   */
  const isCurrentMonth = (mes: string): boolean => {
    const [mesNombre, anioStr] = mes.split(" ");
    const mesesMap: { [key: string]: number } = {
      Ene: 0,
      Feb: 1,
      Mar: 2,
      Abr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Ago: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dic: 11,
    };

    const mesNumero = mesesMap[mesNombre];
    const anio = parseInt(anioStr);

    const ahora = new Date();
    return ahora.getUTCFullYear() === anio && ahora.getUTCMonth() === mesNumero;
  };

  /**
   * Obtener el mes actual en formato "MMM YYYY"
   */
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
    const mesNombre = months[now.getUTCMonth()];
    const anio = now.getUTCFullYear();
    return `${mesNombre} ${anio}`;
  };

  const validateBudgetData = async () => {
    try {
      setValidationCompleted(false);
      setError(null);
      setHasBudgetData(null);

      // 1. Verificar si el usuario tiene la política readComisionesTienda
      const hasStorePolicy = hasPolicy("readComisionesTienda");
      if (!hasStorePolicy) {
        // Si no tiene la política, no validamos presupuesto (usuario admin/comercial)
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // 2. Obtener la tienda del usuario
      const tiendas = await obtenerTiendas();
      if (tiendas.length === 0) {
        setError("No tienes tiendas asignadas");
        setValidationCompleted(true);
        return;
      }

      if (tiendas.length > 1) {
        // Si tiene múltiples tiendas, no validamos presupuesto
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // Guardar la tienda del usuario
      const userStore = tiendas[0];
      setCurrentStore(userStore);

      // 3. Verificar si es el mes actual
      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();

      // 4. Consultar presupuestos de empleados para la tienda del día actual
      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        userStore.id,
        fechaActual,
        currentMonth
      );

      // 5. Filtrar solo los registros del día actual para la tienda del usuario
      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.tienda_id === userStore.id && pe.fecha === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      // 6. Si hay al menos un registro de presupuesto, la validación pasa
      const hasBudget = budgetCount > 0;
      setHasBudgetData(hasBudget);

      if (!hasBudget) {
        setError(
          "No hay presupuesto diario asignado para ningún empleado en el día de hoy"
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
    setValidationCompleted(false);
    setError(null);
  };

  /**
   * NUEVO: Función para revalidar presupuesto después de guardar
   * Esta función es más rápida ya que no verifica permisos ni múltiples tiendas
   */
  const revalidateBudgetData = async () => {
    try {
      setValidationCompleted(false);
      setError(null);

      // 1. Verificar si el usuario tiene la política readComisionesTienda
      const hasStorePolicy = hasPolicy("readComisionesTienda");
      if (!hasStorePolicy) {
        // Si no tiene la política, no validamos presupuesto (usuario admin/comercial)
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // 2. Obtener la tienda del usuario
      const tiendas = await obtenerTiendas();
      if (tiendas.length === 0) {
        setError("No tienes tiendas asignadas");
        setValidationCompleted(true);
        return;
      }

      if (tiendas.length > 1) {
        // Si tiene múltiples tiendas, no validamos presupuesto
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // Guardar la tienda del usuario
      const userStore = tiendas[0];
      setCurrentStore(userStore);

      // 3. Verificar si es el mes actual
      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();

      // 4. Consultar presupuestos de empleados para la tienda del día actual
      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        userStore.id,
        fechaActual,
        currentMonth
      );

      // 5. Filtrar solo los registros del día actual para la tienda del usuario
      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.tienda_id === userStore.id && pe.fecha === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      // 6. Si hay al menos un registro de presupuesto, la validación pasa
      const hasBudget = budgetCount > 0;
      setHasBudgetData(hasBudget);

      if (!hasBudget) {
        setError(
          "No hay presupuesto diario asignado para ningún empleado en el día de hoy"
        );
      }

      setValidationCompleted(true);
    } catch (err) {
      console.error("Error revalidando presupuesto diario:", err);
      setError("Error al revalidar presupuesto diario");
      setHasBudgetData(false);
      setValidationCompleted(true);
    }
  };

  // Auto-validar cuando se monta el hook y el usuario está disponible
  useEffect(() => {
    if (user) {
      validateBudgetData();
    }
  }, [user]);

  return {
    hasBudgetData,
    currentStore,
    todayBudgetCount,
    validationCompleted,
    error,
    validateBudgetData,
    revalidateBudgetData,
    resetState,
  };
};
