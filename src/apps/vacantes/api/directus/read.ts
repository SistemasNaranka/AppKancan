import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems, readAssetRaw, readMe } from '@directus/sdk';

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

export async function abrirCv(cv: string | null) {
  if (!cv) return;
  const ventana = window.open('', '_blank');
  try {
    const stream = await withAutoRefresh(() => directus.request(readAssetRaw(cv)));
    const datos = await new Response(stream as ReadableStream).arrayBuffer();
    const url = URL.createObjectURL(new Blob([datos], { type: 'application/pdf' }));
    if (ventana) ventana.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    ventana?.close();
    throw err;
  }
}

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
  ai_score?: number | null; // 👈 CAMBIADO AQUÍ
  ai_analysis?: string | null;
}

// Helper: parsea el string ai_analysis a objeto
export function parsearAnalisisIA(p: Postulacion): {
  puntaje: number;
  fortalezas: string[];
  aVerificar: string[];
  resumen: string;
  cargo: string;
  fecha: string;
  modelo?: string;
} | null {
  if (!p.ai_analysis) return null;
  try {
    return typeof p.ai_analysis === 'string'
      ? JSON.parse(p.ai_analysis)
      : (p.ai_analysis as any);
  } catch {
    return null;
  }
}

export async function getApplications(): Promise<Postulacion[]> {
  const res = await withAutoRefresh(() =>
    directus.request(
      readItems('app_applications' as never, {
        fields: ['*', 'positions.*.*', 'ai_score', 'ai_analysis'], // 👈 CAMBIADO AQUÍ
        sort: ['-date_created'],
        limit: -1,
      } as never)
    )
  );
  return res as unknown as Postulacion[];
}

export async function getModelosIAUsuario(): Promise<unknown> {
  try {
    const yo = await withAutoRefresh(() =>
      directus.request(readMe({ fields: ['models_ia'] } as never))
    );
    return (yo as any)?.models_ia ?? null;
  } catch (err) {
    console.warn('[vacantes] No se pudo leer models_ia del usuario:', err);
    return null;
  }
}

export async function descargarCvBytes(cv: string): Promise<ArrayBuffer> {
  const stream = await withAutoRefresh(() => directus.request(readAssetRaw(cv)));
  return new Response(stream as ReadableStream).arrayBuffer();
}

export async function getDescripcionCargo(nombre: string): Promise<string> {
  if (!nombre) return '';
  try {
    const res = await withAutoRefresh(() =>
      directus.request(
        readItems('app_positions' as never, {
          filter: { nombre: { _eq: nombre } },
          fields: ['id', 'nombre', 'descripcion'],
          limit: 1,
        } as never)
      )
    );
    const arr = res as any[];
    const desc = arr?.[0]?.descripcion ?? '';
    console.log(`[vacantes] Descripción del cargo "${nombre}":`, desc ? 'ok' : 'vacía');
    return desc;
  } catch (err) {
    console.warn('[vacantes] No se pudo leer la descripción del cargo:', err);
    return '';
  }
}