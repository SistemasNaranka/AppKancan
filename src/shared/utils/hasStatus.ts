type ErrorWithResponse = {
  response?: {
    status?: unknown;
  };
};

export function hasStatusCode(error: unknown): error is { response: { status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response?.status === 'number'
  );
}