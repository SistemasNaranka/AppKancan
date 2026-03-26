import { useMemo } from "react";
import { useContractContext } from "../contexts/ContractContext";
import { Contrato } from "../types/types";
import { daysUntil, getContractStatus } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// useContracts — filtra, ordena y enriquece la lista de contratos
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichedContrato extends Contrato {
  /** Días restantes hasta el vencimiento */
  daysLeft: number;
  /** Estado visual del contrato */
  contractStatus: ReturnType<typeof getContractStatus>;
}

export const useContracts = () => {
  const ctx = useContractContext();
  const { contratos, filters } = ctx;

  const enriched = useMemo<EnrichedContrato[]>(() => {
    return contratos.map((c) => {
      const daysLeft = daysUntil(c.fecha_final);
      const contractStatus = getContractStatus(c.fecha_final);
      return { ...c, daysLeft, contractStatus };
    });
  }, [contratos]);

  const filtered = useMemo<EnrichedContrato[]>(() => {
    const q = filters.search.toLowerCase().trim();

    return enriched
      .filter((c) => {
        // Filtro por búsqueda
        if (q) {
          return (
            c.nombre.toLowerCase().includes(q) ||
            c.apellido.toLowerCase().includes(q) ||
            c.cargo.toLowerCase().includes(q) ||
            c.documento.toLowerCase().includes(q) ||
            String(c.id).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "vencimiento") return a.daysLeft - b.daysLeft;
        if (filters.sortBy === "nombre")
          return `${a.nombre} ${a.apellido}`.localeCompare(
            `${b.nombre} ${b.apellido}`,
          );
        if (filters.sortBy === "fecha_ingreso")
          return (
            new Date(a.fecha_ingreso).getTime() -
            new Date(b.fecha_ingreso).getTime()
          );
        return 0;
      });
  }, [enriched, filters]);

  // Contratos para la campana de notificaciones (≤ 50 días)
  const alertContratos = useMemo(
    () =>
      enriched
        .filter((c) => c.daysLeft >= 0 && c.daysLeft <= 50)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [enriched],
  );

  return {
    ...ctx,
    filteredContratos: filtered,
    allEnriched: enriched,
    alertContratos,
    // Aliases para compatibilidad
    selectContract: ctx.select,
    filteredContracts: filtered,
    selectedContract: ctx.selectedContrato,
  };
};
