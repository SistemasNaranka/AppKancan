export type TGrupo = 'G1' | 'G2' | 'G3';

export interface ISegment {
  label: string;
  grupo: TGrupo;
  color: string;
  colorDark?: string;
  cantidad?: number;
  cantidadesPorTienda?: Record<string, number>;
  // id de sal_prizes en Directus, cuando el premio ya está persistido
  id?: number;
}

// Forma canónica que usa toda la app (Ruleta.tsx, ModalPremio.tsx, etc.)
export interface IPremioResponse {
  prize: string;
  couponCode: string;
  expiresAt: string;
  message?: string;
  probabilidad?: number;
}

// Forma "cruda" tal como puede llegar del backend, donde `prize` a veces
// viene anidado como objeto en vez de string. No se usa fuera de useRuleta.
export interface IPremioResponseRaw {
  prize: string | { prize: string; probabilidad?: number };
  couponCode: string;
  expiresAt: string;
  message?: string;
  probabilidad?: number;
}

export interface IGirarRequest {
  documentos: string;
  storeId?: number | null;
}

export interface IFormularioGanador {
  nombre: string;
  email: string;
  telefono: string;
}

// ============================================================
// 🏪 TIENDA (para el selector)
// ============================================================
export interface Tienda {
  id: number;
  name: string;
  ultra_code: string;
}
