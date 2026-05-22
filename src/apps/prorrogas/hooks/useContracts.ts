import { useMemo } from 'react';
import { useContractContext } from '../contexts/ContractContext';
import { Contrato, ContractStatus, DashboardStats, Prorroga } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Días desde hoy hasta dateStr (negativo = ya expiró) */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Estado visual calculado a partir de días restantes:
 *  - vencido : daysLeft < 0
 *  - proximo : 0 – 30 días
 *  - vigente  : > 30 días
 */
export function computeContractStatus(daysLeft: number): ContractStatus {
  if (daysLeft < 0) return 'vencido';
  if (daysLeft <= 30) return 'proximo';
  return 'vigente';
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipo enriquecido
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichedContrato extends Contrato {
  /** Última prórroga registrada (mayor número) - puede ser null si no hay extensions */
  lastProrroga: Prorroga | null;
  /** Fecha de vencimiento efectiva (end_date del contrato o última prórroga) */
  fechaVencimiento: string | null;
  /** Días restantes hasta vencimiento (Infinity si no hay fecha) */
  daysLeft: number;
  /** Estado visual basado en días restantes */
  contractStatus: ContractStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useContracts = () => {
  const ctx = useContractContext();
  const { contratos, filters } = ctx;

  // ── 1. Enriquecer todos los contratos ───────────────────────────────────
  const enriched = useMemo<EnrichedContrato[]>(() => {
    return contratos
      .map((c) => {
        const fechaVencimiento = c.end_date ?? null;
        const daysLeft = fechaVencimiento ? daysUntil(fechaVencimiento) : Infinity;
        const contractStatus = isFinite(daysLeft) ? computeContractStatus(daysLeft) : 'vigente';

        const lastProrroga = c.extensions && c.extensions.length > 0
          ? [...c.extensions].sort((a, b) => a.extension_number - b.extension_number)[c.extensions.length - 1]
          : null;

        return { ...c, lastProrroga, fechaVencimiento, daysLeft, contractStatus };
      });
  }, [contratos]);

  // ── 2. Filtrar y ordenar para la vista de Contratos ──────────────────────
  const filteredContratos = useMemo<EnrichedContrato[]>(() => {
    const q = filters.search.toLowerCase().trim();
    const statusFilter = filters.contractStatus ?? 'todos';

    return enriched
      .filter((c) => {
        if (statusFilter !== 'todos' && c.contractStatus !== statusFilter) return false;
        if (q) {
          return (
            c.first_name.toLowerCase().includes(q) ||
            (c.last_name?.toLowerCase() ?? '').includes(q) ||
            String(c.position).toLowerCase().includes(q) ||
            (c.department?.toLowerCase() ?? '').includes(q) ||
            (c.empresa?.toLowerCase() ?? '').includes(q) ||
            (c.document?.toLowerCase() ?? '').includes(q) ||
            (c.contract_type?.toLowerCase() ?? '').includes(q) ||
            (c.numero_contrato?.toLowerCase() ?? '').includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'vencimiento') return a.daysLeft - b.daysLeft;
        if (filters.sortBy === 'nombre') return a.first_name.localeCompare(b.first_name);
        if (filters.sortBy === 'prorroga') return (b.extensions?.length ?? 0) - (a.extensions?.length ?? 0);
        return 0;
      });
  }, [enriched, filters]);

  // ── 3. Estadísticas del dashboard ────────────────────────────────────────
  const dashboardStats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const msDay = 1000 * 60 * 60 * 24 * 30; // ~30 días en ms

    const activos = enriched.filter((c) => c.contractStatus === 'vigente').length;
    const por_vencer = enriched.filter((c) => c.contractStatus === 'proximo' && c.daysLeft > 7).length;
    const criticos = enriched.filter((c) => c.contractStatus === 'proximo' && c.daysLeft <= 7).length;
    const vencidos = enriched.filter((c) => c.contractStatus === 'vencido').length;

    const nuevos_este_mes = enriched.filter((c) => {
      if (!c.date_created) return false;
      return (now.getTime() - new Date(c.date_created).getTime()) <= msDay;
    }).length;

    return {
      total: enriched.length,
      activos,
      por_vencer,
      criticos,
      vencidos,
      nuevos_este_mes,
    };
  }, [enriched]);

  // ── 4. Contratos recientes (últimos 10 por id de creación) ───────────────
  const recentContratos = useMemo<EnrichedContrato[]>(
    () =>
      [...enriched]
        .sort((a, b) => b.id - a.id)
        .slice(0, 10),
    [enriched],
  );

  // ── 5. Contratos para la campana (≤ 7 días o vencidos) ──────────────────
  const alertContratos = useMemo(
    () =>
      enriched
        .filter((c) => c.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [enriched],
  );

  // ── 6. Conteos por ContractStatus ─────────────────────────────────────────
  const counts = useMemo(
    () => ({
      activos: dashboardStats.activos,
      por_vencer: dashboardStats.por_vencer,
      criticos: dashboardStats.criticos,
      vencidos: dashboardStats.vencidos,
      total: dashboardStats.total,

      pendiente: enriched.filter((c) => c.status === 'pendiente').length,
      en_revision: enriched.filter((c) => c.status === 'en_revision').length,
      aprobada: enriched.filter((c) => c.status === 'aprobada').length,
      rechazada: enriched.filter((c) => c.status === 'rechazada').length,
      completada: enriched.filter((c) => c.status === 'completada').length,
    }),
    [dashboardStats, enriched],
  );

  return {
    ...ctx,

    allEnriched: enriched,
    filteredContratos,
    recentContratos,
    alertContratos,

    dashboardStats,
    counts,

    filteredContracts: filteredContratos,
    selectedContract: ctx.selectedContrato,
    selectContract: ctx.select,
  };
};
