export interface ISegment {
  label: string;
  color: string;
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

// ============================================================
// 🏪 TIENDA (para el selector)
// ============================================================
export interface Tienda {
  id: number;
  name: string;
}