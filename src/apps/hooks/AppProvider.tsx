import { useAuth } from "@/auth/hooks/useAuth";
import { getApps, getUserArea } from "@/services/directus/apps";
import React, { useCallback, useEffect, useState } from "react";
import {
  AppContext,
  type App,
  type AppsLoadingStatus,
} from "@/apps/hooks/AppContext";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<AppsLoadingStatus>({
    status: "loading",
  });

  const cargarApps = useCallback(async () => {
    if (!isAuthenticated) {
      setArea(null);
      setApps([]);
      setLoading(false);
      setLoadingStatus({ status: "loaded" });
      return;
    }

    try {
      setLoading(true);
      setLoadingStatus({ status: "loading" });

      const data = await getApps();

      if (!data || data.length === 0) {
        setApps([]);
        setArea(null);
        setLoading(false);
        setLoadingStatus({
          status: "no_apps",
          message: "No tienes aplicaciones asignadas. Contacta a soporte.",
        });
        return;
      }

      setApps(data);

      const areaUsuario = await getUserArea();

      if (areaUsuario.length < 1) {
        console.warn("⚠️ Este usuario no tiene rol");
        setArea(null);
        setLoading(false);
        setLoadingStatus({
          status: "no_area",
          message:
            "Tu área de trabajo no está definida. Contacta a soporte para configurar tu rol.",
        });
      } else if (areaUsuario.length > 1) {
        console.warn("⚠️ Hay más de un area en este usuario");
        setArea(null);
        setLoading(false);
        setLoadingStatus({
          status: "no_area",
          message:
            "Tu cuenta tiene múltiples áreas asignadas. Contacta a soporte.",
        });
      } else {
        const areaValue = areaUsuario[0].department?.toLowerCase() || null;
        setArea(areaValue);
        setLoading(false);

        if (!areaValue) {
          setLoadingStatus({
            status: "no_area",
            message:
              "Tu área de trabajo no está definida. Contacta a soporte para configurar tu rol.",
          });
        } else {
          setLoadingStatus({ status: "loaded" });
        }
      }
    } catch (err) {
      console.error("❌ Error cargando apps:", err);
      setApps([]);
      setArea(null);
      setLoading(false);
      setLoadingStatus({ status: "loading" });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    cargarApps();
  }, [cargarApps]);

  return (
    <AppContext.Provider
      value={{
        area,
        apps,
        loading,
        loadingStatus,
        reloadApps: cargarApps,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
