// src/apps/gestion_proyectos/contexts/CurvasContext.tsx
import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useCurvasPolicies } from "../hooks/useCurvasPolicies";
import { useAuth } from "@/auth/hooks/useAuth";

import { useCurvasBaseState } from "../hooks/useCurvasBaseState";
import { useCurvasDataFetcher } from "../hooks/useCurvasDataFetcher";
import { useCurvasEditor } from "../hooks/useCurvasEditor";
import { useCurvasLocks } from "../hooks/useCurvasLocks";
import { useCurvasShipping } from "../hooks/useCurvasShipping";
import { extractRef } from "../utils/curvasHelpers";

import type {
  UserRole, RolePermissions, DatosCurvas, ArchivoSubido, CeldaEditada,
  EnvioTienda, ArticuloEscaneado, ComparacionEnvio, ReporteDiscrepancias, BloqueoEscaner,
  MatrizGeneralCurvas, DetalleProducto
} from "../types";
import { PERMISSIONS as DEFAULT_PERMISSIONS } from "../types";
import { saveEnviosBatch } from "../api/directus/create";

interface CurvasContextType {
  userRole: UserRole;
  permissions: RolePermissions;
  setUserRole: (role: UserRole) => void;
  datosCurvas: DatosCurvas | null;
  archivos: ArchivoSubido[];
  celdasEditadas: CeldaEditada[];
  hasChanges: boolean;
  envios: EnvioTienda[];
  articulosEscaneados: ArticuloEscaneado[];
  procesarArchivo: (file: File, tipo: ArchivoSubido["tipo"]) => Promise<void>;
  cargarDatosManuales: (data: MatrizGeneralCurvas | DetalleProducto, tipo: ArchivoSubido["tipo"]) => void;
  limpiarDatos: () => void;
  cargarDatosGuardados: (fecha?: string | null) => Promise<void>;
  editarCelda: (sheetId: string, filaId: string, columna: string, valorNuevo: number | string) => void;
  cambiarTalla: (sheetId: string, tallaActual: string, tallaNueva: string) => void;
  guardarCambios: (datosLog?: any[]) => Promise<boolean>;
  guardarLogCurvas: (data: any) => Promise<boolean>;
  confirmarLote: (tipo: "general" | "producto_a" | "producto_b", sheetId: string) => Promise<boolean>;
  confirmarLoteConDatos: (tipo: "general" | "producto_a" | "producto_b", sheetId: string, sheetData?: any) => Promise<boolean>;
  descartarCambios: () => void;
  setHasChanges: (val: boolean) => void;
  actualizarValorValidacion: (sheetId: string, filaId: string, columna: string, valor: number, codigoBarra?: string | null) => void;
  limpiarValidacion: (sheetId?: string) => void;
  guardarEnvioDespacho: (sheetLogId: string, overrideData?: any, overridePlantilla?: any, overrideRef?: string) => Promise<{ success: boolean; logIds?: string[] }>;
  validationData: Record<string, any>;
  setValidationData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  bloqueosActivos: BloqueoEscaner[];
  intentarBloquear: (tienda_id: string, referencia: string) => Promise<boolean>;
  desmarcarTienda: (tienda_id: string, referencia: string) => Promise<void>;
  saveEnviosBatch: (enviosData: any[]) => Promise<boolean>;
  agregarArticuloEscaneado: (articulo: Omit<ArticuloEscaneado, "id" | "fechaEscaneo">) => void;
  crearEnvio: (tiendaId: string) => EnvioTienda | null;
  actualizarEstadoEnvio: (envioId: string, estado: EnvioTienda["estado"]) => void;
  generarComparacion: (envioId: string) => ComparacionEnvio[];
  generarReporteDiscrepancias: (envioId: string) => ReporteDiscrepancias | null;
  refreshLogs: () => void;
  lastLogsUpdate: number;
  notificacionCambios: any;
  setNotificacionCambios: (val: any) => void;
  tiendasDict: Record<string, string>;
  extractRef: (sheet: any) => string;
  cargarDatosPorFecha: (fecha?: string) => Promise<void>;
  reutilizarLote: (sheetId: string) => Promise<boolean>;
}

const CurvasContext = createContext<CurvasContextType | undefined>(undefined);

