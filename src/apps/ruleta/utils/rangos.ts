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

// Variantes de tono dentro del mismo grupo para que los gajos se distingan entre sí
// Variantes de tono dentro del mismo grupo para que los gajos se distingan entre sí
const VARIANTES_TONO: Record<TGrupo, string[]> = {
  G1: ['#E53935', '#B71C1C', '#FF7043'],
  G2: ['#FBC02D', '#E65100', '#FFEB3B'],
  G3: ['#1E88E5', '#0D47A1', '#4FC3F7', '#3949AB'],
};

export const aplicarColorPorGrupo = (label: string, grupo: TGrupo, indiceEnGrupo = 0): ISegment => ({
  label,
  grupo,
  color: VARIANTES_TONO[grupo][indiceEnGrupo % VARIANTES_TONO[grupo].length],
  colorDark: GRUPO_COLOR[grupo].colorDark,
});

export const migrarSegment = (raw: any, indiceEnGrupo = 0): ISegment => {
  if (raw?.grupo && GRUPO_COLOR[raw.grupo as TGrupo]) {
    return aplicarColorPorGrupo(raw.label, raw.grupo, indiceEnGrupo);
  }
  const grupo: TGrupo = GRUPO_POR_PREMIO[raw?.label] || 'G3';
  return aplicarColorPorGrupo(raw?.label || 'Premio', grupo, indiceEnGrupo);
};

// Umbrales de negocio — deben coincidir con server/routes/ruleta.js
const UMBRAL_BAJOS = 300000;
const UMBRAL_MEDIOS = 600000;

// Filtra los premios visibles en la ruleta según el monto facturado (exclusivo por tramo)
export const filtrarSegmentsPorMonto = (
  segments: ISegment[],
  monto: number | null
): ISegment[] => {
  if (monto === null) return segments; // sin factura validada: muestra todos
  let grupoPermitido: TGrupo;
  if (monto <= UMBRAL_BAJOS) grupoPermitido = 'G3';        // bajos
  else if (monto <= UMBRAL_MEDIOS) grupoPermitido = 'G2';  // medios
  else return segments;                                     // >600k: todos
  return segments.filter((s) => s.grupo === grupoPermitido);
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