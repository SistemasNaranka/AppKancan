import { useAuth } from '@/auth/hooks/useAuth';

export const useHorariosPolicies = () => {
  const { user } = useAuth();

  const hasPolicy = (policyName: string): boolean =>
    user?.policies?.includes(policyName) ?? false;
  
  const MODULO_REGEX = /(time_?log|horario)/;
  const esAdmin = (): boolean =>
    (user?.policies ?? []).some((p) => {
      const s = p.toLowerCase();
      return s.includes('admin') && MODULO_REGEX.test(s);
    });

  const esReport = (): boolean =>
    (user?.policies ?? []).some((p) => {
      const s = p.toLowerCase();
      return s.includes('report');
    });

  return { hasPolicy, esAdmin, esReport };
};

export default useHorariosPolicies;

