import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWarranties,
  getWarrantyById,
  getWarrantyStats,
  searchClients,
} from "../api/directus/read";
import {
  createWarranty,
  updateWarranty,
  deleteWarranty,
  changeWarrantyStatus,
  createClient,
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
export function  useWarranties(
  filters: GarantiaFilters = {},
  pagination: PaginationParams = { page: 0, limit: 10 }
) {
  return useQuery({
    queryKey: garantiaKeys.list(filters, pagination),
    queryFn:  () => getWarranties(filters, pagination),
    staleTime: 30_000,   // 30s — no refetch innecesario
    gcTime:    120_000,  // 2min en caché
    placeholderData: (prev) => prev, // mantiene datos anteriores mientras carga
  });
}

/**
 * Detalle de una garantía por ID.
 */
export function useWarranty(id: number | null) {
  return useQuery({
    queryKey: garantiaKeys.detail(id!),
    queryFn:  () => getWarrantyById(id!),
    enabled:  id !== null && id > 0,
    staleTime: 60_000,
  });
}

/**
 * Estadísticas agregadas por estado.
 * staleTime más alto porque cambian menos frecuente que la lista.
 */
export function useWarrantyStats(filters: GarantiaFilters = {}) {
  // Para stats, ignoramos el filtro de estado (queremos conteos globales)
  const { estado: _estado, ...filtersForStats } = filters;

  return useQuery({
    queryKey: garantiaKeys.stats(filtersForStats),
    queryFn:  () => getWarrantyStats(filtersForStats),
    staleTime: 60_000,   // 1min — los conteos no cambian tan rápido
    gcTime:    180_000,  // 3min
  });
}

/**
 * Búsqueda de clientes para autocompletar en el formulario.
 */
export function useSearchClients(query: string) {
  return useQuery({
    queryKey: garantiaKeys.clientes(query),
    queryFn:  () => searchClients(query),
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
export function useCreateWarranty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGarantia) => createWarranty(data),
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
export function useUpdateWarranty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateGarantia }) =>
      updateWarranty(id, updates),

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
export function useDeleteWarranty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWarranty(id),
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
export function useChangeWarrantyStatus() {
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
    }) => changeWarrantyStatus(id, estado, resolucion),

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
export function useCreateClient() {
  return useMutation({
    mutationFn: (data: CreateCliente) => createClient(data),
  });
}