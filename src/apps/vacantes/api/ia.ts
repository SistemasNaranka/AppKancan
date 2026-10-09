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
  ejemplo: boolean;             // true mientras no exista el backend de IA
}

const NIVEL: Record<string, string> = {
  bachiller: 'Bachiller',
  tecnico_tecnologo: 'Técnico/Tecnólogo',
  profesional: 'Profesional',
};
const BONO_NIVEL: Record<string, number> = { bachiller: 0, tecnico_tecnologo: 6, profesional: 10 };

export const nivelEducativo = (v: unknown) => {
  const s = String(v ?? '');
  return NIVEL[s] || s || 'Sin dato';
};

// TEMPORAL: datos de ejemplo con experiencia y nivel educativo. NO lee los PDF.
// Se reemplaza por la llamada al backend de IA.
export const generarResultadoEjemplo = (seleccion: Postulacion[], cargo: string): ResultadoIA => {
  const ranking = seleccion.map((p) => {
    const anios = Number(p.years_experience) || 0;
    const puntaje = Math.min(98, 45 + Math.min(anios, 10) * 4 + (BONO_NIVEL[String(p.education_level ?? '')] ?? 0));
    return {
      postulacion: p,
      puntaje,
      fortalezas: [
        anios > 0 ? `${anios} ${anios === 1 ? 'año' : 'años'} de experiencia` : 'Disponibilidad para iniciar',
        `Formación: ${nivelEducativo(p.education_level)}`,
      ],
      aVerificar: [anios === 0 ? 'Sin experiencia registrada' : 'Experiencia específica en el cargo'],
    };
  }).sort((a, b) => b.puntaje - a.puntaje);

  const top = ranking[0];
  return {
    cargo,
    fecha: new Date(),
    ejemplo: true,
    ranking,
    resumen: top
      ? `${top.postulacion.full_name} queda primero por experiencia y formación registradas.`
      : '',
  };
};