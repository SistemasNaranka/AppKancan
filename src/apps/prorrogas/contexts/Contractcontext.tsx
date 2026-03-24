import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  Contrato,
  ContratoStats,
  UIFilters,
  TabValue,
  CreateProrrogaPayload,
  Prorroga,
} from "../types/types";
import { getContratos, getContratoStats } from "../api";
import { crearProrroga, cambiarRequestStatus } from "../api";
import { getNextProrrogaNumber } from "../lib/utils";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";
import { setTokenDirectus } from "@/services/directus/auth";
import { useAuth } from "@/auth/hooks/useAuth";

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
  | {
      type: "ADD_PRORROGA";
      payload: { contratoId: number; prorroga: Prorroga };
    }
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
    case "ADD_PRORROGA":
      return {
        ...state,
        saving: false,
        contratos: state.contratos.map((c) =>
          c.id === action.payload.contratoId
            ? { ...c, prorrogas: [...c.prorrogas, action.payload.prorroga] }
            : c,
        ),
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
// CONTEXT VALUE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextValue extends State {
  selectedContrato: Contrato | null;
  loadContratos: () => Promise<void>;
  select: (id: number | null) => void;
  setTab: (tab: TabValue) => void;
  setFilter: (f: Partial<UIFilters>) => void;
  addProrroga: (payload: CreateProrrogaPayload) => Promise<void>;
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

  const addProrroga = useCallback(
    async (payload: CreateProrrogaPayload) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const contrato = state.contratos.find(
          (c) => c.id === payload.contractId,
        );
        if (!contrato) throw new Error("Contrato no encontrado.");

        const numero = getNextProrrogaNumber(contrato.prorrogas);

        const prorroga = await crearProrroga({
          contrato_id: payload.contractId,
          numero,
          fecha_inicio: payload.fechaInicio,
          descripcion: payload.descripcion,
        });

        if (!prorroga) {
          throw new Error('No se pudo crear la prórroga en el servidor.');
        }

        dispatch({
          type: "ADD_PRORROGA",
          payload: { contratoId: payload.contractId, prorroga },
        });
        dispatch({
          type: "SET_SUCCESS",
          payload: "Prórroga registrada exitosamente.",
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al guardar la prórroga.";
        dispatch({ type: "SET_ERROR", payload: msg });
      }
    },
    [state.contratos],
  );

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
      loadContratos,
      select,
      setTab,
      setFilter,
      addProrroga,
      clearMessages,
    }),
    [
      state,
      selectedContrato,
      loadContratos,
      select,
      setTab,
      setFilter,
      addProrroga,
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
  return ctx;
};
