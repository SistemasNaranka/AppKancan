import { useAuth } from "@/auth/hooks/useAuth";

export const useUserPolicies = () => {
  const { user } = useAuth();

  const hasPolicy = (policyName: string): boolean => {
    return user?.policies?.includes(policyName) || false;
  };

  const canSeeConfig = (): boolean => {
    return hasPolicy("readComisionesAdmin");
  };

  const canSeeAssign = (): boolean => {
    return hasPolicy("readComisionesAdmin");
  };

  const canAssignEmployees = (): boolean => {
    return (
      hasPolicy("readComisionesAdmin") || hasPolicy("readComisionesTienda")
    );
  };

  const canSeeStoreFilter = (): boolean => {
    return (
      hasPolicy("readComisionesAdmin") || hasPolicy("readComisionesComercial")
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
