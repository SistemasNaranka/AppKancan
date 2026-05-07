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
  /** Última prórroga registrada (mayor número) - puede ser null si no hay prorrogas */
  lastProrroga: Prorroga | null;
  /** Fecha de vencimiento efectiva (fecha_final del contrato o última(prorroga) */
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
  // NOTA: Ahora usa fecha_final del contrato directamente para el vencimiento
  const enriched = useMemo<EnrichedContrato[]>(() => {
    return contratos
      .map((c) => {
        // Usar fecha_final del contrato directamente para el vencimiento
        const fechaVencimiento = c.fecha_final ?? null;
        const daysLeft = fechaVencimiento ? daysUntil(fechaVencimiento) : Infinity;
        const contractStatus = isFinite(daysLeft) ? computeContractStatus(daysLeft) : 'vigente';

        // Obtener última prórroga si existe (para otros usos)
        const lastProrroga = c.prorrogas && c.prorrogas.length > 0
          ? [...c.prorrogas].sort((a, b) => a.numero - b.numero)[c.prorrogas.length - 1]
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
        // Filtro por ContractStatus visual (botones Todos / Activo / etc.)
        if (statusFilter !== 'todos' && c.contractStatus !== statusFilter) return false;
        // Búsqueda libre
        if (q) {
          return (
            c.nombre.toLowerCase().includes(q) ||
            (c.apellido?.toLowerCase() ?? '').includes(q) ||
            String(c.cargo).toLowerCase().includes(q) ||
            (c.area?.toLowerCase() ?? '').includes(q) ||
            (c.empresa?.toLowerCase() ?? '').includes(q) ||
            (c.documento?.toLowerCase() ?? '').includes(q) ||
            (c.tipo_contrato?.toLowerCase() ?? '').includes(q) ||
            (c.numero_contrato?.toLowerCase() ?? '').includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'vencimiento') return a.daysLeft - b.daysLeft;
        if (filters.sortBy === 'nombre') return a.nombre.localeCompare(b.nombre);
        if (filters.sortBy === 'prorroga') return (b.prorrogas?.length ?? 0) - (a.prorrogas?.length ?? 0);
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

  // ── 4. Contratos recientes (últimos 10 por número de prórroga + id) ──────
  const recentContratos = useMemo<EnrichedContrato[]>(
    () =>
      [...enriched]
        .sort((a, b) => b.id - a.id)   // más recientes primero (por id de creación)
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

  // ── 6. Conteos por ContractStatus (para badges y distribución) ───────────
  const counts = useMemo(
    () => ({
      // Estos sí existen en dashboardStats (basado en tus errores previos)
      activos: dashboardStats.activos,
      por_vencer: dashboardStats.por_vencer,
      criticos: dashboardStats.criticos,
      vencidos: dashboardStats.vencidos,
      total: dashboardStats.total,

      // Para los estados de "solicitud", calculamos directamente de 'enriched'
      // Quitamos el "dashboardStats?.propiedad" porque esa interfaz no los incluye
      pendiente: enriched.filter((c) => c.request_status === 'pendiente').length,
      en_revision: enriched.filter((c) => c.request_status === 'en_revision').length,
      aprobada: enriched.filter((c) => c.request_status === 'aprobada').length,
      rechazada: enriched.filter((c) => c.request_status === 'rechazada').length,
      completada: enriched.filter((c) => c.request_status === 'completada').length,
    }),
    [dashboardStats, enriched],
  );

  return {
    // Context base (acciones, estado crudo)
    ...ctx,

    // Contratos enriquecidos
    allEnriched: enriched,
    filteredContratos,
    recentContratos,
    alertContratos,

    // Estadísticas
    dashboardStats,
    counts,

    // Aliases de compatibilidad
    filteredContracts: filteredContratos,
    selectedContract: ctx.selectedContrato,
    selectContract: ctx.select,
  };
};
