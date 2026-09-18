import { useAuth } from '@/auth/hooks/useAuth';

const PRIZE_ADMIN_POLICY = 'crud_ruleta_prizes';

export const useRuletaPolicies = () => {
  const { user } = useAuth() as any;

  const policies: string[] = (user?.policies ?? []).map((p: any) =>
    (typeof p === 'string' ? p : p?.name ?? p?.policy ?? '')
      .toString()
      .toLowerCase()
  );

  return {
    canManagePrizes: policies.some((p) => p.includes(PRIZE_ADMIN_POLICY)),
  };
};