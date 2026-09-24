export const AZUL = '#004680';
export const AZUL_BG = '#E6EEF5';
export const AZUL_BORDER = '#99BBD4';
export const AZUL_HOVER = '#CCDDEA';

export const TIENDAS_AUTORIZADAS: readonly string[] = [
  'CALI CARRERA8',
  'CALI CENTRO',
  'CALI SALOMIA',
  'CALIMA',
  'CENCO CALI',
  'CHIPICHAPE',
  'COSMOCENTRO',
  'MALL PLAZA',
  'MANIZALES CENTRO',
  'PALMETTO',
  'UNICENTRO1 CALI',
  'UNICENTRO2 CALI',
  'UNICO CALI',
  'VICTORIA PLAZA',
];

export const esTiendaAutorizada = (nombre: string): boolean =>
  TIENDAS_AUTORIZADAS.includes((nombre || '').trim().toUpperCase());