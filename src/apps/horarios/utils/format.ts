export const formatDocumentNumber = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const PARTICULAS_MINUSCULAS = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'von', 'van', 'da', 'di', 'do', 'das', 'dos'
]);

export const formatNombrePropio = (str: string | undefined | null): string => {
  if (!str) return '';
  const palabras = str.trim().split(/\s+/).filter(Boolean);
  return palabras
    .map((palabra, index) => {
      const lower = palabra.toLowerCase();
      if (index > 0 && PARTICULAS_MINUSCULAS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};
