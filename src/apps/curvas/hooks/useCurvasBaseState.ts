// src/apps/gestion_proyectos/hooks/useCurvasBaseState.ts
import { useState, useCallback } from "react";
import { PERMISSIONS as DEFAULT_PERMISSIONS } from "../types";
import type { RolePermissions, UserRole, DatosCurvas, ArchivoSubido, CeldaEditada } from "../types";

export const useCurvasBaseState = () => {
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS.admin);
  const [internalRole, setInternalRole] = useState<UserRole>("produccion");
  
  const [datosCurvas, setDatosCurvas] = useState<DatosCurvas | null>(null);
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [celdasEditadas, setCeldasEditadas] = useState<CeldaEditada[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [notificacionCambios, setNotificacionCambios] = useState<{ open: boolean; mensaje: string; ubicacion: string; timestamp: number; } | null>(null);
  const [lastLogsUpdate, setLastLogsUpdate] = useState<number>(Date.now());
  const [tiendasDict, setTiendasDict] = useState<Record<string, string>>({});

  const refreshLogs = useCallback(() => setLastLogsUpdate(Date.now()), []);

  const limpiarDatosBase = useCallback(() => {
    setArchivos([]);
    setDatosCurvas(null);
    setCeldasEditadas([]);
    setHasChanges(false);
  }, []);

  return {
    permissions, setPermissions, internalRole, setInternalRole,
    datosCurvas, setDatosCurvas, archivos, setArchivos,
    celdasEditadas, setCeldasEditadas, hasChanges, setHasChanges,
    currentDate, setCurrentDate, notificacionCambios, setNotificacionCambios,
    lastLogsUpdate, setLastLogsUpdate, tiendasDict, setTiendasDict,
    refreshLogs, limpiarDatosBase,
  };
};