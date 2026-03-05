import { useAuth } from "@/auth/hooks/useAuth";
import { getApps, getUserArea } from "@/services/directus/apps";
import React, { useCallback, useEffect, useState } from "react";
import {
  AppContext,
  type App,
  type AppsLoadingStatus,
} from "@/apps/hooks/AppContext";

/**
 * Provider que otorga a sus hijos las aplicaciones obtenidas de Directus
 */
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

  /**
   * Carga las aplicaciones de Directus
   */
  const cargarApps = useCallback(async () => {
    // Si el usuario no está autenticado
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

      // Verificar si el usuario tiene apps asignadas
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

      // Estableciendo area apartir del id del usuario
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
        const areaValue = areaUsuario[0].area?.toLowerCase() || null;
        setArea(areaValue);
        setLoading(false);

        // Verificar si el área es null o vacía
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
      setLoadingStatus({ status: "loading" }); // En caso de error, mantiene loading
    }
  }, [isAuthenticated]);

  // ✅ FIX: Solo depender de isAuthenticated, NO de area
  useEffect(() => {
    cargarApps();
  }, [cargarApps]); // Solo se recarga cuando cambia la autenticación

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
