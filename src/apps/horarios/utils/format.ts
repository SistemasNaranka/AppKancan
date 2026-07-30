/**
 * Formats a document number (cedula) visually by separating every 3 digits with a comma.
 * e.g., 1114952503 -> 1,114,952,503
 */
export const formatDocumentNumber = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const PARTICULAS_MINUSCULAS = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'von', 'van', 'da', 'di', 'do', 'das', 'dos'
]);

/**
 * Formatea un nombre o texto propio respetando mayúsculas iniciales y manteniendo
 * en minúsculas las partículas compuestas en español ("de", "del", "la", "y", etc.).
 * Convierte textos en MAYÚSCULAS SOSTENIDAS o minúsculas a Title Case apropiado.
 * e.g., "MARIA ANTONIA DE LA CRUZ" -> "Maria Antonia de la Cruz"
 * e.g., "carlos del toro gomez" -> "Carlos del Toro Gomez"
 */
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
