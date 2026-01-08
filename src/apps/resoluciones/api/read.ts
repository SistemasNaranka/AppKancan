export const getResoluciones = async () => {
  // Implementación básica para obtener datos de resoluciones
  const response = await fetch("/resoluciones");
  if (!response.ok) {
    throw new Error("Failed to fetch resoluciones");
  }
  return response.json();
};
