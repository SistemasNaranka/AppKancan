import { useAuth } from '@/auth/hooks/useAuth';

/**
 * Permisos del módulo de Horarios.
 * Sigue el mismo patrón que comisiones (useUserPolicies): se basa en las
 * policies del usuario autenticado. La seguridad real la aplican los
 * permisos de Directus; esto solo controla la visibilidad en la UI.
 */
export const useHorariosPolicies = () => {
  const { user } = useAuth();

  const hasPolicy = (policyName: string): boolean =>
    user?.policies?.includes(policyName) ?? false;

  // Acceso al panel administrativo de empleados.
  // No depende del nombre EXACTO de la policy: detecta cualquier policy que
  // contenga "admin" + un término del módulo (time_log / timelog / horario).
  // Así sobrevive a renombres como crud_horarios_admin → crud_time_log_admin.
  const MODULO_REGEX = /(time_?log|horario)/;
  const esAdmin = (): boolean =>
    (user?.policies ?? []).some((p) => {
      const s = p.toLowerCase();
      return s.includes('admin') && MODULO_REGEX.test(s);
    });

  return { hasPolicy, esAdmin };
};

export default useHorariosPolicies;
