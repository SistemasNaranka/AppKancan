import { useAuth } from "@/auth/hooks/useAuth";

export const useUserPolicies = () => {
  const { user } = useAuth();

  const hasPolicy = (policyName: string): boolean => {
    return user?.policies?.includes(policyName) || false;
  };

  const canSeeConfig = (): boolean => {
    return hasPolicy("crud_commission_admin");
  };

  const canSeeAssign = (): boolean => {
    return hasPolicy("crud_commission_admin");
  };

  const canAssignEmployees = (): boolean => {
    return (
      hasPolicy("crud_commission_admin") || hasPolicy("crud_commission_stores")
    );
  };

  const canSeeStoreFilter = (): boolean => {
    return (
      hasPolicy("crud_commission_admin") || hasPolicy("crud_commission_commercial")
    );
  };

  return {
    hasPolicy,
    canSeeConfig,
    canSeeAssign,
    canAssignEmployees,
    canSeeStoreFilter,
  };
};
