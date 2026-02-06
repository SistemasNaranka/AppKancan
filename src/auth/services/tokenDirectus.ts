import { LoginResponse } from "@/services/directus/auth";
import type { AuthenticationData } from "@directus/sdk";
const STORAGE_KEY = "directus_tokens";

// Interfaz para tipar los tokens
export interface StoredTokens {
  access: string;
  refresh: string;
  expires_at: number; // ✅ Nombre corregido para coincidir con Directus
}

/**
 * Guardar tokens en localStorage
 */
export function guardarTokenStorage(
  access: string,
  refresh: string,
  expires_at: number,
): void {
  // Validar que expires_at sea un timestamp válido
  if (!expires_at || isNaN(expires_at) || expires_at <= 0) {
    console.error("❌ expires_at inválido:", expires_at);
    throw new Error("expires_at debe ser un timestamp válido en milisegundos");
  }

  const tokens: StoredTokens = {
    access,
    refresh,
    expires_at,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));

  // Debug: Mostrar cuándo expira el token y cuánto tiempo queda
  /*   const expirationDate = new Date(expires_at);
  const diffInSeconds = Math.floor((expires_at - Date.now()) / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  const seconds = diffInSeconds % 60; */
}

/**
 * Cargar tokens desde localStorage
 */
export function cargarTokenStorage(): StoredTokens | null {
  const tokensStr = localStorage.getItem(STORAGE_KEY);

  if (!tokensStr) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokensStr) as StoredTokens;

    // Validar que tenga todos los campos necesarios
    if (!tokens.access || !tokens.refresh || !tokens.expires_at) {
      console.warn("⚠️ Tokens inválidos en localStorage, borrando...");
      borrarTokenStorage();
      return null;
    }

    return tokens;
  } catch (error) {
    console.error("❌ Error parseando tokens:", error);
    borrarTokenStorage();
    return null;
  }
}
/**
 * Borrar tokens del localStorage
 */
export function borrarTokenStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.clear();
}

/**
 * Convierte la respuesta de Directus a formato con expires_at calculado
 * @param res Respuesta de Directus (tiene expires, puede o no tener expires_at)
 * @returns LoginResponse con expires_at siempre calculado
 */
export function normalizeTokenResponse(res: AuthenticationData): LoginResponse {
  if (!res.access_token || !res.refresh_token || !res.expires) {
    throw new Error("Respuesta inválida: faltan tokens o expiración");
  }
  // SIEMPRE calcular expires_at basado en expires (duración)
  // Ignoramos res.expires_at aunque venga, para ser consistentes
  const expires_at = Date.now() + res.expires;

  return {
    access_token: res.access_token!,
    refresh_token: res.refresh_token!,
    expires_at: expires_at, // ✅ Siempre calculado localmente
    expires: res.expires!,
  };
}
/**
 * Valida si el token expiro
 * @param expiresAt Timestamp de expiración
 * @param marginMinutes Minutos de margen antes de considerar como "casi expirado"
 * @returns true si expirado, false si aún válido
 */
export const isExpired = (
  expiresAt: number,
  marginMinutes: number = 0,
): boolean => {
  if (!expiresAt || isNaN(expiresAt)) {
    return true;
  }

  const now = Date.now();
  const threshold = expiresAt - marginMinutes * 60 * 1000;
  const expired = now >= expiresAt;
  const almostExpired = !expired && now >= threshold;

  return almostExpired || expired;
};
