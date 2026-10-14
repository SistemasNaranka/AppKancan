// Análisis de hojas de vida con IA. Usa el mismo proxy que contabilización:
// la clave sale del ia_key del usuario logueado.
import { Postulacion, getModelosIAUsuario } from '../directus/read';
import { leerHojaDeVida, HojaLeida } from './leerHojaDeVida';
import { ResultadoIA, nivelEducativo } from '../ia';
import { cargarTokenStorage } from '@/auth/services/tokenDirectus';
import { ensureValidToken } from '@/auth/services/directusInterceptor';
import { obtenerModelosIA } from '@/apps/contabilizacion_factura/hooks/useHybridExtractor';

const API_URL = import.meta.env.VITE_VENTAS_API_URL || '/api';
const MAX_MB_TOTAL = 15; // Gemini limita los archivos adjuntos por petición (~20 MB)

// Último modelo que respondió bien en esta sesión: se prueba primero para no perder tiempo con los saturados
let ultimoModeloExitoso: string | null = null;

interface RespuestaGemini {
  resumen: string;
  ranking: { id: number; puntaje: number; fortalezas: string[]; aVerificar: string[] }[];
}

interface HojaDescargada {
  postulacion: Postulacion;
  hoja: HojaLeida;
}

const INSTRUCCIONES = (cargo: string, total: number) => `Eres un asistente de selección de personal para KanCan, una marca colombiana de jeans con tiendas físicas.
Cargo a evaluar: "${cargo}".
Vas a evaluar exactamente ${total} hojas de vida.

Recibirás varias hojas de vida: unas como texto extraído del PDF y otras como PDF (escaneos o fotos). Antes de cada una hay una línea con el id del postulante, su nivel educativo y sus años de experiencia declarados.

Reglas:
- Evalúa solo la relación entre experiencia, formación y habilidades del postulante y el cargo.
- Ignora nombre, foto, edad, género, estado civil, dirección y cualquier dato personal: no son criterio.
- Más estudios no significa automáticamente mejor: pesa la experiencia relevante para el cargo.
- Calcula el puntaje (0 a 100) sumando SOLO estos criterios, siempre los mismos:
  * Experiencia en las funciones propias del cargo "${cargo}": hasta 40 puntos.
  * Experiencia en retail, comercio o moda: hasta 25 puntos.
  * Habilidades clave para este cargo (por ejemplo atención al cliente, inventario, caja o liderazgo, según aplique): hasta 25 puntos.
  * Formación relacionada con el cargo: hasta 10 puntos.
- Experiencia en un sector distinto (bares, salud, docencia...) puntúa menos que la misma experiencia en retail o moda.
- Da fortalezas concretas y puntos a verificar específicos para la entrevista (no genéricos como "verificar referencias").
- Si un PDF no se puede leer o no es una hoja de vida, dale puntaje 0 y explícalo en "aVerificar".
- Incluye a todos los postulantes, usando exactamente el id que se te da.
- El resumen tiene máximo 3 frases cortas: (1) qué tan fuerte es el grupo frente al cargo, (2) quiénes destacan, máximo 3, y (3) la principal brecha del grupo.
- En el resumen refiérete a cada persona solo como [id:N], por ejemplo [id:523]. Nunca escribas nombres.
- Usa lenguaje neutro de género: escribe "[id:N] tiene..." o "la persona postulante", nunca "el postulante" ni "la postulante".
- No declares un ganador definitivo; la decisión final es de Gestión Humana.
- Responde en español.

FORMATO DE SALIDA (JSON PURO):
{
  "resumen": "String",
  "ranking": [
    { "id": Number, "puntaje": Number, "fortalezas": ["String"], "aVerificar": ["String"] }
  ]
}
Sin texto adicional y sin bloques de código \`\`\`json. Solo el objeto.`;

