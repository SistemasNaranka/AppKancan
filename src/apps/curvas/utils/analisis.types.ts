export interface UsuarioData {
  id: string;
  nombreCompleto: string;
}

export interface FilaAnalisis {
  tiendaId: string;
  tiendaNombre: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha?: string;
  referencia?: string;
  tallas: Record<string, number>;
  total: number;
}

export interface MatrixDataTransformada {
  tallas: string[];
  filas: FilaAnalisis[];
  columnTotals: Record<string, number>;
  grandTotal: number;
  tiendasUnicas: number;
  usuariosUnicos: number;
  maxCellValue: number;
  unidadesPorUsuario: Record<string, { nombre: string; total: number }>;
}