import { ISegment, TGrupo } from '../interfaces/ruleta.interface';

// ============================================================
// 🎨 COLORES LATINOS POR GRUPO (con emoji)
// ============================================================
export const GRUPO_COLOR: Record<
  TGrupo,
  { color: string; colorDark: string; label: string; emoji: string }
> = {
  G1: { color: '#E63946', colorDark: '#A4161A', label: 'Rango Alto',  emoji: '🌹' },
  G2: { color: '#D90368', colorDark: '#9D0208', label: 'Rango Medio', emoji: '🌺' },
  G3: { color: '#FF6B00', colorDark: '#E65100', label: 'Rango Bajo',  emoji: '🍊' },
};

// ============================================================
// 🎁 GRUPO POR PREMIO — ORDENADO POR RANGO
// ⚠️ DEBE COINCIDIR EXACTAMENTE con el backend (ruleta.js)
// ============================================================
export const GRUPO_POR_PREMIO: Record<string, TGrupo> = {
  // ========== 🌹 G1 — ALTOS (≥ $600.000) ==========
  'Jean de línea': 'G1',
  'Jean básico':   'G1',
  'Bono $100k':    'G1',

  // ========== 🌺 G2 — MEDIOS ($300.000 - $599.999) ==========
  'Bono $50k':     'G2',
  'Blusa básica':  'G2',
  'Tote bag':      'G2',

  // ========== 🍊 G3 — BAJOS (≤ $300.000) ==========
  'Bandana':       'G3',
  'Bamba':         'G3',
  'Bono $30k':     'G3',
};

// ============================================================
// 🎨 APLICAR COLOR POR GRUPO
// ============================================================
export const aplicarColorPorGrupo = (label: string, grupo: TGrupo): ISegment => ({
  label,
  grupo,
  color: GRUPO_COLOR[grupo].color,
  colorDark: GRUPO_COLOR[grupo].colorDark,
});

// ============================================================
// 🔄 MIGRAR SEGMENTO (compatible con premios viejos y nuevos)
// ============================================================
export const migrarSegment = (raw: any): ISegment => {
  const grupo: TGrupo =
    raw?.grupo && GRUPO_COLOR[raw.grupo as TGrupo]
      ? (raw.grupo as TGrupo)
      : GRUPO_POR_PREMIO[raw?.label] || 'G3';

  const seg: ISegment = {
    label: raw?.label || 'Premio',
    grupo,
    color: raw?.color || GRUPO_COLOR[grupo].color,
    colorDark: raw?.colorDark || GRUPO_COLOR[grupo].colorDark,
  };

  // 📦 Preservar cantidad y cantidadesPorTienda si existen
  if (typeof raw?.cantidad === 'number' && raw.cantidad > 0) {
    seg.cantidad = raw.cantidad;
  }
  if (raw?.cantidadesPorTienda && typeof raw.cantidadesPorTienda === 'object') {
    const entries = Object.entries(raw.cantidadesPorTienda)
      .map(([k, v]) => [k, Number(v)] as [string, number])
      .filter(([, v]) => !isNaN(v) && v > 0);
    if (entries.length > 0) {
      seg.cantidadesPorTienda = Object.fromEntries(entries);
    }
  }

  return seg;
};

// ============================================================
// 🔀 INTERCALAR SEGMENTOS
// (para que no queden todos los del mismo grupo juntos)
// ============================================================
export const intercalarSegments = (segments: ISegment[]): ISegment[] => {
  if (segments.length <= 1) return [...segments];

  const buckets: Record<TGrupo, ISegment[]> = { G1: [], G2: [], G3: [] };
  segments.forEach((s) => buckets[s.grupo].push(s));

  const result: ISegment[] = [];
  let last: TGrupo | null = null;

  while (result.length < segments.length) {
    const orden = (Object.keys(buckets) as TGrupo[])
      .filter((g) => buckets[g].length > 0)
      .sort((a, b) => buckets[b].length - buckets[a].length);

    const pick = orden.find((g) => g !== last) || orden[0];
    if (!pick) break;
    result.push(buckets[pick].shift()!);
    last = pick;
  }

  return result;
};

// ============================================================
// 📊 RANGOS DE PRECIOS
// ============================================================
export const MONTO_MINIMO_PARTICIPACION = 300000;

export const RANGOS_PRECIO: { grupo: TGrupo; min: number; max: number }[] = [
  { grupo: 'G1', min: 600000, max: Infinity },
  { grupo: 'G2', min: 300000, max: 599999 },
  { grupo: 'G3', min: 0,      max: 299999 },
];

export function determinarGrupoPorTotal(total: number): TGrupo | null {
  if (total < MONTO_MINIMO_PARTICIPACION) return 'G3';
  for (const r of RANGOS_PRECIO) {
    if (total >= r.min && total <= r.max) return r.grupo;
  }
  return 'G3';
}