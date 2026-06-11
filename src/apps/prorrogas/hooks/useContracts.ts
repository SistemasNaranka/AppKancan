import { useMemo } from 'react';
import { useContractContext } from '../contexts/ContractContext';
import { Contrato, ContractStatus, DashboardStats, Prorroga } from '../types/types';
import { formatNombreCompleto } from '../lib/nombreCompleto';

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeContractStatus(daysLeft: number): ContractStatus {
  if (daysLeft < 0) return 'vencido';
  if (daysLeft <= 30) return 'proximo';
  return 'vigente';
}

export interface EnrichedContrato extends Contrato {
  lastProrroga: Prorroga | null;
  fechaVencimiento: string | null;
  daysLeft: number;
  contractStatus: ContractStatus;
}


export const useContracts = () => {
  const ctx = useContractContext();
  const { contratos, filters } = ctx;

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

  const filteredContratos = useMemo<EnrichedContrato[]>(() => {
    const q = filters.search.toLowerCase().trim();
    const statusFilter = filters.contractStatus ?? 'todos';

    return enriched
      .filter((c) => {
        if (statusFilter !== 'todos' && c.contractStatus !== statusFilter) return false;
        if (q) {
          return (
            formatNombreCompleto(c).toLowerCase().includes(q) ||
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
        if (filters.sortBy === 'nombre') return formatNombreCompleto(a).localeCompare(formatNombreCompleto(b));
        if (filters.sortBy === 'prorroga') return (b.extensions?.length ?? 0) - (a.extensions?.length ?? 0);
        return 0;
      });
  }, [enriched, filters]);

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

  const recentContratos = useMemo<EnrichedContrato[]>(
    () =>
      [...enriched]
        .sort((a, b) => b.id - a.id)
        .slice(0, 10),
    [enriched],
  );

  const alertContratos = useMemo(
    () =>
      enriched
        .filter((c) => c.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [enriched],
  );

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
