import { useState, useEffect, useRef } from "react";
import dayjs, { type Dayjs } from "dayjs";
import directus from "@/services/directus/directus";
import { getLogCurvas, getEnviosCurvas, getResumenFechasCurvas } from "../api/directus/read";
import type { LogCurvas } from "../types";

interface UseEnviosDataSyncProps {
  filtroFecha: Dayjs | null;
  filtroReferencia: string;
  userRole: any;
  lastLogsUpdate: number;
}

export const useEnviosDataSync = ({ filtroFecha, filtroReferencia, userRole, lastLogsUpdate }: UseEnviosDataSyncProps) => {
  const [logCurvasData, setLogCurvasData] = useState<LogCurvas[]>([]);
  const [enviosCurvasData, setEnviosCurvasData] = useState<any[]>([]);
  const [loadingLogCurvas, setLoadingLogCurvas] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState<Record<string, "pendiente" | "enviado">>({});
  const [wsTrigger, setWsTrigger] = useState(0);

  const initDateChecked = useRef(false);
  // Coalesce: agrupa ráfagas de eventos WS en un solo refetch (evita loops de 304s).
  const wsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleWsRefetch = () => {
    if (wsDebounceRef.current) clearTimeout(wsDebounceRef.current);
    wsDebounceRef.current = setTimeout(() => {
      wsDebounceRef.current = null;
      setWsTrigger((t) => t + 1);
    }, 800);
  };

  // Fetch de fechas con datos
  useEffect(() => {
    let isMounted = true;
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      if (!isMounted) return;
      setFechasConDatos(resumen);

      if (!initDateChecked.current) {
        initDateChecked.current = true;
        const todayStr = dayjs().format("YYYY-MM-DD");
        // Nota: Si necesitas que setFiltroFecha se actualice aquí, 
        // tendrías que pasarlo como prop, pero en el original solo se usaba al inicio.
      }
    };
    fetchFechas();
    return () => { isMounted = false; };
  }, []);

  // WebSockets setup
  useEffect(() => {
    let isMounted = true;
    let unsubLog: (() => void) | undefined;
    let unsubEnvios: (() => void) | undefined;

    const setupWebSockets = async () => {
      try {
        try {
          await directus.connect();
        } catch (e: any) {
          if (!e?.message?.includes('state is "open"') && !e?.message?.includes('state is "connecting"')) {
            throw e;
          }
        }

        const logRes = await directus.subscribe("log_curve_scans");
        unsubLog = logRes.unsubscribe;
        const enviosRes = await directus.subscribe("envios_curvas");
        unsubEnvios = enviosRes.unsubscribe;

        (async () => {
          try {
            for await (const msg of logRes.subscription) {
              if (!isMounted) break;
              if (msg.type === "subscription" && ["create", "update", "delete"].includes(msg.event)) scheduleWsRefetch();
            }
          } catch (e) {}
        })();

        (async () => {
          try {
            for await (const msg of enviosRes.subscription) {
              if (!isMounted) break;
              if (msg.type === "subscription" && ["create", "update", "delete"].includes(msg.event)) scheduleWsRefetch();
            }
          } catch (e) {}
        })();
      } catch (err) {
        console.error("Error setting up websockets:", err);
      }
    };

    setupWebSockets();
    return () => {
      isMounted = false;
      if (wsDebounceRef.current) {
        clearTimeout(wsDebounceRef.current);
        wsDebounceRef.current = null;
      }
      if (unsubLog) unsubLog();
      if (unsubEnvios) unsubEnvios();
    };
  }, []);

  // Fetch de Logs y Envíos
  useEffect(() => {
    let isMounted = true;
    const fetchLogCurvasYTiendas = async () => {
      if (!isMounted) return;
      setLoadingLogCurvas(true);
      try {
        const [logs, envios] = await Promise.all([
          getLogCurvas(filtroFecha ? filtroFecha.format("YYYY-MM-DD") : undefined, filtroReferencia || undefined),
          getEnviosCurvas(filtroFecha ? filtroFecha.format("YYYY-MM-DD") : undefined, filtroReferencia || undefined),
        ]);
        if (isMounted) {
          setLogCurvasData(logs || []);
          setEnviosCurvasData(envios || []);
        }
      } catch (error) {
        console.error("Error fetching logs in EnviosPage:", error);
      } finally {
        if (isMounted) setLoadingLogCurvas(false);
      }
    };

    fetchLogCurvasYTiendas();
    return () => { isMounted = false; };
  }, [filtroFecha, filtroReferencia, userRole, lastLogsUpdate, wsTrigger]);

  return { logCurvasData, enviosCurvasData, loadingLogCurvas, fechasConDatos };
};