import { createContext} from "react";
interface FilterState {
  duracion: "temporal" | "fija" | null;
  setDuracion: (d: "temporal" | "fija") => void;

  tipos: string[];
  setTipos: (types: string[]) => void;

  descuentoRange: { min: number; max: number };
  setDescuentoRange: (range: { min: number; max: number }) => void;

  tiendas: (string | number)[]; // 🆕 Tiendas seleccionadas
  setTiendas: (stores: (string | number)[]) => void; // 🆕 Setter
}
const PromotionsFilterContext = createContext<FilterState | undefined>(undefined);
export default PromotionsFilterContext