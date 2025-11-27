/**
 * Utilidades para medición de rendimiento
 */

/**
 * Función para medir el tiempo de ejecución de una operación
 */
export const measureExecutionTime = <T>(
  operation: () => T,
  label: string
): T => {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  console.log(`${label}: ${end - start} milliseconds`);
  return result;
};

/**
 * Función para medir el tiempo de ejecución de una operación asíncrona
 */
export const measureAsyncExecutionTime = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  console.log(`${label}: ${end - start} milliseconds`);
  return result;
};
