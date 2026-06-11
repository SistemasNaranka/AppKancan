import { useState, useEffect } from "react";
import { obtenerTodosPresupuestosMeses } from "../api/directus/read";
export const useAvailableMonths = () => {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  useEffect(() => {
    const loadAllMonths = async () => {
      try {
        setIsLoadingMonths(true);
        const meses = await obtenerTodosPresupuestosMeses();

        if (meses.length > 0) {
          setAvailableMonths(meses);
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
          const mesActual = mesesNombres[ahora.getMonth()];
          const anioActual = ahora.getFullYear();
          const mesActualStr = `${mesActual} ${anioActual}`;

          const mesEncontrado = meses.find((m) => m === mesActualStr);

          if (mesEncontrado) {
            setCurrentMonth(mesEncontrado);
          } else {
            setCurrentMonth(meses[meses.length - 1]);
          }
        } else {
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
          const mesActual = mesesNombres[ahora.getMonth()];
          const anioActual = ahora.getFullYear();
          const mesActualStr = `${mesActual} ${anioActual}`;

          setAvailableMonths([mesActualStr]);
          setCurrentMonth(mesActualStr);
        }
      } catch (error) {
        console.error("Error cargando meses disponibles:", error);

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
        const mesActual = mesesNombres[ahora.getMonth()];
        const anioActual = ahora.getFullYear();
        const mesActualStr = `${mesActual} ${anioActual}`;

        setAvailableMonths([mesActualStr]);
        setCurrentMonth(mesActualStr);
      } finally {
        setIsLoadingMonths(false);
      }
    };

    loadAllMonths();
  }, []);

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
    setCurrentMonth,
  };
};
