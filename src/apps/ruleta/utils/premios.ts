import { ISegment, TGrupo } from '../interfaces/ruleta.interface';
import { GRUPO_COLOR } from './rangos';

export const normKey = (v: any): string => String(v ?? '').trim();

export const getInicial = (nombre: string): string => {
  if (!nombre) return '?';
  return nombre.trim().charAt(0).toUpperCase();
};

export const getIconoDecorativo = (nombre: string) => {
  const lower = nombre.toLowerCase();
  if (lower.includes('jean') || lower.includes('denim')) return '👖';
  if (lower.includes('bono') || lower.includes('$')) return '💰';
  if (lower.includes('blusa')) return '👚';
  if (lower.includes('top')) return '👕';
  if (lower.includes('pañole') || lower.includes('bandana')) return '🧣';
  if (lower.includes('bamba')) return '👟';
  if (lower.includes('tote')) return '👜';
  return '🎁';
};

export const buildPremiosFromData = (data: any): ISegment[] => {
  if (!data) return [];

  return (data.prizes ?? [])
    .filter((p: any) => p.is_active)
    .map((p: any) => {
      const cantidadesPorTienda: Record<string, number> = {};
      const restantesPorTienda: Record<string, number> = {};

      (data.inventory ?? [])
        .filter((inv: any) => normKey(inv.prize_id) === normKey(p.id))
        .forEach((inv: any) => {
          const store = normKey(inv.store_code);
          cantidadesPorTienda[store] = Number(inv.total_assigned) || 0;
          restantesPorTienda[store] = inv.available == null ? 0 : Number(inv.available);
        });

      const meta = GRUPO_COLOR[p.tier as TGrupo] ?? GRUPO_COLOR['G3'];

      return {
        id: p.id,
        label: p.name,
        grupo: p.tier,
        color: meta.color,
        colorDark: meta.colorDark,
        cantidadesPorTienda: Object.keys(cantidadesPorTienda).length ? cantidadesPorTienda : undefined,
        restantesPorTienda: Object.keys(restantesPorTienda).length ? restantesPorTienda : undefined,
      } as ISegment;
    });
};

// Con tienda filtrada: valores de esa tienda. Sin filtro: suma de todas.
export const calcularStockPremio = (premio: ISegment, storeKey: string | null) => {
  const cantidades = premio.cantidadesPorTienda ?? {};
  const restantes = premio.restantesPorTienda ?? {};
  const sumar = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

  const stockMostrado = storeKey ? cantidades[storeKey] ?? 0 : sumar(cantidades);
  const restanteMostrado = storeKey ? restantes[storeKey] ?? 0 : sumar(restantes);

  return {
    tiendasConCantidad: Object.keys(cantidades).length,
    stockMostrado,
    restanteMostrado,
    entregadosMostrado: Math.max(0, stockMostrado - restanteMostrado),
  };
};

export const estiloRestante = (restante: number) =>
  restante === 0
    ? { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }
    : restante === 1
    ? { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' }
    : { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };