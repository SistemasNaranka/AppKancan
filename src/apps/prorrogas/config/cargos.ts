export const ROLES_AREAS = [
  { nombre: 'Gerente', area: 'Administrativa' },
  { nombre: 'Asesor', area: 'Comercial' },
  { nombre: 'Cajero', area: 'Comercial' },
  { nombre: 'Logistico', area: 'Logística' },
  { nombre: 'Coadministrador', area: 'Administrativa' },
  { nombre: 'Gerente Online', area: 'Sistemas' },
];

// Mapeo de IDs numéricos antiguos a nombres legibles.
// Los contratos creados antes de la migración guardaban el cargo como número.
const LEGACY_ID_MAP: Record<string, string> = {
  '1': 'Gerente',
  '2': 'Asesor',
  '3': 'Cajero',
  '4': 'Logistico',
  '5': 'Coadministrador',
  '6': 'Gerente Online',
};

/**
 * Resuelve cualquier representación de cargo (número legacy, string, objeto)
 * a un nombre legible para mostrar en la UI.
 */
export const getCargoLabel = (cargo: unknown): string => {
  if (!cargo) return 'Sin Cargo';

  // Si Directus lo devolvió como objeto con campo nombre
  if (typeof cargo === 'object' && cargo !== null && 'nombre' in cargo) {
    return (cargo as { nombre: string }).nombre;
  }

  const str = String(cargo);

  // Resolver ID numérico legacy
  if (LEGACY_ID_MAP[str]) {
    return LEGACY_ID_MAP[str];
  }

  // Ya es un string válido (post-migración)
  if (isNaN(Number(str)) && str.trim() !== '') {
    return str;
  }

  return 'Sin Cargo';
};
