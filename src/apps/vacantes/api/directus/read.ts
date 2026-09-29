import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';

export const ESTADOS = [
  'Recibido', 'En revisión', 'Preseleccionado',
  'Entrevista', 'Contratado', 'Rechazado',
] as const;

export type EstadoContratacion = typeof ESTADOS[number];

export const ESTADO_COLOR: Record<string, { bg: string; color: string }> = {
  'Recibido':        { bg: '#FEF3C7', color: '#B45309' },
  'En revisión':     { bg: '#DBEAFE', color: '#1D4ED8' },
  'Preseleccionado': { bg: '#EDE9FE', color: '#6D28D9' },
  'Entrevista':      { bg: '#FFEDD5', color: '#C2410C' },
  'Contratado':      { bg: '#DCFCE7', color: '#15803D' },
  'Rechazado':       { bg: '#FEE2E2', color: '#B91C1C' },
};

export const getEstadoMeta = (status?: string | null) =>
  (status && ESTADO_COLOR[status]) || { bg: '#F1F5F9', color: '#64748B' };

const EDUCACION: Record<string, string> = {
  bachiller: 'Bachiller',
  tecnico_tecnologo: 'Técnico/Tecnólogo',
  profesional: 'Profesional',
};

export const formatearEducacion = (v?: string | null) =>
  v ? EDUCACION[v] ?? v : 'No especificado';

// Lee los cargos desde la relación M2M "positions",
// sin depender del nombre del campo intermedio
export const getCargos = (p: any): string[] => {
  const rows: any[] = Array.isArray(p?.positions) ? p.positions : [];
  const nombres = rows
    .map((row: any) => {
      if (!row || typeof row !== 'object') return '';
      if (typeof row.nombre === 'string') return row.nombre;
      const nested = Object.values(row).find(
        (v: any) => v && typeof v === 'object' && typeof (v as any).nombre === 'string'
      ) as any;
      return nested?.nombre ?? '';
    })
    .filter((v: string) => Boolean(v));
  return Array.from(new Set(nombres));
};

export const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

const DIRECTUS_URL = 'http://192.168.19.245:8055';
export const buildCvUrl = (cv: string | null) =>
  cv ? `${DIRECTUS_URL}/assets/${cv}` : '#';

export interface Postulacion {
  id: number;
  document_type: string;
  document_number: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  education_level: string | null;
  years_experience: number | string;
  cv: string | null;
  consent_text: string | null;
  consent_accepted_at: string | null;
  date_created: string;
  status: string;
  positions?: any[] | null;
}

export async function getApplications(): Promise<Postulacion[]> {
  const res = await withAutoRefresh(() =>
    directus.request(
      readItems('app_applications' as never, {
        fields: ['*', 'positions.*.*'],
        sort: ['-date_created'],
        limit: -1,
      } as never)
    )
  );
  return res as unknown as Postulacion[];
}