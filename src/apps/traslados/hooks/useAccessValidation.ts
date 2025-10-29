import { useMemo } from "react";

export interface AccessValidationResult {
  isValid: boolean;
  errorType: "no-access" | "incomplete" | null;
  missingFields: string[];
}

interface UserData {
  codigo_ultra?: string | number | null;
  empresa?: string | null;
}

export function useAccessValidation(
  user: UserData | null | undefined
): AccessValidationResult {
  return useMemo(() => {
    if (!user) {
      return {
        isValid: false,
        errorType: "no-access",
        missingFields: ["codigo_ultra", "empresa"],
      };
    }

    const missingFields: string[] = [];

    const codigoUltraValido =
      user.codigo_ultra !== null &&
      user.codigo_ultra !== undefined &&
      String(user.codigo_ultra).trim() !== "";

    const empresaValida =
      typeof user.empresa === "string" && user.empresa.trim() !== "";

    if (!codigoUltraValido) missingFields.push("codigo_ultra");
    if (!empresaValida) missingFields.push("empresa");

    if (missingFields.length === 2) {
      return { isValid: false, errorType: "no-access", missingFields };
    }

    if (missingFields.length > 0) {
      return { isValid: false, errorType: "incomplete", missingFields };
    }

    return { isValid: true, errorType: null, missingFields: [] };
  }, [user]);
}
