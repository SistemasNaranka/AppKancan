import {
  cargarTokenStorage,
  guardarTokenStorage,
  isExpired,
  borrarTokenStorage,
} from "@/auth/services/tokenDirectus";
import { refreshDirectus, setTokenDirectus } from "@/services/directus/auth";

const TOKEN_REFRESH_MARGIN_MINUTES = 5;

/**
 * Interceptor que verifica y refresca el token antes de cada petición
 */
export async function ensureValidToken(): Promise<void> {
  const tokens = cargarTokenStorage();
  if (!tokens) {
    return;
  }

  if (isExpired(tokens.expires_at, TOKEN_REFRESH_MARGIN_MINUTES)) {
    try {
      const newTokens = await refreshDirectus(tokens.refresh);
      guardarTokenStorage(
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_at,
      );
      await setTokenDirectus(newTokens.access_token);
    } catch (error) {
      borrarTokenStorage();
      window.location.href = "/";
    }
  }
}

/**
 * Wrapper para directus.request que hace refresh automático si es necesario
 */
export async function requestWithAutoRefresh<T>(
  requestFn: () => Promise<T>,
): Promise<T> {
  await ensureValidToken();

  try {
    return await requestFn();
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const tokens = cargarTokenStorage();
      if (!tokens) {
        throw error;
      }

      try {
        const newTokens = await refreshDirectus(tokens.refresh);
        guardarTokenStorage(
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.expires_at,
        );
        await setTokenDirectus(newTokens.access_token);
        return await requestFn();
      } catch (refreshError) {
        borrarTokenStorage();
        window.location.href = "/";
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Función helper para usar con directus.request
 *
 * Uso:
 * ```typescript
 * import { withAutoRefresh } from "@/services/directus/directusInterceptor";
 * import { readItems } from "@directus/sdk";
 *
 * const items = await withAutoRefresh(() =>
 *   directus.request(readItems('empresas'))
 * );
 * ```
 */
export async function withAutoRefresh<T>(
  directusRequest: () => Promise<T>,
): Promise<T> {
  return requestWithAutoRefresh(directusRequest);
}
