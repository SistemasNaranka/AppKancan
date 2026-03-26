import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { Contrato, ContratoStats, UIFilters, TabValue } from "../types/types";
import { getContratos, getContratoStats } from "../api";
import { useAuth } from "@/auth/hooks/useAuth";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { setTokenDirectus } from "@/services/directus/auth";
import { daysUntil, getContractStatus } from "../lib/utils";

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
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_CONTRATOS"; payload: Contrato[] }
  | { type: "SET_STATS"; payload: ContratoStats }
  | { type: "SELECT"; payload: number | null }
  | { type: "SET_FILTER"; payload: Partial<UIFilters> }
  | { type: "SET_TAB"; payload: TabValue }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SUCCESS"; payload: string | null };

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
    case "SET_ERROR":
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
        if (state.filters.sortBy === "vencimiento")
          return a.daysLeft - b.daysLeft;
        if (state.filters.sortBy === "nombre")
          return `${a.nombre} ${a.apellido}`.localeCompare(
            `${b.nombre} ${b.apellido}`,
          );
        if (state.filters.sortBy === "fecha_ingreso")
          return (
            new Date(a.fecha_ingreso).getTime() -
            new Date(b.fecha_ingreso).getTime()
          );
        return 0;
      });
  }, [state.contratos, state.filters.search, state.filters.sortBy]);

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

  const clearMessages = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_SUCCESS", payload: null });
  }, []);

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
      clearMessages,
    }),
    [
      state,
      selectedContrato,
      filteredContratos,
      loadContratos,
      select,
      setTab,
      setFilter,
      clearMessages,
    ],
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
