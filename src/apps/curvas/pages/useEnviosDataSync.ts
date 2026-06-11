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
  const wsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleWsRefetch = () => {
    if (wsDebounceRef.current) clearTimeout(wsDebounceRef.current);
    wsDebounceRef.current = setTimeout(() => {
      wsDebounceRef.current = null;
      setWsTrigger((t) => t + 1);
    }, 800);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchFechas = async () => {
      const resumen = await getResumenFechasCurvas();
      if (!isMounted) return;
      setFechasConDatos(resumen);

      if (!initDateChecked.current) {
        initDateChecked.current = true;
        const todayStr = dayjs().format("YYYY-MM-DD");
      }
    };
    fetchFechas();
    return () => { isMounted = false; };
  }, []);

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
        const enviosRes = await directus.subscribe("log_curve_shipments");
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