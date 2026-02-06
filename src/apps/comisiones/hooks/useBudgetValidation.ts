import { useState, useEffect } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { useUserPolicies } from "./useUserPolicies";
import {
  obtenerTiendas,
  obtenerPresupuestosEmpleados,
  obtenerPresupuestosDiarios,
} from "../api/directus/read";
import { DirectusTienda } from "../types/modal";

interface BudgetValidationState {
  hasBudgetData: boolean | null; // null = cargando, true = tiene datos, false = no tiene datos
  currentStore: DirectusTienda | null;
  todayBudgetCount: number;
  missingDaysCount: number; // NUEVO: Días sin presupuesto en el mes actual
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
export const useBudgetValidation = (selectedTiendaName?: string): UseBudgetValidationReturn => {
  const { user } = useAuth();
  const { hasPolicy } = useUserPolicies();

  const [hasBudgetData, setHasBudgetData] = useState<boolean | null>(null);
  const [currentStore, setCurrentStore] = useState<DirectusTienda | null>(null);
  const [todayBudgetCount, setTodayBudgetCount] = useState(0);
  const [missingDaysCount, setMissingDaysCount] = useState(0);
  const [validationCompleted, setValidationCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener la fecha actual en formato YYYY-MM-DD usando la hora local de Colombia (UTC-5)
   */
  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getFullYear(); // Usar hora local
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Usar hora local
    const day = String(now.getDate()).padStart(2, "0"); // Usar hora local
    return `${year}-${month}-${day}`;
  };

  /**
   * Verificar si un mes es el mes actual usando la hora local
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
    return ahora.getFullYear() === anio && ahora.getMonth() === mesNumero; // Usar hora local
  };

  /**
   * Obtener el mes actual en formato "MMM YYYY" usando la hora local de Colombia (UTC-5)
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
    const mesNombre = months[now.getMonth()]; // Usar hora local
    const anio = now.getFullYear(); // Usar hora local
    return `${mesNombre} ${anio}`;
  };

  const validateBudgetData = async () => {
    try {
      setValidationCompleted(false);
      setError(null);
      setHasBudgetData(null);

      // 1. Verificar si el usuario tiene la política readComisionesTienda
      // Si se proporciona un selectedTiendaName, estamos en modo "validación forzada" (ej. Admin viendo una tienda)
      const hasStorePolicy = hasPolicy("readComisionesTienda");

      if (!hasStorePolicy && !selectedTiendaName) {
        // Si no tiene la política y no hay tienda seleccionada, no validamos presupuesto (usuario admin/comercial)
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // 2. Obtener la tienda
      const tiendas = await obtenerTiendas();
      let targetStore: DirectusTienda | undefined;

      if (selectedTiendaName) {
        // Buscar la tienda por nombre si se proporcionó
        targetStore = tiendas.find(t => t.nombre === selectedTiendaName);
      } else if (tiendas.length === 1) {
        // Comportamiento original para personal de tienda
        targetStore = tiendas[0];
      }

      if (!targetStore) {
        // Si no encontramos la tienda específica o tiene múltiples sin filtro, bypass
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // Guardar la tienda objetivo
      setCurrentStore(targetStore);

      // 3. Verificar si es el mes actual
      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();

      // 4. Consultar presupuestos de empleados para la tienda del día actual
      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        targetStore.id,
        undefined, // Consultar todo el mes para calcular missingDays
        currentMonth
      );

      // 5. Filtrar solo los registros del día actual para la tienda del usuario
      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.tienda_id === targetStore.id && pe.fecha === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      // 6. Consultar presupuestos de la casa para el mes (para saber qué días tienen meta real)
      const ahora = new Date();
      const startOfMonth = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
      const endOfMonth = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];

      const presupuestosCasa = await obtenerPresupuestosDiarios(targetStore.id, startOfMonth, endOfMonth);

      const diasConMetaValida = new Set(
        presupuestosCasa
          .filter((p: any) => (p.presupuesto || 0) > 0)
          .map((p: any) => p.fecha)
      );

      // 7. Calcular días sin presupuesto en el mes (hasta hoy) que SÍ tengan meta > 0
      const diasPasadosSet = new Set();
      presupuestosEmpleados.forEach((pe: any) => {
        diasPasadosSet.add(pe.fecha);
      });

      let missingCount = 0;
      for (let i = 1; i <= ahora.getDate(); i++) {
        const diaStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        // Solo contar como pendiente si:
        // - NO tiene asignación de empleados
        // - TIENE meta de casa > 0 (es un día de venta real)
        if (!diasPasadosSet.has(diaStr) && diasConMetaValida.has(diaStr)) {
          missingCount++;
        }
      }
      setMissingDaysCount(missingCount);

      // 8. Si hay al menos un registro de presupuesto, la validación pasa
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
    setMissingDaysCount(0);
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
      if (!hasStorePolicy && !selectedTiendaName) {
        // Si no tiene la política, no validamos presupuesto (usuario admin/comercial)
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // 2. Obtener la tienda
      const tiendas = await obtenerTiendas();
      let targetStore: DirectusTienda | undefined;

      if (selectedTiendaName) {
        targetStore = tiendas.find(t => t.nombre === selectedTiendaName);
      } else if (tiendas.length === 1) {
        targetStore = tiendas[0];
      }

      if (!targetStore) {
        setHasBudgetData(true);
        setValidationCompleted(true);
        return;
      }

      // Guardar la tienda objetivo
      setCurrentStore(targetStore);

      // 3. Verificar si es el mes actual
      const currentMonth = getCurrentMonth();
      const fechaActual = getCurrentDate();

      // 4. Consultar presupuestos de empleados para la tienda del día actual
      const presupuestosEmpleados = await obtenerPresupuestosEmpleados(
        targetStore.id,
        undefined,
        currentMonth
      );

      // 5. Filtrar solo los registros del día actual para la tienda del usuario
      const presupuestosHoy = presupuestosEmpleados.filter((pe: any) => {
        return pe.tienda_id === targetStore.id && pe.fecha === fechaActual;
      });

      const budgetCount = presupuestosHoy.length;
      setTodayBudgetCount(budgetCount);

      // 6. Consultar presupuestos de la casa para el mes (para saber metas)
      const ahora = new Date();
      const startOfMonth = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-01`;
      const endOfMonth = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0];

      const presupuestosCasa = await obtenerPresupuestosDiarios(targetStore.id, startOfMonth, endOfMonth);

      const diasConMetaValida = new Set(
        presupuestosCasa
          .filter((p: any) => (p.presupuesto || 0) > 0)
          .map((p: any) => p.fecha)
      );

      // 7. Calcular días sin presupuesto en el mes (hasta hoy)
      const diasPasadosSet = new Set();
      presupuestosEmpleados.forEach((pe: any) => {
        diasPasadosSet.add(pe.fecha);
      });

      let missingCount = 0;
      for (let i = 1; i <= ahora.getDate(); i++) {
        const diaStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        if (!diasPasadosSet.has(diaStr) && diasConMetaValida.has(diaStr)) {
          missingCount++;
        }
      }
      setMissingDaysCount(missingCount);

      // 8. Si hay al menos un registro de presupuesto, la validación pasa
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

  // Auto-validar cuando se monta el hook, el usuario está disponible o cambia la tienda seleccionada
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
