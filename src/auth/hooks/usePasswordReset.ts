import { useState, useCallback } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { updateUserPassword } from "@/services/directus/auth";

export const usePasswordReset = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requiresPasswordChange = user?.requires_password_change || false;

  const changePassword = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (!user?.id) {
        setError("Usuario no encontrado");
        return false;
      }

      if (newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return false;
      }

      if (newPassword.length < 4) {
        setError("La contraseña debe tener al menos 4 caracteres");
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        await updateUserPassword(user.id, newPassword);
        setSuccess(true);
        return true;
      } catch (err: any) {
        console.error("❌ Error al cambiar contraseña:", err);
        setError(err?.message || "Error al cambiar la contraseña");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  const forceLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    requiresPasswordChange,
    loading,
    error,
    success,
    changePassword,
    forceLogout,
    clearError: () => setError(null),
  };
};
