import { useAuth } from "@/auth/hooks/useAuth";
import { getApps, getUserArea} from "@/services/directus/apps";
import React, { useCallback, useEffect, useState } from "react";
import { AppContext, type App } from "@/apps/hooks/AppContext";

/**
 * Provider que otorga a sus hijos las aplicaciones obtenidas de Directus
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated} = useAuth();
  
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<string | null>(null);

  /**
   * Carga las aplicaciones de Directus
   */
  const cargarApps = useCallback(async () => {
    // Si el usuario no está autenticado
    if (!isAuthenticated) {
      setArea(null);
      setApps([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("📱 Cargando apps desde Directus...");
      
      const data = await getApps();
      console.log(data)
      setApps(data);

      // Estableciendo area apartir del id del usuario
      const areaUsuario = await getUserArea()
      console.log(areaUsuario)

    
      if (areaUsuario.length < 1) {
        console.warn("⚠️ Este usuario no tiene rol'");
        setArea(null);
      } else if (areaUsuario.length > 1) {
        console.warn("⚠️ Hay más de un area en este usuario");
        setArea(null);
      } else {
        const areaValue = areaUsuario[0].area?.toLowerCase() || null;
        setArea(areaValue);
        console.log(`🏠 Área principal establecida: ${areaValue}`);
      }

    } catch (err) {
      console.error("❌ Error cargando apps:", err);
      setApps([]);
      setArea(null);
    } finally {
      setLoading(false);
    }
  },[isAuthenticated])

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
        reloadApps: cargarApps 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};