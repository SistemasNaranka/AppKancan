import directus from "./directus";
import { logout, refresh } from "@directus/sdk";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { normalizeTokenResponse } from "@/auth/services/tokenDirectus";
import { readMe } from "@directus/sdk";
import { cargarTokenStorage } from "@/auth/services/tokenDirectus";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires: number;
}

export async function loginDirectus(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await directus.login({ email, password }, { mode: "json" });
  return normalizeTokenResponse(res);
}

export async function logoutDirectus(refresh_token: string): Promise<void> {
  await directus.request(
    logout({ refresh_token: refresh_token, mode: "json" }),
  );
}

export async function setTokenDirectus(
  access_token: string | null,
): Promise<void> {
  await directus.setToken(access_token);
}

export async function refreshDirectus(
  refresh_token: string,
): Promise<LoginResponse> {
  await directus.setToken(null);

  const res = await directus.request(refresh({ mode: "json", refresh_token }));

  return normalizeTokenResponse(res);
}

export async function getCurrentUser() {
  return await withAutoRefresh(() =>
    directus.request(
      readMe({
        fields: [
          "email",
          "ultra_code",
          "company",
          "first_name",
          "last_name",
          "role.name",
          "store_id.id",
          "store_id.name",
          "id",
          "requires_password_change",
          "ia_key",
          "models_ia",
          {
            policies: [
              {
                policy: ["name"],
              },
            ],
          },
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

function getAccessToken(): string | null {
  const tokens = cargarTokenStorage();
  return tokens?.access || null;
}

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

export async function updateUserPassword(_userId: string, newPassword: string) {
  const directusUrl = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
  const token = getAccessToken();

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  return await withAutoRefresh(async () => {
    const response = await fetch(`${directusUrl}/users/me`, {
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
