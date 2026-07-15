/**
 * Formats a document number (cedula) visually by separating every 3 digits with a comma.
 * e.g., 1114952503 -> 1,114,952,503
 */
export const formatDocumentNumber = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
