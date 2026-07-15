import { LoginResponse } from "@/services/directus/auth";
import type { AuthenticationData } from "@directus/sdk";
const STORAGE_KEY = "directus_tokens";

export interface StoredTokens {
  access: string;
  refresh: string;
  expires_at: number;
}

export function guardarTokenStorage(
  access: string,
  refresh: string,
  expires_at: number
): void {
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
}

export function cargarTokenStorage(): StoredTokens | null {
  const tokensStr = localStorage.getItem(STORAGE_KEY);

  if (!tokensStr) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokensStr) as StoredTokens;

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

export function borrarTokenStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.clear();
}

export function normalizeTokenResponse(res: AuthenticationData): LoginResponse {
  if (!res.access_token || !res.refresh_token || !res.expires) {
    throw new Error("Respuesta inválida: faltan tokens o expiración");
  }
  const expires_at = Date.now() + res.expires;

  return {
    access_token: res.access_token!,
    refresh_token: res.refresh_token!,
    expires_at: expires_at,
    expires: res.expires!,
  };
}

export const isExpired = (expiresAt: number): boolean => {
  if (!expiresAt || isNaN(expiresAt)) {
    console.warn("⚠️ expires_at inválido:", expiresAt);
    return true;
  }

  const now = Date.now();
  return now >= expiresAt;
};
