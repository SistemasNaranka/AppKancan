import { Postulacion } from './directus/read';

export interface CandidatoEvaluado {
  postulacion: Postulacion;
  puntaje: number;        // 0-100, ajuste al cargo
  fortalezas: string[];
  aVerificar: string[];
  evaluado?: boolean;     // false = la IA no lo evaluó (va a "Sin evaluar")
}

export interface ResultadoIA {
  cargo: string;
  fecha: Date;
  resumen: string;
  ranking: CandidatoEvaluado[]; // ordenado de mayor a menor puntaje
  ejemplo: boolean;             // true solo si el resultado no viene de la IA real
}

const NIVEL: Record<string, string> = {
  bachiller: 'Bachiller',
  tecnico_tecnologo: 'Técnico/Tecnólogo',
  profesional: 'Profesional',
};

export const nivelEducativo = (v: unknown) => {
  const s = String(v ?? '');
  return NIVEL[s] || s || 'Sin dato';
};


// Niveles de ajuste: único lugar donde viven umbrales, nombres y colores
export type NivelAjuste = 'alto' | 'medio' | 'bajo' | 'sin';

export const UMBRAL_ALTO = 75;
export const UMBRAL_MEDIO = 50;

export const NIVELES_AJUSTE: Record<NivelAjuste, { nombre: string; rango: string; fondo: string; texto: string }> = {
  alto:  { nombre: 'Alto',        rango: `Puntaje ${UMBRAL_ALTO} o más`,               fondo: '#F0FDF4', texto: '#166534' },
  medio: { nombre: 'Medio',       rango: `Puntaje ${UMBRAL_MEDIO} a ${UMBRAL_ALTO - 1}`, fondo: '#FFF7ED', texto: '#9A3412' },
  bajo:  { nombre: 'Bajo',        rango: `Puntaje menor a ${UMBRAL_MEDIO}`,            fondo: '#FEF2F2', texto: '#991B1B' },
  sin:   { nombre: 'Sin evaluar', rango: 'La IA no las evaluó',                        fondo: '#F1F5F9', texto: '#334155' },
};

export const ORDEN_NIVELES: NivelAjuste[] = ['alto', 'medio', 'bajo', 'sin'];

export const nivelDe = (c: CandidatoEvaluado): NivelAjuste => {
  if (c.evaluado === false) return 'sin';
  if (c.puntaje >= UMBRAL_ALTO) return 'alto';
  if (c.puntaje >= UMBRAL_MEDIO) return 'medio';
  return 'bajo';
};