// Lee todas las hojas a la vez (texto o PDF) y controla el tamaño total antes de enviar nada
async function descargarHojas(seleccion: Postulacion[], signal?: AbortSignal): Promise<HojaDescargada[]> {
  const conCv = seleccion.filter((p) => p.cv);
  if (conCv.length === 0) throw new Error('Ninguna postulación seleccionada tiene hoja de vida');

  const hojas = await Promise.all(
    conCv.map(async (p) => ({ postulacion: p, hoja: await leerHojaDeVida(p.cv as string) }))
  );
  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');

  const comoPdf = hojas.filter((h) => h.hoja.tipo === 'pdf').length;
  const totalMb = hojas.reduce((s, h) => s + h.hoja.bytes, 0) / (1024 * 1024);
  console.log(`[vacantes] ${hojas.length - comoPdf} como texto, ${comoPdf} como PDF, ${totalMb.toFixed(1)} MB en total`);

  if (totalMb > MAX_MB_TOTAL) {
    throw Object.assign(
      new Error(`Las hojas de vida pesan ${totalMb.toFixed(1)} MB en total (máximo ${MAX_MB_TOTAL} MB). Selecciona menos postulantes.`),
      { definitivo: true }
    );
  }
  return hojas;
}

// Arma el mensaje: instrucciones y luego, por cada postulante, su línea de id y su hoja (texto o PDF)
function construirContenido(cargo: string, hojas: HojaDescargada[]) {
  const parts: object[] = [{ text: INSTRUCCIONES(cargo, hojas.length) }];
  for (const { postulacion: p, hoja } of hojas) {
    parts.push({
      text: `--- Postulante id=${p.id} · Nivel educativo: ${nivelEducativo(p.education_level)} · Años de experiencia declarados: ${p.years_experience} ---`,
    });
    parts.push(
      hoja.tipo === 'texto'
        ? { text: `Hoja de vida (texto extraído del PDF):\n${hoja.texto}` }
        : { inlineData: { mimeType: 'application/pdf', data: hoja.base64 } }
    );
  }
  return [{ role: 'user', parts }];
}

// Igual que contabilización: tolera ```json ... ``` o texto alrededor del objeto
function extraerJson(texto: string): RespuestaGemini {
  let s = texto.trim();
  const bloque = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (bloque) s = bloque[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const objeto = s.match(/\{[\s\S]*\}/);
    if (!objeto) throw new Error('La IA no devolvió JSON válido');
    return JSON.parse(objeto[0]);
  }
}

async function llamarProxy(contents: object[], modelo: string, signal?: AbortSignal): Promise<string> {
  await ensureValidToken();
  const tokens = cargarTokenStorage();

  const res = await fetch(`${API_URL}/ia/gemini/extraer`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
    body: JSON.stringify({ model: modelo, contents }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.message || err.error || `HTTP ${res.status}`;
    // Crítico: sin clave o sin sesión, probar otro modelo no sirve
    if (res.status === 400 || res.status === 401) throw Object.assign(new Error(msg), { definitivo: true });
    throw Object.assign(new Error(msg), { status: res.status });
  }
  const data = await res.json();
  return data.text || '';
}

// Espera ms milisegundos; se corta si el usuario cancela
function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Cancelado', 'AbortError'));
    }, { once: true });
  });
}

// 503 = Google saturado: espera y reintenta una vez antes de rendirse con ese modelo
async function llamarConReintento(contents: object[], modelo: string, signal?: AbortSignal): Promise<string> {
  try {
    return await llamarProxy(contents, modelo, signal);
  } catch (err: any) {
    if (err?.status !== 503 || signal?.aborted) throw err;
    console.warn(`[vacantes] ${modelo} saturado, reintentando en 4 s...`);
    await esperar(4000, signal);
    return llamarProxy(contents, modelo, signal);
  }
}

// Cambia [id:N] por el nombre real
function ponerNombres(texto: string, seleccion: Postulacion[]): string {
  return texto.replace(/\[id:(-?\d+)\]/g, (original, id) =>
    seleccion.find((p) => p.id === Number(id))?.full_name ?? original);
}

