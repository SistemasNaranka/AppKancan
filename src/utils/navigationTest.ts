// Utilidad para probar la navegación persistente
export const testNavigationPersistence = () => {
  const STORAGE_KEY = "lastVisitedRoute";
  
  console.log("=== PRUEBA DE NAVEGACIÓN PERSISTENTE ===");
  
  // Test 1: Verificar localStorage
  console.log("1. localStorage disponible:", typeof Storage !== "undefined");
  
  // Test 2: Verificar valor actual
  const currentValue = localStorage.getItem(STORAGE_KEY);
  console.log("2. Valor actual en localStorage:", currentValue);
  
  // Test 3: Guardar una ruta de prueba
  const testRoute = "/comisiones";
  localStorage.setItem(STORAGE_KEY, testRoute);
  console.log("3. Guardando ruta de prueba:", testRoute);
  
  // Test 4: Verificar que se guardó
  const savedValue = localStorage.getItem(STORAGE_KEY);
  console.log("4. Valor después de guardar:", savedValue);
  
  // Test 5: Validar ruta
  const isValidRoute = (route: string | null) => {
    return route && 
           route !== "/login" && 
           route !== "/home" && 
           route.startsWith("/");
  };
  
  console.log("5. Ruta válida:", isValidRoute(savedValue));
  console.log("========================================");
  
  return {
    currentValue,
    savedValue,
    isValid: isValidRoute(savedValue)
  };
};

// Ejecutar prueba automáticamente si estamos en desarrollo
if (typeof window !== "undefined" && import.meta.env.DEV) {
  setTimeout(() => {
    testNavigationPersistence();
  }, 1000);
}