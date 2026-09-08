import { ISegment, TGrupo } from '../interfaces/ruleta.interface';

export const GRUPO_COLOR: Record<TGrupo, { color: string; colorDark: string; label: string }> = {
  G1: { color: '#E53935', colorDark: '#B71C1C', label: 'Rango 1' },
  G2: { color: '#FBC02D', colorDark: '#F57F17', label: 'Rango 2' },
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