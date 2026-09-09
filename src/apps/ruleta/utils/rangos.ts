import { ISegment, TGrupo } from '../interfaces/ruleta.interface';

export const GRUPO_COLOR: Record<TGrupo, { color: string; colorDark: string; label: string }> = {
  G1: { color: '#E53935', colorDark: '#B71C1C', label: 'Rango 1' },
  G2: { color: '#FBC02D', colorDark: '#F9A825', label: 'Rango 2' },
  G3: { color: '#1E88E5', colorDark: '#0D47A1', label: 'Rango 3' },
};

export const GRUPO_POR_PREMIO: Record<string, TGrupo> = {
  'Jean de línea': 'G1',
  'Jean básico': 'G1',
  'Bonos $100k': 'G1',
  'Bonos $50k': 'G2',
  'Bonos $30k': 'G2',
  'Blusas básicas': 'G2',
  'Tote bag denim': 'G3',
  'Tops': 'G3',
  'Pañoletas': 'G3',
  'Bambas': 'G3',
};

export const aplicarColorPorGrupo = (label: string, grupo: TGrupo): ISegment => ({
  label,
  grupo,
  color: GRUPO_COLOR[grupo].color,
  colorDark: GRUPO_COLOR[grupo].colorDark,
});

export const migrarSegment = (raw: any): ISegment => {
  if (raw?.grupo && GRUPO_COLOR[raw.grupo as TGrupo]) {
    return aplicarColorPorGrupo(raw.label, raw.grupo);
  }
  const grupo: TGrupo = GRUPO_POR_PREMIO[raw?.label] || 'G3';
  return aplicarColorPorGrupo(raw?.label || 'Premio', grupo);
};

export const intercalarSegments = (segments: ISegment[]): ISegment[] => {
  const n = segments.length;
  if (n <= 1) return [...segments];

  const buckets: Record<TGrupo, ISegment[]> = { G1: [], G2: [], G3: [] };
  segments.forEach((s) => buckets[s.grupo].push(s));

  const grupos = (Object.keys(buckets) as TGrupo[])
    .filter((g) => buckets[g].length > 0)
    .sort((a, b) => buckets[b].length - buckets[a].length);

  const result: (ISegment | null)[] = new Array(n).fill(null);

  // 1. Mayoritario distribuido uniformemente en el círculo
  const mayor = grupos[0];
  const cantMayor = buckets[mayor].length;
  const step = n / cantMayor;
  for (let i = 0; i < cantMayor; i++) {
    const pos = Math.round(i * step) % n;
    result[pos] = buckets[mayor].shift()!;
  }

  // 2. Rellenar huecos evitando adyacencia con vecinos ya colocados
  const huecos: number[] = [];
  for (let i = 0; i < n; i++) if (result[i] === null) huecos.push(i);

  for (const pos of huecos) {
    const disponibles = grupos.slice(1).filter((g) => buckets[g].length > 0);
    if (disponibles.length === 0) break;

    const prev = result[(pos - 1 + n) % n];
    const next = result[(pos + 1) % n];
    const prohibidos = new Set([prev?.grupo, next?.grupo].filter(Boolean));

    let pick = disponibles
      .filter((g) => !prohibidos.has(g))
      .sort((a, b) => buckets[b].length - buckets[a].length)[0];

    if (!pick) {
      pick = disponibles.sort((a, b) => buckets[b].length - buckets[a].length)[0];
    }

    result[pos] = buckets[pick].shift()!;
  }

  return result as ISegment[];
};