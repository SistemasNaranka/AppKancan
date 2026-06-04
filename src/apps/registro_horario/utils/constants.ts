export const API_URL = import.meta.env.VITE_HOST as string;

export const EVENTS = {
  START: 'Comenzar Jornada',
  START_LUNCH: 'Iniciar Almuerzo',
  END_LUNCH: 'Finalizar Almuerzo',
  END_WORK: 'Terminar Jornada',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];