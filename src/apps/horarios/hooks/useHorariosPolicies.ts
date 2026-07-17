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

  const esAreaManager = (): boolean =>
    (user?.policies ?? []).some((p) => {
      const s = p.toLowerCase();
      const hasTimeLog = s.includes('time_log') || s.includes('time-log') || s.includes('timelog');
      const hasManagerOrArea = s.includes('manager') || s.includes('area');
      return hasTimeLog && hasManagerOrArea;
    });

  const esReport = (): boolean =>
    (user?.policies ?? []).some((p) => {
      const s = p.toLowerCase();
      return s.includes('report') || esAreaManager();
    });

  const tieneTemporal = (): boolean =>
    (user?.policies ?? []).some((p) => p.toLowerCase() === 'temporal');

  const puedeVerDemo = (): boolean =>
    (user?.policies ?? []).some((p) => p.toLowerCase().includes('demo'));

  return { hasPolicy, esAdmin, esReport, puedeVerDemo, tieneTemporal, esAreaManager };
};

export default useHorariosPolicies;

