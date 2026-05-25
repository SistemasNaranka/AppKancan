import { useState, useEffect } from "react";
import { obtenerTodosPresupuestosMeses } from "../api/directus/read";

/**
 * Hook para obtener todos los meses disponibles y manejar el mes actual
 * NO cambia los cálculos existentes, solo la carga inicial de meses
 */
export const useAvailableMonths = () => {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  useEffect(() => {
    const loadAllMonths = async () => {
      try {
        setIsLoadingMonths(true);
        const meses = await obtenerTodosPresupuestosMeses();

        // Si hay meses disponibles
        if (meses.length > 0) {
          setAvailableMonths(meses);

          // Determinar el mes actual
          const ahora = new Date();
          const mesesNombres = [
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
          const mesActual = mesesNombres[ahora.getMonth()]; // Usar hora local
          const anioActual = ahora.getFullYear(); // Usar hora local
          const mesActualStr = `${mesActual} ${anioActual}`;

          // Verificar si el mes actual está en la lista
          const mesEncontrado = meses.find((m) => m === mesActualStr);

          if (mesEncontrado) {
            // Si el mes actual está disponible, usarlo
            setCurrentMonth(mesEncontrado);
          } else {
            // Si el mes actual no está disponible, usar el más reciente
            setCurrentMonth(meses[meses.length - 1]);
          }
        } else {
          // Si no hay meses disponibles, usar un valor por defecto
          const mesesNombres = [
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
          const ahora = new Date();
          const mesActual = mesesNombres[ahora.getMonth()]; // Usar hora local
          const anioActual = ahora.getFullYear(); // Usar hora local
          const mesActualStr = `${mesActual} ${anioActual}`;

          setAvailableMonths([mesActualStr]);
          setCurrentMonth(mesActualStr);
        }
      } catch (error) {
        console.error("Error cargando meses disponibles:", error);

        // En caso de error, usar mes actual como fallback
        const mesesNombres = [
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
        const ahora = new Date();
        const mesActual = mesesNombres[ahora.getMonth()]; // Usar hora local
        const anioActual = ahora.getFullYear(); // Usar hora local
        const mesActualStr = `${mesActual} ${anioActual}`;

        setAvailableMonths([mesActualStr]);
        setCurrentMonth(mesActualStr);
      } finally {
        setIsLoadingMonths(false);
      }
    };

    loadAllMonths();
  }, []);

  // Función para cambiar el mes seleccionado
  const changeMonth = (month: string) => {
    if (availableMonths.includes(month)) {
      setCurrentMonth(month);
      return true;
    }
    return false;
  };

  return {
    availableMonths,
    currentMonth,
    isLoadingMonths,
    changeMonth,
    setCurrentMonth, // Para compatibilidad
  };
};
