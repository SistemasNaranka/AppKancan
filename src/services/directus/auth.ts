import directus from "./directus";
import { logout, refresh, updateItem } from "@directus/sdk";
import { type App } from "@/auth/hooks/AuthContext";
import { hasStatusCode } from "@/shared/utils/hasStatus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { normalizeTokenResponse } from "@/auth/services/tokenDirectus";
import { readMe } from "@directus/sdk";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";

/**
 * Tipado de la respuesta a un login/refresh exitoso.
 * Solo usamos 'expires' (duración en ms) y calculamos expires_at nosotros
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Lo calculamos nosotros: Date.now() + expires
  expires: number; // Lo que viene de Directus (duración en ms)
}

/**
 * Inicia sesión en Directus con email y password.
 */
export async function loginDirectus(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await directus.login({ email, password }, { mode: "json" });
  return normalizeTokenResponse(res);
}

/**
 * Cierra la sesión activa usando el refresh_token.
 */
export async function logoutDirectus(refresh_token: string): Promise<void> {
  await directus.request(
    logout({ refresh_token: refresh_token, mode: "json" }),
  );
}

/**
 * Cierra la sesión activa usando el refresh_token.
 */
export async function setTokenDirectus(
  access_token: string | null,
): Promise<void> {
  await directus.setToken(access_token);
}

/**
 * Refresca los tokens de acceso.
 * IMPORTANTE: Directus NO envía expires_at en refresh, solo expires
 */
export async function refreshDirectus(
  refresh_token: string,
): Promise<LoginResponse> {
  await directus.setToken(null);

  const res = await directus.request(refresh({ mode: "json", refresh_token }));

  // Normalizar la respuesta (calculará expires_at)
  return normalizeTokenResponse(res);
}

/**
 * Obtiene los datos del usuario autenticado.
 * ✅ Ahora con refresh automático si el token está expirado
 * ✅ Consulta mejorada para obtener las políticas correctamente
 */
export async function getCurrentUser() {
  return await withAutoRefresh(() =>
    directus.request(
      readMe({
        fields: [
          "email",
          "codigo_ultra",
          "empresa",
          "first_name",
          "last_name",
          "role.name",
          "tienda_id",
          "id",
          "requires_password_change",
          // 1. Políticas asignadas directamente al usuario
          {
            policies: [
              {
                policy: ["name"],
              },
            ],
          },
          // 2. Rol y sus políticas
          {
            role: [
              {
                policies: [
                  {
                    policy: ["name"],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ),
  );
}

/**
 * Obtiene el token de acceso del storage
 */
function getAccessToken(): string | null {
  const tokens = cargarTokenStorage();
  return tokens?.access || null;
}

/**
 * Obtiene todos los usuarios del sistema (solo para admins)
 * Usa REST API directamente para evitar restricción de core collections
 */
export async function getAllUsers() {
  const directusUrl = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
  const token = getAccessToken();

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  return await withAutoRefresh(async () => {
    const response = await fetch(`${directusUrl}/users?fields=*.*`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener usuarios");
    }

    const data = await response.json();
    return data.data;
  });
}

/**
 * Reestablece la contraseña de un usuario y marca que debe cambiar contraseña
 * @param userId - ID del usuario
 * @param newPassword - Nueva contraseña
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  const directusUrl = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
  const token = getAccessToken();

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  return await withAutoRefresh(async () => {
    const response = await fetch(`${directusUrl}/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        requires_password_change: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al reestablecer contraseña");
    }

    return await response.json();
  });
}

/**
 * Actualiza la contraseña del usuario autenticado y quita la marca de cambio obligatorio
 * @param userId - ID del usuario
 * @param newPassword - Nueva contraseña
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  const directusUrl = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
  const token = getAccessToken();

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  return await withAutoRefresh(async () => {
    const response = await fetch(`${directusUrl}/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        requires_password_change: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar contraseña");
    }

    return await response.json();
  });
}
