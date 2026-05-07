import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  Contrato,
  ContratoStats,
  UIFilters,
  TabValue,
  CreateProrrogaPayload,
  CreateContrato,
  UpdateContrato,
  Prorroga,
  UpdateProrroga,
} from '../types/types';
import { getContratos, getContratoStats, getContratoById } from '../api';
import directus from '@/services/directus/directus';
import { crearProrroga, crearContrato, cambiarRequestStatus, actualizarProrroga, eliminarProrroga, actualizarContrato, eliminarContrato } from '../api';
import { getNextProrrogaNumber } from '../lib/utils';
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { setTokenDirectus } from "@/services/directus/auth";
import { daysUntil, getContractStatus } from "../lib/utils";
import { useAuth } from '@/auth/hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

interface State {
  contratos: Contrato[];
  stats: ContratoStats | null;
  selectedId: number | null;
  filters: UIFilters;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMsg: string | null;
  //fecha_ingreso: Date;
}

const initialState: State = {
  contratos: [],
  stats: null,
  selectedId: null,
  filters: { search: "", tab: "resumen", sortBy: "vencimiento" },
  loading: false,
  saving: false,
  error: null,
  successMsg: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_CONTRATOS'; payload: Contrato[] }
  | { type: 'SET_STATS'; payload: ContratoStats }
  | { type: 'SELECT'; payload: number | null }
  | { type: 'SET_FILTER'; payload: Partial<UIFilters> }
  | { type: 'SET_TAB'; payload: TabValue }
  | { type: 'ADD_PRORROGA'; payload: { contratoId: number; prorroga: Prorroga } }
  | { type: 'ADD_CONTRATO'; payload: Contrato }
  | { type: 'UPSERT_CONTRATO'; payload: Contrato }
  | { type: 'REMOVE_CONTRATO'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_CONTRATOS":
      return { ...state, contratos: action.payload, loading: false };
    case "SET_STATS":
      return { ...state, stats: action.payload };
    case "SELECT":
      return { ...state, selectedId: action.payload };
    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_TAB":
      return {
        ...state,
        filters: { ...state.filters, tab: action.payload },
        selectedId: null,
      };
    case 'ADD_PRORROGA':
      return {
        ...state,
        saving: false,
        contratos: state.contratos.map((c) =>
          c.id === action.payload.contratoId
            ? { ...c, prorrogas: [...(c.prorrogas ?? []), action.payload.prorroga] }
            : c,
        ),
      };
    case 'ADD_CONTRATO':
      return {
        ...state,
        saving: false,
        contratos: [action.payload, ...state.contratos],
      };
    case 'UPSERT_CONTRATO': {
      const idx = state.contratos.findIndex(c => c.id === action.payload.id);
      if (idx === -1) {
        return { ...state, contratos: [action.payload, ...state.contratos] };
      }
      const next = state.contratos.slice();
      // Conservar relaciones ya cargadas (prorrogas/documentos) si el payload no las trae
      next[idx] = {
        ...next[idx],
        ...action.payload,
        prorrogas: action.payload.prorrogas ?? next[idx].prorrogas,
        documentos: action.payload.documentos ?? next[idx].documentos,
      };
      return { ...state, contratos: next };
    }
    case 'REMOVE_CONTRATO':
      return {
        ...state,
        contratos: state.contratos.filter(c => c.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, saving: false };
    case "SET_SUCCESS":
      return { ...state, successMsg: action.payload };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENRICHED CONTRATO
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichedContrato extends Contrato {
  daysLeft: number;
  contractStatus: ReturnType<typeof getContractStatus>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT VALUE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextValue extends State {
  selectedContrato: Contrato | null;
  filteredContratos: EnrichedContrato[];
  loadContratos: () => Promise<void>;
  select: (id: number | null) => void;
  setTab: (tab: TabValue) => void;
  setFilter: (f: Partial<UIFilters>) => void;
  addProrroga: (payload: CreateProrrogaPayload) => Promise<boolean>;
  updateProrroga: (id: number, updates: UpdateProrroga) => Promise<void>;
  deleteProrroga: (id: number) => Promise<boolean>;
  addContrato: (payload: CreateContrato) => Promise<void>;
  updateContrato: (id: number, updates: UpdateContrato) => Promise<void>;
  deleteContrato: (id: number) => Promise<boolean>;
  clearMessages: () => void;
}

const ContractContext = createContext<ContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading: authLoading } = useAuth();

  const selectedContrato = useMemo(
    () => state.contratos.find((c) => c.id === state.selectedId) ?? null,
    [state.contratos, state.selectedId],
  );

  const filteredContratos = useMemo<EnrichedContrato[]>(() => {
    const q = state.filters.search.toLowerCase().trim();

    return state.contratos
      .map((c) => ({
        ...c,
        daysLeft: daysUntil(c.fecha_final),
        contractStatus: getContractStatus(c.fecha_final),
      }))
      .filter((c) => {
        // Tab Filters
        if (state.filters.tab === "activos" && c.contractStatus !== "vigente") return false;
        if (state.filters.tab === "vencidos" && c.contractStatus !== "vencido") return false;
        if (state.filters.tab === "por_vencer" && (c.daysLeft < 0 || c.daysLeft > 30)) return false;
        if (state.filters.tab === "criticos" && (c.daysLeft < 0 || c.daysLeft > 7)) return false;

        // Búsqueda de texto global
        if (q) {
          return (
            c.nombre.toLowerCase().includes(q) ||
            c.apellido.toLowerCase().includes(q) ||
            String(c.cargo).toLowerCase().includes(q) ||
            c.documento.toLowerCase().includes(q) ||
            (c.area?.toLowerCase() ?? '').includes(q) ||
            (c.empresa?.toLowerCase() ?? '').includes(q) ||
            (c.tipo_contrato?.toLowerCase() ?? '').includes(q) ||
            (c.numero_contrato?.toLowerCase() ?? '').includes(q) ||
            String(c.id).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (state.filters.sortBy === "vencimiento")
          return a.daysLeft - b.daysLeft;
        if (state.filters.sortBy === "nombre")
          return `${a.nombre} ${a.apellido}`.localeCompare(
            `${b.nombre} ${b.apellido}`,
          );
        if (state.filters.sortBy === "prorroga")
          return (b.prorrogas?.length ?? 0) - (a.prorrogas?.length ?? 0);
        return 0;
      });
  }, [state.contratos, state.filters.search, state.filters.sortBy, state.filters.tab]);

  const loadContratos = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [response, stats] = await Promise.all([
        getContratos(),
        getContratoStats(),
      ]);
      dispatch({ type: "SET_CONTRATOS", payload: response.data });
      dispatch({ type: "SET_STATS", payload: stats });
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: "Error al cargar los contratos.",
      });
    }
  }, []);

  const select = useCallback((id: number | null) => {
    dispatch({ type: "SELECT", payload: id });
  }, []);

  const setTab = useCallback((tab: TabValue) => {
    dispatch({ type: "SET_TAB", payload: tab });
  }, []);

  const setFilter = useCallback((f: Partial<UIFilters>) => {
    dispatch({ type: "SET_FILTER", payload: f });
  }, []);

  const addProrroga = useCallback(async (payload: CreateProrrogaPayload): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const contrato = state.contratos.find((c) => c.id === payload.contractId);
      if (!contrato) throw new Error('Contrato no encontrado.');

      const numero = getNextProrrogaNumber(contrato.prorrogas ?? []);

      const prorroga = await crearProrroga({
        contrato_id: payload.contractId,
        numero,
        fecha_inicio: payload.fechaInicio,
        descripcion: payload.descripcion,
      });

      if (!prorroga) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al crear la prórroga.' });
        return false;
      }

      dispatch({
        type: 'ADD_PRORROGA',
        payload: { contratoId: payload.contractId, prorroga },
      });
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga registrada exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return false;
    }
  }, [state.contratos]);

  const addContrato = useCallback(async (payload: CreateContrato) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const nuevoContrato = await crearContrato(payload);

      if (!nuevoContrato) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al crear el contrato.' });
        return;
      }

      // Inicializar el contrato con arrays vacíos para prorrogas y documentos
      const contratoCompleto: Contrato = {
        ...nuevoContrato,
        prorrogas: [],
        documentos: [],
      };

      dispatch({
        type: 'ADD_CONTRATO',
        payload: contratoCompleto,
      });
      dispatch({ type: 'SET_SUCCESS', payload: 'Contrato registrado exitosamente.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el contrato.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_SUCCESS", payload: null });
  }, []);

  // Funciones CRUD para Prórrogas
  const updateProrroga = useCallback(async (id: number, updates: UpdateProrroga) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updated = await actualizarProrroga(id, updates);
      if (!updated) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar la prórroga.' });
        return;
      }
      // Actualizar la prórroga en el contrato correspondiente
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga actualizada exitosamente.' });
      // Recargar contratos para obtener datos actualizados
      await loadContratos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [loadContratos]);

  const deleteProrroga = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const success = await eliminarProrroga(id);
      if (!success) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar la prórroga.' });
        dispatch({ type: 'SET_SAVING', payload: false });
        return false;
      }
      // Recargar contratos para actualizar la lista
      await loadContratos();
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga eliminada exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_SAVING', payload: false });
      return false;
    }
  }, [loadContratos]);

  // Funciones CRUD para Contratos
  const updateContrato = useCallback(async (id: number, updates: UpdateContrato) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updated = await actualizarContrato(id, updates);
      if (!updated) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar el contrato.' });
        return;
      }
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_SUCCESS', payload: 'Contrato actualizado exitosamente.' });
      // Recargar contratos para obtener datos actualizados
      await loadContratos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el contrato.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [loadContratos]);

  const deleteContrato = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const success = await eliminarContrato(id);
      if (!success) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar el contrato.' });
        dispatch({ type: 'SET_SAVING', payload: false });
        return false;
      }
      // Recargar contratos para actualizar la lista
      await loadContratos();
      dispatch({ type: 'SET_SUCCESS', payload: 'Contrato eliminado exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el contrato.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_SAVING', payload: false });
      return false;
    }
  }, [loadContratos]);

  // ─── WebSocket: sync contratos en tiempo real (cargo, área, etc.) ────────
  // Escucha eventos de Directus en la colección `contratos`. Al recibir
  // create/update/delete, refresca el contrato afectado en el estado global
  // sin recargar todos los contratos.
  useEffect(() => {
    if (authLoading) return;
    const tokens = cargarTokenStorage();
    if (!tokens) return;

    let isMounted = true;
    let unsubContratos: (() => void) | undefined;
    let unsubHistorial: (() => void) | undefined;

    const setupWS = async () => {
      try {
        try {
          await directus.connect();
        } catch (e: any) {
          if (
            !e?.message?.includes('state is "open"') &&
            !e?.message?.includes('state is "connecting"')
          ) {
            throw e;
          }
        }

        const contratosRes = await directus.subscribe('contratos' as any);
        unsubContratos = contratosRes.unsubscribe;

        (async () => {
          try {
            for await (const msg of contratosRes.subscription) {
              if (!isMounted) break;
              if (msg.type !== 'subscription') continue;
              const ids: number[] = Array.isArray((msg as any).data)
                ? (msg as any).data.map((d: any) => d?.id).filter(Boolean)
                : [];
              if (msg.event === 'delete') {
                ids.forEach((id) =>
                  dispatch({ type: 'REMOVE_CONTRATO', payload: id })
                );
                continue;
              }
              if (msg.event === 'create' || msg.event === 'update') {
                for (const id of ids) {
                  const fresh = await getContratoById(id);
                  if (!isMounted) break;
                  if (fresh) dispatch({ type: 'UPSERT_CONTRATO', payload: fresh });
                }
              }
            }
          } catch { }
        })();

        // historial_cargos: si llega un cambio de cargo, refrescar contrato_id
        try {
          const histRes = await directus.subscribe('historial_cargos' as any);
          unsubHistorial = histRes.unsubscribe;
          (async () => {
            try {
              for await (const msg of histRes.subscription) {
                if (!isMounted) break;
                if (msg.type !== 'subscription') continue;
                if (!['create', 'update', 'delete'].includes(msg.event)) continue;
                const contratoIds: number[] = Array.isArray((msg as any).data)
                  ? (msg as any).data.map((d: any) => d?.contrato_id).filter(Boolean)
                  : [];
                for (const cid of contratoIds) {
                  const fresh = await getContratoById(cid);
                  if (!isMounted) break;
                  if (fresh) dispatch({ type: 'UPSERT_CONTRATO', payload: fresh });
                }
              }
            } catch { }
          })();
        } catch (e) {
          // historial_cargos suscripción opcional — no romper si permisos faltan
          console.warn('WS historial_cargos no disponible:', e);
        }
      } catch (err) {
        console.error('Error setup WS contratos:', err);
      }
    };

    setupWS();
    return () => {
      isMounted = false;
      if (unsubContratos) unsubContratos();
      if (unsubHistorial) unsubHistorial();
    };
  }, [authLoading]);

  // ─── Esperar a que AuthProvider termine antes de disparar queries ─────────
  // AuthProvider inicializa el token de forma asíncrona. Si disparamos
  // queries antes de que termine, salen sin Authorization → 403.
  // Esperamos a que authLoading sea false (init de AuthProvider completado)
  // y luego verificamos que haya tokens válidos antes de cargar datos.
  useEffect(() => {
    if (authLoading) return; // AuthProvider aún inicializando, esperar

    const init = async () => {
      const tokens = cargarTokenStorage();
      if (!tokens) return; // Sin sesión activa, no cargar datos

      try {
        await setTokenDirectus(tokens.access);
        await loadContratos();
      } catch {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Sesión inválida. Por favor cierra sesión y vuelve a entrar.",
        });
      }
    };
    init();
  }, [authLoading, loadContratos]);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      selectedContrato,
      filteredContratos,
      loadContratos,
      select,
      setTab,
      setFilter,
      addProrroga,
      updateProrroga,
      deleteProrroga,
      addContrato,
      updateContrato,
      deleteContrato,
      clearMessages,
    }),
    [state, selectedContrato, loadContratos, select, setTab, setFilter, addProrroga, updateProrroga, deleteProrroga, addContrato, updateContrato, deleteContrato, clearMessages],
  );

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export const useContractContext = (): ContextValue => {
  const ctx = useContext(ContractContext);
  if (!ctx)
    throw new Error(
      "useContractContext must be used within <ContractProvider>",
    );
  return {
    ...ctx,
    contratos: ctx.contratos || [],
    filteredContratos: ctx.filteredContratos || [],
  };
};