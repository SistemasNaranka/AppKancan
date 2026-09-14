import { ISegment, TGrupo } from '../interfaces/ruleta.interface';

// ============================================================
// 🍊🌺 COLORES LATINOS POR GRUPO
// ============================================================
export const GRUPO_COLOR: Record<TGrupo, { color: string; colorDark: string; label: string }> = {
  G1: { color: '#E63946', colorDark: '#A4161A', label: 'Rango 1' }, // 🌹 Rojo pasión
  G2: { color: '#D90368', colorDark: '#9D0208', label: 'Rango 2' }, // 🌺 Rosa mexicano
  G3: { color: '#FF6B00', colorDark: '#E65100', label: 'Rango 3' }, // 🍊 Naranja mango
};

// ============================================================
// 🎁 GRUPO POR PREMIO
// ⚠️ DEBE COINCIDIR EXACTAMENTE con los nombres del backend
// (backend/routes/ruleta.js → PREMIOS_POR_GRUPO)
// ============================================================
export const GRUPO_POR_PREMIO: Record<string, TGrupo> = {
  // 🌹 Rango 1 — Altos (facturas ≥ $600.000)
  'Jean de línea': 'G1',
  'Jean básico': 'G1',
  'Bono $100k': 'G1',

  // 🌺 Rango 2 — Medios (facturas $300.000 – $599.999)
  'Bono $50k': 'G2',
  'Blusa básica': 'G2',
  'Tote bag': 'G2',

  // 🍊 Rango 3 — Bajos (facturas ≤ $300.000)
  'Bandana': 'G3',
  'Bamba': 'G3',
  'Bono $30k': 'G3',
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
// 🔄 MIGRAR SEGMENTO
// ============================================================
export const migrarSegment = (raw: any): ISegment => {
  if (raw?.grupo && GRUPO_COLOR[raw.grupo as TGrupo]) {
    const grupo = raw.grupo as TGrupo;
    return {
      label: raw.label,
      grupo,
      color: raw.color || GRUPO_COLOR[grupo].color,
      colorDark: raw.colorDark || GRUPO_COLOR[grupo].colorDark,
    };
  }
  const grupo: TGrupo = GRUPO_POR_PREMIO[raw?.label] || 'G3';
  return aplicarColorPorGrupo(raw?.label || 'Premio', grupo);
};

// ============================================================
// 🔀 INTERCALAR SEGMENTOS
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
  { grupo: 'G3', min: 300000, max: 600000 },
];

export function determinarGrupoPorTotal(total: number): TGrupo | null {
  if (total < MONTO_MINIMO_PARTICIPACION) return null;
  for (const r of RANGOS_PRECIO) {
    if (total >= r.min && total <= r.max) return r.grupo;
  }
  return null;
}