export const CurvasProvider = ({ children }: { children: ReactNode }) => {
  const { userRole: hookRole } = useCurvasPolicies();
  const { user } = useAuth();

  const dataState = useCurvasBaseState();

  useEffect(() => {
    const lowerRole = (hookRole || "").toLowerCase();
    const isActuallyAdmin = lowerRole.includes("admin") || lowerRole.includes("gerente") || lowerRole.includes("director");
    const validRole: UserRole = isActuallyAdmin ? "admin" : lowerRole.includes("bodega") ? "bodega" : "produccion";
    dataState.setPermissions(DEFAULT_PERMISSIONS[validRole]);
    dataState.setInternalRole(validRole);
  }, [hookRole, dataState]);

  const fetcherState = useCurvasDataFetcher({
    setTiendasDict: dataState.setTiendasDict, tiendasDict: dataState.tiendasDict,
    setDatosCurvas: dataState.setDatosCurvas, currentDate: dataState.currentDate,
    setCurrentDate: dataState.setCurrentDate, lastLogsUpdate: dataState.lastLogsUpdate
  });

  const locksState = useCurvasLocks(user);

  const shippingState = useCurvasShipping({
    user, userRole: dataState.internalRole, permissions: dataState.permissions,
    datosCurvas: dataState.datosCurvas, tiendasDict: dataState.tiendasDict, setBloqueosActivos: locksState.setBloqueosActivos
  });

  const editorState = useCurvasEditor({
    datosCurvas: dataState.datosCurvas, setDatosCurvas: dataState.setDatosCurvas,
    setArchivos: dataState.setArchivos, celdasEditadas: dataState.celdasEditadas,
    setCeldasEditadas: dataState.setCeldasEditadas, hasChanges: dataState.hasChanges,
    setHasChanges: dataState.setHasChanges, permissions: dataState.permissions,
    userRole: dataState.internalRole, setNotificacionCambios: dataState.setNotificacionCambios,
    refreshLogs: dataState.refreshLogs, cargarDatosGuardados: fetcherState.cargarDatosGuardados, user
  });

  const limpiarDatosGlobal = () => {
    dataState.limpiarDatosBase();
    shippingState.setEnvios([]);
    shippingState.setArticulosEscaneados([]);
    shippingState.setValidationData({});
  };

  const value: CurvasContextType = useMemo(() => ({
    userRole: dataState.internalRole, permissions: dataState.permissions, setUserRole: () => {},
    datosCurvas: dataState.datosCurvas, archivos: dataState.archivos, celdasEditadas: dataState.celdasEditadas,
    hasChanges: dataState.hasChanges, setHasChanges: dataState.setHasChanges,
    envios: shippingState.envios, articulosEscaneados: shippingState.articulosEscaneados,
    procesarArchivo: editorState.procesarArchivo, cargarDatosManuales: editorState.cargarDatosManuales,
    limpiarDatos: limpiarDatosGlobal, cargarDatosGuardados: fetcherState.cargarDatosGuardados,
    editarCelda: editorState.editarCelda, cambiarTalla: editorState.cambiarTalla, guardarCambios: editorState.guardarCambios,
    guardarLogCurvas: editorState.guardarLogCurvas, confirmarLote: editorState.confirmarLote,
    confirmarLoteConDatos: editorState.confirmarLoteConDatos, descartarCambios: editorState.descartarCambios,
    actualizarValorValidacion: shippingState.actualizarValorValidacion, limpiarValidacion: shippingState.limpiarValidacion,
    guardarEnvioDespacho: shippingState.guardarEnvioDespacho, validationData: shippingState.validationData,
    setValidationData: shippingState.setValidationData, bloqueosActivos: locksState.bloqueosActivos,
    intentarBloquear: locksState.intentarBloquear, desmarcarTienda: locksState.desmarcarTienda, saveEnviosBatch,
    agregarArticuloEscaneado: shippingState.agregarArticuloEscaneado, crearEnvio: shippingState.crearEnvio,
    actualizarEstadoEnvio: shippingState.actualizarEstadoEnvio, generarComparacion: shippingState.generarComparacion,
    generarReporteDiscrepancias: shippingState.generarReporteDiscrepancias, refreshLogs: dataState.refreshLogs,
    lastLogsUpdate: dataState.lastLogsUpdate, notificacionCambios: dataState.notificacionCambios,
    setNotificacionCambios: dataState.setNotificacionCambios, tiendasDict: dataState.tiendasDict, extractRef,
    cargarDatosPorFecha: fetcherState.cargarDatosPorFecha, reutilizarLote: editorState.reutilizarLote,
  }), [dataState, fetcherState, locksState, shippingState, editorState]);

  return <CurvasContext.Provider value={value}>{children}</CurvasContext.Provider>;
};

export const useCurvas = () => {
  const context = useContext(CurvasContext);
  if (!context) throw new Error("useCurvas debe usarse dentro de CurvasProvider");
  return context;
};

export default CurvasContext;