export type TGrupo = 'G1' | 'G2' | 'G3';

export interface ISegment {
  label: string;
  grupo: TGrupo;
  color: string;
  colorDark?: string;
}

export interface IPremioResponse {
  prize: string;
  couponCode: string;
  expiresAt: string;
  message?: string;
}

export interface IFormularioGanador {
  nombre: string;
  email: string;
  telefono: string;
}