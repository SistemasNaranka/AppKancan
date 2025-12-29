import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { testNavigationPersistence } from "@/utils/navigationTest";

/**
 * Hook personalizado para persistir la navegación entre recargas de página
 * Guarda la última ruta visitada y la recupera al cargar la aplicación
 */
export const useNavigationPersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Clave para localStorage
  const STORAGE_KEY = "lastVisitedRoute";

  // Función directa para obtener la última ruta guardada
  const getLastVisitedRoute = useCallback((): string | null => {
    try {
      const savedRoute = localStorage.getItem(STORAGE_KEY);
      // Solo retornar rutas válidas que no sean login ni home por defecto
      if (savedRoute && 
          savedRoute !== "/login" && 
          savedRoute !== "/home" && 
          savedRoute.startsWith("/")) {
        return savedRoute;
      }
    } catch (error) {
      console.warn("Error reading navigation persistence:", error);
    }
    return null;
  }, []);

  // Estado para la última ruta visitada
  const [lastVisitedRoute, setLastVisitedRoute] = useState<string | null>(null);

  // Inicializar el estado con el valor del localStorage
  useEffect(() => {
    const savedRoute = getLastVisitedRoute();
    setLastVisitedRoute(savedRoute);
    
    // Log para debugging en desarrollo
    if (import.meta.env.DEV) {
      console.log("🔄 Navigation Hook - Initial route:", savedRoute);
    }
  }, [getLastVisitedRoute]);

  // Actualizar la ruta guardada cuando cambie la ubicación
  useEffect(() => {
    // No guardar la ruta de login ni rutas vacías
    if (location.pathname && 
        location.pathname !== "/login" && 
        location.pathname !== "/home") {
      try {
        localStorage.setItem(STORAGE_KEY, location.pathname);
        setLastVisitedRoute(location.pathname);
        
        // Log para debugging en desarrollo
        if (import.meta.env.DEV) {
          console.log("💾 Navigation Hook - Saved route:", location.pathname);
        }
      } catch (error) {
        console.warn("Error saving navigation persistence:", error);
      }
    }
  }, [location.pathname]);

  // Función para ir a la página de inicio explícitamente
  const goToHome = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "/home");
    } catch (error) {
      console.warn("Error saving home route:", error);
    }
    navigate("/home");
  }, [navigate]);

  // Función para ir a la última ruta guardada
  const goToLastVisited = useCallback(() => {
    const savedRoute = getLastVisitedRoute();
    if (savedRoute) {
      navigate(savedRoute);
    } else {
      navigate("/home");
    }
  }, [navigate, getLastVisitedRoute]);

  // Función para limpiar la ruta guardada (útil para logout)
  const clearSavedRoute = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastVisitedRoute(null);
    } catch (error) {
      console.warn("Error clearing navigation persistence:", error);
    }
  }, []);

  return {
    lastVisitedRoute,
    getLastVisitedRoute,
    goToHome,
    goToLastVisited,
    clearSavedRoute,
  };
};