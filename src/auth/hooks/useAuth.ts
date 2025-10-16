import { useContext} from "react";
import { AuthContext } from "./AuthContext";
/**
   *  Hook para extraer los states y funciones otorgados por el AuthProvider
*/
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}