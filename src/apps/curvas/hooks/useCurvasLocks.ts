// src/apps/gestion_proyectos/hooks/useCurvasLocks.ts
import { useState, useEffect, useCallback } from "react";
import { obtenerBloqueosActivos, intentarBloquearTienda, liberarTienda } from "../api/directus/bloqueos";
import directus from "@/services/directus/directus";
import type { BloqueoEscaner } from "../types";

export const useCurvasLocks = (user: any) => {
  const [bloqueosActivos, setBloqueosActivos] = useState<BloqueoEscaner[]>([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchLocks = async () => {
      try {
        const locks = await obtenerBloqueosActivos();
        if (isMounted) setBloqueosActivos(locks);
      } catch (e) {}
    };

    let unsubLocks: (() => void) | undefined;

    const setupLocksRealtime = async () => {
      try {
        try { await directus.connect(); } 
        catch (e: any) {
          if (!e?.message?.includes('state is "open"') && !e?.message?.includes('state is "connecting"')) throw e;
        }
        const locksRes = await directus.subscribe("log_curve_scans");
        unsubLocks = locksRes.unsubscribe;

        (async () => {
          try {
            for await (const msg of locksRes.subscription) {
              if (!isMounted) break;
              if (msg.type === "subscription") fetchLocks();
            }
          } catch (e) {}
        })();
      } catch (err) {
        console.error("Error setting up realtime locks:", err);
      }
    };

    fetchLocks();
    setupLocksRealtime();

    return () => {
      isMounted = false;
      if (unsubLocks) unsubLocks();
    };
  }, [user]);

  const intentarBloquear = useCallback(
    async (tienda_id: string, referencia: string) => {
      if (!user) return false;
      const success = await intentarBloquearTienda(referencia, tienda_id, user.id);
      if (success) {
        const locks = await obtenerBloqueosActivos();
        setBloqueosActivos(locks);
      }
      return success;
    },
    [user],
  );

  const desmarcarTienda = useCallback(
    async (tienda_id: string, referencia: string) => {
      if (!user) return;
      await liberarTienda(referencia, tienda_id, user.id);
      const locks = await obtenerBloqueosActivos();
      setBloqueosActivos(locks);
    },
    [user],
  );

  return { bloqueosActivos, intentarBloquear, desmarcarTienda, setBloqueosActivos };
};