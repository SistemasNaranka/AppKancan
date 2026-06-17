import { useState } from "react";
import { useUserPolicies } from "./useUserPolicies";
import { getStores } from "../api/directus/read";
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
      const hasPermission = canAssignEmployees();
      if (!hasPermission) {
        setError("No tienes permisos para asignar empleados");
        return;
      }

      const tiendas = await  getStores();
      setTiendasCount(tiendas.length);

      if (tiendas.length === 0) {
        setError("No tienes tiendas asignadas");
        return;
      }

      if (tiendas.length > 1) {
        setShowMultipleStoresWarning(true);
        setError(
          `Tienes ${tiendas.length} tiendas asignadas. Por favor, contacta a Soporte/Sistemas para asignar una sola tienda.`,
        );
        return;
      }

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
    if (showMultipleStoresWarning) {
      setShowMultipleStoresWarning(false);
      setValidationCompleted(false);
      setError(null);
      onClose();
      navigate("/home");
    } else {
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
