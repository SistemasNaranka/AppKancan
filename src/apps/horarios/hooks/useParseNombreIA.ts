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

const PROMPT = (nombre: string) => `Eres un experto en onomástica colombiana. Tu tarea es separar un nombre completo en sus 4 componentes.

Devuelve EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin explicaciones, sin bloques de código) con esta forma exacta:
{"first_name":"","middle_name":"","last_name":"","second_last_name":""}

Donde:
- first_name = PRIMER nombre
- middle_name = SEGUNDO nombre (NO un apellido)
- last_name = PRIMER apellido
- second_last_name = SEGUNDO apellido

Estructura de un nombre en Colombia (en este orden): [primer nombre] [segundo nombre] [primer apellido] [segundo apellido].
La parte de NOMBRES va primero y la parte de APELLIDOS va al final. Normalmente cada persona tiene DOS apellidos (los dos últimos tokens) y uno o dos nombres.

REGLAS según la cantidad de palabras:
- 4 palabras  -> first_name=1ª, middle_name=2ª, last_name=3ª, second_last_name=4ª. (DEBES llenar los 4 campos)
- 3 palabras  -> first_name=1ª, middle_name="", last_name=2ª, second_last_name=3ª.
- 2 palabras  -> first_name=1ª, middle_name="", last_name=2ª, second_last_name="".
- 5 o más     -> los DOS últimos tokens son los apellidos (last_name y second_last_name); el resto son nombres (first_name = 1º, middle_name = el resto de los nombres unidos).
- Apellidos/partículas compuestas ("de", "del", "la", "los", "san", "santa", "da", "di", "van", "von") se unen al apellido que les sigue (ej. "de la Cruz" => un solo apellido "de la Cruz").

IMPORTANTE: cuando haya 4 o más palabras, NUNCA dejes middle_name ni second_last_name vacíos por defecto; complétalos según las reglas. Respeta tildes y mayúsculas iniciales. Si un campo no aplica, déjalo en "".

EJEMPLOS:
"Maria Camila Mendes Rey" => {"first_name":"Maria","middle_name":"Camila","last_name":"Mendes","second_last_name":"Rey"}
"Lycet Paola Luna Rincon" => {"first_name":"Lycet","middle_name":"Paola","last_name":"Luna","second_last_name":"Rincon"}
"Juan Perez Gomez" => {"first_name":"Juan","middle_name":"","last_name":"Perez","second_last_name":"Gomez"}
"Ana Lopez" => {"first_name":"Ana","middle_name":"","last_name":"Lopez","second_last_name":""}
"Jose Luis de la Cruz Romero" => {"first_name":"Jose","middle_name":"Luis","last_name":"de la Cruz","second_last_name":"Romero"}

Ahora separa este nombre: "${nombre}"`;

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
