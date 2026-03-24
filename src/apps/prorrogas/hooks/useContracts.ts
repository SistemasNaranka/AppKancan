import { useMemo } from "react";
import { useContractContext } from "../contexts/ContractContext";
import { Contrato } from "../types/types";
import { daysUntil, getContractStatus } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// useContracts — filtra, ordena y enriquece la lista de contratos
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichedContrato extends Contrato {
  /** Última prórroga registrada */
  lastProrroga: Contrato["prorrogas"][number];
  /** Días restantes hasta el vencimiento */
  daysLeft: number;
  /** Estado visual del contrato */
  contractStatus: ReturnType<typeof getContractStatus>;
}

export const useContracts = () => {
  const ctx = useContractContext();
  const { contratos, filters, stats } = ctx;

  const enriched = useMemo<EnrichedContrato[]>(() => {
    return contratos
      .filter((c) => c.prorrogas && c.prorrogas.length > 0)
      .map((c) => {
        // Ordenar prórrogas por número ascendente y tomar la última
        const sorted = [...c.prorrogas].sort((a, b) => a.numero - b.numero);
        const lastProrroga = sorted[sorted.length - 1];
        const daysLeft = daysUntil(lastProrroga.fecha_fin);
        const contractStatus = getContractStatus(lastProrroga.fecha_fin);
        return { ...c, lastProrroga, daysLeft, contractStatus };
      });
  }, [contratos]);

  const filtered = useMemo<EnrichedContrato[]>(() => {
    const q = filters.search.toLowerCase().trim();

    return enriched
      .filter((c) => {
        // Filtro por tab (request_status)
        if (filters.tab !== "resumen" && c.request_status !== filters.tab)
          return false;
        // Filtro por búsqueda
        if (q) {
          return (
            c.empleado_nombre.toLowerCase().includes(q) ||
            c.empleado_cargo.toLowerCase().includes(q) ||
            c.empleado_departamento.toLowerCase().includes(q) ||
            String(c.id).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "vencimiento") return a.daysLeft - b.daysLeft;
        if (filters.sortBy === "nombre")
          return a.empleado_nombre.localeCompare(b.empleado_nombre);
        if (filters.sortBy === "prorroga")
          return b.prorrogas.length - a.prorrogas.length;
        return 0;
      });
  }, [enriched, filters]);

  // Counts por estado (para badges en tabs). Usa stats de Directus si están disponibles.
  const counts = useMemo(
    () => ({
      pendiente:
        stats?.pendiente ??
        enriched.filter((c) => c.request_status === "pendiente").length,
      en_revision:
        stats?.en_revision ??
        enriched.filter((c) => c.request_status === "en_revision").length,
      aprobada:
        stats?.aprobada ??
        enriched.filter((c) => c.request_status === "aprobada").length,
      rechazada:
        stats?.rechazada ??
        enriched.filter((c) => c.request_status === "rechazada").length,
      completada:
        stats?.completada ??
        enriched.filter((c) => c.request_status === "completada").length,
      alertas: enriched.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 50)
        .length,
      total: stats?.total ?? enriched.length,
    }),
    [enriched, stats],
  );

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
    counts,
    // Aliases para compatibilidad
    selectContract: ctx.select,
    filteredContracts: filtered,
    selectedContract: ctx.selectedContrato,
  };
};
