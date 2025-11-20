import { createContext } from "react";
import { Dayjs } from "dayjs";

export type ViewType = "anual" | "mensual" | "semanal" | "dia";

interface FilterState {
  duracion: ("temporal" | "fija")[];
  setDuracion: (d: ("temporal" | "fija")[]) => void;

  tipos: string[];
  setTipos: (types: string[]) => void;

  descuentoRange: { min: number; max: number };
  setDescuentoRange: (range: { min: number; max: number }) => void;

  tiendas: (string | number)[];
  setTiendas: (stores: (string | number)[]) => void;

  // 🆕 Sincronización de fecha entre vistas
  focusedDate: Dayjs;
  setFocusedDate: (date: Dayjs) => void;

  // 🆕 Vista activa
  selectedView: ViewType;
  setSelectedView: (view: ViewType) => void;

  // 🆕 Filtro solo vigentes
  soloVigentes: boolean;
  setSoloVigentes: (value: boolean) => void;

  // 🆕 Año enfocado (sigiloso, derivado de focusedDate)
  focusedYear: number;
}

const PromotionsFilterContext = createContext<FilterState | undefined>(
  undefined
);
export default PromotionsFilterContext;
