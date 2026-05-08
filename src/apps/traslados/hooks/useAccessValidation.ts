import { useMemo } from "react";

export interface AccessValidationResult {
  isValid: boolean;
  errorType: "no-access" | "incomplete" | null;
  missingFields: string[];
}

interface UserData {
  ultra_code?: string | number | null;
  company?: string | null;
}

export function useAccessValidation(
  user: UserData | null | undefined
): AccessValidationResult {
  return useMemo(() => {
    if (!user) {
      return {
        isValid: false,
        errorType: "no-access",
        missingFields: ["ultra_code", "company"],
      };
    }

    const missingFields: string[] = [];

    const ultraCodeValido =
      user.ultra_code !== null &&
      user.ultra_code !== undefined &&
      String(user.ultra_code).trim() !== "";

    const companyValida =
      typeof user.company === "string" && user.company.trim() !== "";

    if (!ultraCodeValido) missingFields.push("ultra_code");
    if (!companyValida) missingFields.push("company");

    if (missingFields.length === 2) {
      return { isValid: false, errorType: "no-access", missingFields };
    }

    if (missingFields.length > 0) {
      return { isValid: false, errorType: "incomplete", missingFields };
    }

    return { isValid: true, errorType: null, missingFields: [] };
  }, [user]);
}
