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
//import { registerLogoutCallback } from "../services/directusInterceptor";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Declarar los estados de usuario y su carga
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Función de login
   */
  const login = async (email: string, password: string) => {
    try {
      // Hacer login con credenciales
      const res = await loginDirectus(email, password);
      // Guardar los tokens en el storage
      guardarTokenStorage(res.access_token, res.refresh_token, res.expires_at);
      // Establece el token en el cliente de directus
      await setTokenDirectus(res.access_token);
      // Llama los datos de si mismo
      const me = await getCurrentUser();

      // Poner valor en el state de user
      setUser({
        email: me.email,
        id: me.id,
        nombre: me.first_name,
        apellido: me.last_name,
        codigo_ultra: me.codigo_ultra,
        empresa: me.empresa,
      });
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error; // Propagar para que el componente Login lo maneje
    }
  };

  /**
   * Función de logout mejorada
   */
  const logout = async () => {
    // Tomar los token del storage
    const tokens = cargarTokenStorage();

    // Intentar logout en servidor (best effort)
    //Si existe el token refresh
    if (tokens?.refresh) {
      try {
        // Cerrar sesion en directus
        await logoutDirectus(tokens.refresh);
      } catch (err) {
        console.warn("⚠️ No se pudo hacer logout en servidor:", err);
      }
    }

    // Borrar en el storage
    borrarTokenStorage();

    setUser(null);
    await setTokenDirectus(null);
  };

  /**
   * Inicialización: Verificar si hay sesión válida
   */
  useEffect(() => {
    const init = async () => {
      // Capturar los token del storage
      const tokens = cargarTokenStorage();

      // Si no hay tokens, no hay sesión
      if (!tokens) {
        setLoading(false);
        return;
      }
      try {
        // Verificar si el token expiró
        if (isExpired(tokens.expires_at)) {
          try {
            // Refrescar el token

            const res = await refreshDirectus(tokens.refresh);
            if (!res) {
              throw new Error("No se pudieron refrescar los tokens");
            }

            guardarTokenStorage(
              res.access_token,
              res.refresh_token,
              res.expires_at
            );

            // Usar los tokens nuevos
            await setTokenDirectus(res.access_token);
          } catch (refreshError) {
            console.error(
              "❌ Error al refrescar tokens en inicialización:",
              refreshError
            );
            // Si falla el refresh en la inicialización, cerrar sesión y redirigir
            console.log(
              "🚫 Refresh falló - limpiando sesión y redirigiendo al login"
            );
            borrarTokenStorage();
            setUser(null);
            await setTokenDirectus(null);
            setLoading(false);
            // Redirigir al login
            //window.location.href = '/login';
            return; // Terminar ejecución
          }
        } else {
          // Token válido, usarlo

          await setTokenDirectus(tokens.access);
        }

        // Obtener info del usuario
        const me = await getCurrentUser();
        setUser({
          email: me.email,
          id: me.id,
          nombre: me.first_name,
          apellido: me.last_name,
          codigo_ultra: me.codigo_ultra,
          empresa: me.empresa,
        });
      } catch (error) {
        console.error("❌ Error al inicializar autenticación:", error);
        // Si falla obtener el usuario (por ejemplo, token inválido), cerrar sesión
        console.log(
          "🚫 Error en inicialización - limpiando sesión y redirigiendo al login"
        );
        borrarTokenStorage();
        setUser(null);
        await setTokenDirectus(null);
        setLoading(false);
        // Redirigir al login
        //window.location.href = '/login';
        return;
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Definir booleano que valida si el usuario esta autenticado
  const isAuthenticated = !!user;

  // ❌ ELIMINADO: El useEffect con setInterval que verificaba cada 10 segundos
  // El refresh ahora se hará bajo demanda en cada petición a Directus

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
