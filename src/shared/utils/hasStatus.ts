type ErrorWithResponse = {
  response?: {
    status?: unknown;
  };
};
/**
*Funcion para validar si el error es una respuesta que viene con status code
*/
export function hasStatusCode(error: unknown): error is { response: { status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response?.status === 'number'
  );
}