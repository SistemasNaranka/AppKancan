import { Postulacion } from './directus/read';

export interface CandidatoEvaluado {
  postulacion: Postulacion;
  puntaje: number;        // 0-100, ajuste al cargo
  fortalezas: string[];
  aVerificar: string[];
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
