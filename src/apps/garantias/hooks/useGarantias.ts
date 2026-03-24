import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGarantias,
  getGarantiaById,
  getGarantiaStats,
  searchClientes,
} from "../api/directus/read";
import {
  crearGarantia,
  actualizarGarantia,
  eliminarGarantia,
  cambiarEstadoGarantia,
  crearCliente,
} from "../api/directus/create";
import type {
  GarantiaFilters,
  PaginationParams,
  CreateGarantia,
  UpdateGarantia,
  Garantia,
  CreateCliente,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys — centralizados para invalidación precisa
// ─────────────────────────────────────────────────────────────────────────────
export const garantiaKeys = {
  all:    ()                                          => ["garantias"]                          as const,
  lists:  ()                                          => ["garantias", "list"]                  as const,
  list:   (f: GarantiaFilters, p: PaginationParams)  => ["garantias", "list", f, p]             as const,
  detail: (id: number)                               => ["garantias", "detail", id]             as const,
  stats:  (f: GarantiaFilters)                       => ["garantias", "stats", f]               as const,
  clientes: (q: string)                              => ["clientes", "search", q]               as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista paginada de garantías con filtros.
 */
export function useGarantias(
  filters: GarantiaFilters = {},
  pagination: PaginationParams = { page: 0, limit: 10 }
) {
  return useQuery({
    queryKey: garantiaKeys.list(filters, pagination),
    queryFn:  () => getGarantias(filters, pagination),
    staleTime: 30_000,   // 30s — no refetch innecesario
    gcTime:    120_000,  // 2min en caché
    placeholderData: (prev) => prev, // mantiene datos anteriores mientras carga
  });
}

/**
 * Detalle de una garantía por ID.
 */
export function useGarantia(id: number | null) {
  return useQuery({
    queryKey: garantiaKeys.detail(id!),
    queryFn:  () => getGarantiaById(id!),
    enabled:  id !== null && id > 0,
    staleTime: 60_000,
  });
}

/**
 * Estadísticas agregadas por estado.
 * staleTime más alto porque cambian menos frecuente que la lista.
 */
export function useGarantiaStats(filters: GarantiaFilters = {}) {
  // Para stats, ignoramos el filtro de estado (queremos conteos globales)
  const { estado: _estado, ...filtersForStats } = filters;

  return useQuery({
    queryKey: garantiaKeys.stats(filtersForStats),
    queryFn:  () => getGarantiaStats(filtersForStats),
    staleTime: 60_000,   // 1min — los conteos no cambian tan rápido
    gcTime:    180_000,  // 3min
  });
}

/**
 * Búsqueda de clientes para autocompletar en el formulario.
 */
export function useSearchClientes(query: string) {
  return useQuery({
    queryKey: garantiaKeys.clientes(query),
    queryFn:  () => searchClientes(query),
    enabled:  query.trim().length >= 2,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crear garantía — invalida lista y stats al terminar.
 */
export function useCrearGarantia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGarantia) => crearGarantia(data),
    onSuccess: () => {
      // Invalida toda la lista y los stats para que se refresquen
      queryClient.invalidateQueries({ queryKey: garantiaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["garantias", "stats"] });
    },
  });
}

/**
 * Actualizar garantía — actualiza la caché optimistamente.
 */
export function useActualizarGarantia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateGarantia }) =>
      actualizarGarantia(id, updates),

    onSuccess: (updatedGarantia) => {
      // Actualiza el detalle en caché directamente sin refetch
      queryClient.setQueryData(
        garantiaKeys.detail(updatedGarantia.id),
        updatedGarantia
      );
      // Invalida listas y stats para sincronizar
      queryClient.invalidateQueries({ queryKey: garantiaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["garantias", "stats"] });
    },
  });
}

/**
 * Eliminar garantía.
 */
export function useEliminarGarantia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eliminarGarantia(id),
    onSuccess: (_data, id) => {
      // Elimina el detalle de la caché
      queryClient.removeQueries({ queryKey: garantiaKeys.detail(id) });
      // Invalida listas y stats
      queryClient.invalidateQueries({ queryKey: garantiaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["garantias", "stats"] });
    },
  });
}

/**
 * Cambiar solo el estado de una garantía (aprobada, rechazada, etc).
 */
export function useCambiarEstadoGarantia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      estado,
      resolucion,
    }: {
      id: number;
      estado: Garantia["estado"];
      resolucion?: string;
    }) => cambiarEstadoGarantia(id, estado, resolucion),

    onSuccess: (updatedGarantia) => {
      queryClient.setQueryData(
        garantiaKeys.detail(updatedGarantia.id),
        updatedGarantia
      );
      queryClient.invalidateQueries({ queryKey: garantiaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["garantias", "stats"] });
    },
  });
}

/**
 * Crear cliente nuevo desde el formulario de garantía.
 */
export function useCrearCliente() {
  return useMutation({
    mutationFn: (data: CreateCliente) => crearCliente(data),
  });
}