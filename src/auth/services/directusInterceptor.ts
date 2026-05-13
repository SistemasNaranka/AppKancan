import {
  cargarTokenStorage,
  guardarTokenStorage,
  isExpired,
  borrarTokenStorage,
} from "@/auth/services/tokenDirectus";
import { refreshDirectus, setTokenDirectus } from "@/services/directus/auth";

// Singleton: si ya hay un refresh en vuelo, todas las requests concurrentes
// esperan al mismo Promise en lugar de disparar refresh duplicados.
let refreshInFlight: Promise<void> | null = null;

function refreshTokensOnce(refreshToken: string): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const newTokens = await refreshDirectus(refreshToken);
    guardarTokenStorage(
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expires_at
    );
    await setTokenDirectus(newTokens.access_token);
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Interceptor que verifica y refresca el token antes de cada petición
 */
export async function ensureValidToken(): Promise<void> {
  const tokens = cargarTokenStorage();
  // Si no hay tokens, no hacer nada (el usuario no está autenticado)
  if (!tokens) {
    return;
  }

  // Si el token está expirado, refrescarlo
  if (isExpired(tokens.expires_at)) {
    try {
      await refreshTokensOnce(tokens.refresh);
    } catch (error) {
      borrarTokenStorage();
      window.location.href = "/";
      console.error("❌ Error al refrescar token:", error);
    }
  } else {
    // Si no está expirado, igual nos aseguramos que el cliente de Directus lo tenga (evita 403 en reloads)
    await setTokenDirectus(tokens.access);
  }
}

/**
 * Wrapper para directus.request que hace refresh automático si es necesario
 */
export async function requestWithAutoRefresh<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  // Verificar y refrescar token si es necesario
  await ensureValidToken();

  // Ejecutar la petición original
  try {
    return await requestFn();
  } catch (error: any) {
    // Si falla por token inválido (401), intentar refrescar y reintentar una vez
    if (error?.response?.status === 401) {
      const tokens = cargarTokenStorage();
      if (!tokens) {
        throw error;
      }

      try {
        // Forzar refresh (deduplicado: múltiples 401 concurrentes comparten Promise)
        await refreshTokensOnce(tokens.refresh);

        // Reintentar la petición
        return await requestFn();
      } catch (refreshError) {
        console.error(
          "❌ Error al refrescar token después de 401:",
          refreshError
        );
        // Manejar sesión expirada (cierra sesión y redirige)
      }
    }

    // Si es otro error, propagarlo
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
  directusRequest: () => Promise<T>
): Promise<T> {
  return requestWithAutoRefresh(directusRequest);
}
