export const ROLES_AREAS = [
  { nombre: 'Gerente', area: 'Administrativa' },
  { nombre: 'Asesor', area: 'Comercial' },
  { nombre: 'Cajero', area: 'Comercial' },
  { nombre: 'Logistico', area: 'Logística' },
  { nombre: 'Coadministrador', area: 'Administrativa' },
  { nombre: 'Gerente Online', area: 'Sistemas' },
];

const LEGACY_ID_MAP: Record<string, string> = {
  '1': 'Gerente',
  '2': 'Asesor',
  '3': 'Cajero',
  '4': 'Logistico',
  '5': 'Coadministrador',
  '6': 'Gerente Online',
};

export const getPositionLabel = (cargo: unknown): string => {
  if (!cargo) return 'Sin Cargo';

  if (typeof cargo === 'object' && cargo !== null && 'name' in cargo) {
    return (cargo as { name: string }).name;
  }

  const str = String(cargo);

  if (LEGACY_ID_MAP[str]) {
    return LEGACY_ID_MAP[str];
  }

  if (isNaN(Number(str)) && str.trim() !== '') {
    return str;
  }

  return 'Sin Cargo';
};
