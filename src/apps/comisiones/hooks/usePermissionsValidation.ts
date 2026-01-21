import { useState } from "react";
import { useUserPolicies } from "./useUserPolicies";
import { obtenerTiendas } from "../api/directus/read";
import { DirectusTienda } from "../types/modal";

interface ValidationState {
  hasPermission: boolean;
  tiendasCount: number;
  tiendaUsuario: DirectusTienda | null;
  validationCompleted: boolean;
  showMultipleStoresWarning: boolean;
  error: string | null;
}

interface UsePermissionsValidationReturn extends ValidationState {
  validatePermissionsAndStores: () => Promise<void>;
  handleCloseAndRedirect: (onClose: () => void, navigate: any) => void;
  resetState: () => void;
}

export const usePermissionsValidation = (): UsePermissionsValidationReturn => {
  const { canAssignEmployees } = useUserPolicies();

  const [hasPermission, setHasPermission] = useState(false);
  const [tiendasCount, setTiendasCount] = useState(0);
  const [tiendaUsuario, setTiendaUsuario] = useState<DirectusTienda | null>(
    null,
  );
  const [validationCompleted, setValidationCompleted] = useState(false);
  const [showMultipleStoresWarning, setShowMultipleStoresWarning] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePermissionsAndStores = async () => {
    try {
      // 1. Verificar si tiene permiso readComisionesTienda
      const hasPermission = canAssignEmployees();
      if (!hasPermission) {
        setError("No tienes permisos para asignar empleados");
        return;
      }

      // 2. Verificar tiendas del usuario
      const tiendas = await obtenerTiendas();
      setTiendasCount(tiendas.length);

      if (tiendas.length === 0) {
        setError("No tienes tiendas asignadas");
        return;
      }

      // 3. Si tiene más de 1 tienda, mostrar aviso y redirigir
      if (tiendas.length > 1) {
        setShowMultipleStoresWarning(true);
        setError(
          `Tienes ${tiendas.length} tiendas asignadas. Por favor, contacta a Soporte/Sistemas para asignar una sola tienda.`,
        );
        return;
      }

      // 4. Si tiene exactamente 1 tienda, guardar la información completa de la tienda del usuario
      setTiendaUsuario(tiendas[0]);
      setHasPermission(true);
      setValidationCompleted(true);
      setError(null);
    } catch (err) {
      console.error("Error validando permisos:", err);
      setError("Error al validar permisos");
    }
  };

  const handleCloseAndRedirect = (onClose: () => void, navigate: any) => {
    // Solo redirigir si realmente hay múltiples tiendas
    if (showMultipleStoresWarning) {
      setShowMultipleStoresWarning(false);
      setValidationCompleted(false);
      setError(null);
      onClose();
      navigate("/home");
    } else {
      // Si no hay múltiples tiendas, simplemente cerrar sin redirigir
      onClose();
    }
  };

  const resetState = () => {
    setHasPermission(false);
    setTiendasCount(0);
    setTiendaUsuario(null);
    setValidationCompleted(false);
    setShowMultipleStoresWarning(false);
    setError(null);
  };

  return {
    hasPermission,
    tiendasCount,
    tiendaUsuario,
    validationCompleted,
    showMultipleStoresWarning,
    error,
    validatePermissionsAndStores,
    handleCloseAndRedirect,
    resetState,
  };
};
