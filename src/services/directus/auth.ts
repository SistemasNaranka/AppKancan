import directus from "./directus";
import { logout, refresh } from "@directus/sdk";
import { type App } from "@/auth/hooks/AuthContext";
import { hasStatusCode } from "@/shared/utils/hasStatus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { normalizeTokenResponse } from "@/auth/services/tokenDirectus";
import { readMe } from "@directus/sdk";

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
  password: string
): Promise<LoginResponse> {
  const res = await directus.login({ email, password }, { mode: "json" });
  return normalizeTokenResponse(res);
}

/**
 * Cierra la sesión activa usando el refresh_token.
 */
export async function logoutDirectus(refresh_token: string): Promise<void> {
  await directus.request(
    logout({ refresh_token: refresh_token, mode: "json" })
  );
}

/**
 * Cierra la sesión activa usando el refresh_token.
 */
export async function setTokenDirectus(
  access_token: string | null
): Promise<void> {
  await directus.setToken(access_token);
}

/**
 * Refresca los tokens de acceso.
 * IMPORTANTE: Directus NO envía expires_at en refresh, solo expires
 */
export async function refreshDirectus(
  refresh_token: string
): Promise<LoginResponse> {
  await directus.setToken(null);

  const res = await directus.request(refresh({ mode: "json", refresh_token }));

  // Normalizar la respuesta (calculará expires_at)
  return normalizeTokenResponse(res);
}

/**
 * Obtiene los datos del usuario autenticado.
 * ✅ Ahora con refresh automático si el token está expirado
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
        ], // incluye rol y tienda_id
      })
    )
  );
}
