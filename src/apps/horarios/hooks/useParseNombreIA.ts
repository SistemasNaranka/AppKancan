import { useState, useCallback } from 'react';
import { useAuth } from '@/auth/hooks/useAuth';
import { cargarTokenStorage } from '@/auth/services/tokenDirectus';

/**
 * Separa un "nombre completo" en sus 4 componentes usando Gemini, a través del
 * proxy genérico ya existente (POST /api/ia/gemini/extraer). Reusa el mismo
 * patrón que contabilizacion_factura/useHybridExtractor (token, model, parseo).
 *
 * Requisitos: la cuenta debe tener `ia_key` y `models_ia` configurados en Directus.
 */

export interface NombreSeparado {
  first_name: string;
  middle_name: string;
  last_name: string;
  second_last_name: string;
}

const MODELO_POR_DEFECTO = 'gemini-3.5-flash';
const API_URL = import.meta.env.VITE_VENTAS_API_URL || '/api';

function obtenerModelosIA(modelosIA: any): string[] {
  if (!modelosIA) return [MODELO_POR_DEFECTO];
  try {
    const parsed = typeof modelosIA === 'string' ? JSON.parse(modelosIA) : modelosIA;
    if (Array.isArray(parsed)) {
      const names = parsed.map((m: any) => m?.name).filter(Boolean);
      if (names.length > 0) return names;
    }
  } catch {
    /* ignore */
  }
  return [MODELO_POR_DEFECTO];
}

const PROMPT = (nombre: string) => `Eres un asistente que separa nombres completos de personas en Colombia.
Dado el nombre completo: "${nombre}"
Devuelve EXCLUSIVAMENTE un JSON válido con esta forma exacta:
{"first_name":"","middle_name":"","last_name":"","second_last_name":""}

Reglas:
- En Colombia el orden es: primer nombre, segundo nombre (opcional), primer apellido, segundo apellido (opcional).
- Por lo general los DOS últimos tokens son apellidos.
- Si hay 4 palabras: primer nombre, segundo nombre, primer apellido, segundo apellido.
- Si hay 3 palabras: primer nombre, primer apellido, segundo apellido (middle_name vacío).
- Si hay 2 palabras: primer nombre y primer apellido (middle_name y second_last_name vacíos).
- Apellidos compuestos (ej. "de la Cruz", "Del Río") deben quedar juntos en el apellido correspondiente.
- Respeta tildes y mayúsculas iniciales. No agregues texto fuera del JSON. Campos faltantes = "".`;

function parsearJSON(texto: string): NombreSeparado {
  let jsonStr = texto.trim();
  const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonStr = fence[1].trim();
  let obj: any;
  try {
    obj = JSON.parse(jsonStr);
  } catch {
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('La IA no devolvió un JSON válido');
    obj = JSON.parse(m[0]);
  }
  return {
    first_name: (obj.first_name || '').trim(),
    middle_name: (obj.middle_name || '').trim(),
    last_name: (obj.last_name || '').trim(),
    second_last_name: (obj.second_last_name || '').trim(),
  };
}

export const useParseNombreIA = () => {
  const { user } = useAuth();
  const [procesando, setProcesando] = useState(false);

  // Disponible solo si el usuario tiene clave de IA configurada.
  const disponible = !!user?.ia_key;

  const separarNombre = useCallback(async (nombreCompleto: string): Promise<NombreSeparado> => {
    const nombre = nombreCompleto.trim().replace(/\s+/g, ' ');
    if (!nombre) throw new Error('Escribe el nombre completo');
    if (!user?.ia_key) throw new Error('No tienes una clave de IA configurada en tu cuenta');

    setProcesando(true);
    try {
      const tokens = cargarTokenStorage();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokens?.access) headers['Authorization'] = `Bearer ${tokens.access}`;

      const modelos = obtenerModelosIA(user?.models_ia);
      const contents = [{ role: 'user', parts: [{ text: PROMPT(nombre) }] }];

      let ultimoError: Error | null = null;
      for (const model of modelos) {
        try {
          const resp = await fetch(`${API_URL}/ia/gemini/extraer`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, contents }),
          });
          if (!resp.ok) {
            const e = await resp.json().catch(() => ({}));
            throw new Error(e?.message || `Error de IA (${resp.status})`);
          }
          const data = await resp.json();
          return parsearJSON(data.text || '');
        } catch (err: any) {
          ultimoError = err;
        }
      }
      throw ultimoError || new Error('No se pudo separar el nombre con IA');
    } finally {
      setProcesando(false);
    }
  }, [user]);

  return { separarNombre, procesando, disponible };
};

export default useParseNombreIA;
