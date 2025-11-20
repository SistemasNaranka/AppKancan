import React, { useState, useMemo } from "react";
import PromotionsFilterContext, { ViewType } from "./PromotionsFilterContext";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export const PromotionsFilterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tipos, setTipos] = useState<string[]>([]);
  const [descuentoRange, setDescuentoRange] = useState<{
    min: number;
    max: number;
  }>({ min: 0, max: 100 });
  const [duracion, setDuracion] = useState<("temporal" | "fija")[]>([
    "temporal",
  ]);

  // Función para setDuracion con validación de al menos una selección
  const setDuracionValidated = (d: ("temporal" | "fija")[]) => {
    if (d.length === 0) return; // No permitir array vacío
    setDuracion(d);
  };

  const [tiendas, setTiendas] = useState<(string | number)[]>([]);

  // 🆕 Estado compartido para sincronización de fecha
  const [focusedDate, setFocusedDate] = useState<Dayjs>(dayjs());

  // 🆕 Vista activa
  const [selectedView, setSelectedView] = useState<ViewType>("anual");

  // 🆕 Filtro solo vigentes
  const [soloVigentes, setSoloVigentes] = useState<boolean>(true);

  // 🆕 Año enfocado (derivado de focusedDate)
  const focusedYear = useMemo(() => focusedDate.year(), [focusedDate]);

  const value = useMemo(
    () => ({
      tipos,
      setTipos,
      duracion,
      setDuracion: setDuracionValidated,
      descuentoRange,
      setDescuentoRange,
      tiendas,
      setTiendas,
      focusedDate,
      setFocusedDate,
      selectedView,
      setSelectedView,
      soloVigentes,
      setSoloVigentes,
      focusedYear,
    }),
    [
      tipos,
      duracion,
      descuentoRange,
      tiendas,
      focusedDate,
      selectedView,
      soloVigentes,
      focusedYear,
    ]
  );

  return (
    <PromotionsFilterContext.Provider value={value}>
      {children}
    </PromotionsFilterContext.Provider>
  );
};
