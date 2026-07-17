import type { Traslado } from "../hooks/types";
import { type UserStoreAccess } from "@/services/directus/userStores";
import { resolveNetworkUrl } from "@/shared/utils/network";

const WEBHOOK_USERNAME = import.meta.env.VITE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = import.meta.env.VITE_WEBHOOK_PASSWORD;
const WEBHOOK_URL_POST = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_POST_TRASLADOS);
const WEBHOOK_URL_TRASLADOS = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_TRASLADOS);
const WEBHOOK_URL_TRASLADOS_TIENDAS = resolveNetworkUrl(
  import.meta.env.VITE_WEBHOOK_URL_TRASLADOS_TIENDAS
);
const WEBHOOK_URL_POST_TRASLADOS_COMERCIAL = resolveNetworkUrl(
  import.meta.env.VITE_WEBHOOK_URL_POST_TRASLADOS_COMERCIAL
);

export async function obtenerTrasladosJefeZona(
  ultra_code: string,
  company: string,
  tiendas: UserStoreAccess[],
): Promise<Traslado[]> {
  const url = WEBHOOK_URL_POST_TRASLADOS_COMERCIAL || WEBHOOK_URL_TRASLADOS;

  const tiendasMapeadas = tiendas.map((t) => {
    let bodegaId = t.store_id;
    if (t.company && t.company.toLowerCase() === "kancan") {
      const idStr = String(t.store_id);
      if (idStr.startsWith("10") && idStr.length > 2) {
        bodegaId = Number(idStr.substring(2));
      }
    }
    return {
      bodega: bodegaId,
      empresa: t.company,
    };
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo_ultra: ultra_code,
      empresa: company,
      tiendas: tiendasMapeadas,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Error del servidor (${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error("Formato inesperado de datos recibidos");
  }

  return data;
}

export async function obtenerTraslados(
  ultra_code: string,
  company: string,
  esTienda: boolean = false,
): Promise<Traslado[]> {
  const url = esTienda ? WEBHOOK_URL_TRASLADOS_TIENDAS : WEBHOOK_URL_TRASLADOS;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo_ultra: ultra_code, empresa: company }),
  });

  if (!resp.ok) {
    throw new Error(`Error del servidor (${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error("Formato inesperado de datos recibidos");
  }

  return data;
}

export interface AprobacionTrasladosRequest {
  traslados: Array<{
    traslado: number;
    fecha: string;
  }>;
  empresa: string;
  codigo_ultra: string;
  clave: string;
}

export async function aprobarTraslados(
  trasladosSeleccionados: Traslado[],
  company: string,
  ultra_code: string,
  clave: string,
): Promise<any> {
  if (!company || !ultra_code || !clave) {
    throw new Error("Faltan datos requeridos: empresa, codigo_ultra o clave");
  }

  if (!trasladosSeleccionados || trasladosSeleccionados.length === 0) {
    throw new Error("No hay traslados seleccionados para aprobar");
  }

  const trasladosFormateados = trasladosSeleccionados.map((t) => ({
    traslado: t.traslado,
    fecha: t.fecha,
  }));

  const payload: AprobacionTrasladosRequest = {
    traslados: trasladosFormateados,
    empresa: company,
    codigo_ultra: String(ultra_code),
    clave,
  };

  try {
    const resp = await fetch(WEBHOOK_URL_POST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + btoa(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`),
      },
      body: JSON.stringify(payload),
    });

    const responseText = await resp.text();

    if (!resp.ok) {
      let errorMessage = `Error al aprobar traslados (${resp.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return { mensaje: responseText, success: true };
    }
  } catch (error: any) {
    console.error("❌ Error en aprobarTraslados:", error);
    throw new Error(error.message || "Error de conexión al aprobar traslados");
  }
}
