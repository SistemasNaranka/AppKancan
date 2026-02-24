/**
 * Utilidades de validación
 * Funciones para validar datos de entrada
 */

/**
 * Valida formato de fecha YYYY-MM-DD
 * @param {string} dateStr - String de fecha a validar
 * @returns {boolean} - true si es válido
 */
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  // Verificar que sea una fecha real
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Valida que un año sea un número entero válido y razonable
 * @param {number} year - Año a validar
 * @returns {boolean} - true si es válido
 */
function isValidYear(year) {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2020 && year <= currentYear + 1;
}

/**
 * Obtiene los años entre dos fechas
 * @param {string} fechaDesde - Fecha inicial (YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha final (YYYY-MM-DD)
 * @returns {Array<number>} - Array de años
 */
function getYearsBetween(fechaDesde, fechaHasta) {
  const yearDesde = new Date(fechaDesde).getFullYear();
  const yearHasta = new Date(fechaHasta).getFullYear();
  const years = [];
  for (let y = yearDesde; y <= yearHasta; y++) {
    years.push(y);
  }
  return years;
}

module.exports = {
  isValidDateFormat,
  isValidYear,
  getYearsBetween,
};
