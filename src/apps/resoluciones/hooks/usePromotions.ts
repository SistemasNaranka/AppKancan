import { useMemo } from "react";
import { Promotion } from "../types/promotion";
import { mockPromotions } from "../data/mockPromotions";

/**
 * Devuelve todas las promociones.  
 * Los componentes deberán filtrar por año, mes, día o tipo.
 */
export const usePromotions = (): Promotion[] => {
  return useMemo(() => {
    return [...mockPromotions]; // copia para evitar mutaciones accidentales
  }, []);
};