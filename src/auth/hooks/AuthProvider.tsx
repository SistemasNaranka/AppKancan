import React, { useEffect, useState } from "react";
import {
  isExpired,
  guardarTokenStorage,
  borrarTokenStorage,
  cargarTokenStorage,
} from "../services/tokenDirectus";
import { type User, AuthContext } from "./AuthContext";
import {
  loginDirectus,
  logoutDirectus,
  getCurrentUser,
  setTokenDirectus,
  refreshDirectus,
} from "@/services/directus/auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Función auxiliar para extraer políticas de Directus (estructura específica)
   */
  const extractPolicies = (userData: any): string[] => {
    // Extraer políticas directas del usuario
    const directPolicies =
      userData?.policies?.map((p: any) => p.policy.name) || [];

    // Extraer políticas del rol
    const rolePolicies =
      userData?.role?.policies?.map((p: any) => p.policy.name) || [];

    // Combinar ambas listas
    const combined = [...directPolicies, ...rolePolicies];

    return combined;
  };

  /**
   * Función de login
   */
  const login = async (email: string, password: string) => {
    try {
      const res = await loginDirectus(email, password);
      guardarTokenStorage(res.access_token, res.refresh_token, res.expires_at);
      await setTokenDirectus(res.access_token);

      const me = await getCurrentUser();

      const extractedPolicies = extractPolicies(me);

      setUser({
        email: me.email,
        id: me.id,
        nombre: me.first_name,
        apellido: me.last_name,
        codigo_ultra: me.codigo_ultra,
        empresa: me.empresa,
        rol: me.role?.name,
        tienda_id: me.tienda_id,
        policies: extractedPolicies,
      });
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    }
  };

  /**
   * Función de logout mejorada
   */
  const logout = async () => {
    const tokens = cargarTokenStorage();

    if (tokens?.refresh) {
      try {
        await logoutDirectus(tokens.refresh);
      } catch (err) {
        console.warn("⚠️ No se pudo hacer logout en servidor:", err);
      }
    }

    borrarTokenStorage();
    setUser(null);
    await setTokenDirectus(null);
  };

  /**
   * Inicialización: Verificar si hay sesión válida
   */
  useEffect(() => {
    const init = async () => {
      const tokens = cargarTokenStorage();

      if (!tokens) {
        console.log("ℹ️ No hay tokens guardados");
        setLoading(false);
        return;
      }

      try {
        if (isExpired(tokens.expires_at)) {
          console.log("🔄 Token expirado, refrescando...");
          try {
            const res = await refreshDirectus(tokens.refresh);
            if (!res) {
              throw new Error("No se pudieron refrescar los tokens");
            }

            guardarTokenStorage(
              res.access_token,
              res.refresh_token,
              res.expires_at
            );

            await setTokenDirectus(res.access_token);
          } catch (refreshError) {
            console.error("❌ Error al refrescar tokens:", refreshError);
            borrarTokenStorage();
            setUser(null);
            await setTokenDirectus(null);
            setLoading(false);
            return;
          }
        } else {
          await setTokenDirectus(tokens.access);
        }

        const me = await getCurrentUser();

        const extractedPolicies = extractPolicies(me);

        setUser({
          email: me.email,
          id: me.id,
          nombre: me.first_name,
          apellido: me.last_name,
          codigo_ultra: me.codigo_ultra,
          empresa: me.empresa,
          rol: me.role?.name,
          tienda_id: me.tienda_id,
          policies: extractedPolicies,
        });
      } catch (error) {
        console.error("❌ Error al inicializar autenticación:", error);
        borrarTokenStorage();
        setUser(null);
        await setTokenDirectus(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
