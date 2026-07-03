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

  const tieneTemporal = (): boolean =>
    (user?.policies ?? []).some((p) => p.toLowerCase().includes('temporal'));

  const puedeVerDemo = (): boolean =>
    (user?.policies ?? []).some((p) => p.toLowerCase().includes('demo'));

  return { hasPolicy, esAdmin, esReport, puedeVerDemo, tieneTemporal };
};

export default useHorariosPolicies;