export async function analizarHojasDeVida(
  cargo: string,
  seleccion: Postulacion[],
  signal?: AbortSignal,
  modelosIA?: unknown
): Promise<ResultadoIA> {
  if (seleccion.length === 0) throw new Error('No hay postulantes para analizar');

  // Se descarga una sola vez, antes de probar modelos
  const hojas = await descargarHojas(seleccion, signal);
  const enviados = hojas.map((h) => h.postulacion);
  const contents = construirContenido(cargo, hojas);
  // Lista del perfil del usuario; si no tiene, la de por defecto. Excluye Gemma, que no lee PDF
  let modelos = obtenerModelosIA(modelosIA ?? (await getModelosIAUsuario()));
  if (ultimoModeloExitoso && modelos.includes(ultimoModeloExitoso)) {
    modelos = [ultimoModeloExitoso, ...modelos.filter((m) => m !== ultimoModeloExitoso)];
  }
  let ultimoError = '';
  let saturados = 0; // modelos que respondieron 503 (Google sin capacidad)

  for (const modelo of modelos) {
    try {
      const r = extraerJson(await llamarConReintento(contents, modelo, signal));

      // Solo se aceptan ids que se enviaron (descarta ids inventados por la IA)
      const ranking = r.ranking
        .map((e) => {
          const postulacion = enviados.find((p) => p.id === Number(e.id));
          if (!postulacion) return null;
          return {
            postulacion,
            puntaje: Math.max(0, Math.min(100, Math.round(Number(e.puntaje) || 0))),
            fortalezas: e.fortalezas ?? [],
            aVerificar: e.aVerificar ?? [],
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        // La IA a veces repite a una persona: se conserva solo su primera evaluación
        .filter((c, i, todos) => todos.findIndex((x) => x.postulacion.id === c.postulacion.id) === i)
        .sort((a, b) => b.puntaje - a.puntaje);

      if (ranking.length === 0) throw new Error('La IA no evaluó a ningún postulante');

      // Crítico: nadie seleccionado puede desaparecer sin aviso (sin PDF u omitido por la IA)
      const evaluados = new Set(ranking.map((c) => c.postulacion.id));
      const faltantes = seleccion
        .filter((p) => !evaluados.has(p.id))
        .map((p) => ({
          postulacion: p,
          puntaje: 0,
          evaluado: false,
          fortalezas: [],
          aVerificar: [p.cv
            ? 'La IA no evaluó esta hoja de vida: revísala manualmente'
            : 'No tiene hoja de vida adjunta'],
        }));
      if (faltantes.length > 0) {
        console.warn(`[vacantes] ${faltantes.length} sin evaluar:`, faltantes.map((f) => f.postulacion.id));
      }
      const aviso = faltantes.length > 0
        ? ` ⚠ ${faltantes.length} ${faltantes.length === 1 ? 'hoja de vida no fue evaluada' : 'hojas de vida no fueron evaluadas'}: están en la pestaña Sin evaluar.`
        : '';

      ultimoModeloExitoso = modelo;
      console.log(`[vacantes] Análisis con modelo: ${modelo}`);
      return {
        cargo,
        fecha: new Date(),
        resumen: ponerNombres(r.resumen ?? '', enviados) + aviso,
        ranking: [...ranking, ...faltantes],
        ejemplo: false,
      };
    } catch (err: any) {
      if (signal?.aborted || err?.definitivo) throw err;
      ultimoError = err?.message ?? String(err);
      if (ultimoModeloExitoso === modelo) ultimoModeloExitoso = null; // dejó de funcionar: se olvida
      console.warn(`[vacantes] Falló ${modelo}:`, ultimoError);

      // Dos modelos saturados = casi seguro que los demás también: no hacer esperar más a RR. HH.
      if (err?.status === 503 && ++saturados >= 2) break;
    }
  }

  if (saturados >= 2) {
    throw new Error('El servicio de IA está saturado en este momento. Intenta de nuevo en unos minutos.');
  }
  console.error('[vacantes] Todos los modelos fallaron. Último error:', ultimoError);
  throw new Error('No se pudo completar el análisis con la IA. Intenta de nuevo más tarde.');
}