import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  Contract,
  ContractStats,
  UIFilters,
  TabValue,
  CreateExtensionPayload,
  CreateContract,
  UpdateContract,
  Extension,
  UpdateExtension,
} from '../types/types';
import { getContracts, getContractStats, getContractById } from '../api';
import directus from '@/services/directus/directus';
import { createExtension, createContract, changeRequestStatus, updateExtension as apiUpdateExtension, deleteExtension as apiDeleteExtension, updateContract as apiUpdateContract, deleteContract as apiDeleteContract } from '../api';
import { getNextExtensionNumber } from '../lib/utils';
import { formatNombreCompleto } from '../lib/nombreCompleto';
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { setTokenDirectus } from "@/services/directus/auth";
import { daysUntil, getContractStatus } from "../lib/utils";
import { useAuth } from '@/auth/hooks/useAuth';


interface State {
  contracts: Contract[];
  stats: ContractStats | null;
  selectedId: number | null;
  filters: UIFilters;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMsg: string | null;
}

const initialState: State = {
  contracts: [],
  stats: null,
  selectedId: null,
  filters: { search: "", tab: "resumen", sortBy: "vencimiento" },
  loading: false,
  saving: false,
  error: null,
  successMsg: null,
};


type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_STATS'; payload: ContractStats }
  | { type: 'SELECT'; payload: number | null }
  | { type: 'SET_FILTER'; payload: Partial<UIFilters> }
  | { type: 'SET_TAB'; payload: TabValue }
  | { type: 'ADD_EXTENSION'; payload: { contractId: number; prorroga: Extension } }
  | { type: 'ADD_CONTRACT'; payload: Contract }
  | { type: 'UPSERT_CONTRACT'; payload: Contract }
  | { type: 'REMOVE_CONTRACT'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_CONTRACTS":
      return { ...state, contracts: action.payload, loading: false };
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
    case 'ADD_EXTENSION':
      return {
        ...state,
        saving: false,
        contracts: state.contracts.map((c) =>
          c.id === action.payload.contractId
            ? { ...c, extensions: [...(c.extensions ?? []), action.payload.prorroga] }
            : c,
        ),
      };
    case 'ADD_CONTRACT':
      return {
        ...state,
        saving: false,
        contracts: [action.payload, ...state.contracts],
      };
    case 'UPSERT_CONTRACT': {
      const idx = state.contracts.findIndex(c => c.id === action.payload.id);
      if (idx === -1) {
        return { ...state, contracts: [action.payload, ...state.contracts] };
      }
      const next = state.contracts.slice();
      next[idx] = {
        ...next[idx],
        ...action.payload,
        extensions: action.payload.extensions ?? next[idx].extensions,
      };
      return { ...state, contracts: next };
    }
    case 'REMOVE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter(c => c.id !== action.payload),
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

export interface EnrichedContract extends Contract {
  daysLeft: number;
  contractStatus: ReturnType<typeof getContractStatus>;
}


interface ContextValue extends State {
  selectedContract: Contract | null;
  filteredContracts: EnrichedContract[];
  loadContracts: () => Promise<void>;
  select: (id: number | null) => void;
  setTab: (tab: TabValue) => void;
  setFilter: (f: Partial<UIFilters>) => void;
  addExtension: (payload: CreateExtensionPayload) => Promise<boolean>;
  updateExtension: (id: number, updates: UpdateExtension) => Promise<void>;
  deleteExtension: (id: number) => Promise<boolean>;
  addContract: (payload: CreateContract) => Promise<void>;
  updateContract: (id: number, updates: UpdateContract) => Promise<void>;
  deleteContract: (id: number) => Promise<boolean>;
  clearMessages: () => void;
}

const ContractContext = createContext<ContextValue | null>(null);


export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading: authLoading } = useAuth();

  const selectedContract = useMemo(
    () => state.contracts.find((c) => c.id === state.selectedId) ?? null,
    [state.contracts, state.selectedId],
  );

  const filteredContracts = useMemo<EnrichedContract[]>(() => {
    const q = state.filters.search.toLowerCase().trim();

    return state.contracts
      .map((c) => ({
        ...c,
        daysLeft: daysUntil(c.end_date),
        contractStatus: getContractStatus(c.end_date),
      }))
      .filter((c) => {
        if (state.filters.tab === "activos" && c.contractStatus !== "vigente") return false;
        if (state.filters.tab === "vencidos" && c.contractStatus !== "vencido") return false;
        if (state.filters.tab === "por_vencer" && (c.daysLeft < 0 || c.daysLeft > 30)) return false;
        if (state.filters.tab === "criticos" && (c.daysLeft < 0 || c.daysLeft > 7)) return false;

        if (q) {
          return (
            formatNombreCompleto(c).toLowerCase().includes(q) ||
            String(c.position).toLowerCase().includes(q) ||
            c.document.toLowerCase().includes(q) ||
            (c.department?.toLowerCase() ?? '').includes(q) ||
            (c.empresa?.toLowerCase() ?? '').includes(q) ||
            (c.contract_type?.toLowerCase() ?? '').includes(q) ||
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
          return formatNombreCompleto(a).localeCompare(formatNombreCompleto(b));
        if (state.filters.sortBy === "prorroga")
          return (b.extensions?.length ?? 0) - (a.extensions?.length ?? 0);
        return 0;
      });
  }, [state.contracts, state.filters.search, state.filters.sortBy, state.filters.tab]);

  const loadContracts = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [response, stats] = await Promise.all([
        getContracts(),
        getContractStats(),
      ]);
      dispatch({ type: "SET_CONTRACTS", payload: response.data });
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

  const addExtension = useCallback(async (payload: CreateExtensionPayload): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const contrato = state.contracts.find((c) => c.id === payload.contractId);
      if (!contrato) throw new Error('Contrato no encontrado.');

      const numero = getNextExtensionNumber(contrato.extensions ?? []);

      const prorroga = await createExtension({
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
        type: 'ADD_EXTENSION',
        payload: { contractId: payload.contractId, prorroga },
      });
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga registrada exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return false;
    }
  }, [state.contracts]);

  const addContract = useCallback(async (payload: CreateContract) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const newContract = await createContract(payload);

      if (!newContract) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al crear el contrato.' });
        return;
      }

      const completeContract: Contract = {
        ...newContract,
        extensions: [],
      };

      dispatch({
        type: 'ADD_CONTRACT',
        payload: completeContract,
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

  const updateExtension = useCallback(async (id: number, updates: UpdateExtension) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updated = await apiUpdateExtension(id, updates);
      if (!updated) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar la prórroga.' });
        return;
      }
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga actualizada exitosamente.' });
      await loadContracts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [loadContracts]);

  const deleteExtension = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const success = await apiDeleteExtension(id);
      if (!success) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar la prórroga.' });
        dispatch({ type: 'SET_SAVING', payload: false });
        return false;
      }
      await loadContracts();
      dispatch({ type: 'SET_SUCCESS', payload: 'Prórroga eliminada exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la prórroga.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_SAVING', payload: false });
      return false;
    }
  }, [loadContracts]);

  const updateContract = useCallback(async (id: number, updates: UpdateContract) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updated = await apiUpdateContract(id, updates);
      if (!updated) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar el contrato.' });
        return;
      }
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_SUCCESS', payload: 'Contrato actualizado exitosamente.' });
      await loadContracts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el contrato.';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [loadContracts]);

  const deleteContract = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const success = await apiDeleteContract(id);
      if (!success) {
        dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar el contrato.' });
        dispatch({ type: 'SET_SAVING', payload: false });
        return false;
      }
      await loadContracts();
      dispatch({ type: 'SET_SUCCESS', payload: 'Contrato eliminado exitosamente.' });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el contrato.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_SAVING', payload: false });
      return false;
    }
  }, [loadContracts]);

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

        const contratosRes = await directus.subscribe('adm_contracts' as any);
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
                  dispatch({ type: 'REMOVE_CONTRACT', payload: id })
                );
                continue;
              }
              if (msg.event === 'create' || msg.event === 'update') {
                for (const id of ids) {
                  const fresh = await getContractById(id);
                  if (!isMounted) break;
                  if (fresh) dispatch({ type: 'UPSERT_CONTRACT', payload: fresh });
                }
              }
            }
          } catch { }
        })();

        try {
          const histRes = await directus.subscribe('adm_position_history' as any);
          unsubHistorial = histRes.unsubscribe;
          (async () => {
            try {
              for await (const msg of histRes.subscription) {
                if (!isMounted) break;
                if (msg.type !== 'subscription') continue;
                if (!['create', 'update', 'delete'].includes(msg.event)) continue;
                const contratoIds: number[] = Array.isArray((msg as any).data)
                  ? (msg as any).data.map((d: any) => d?.contract_id).filter(Boolean)
                  : [];
                for (const cid of contratoIds) {
                  const fresh = await getContractById(cid);
                  if (!isMounted) break;
                  if (fresh) dispatch({ type: 'UPSERT_CONTRACT', payload: fresh });
                }
              }
            } catch { }
          })();
        } catch (e) {
          console.warn('WS adm_position_history no disponible:', e);
        }
      } catch (err) {
        console.error('Error setup WS adm_contracts:', err);
      }
    };

    setupWS();
    return () => {
      isMounted = false;
      if (unsubContratos) unsubContratos();
      if (unsubHistorial) unsubHistorial();
    };
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      const tokens = cargarTokenStorage();
      if (!tokens) return;

      try {
        await setTokenDirectus(tokens.access);
        await loadContracts();
      } catch {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Sesión inválida. Por favor cierra sesión y vuelve a entrar.",
        });
      }
    };
    init();
  }, [authLoading, loadContracts]);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      selectedContract,
      filteredContracts,
      loadContracts,
      select,
      setTab,
      setFilter,
      addExtension,
      updateExtension,
      deleteExtension,
      addContract,
      updateContract,
      deleteContract,
      clearMessages,
    }),
    [state, selectedContract, loadContracts, select, setTab, setFilter, addExtension, updateExtension, deleteExtension, addContract, updateContract, deleteContract, clearMessages],
  );

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};


export const useContractContext = (): ContextValue => {
  const ctx = useContext(ContractContext);
  if (!ctx)
    throw new Error(
      "useContractContext must be used within <ContractProvider>",
    );
  return {
    ...ctx,
    contracts: ctx.contracts || [],
    filteredContracts: ctx.filteredContracts || [],
  };
};
