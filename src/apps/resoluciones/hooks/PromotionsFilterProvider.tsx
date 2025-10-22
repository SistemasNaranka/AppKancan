// PromotionsFilterProvider.tsx
import React, { useState, useMemo } from "react";
import PromotionsFilterContext from "./PromotionsFilterContext";

export const PromotionsFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tipos, setTipos] = useState<string[]>([]);
  const [descuentoRange, setDescuentoRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [duracion, setDuracion] = useState<"temporal" | "fija" | null>("temporal");
  const [tiendas, setTiendas] = useState<(string | number)[]>([]); // 🆕 NUEVO

  const value = useMemo(
    () => ({
      tipos,
      setTipos,
      duracion,
      setDuracion,
      descuentoRange,
      setDescuentoRange,
      tiendas,         // 🆕
      setTiendas,      // 🆕
    }),
    [tipos, duracion, descuentoRange, tiendas]
  );

  return <PromotionsFilterContext.Provider value={value}>{children}</PromotionsFilterContext.Provider>;
};
