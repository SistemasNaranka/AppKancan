import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem } from "@directus/sdk";

export interface Normas {
  id: number;
  version: number;
  title: string;
  content: string;
}

// Normas vigentes (la fila activa de com_rules con la mayor versión).
export async function getNormasActivas(): Promise<Normas | null> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_rules", {
          fields: ["id", "version", "title", "content"],
          filter: { is_active: { _eq: true } },
          sort: ["-version"],
          limit: 1,
        })
      )
    );
    return ((items || [])[0] as Normas) ?? null;
  } catch (error) {
    console.error("❌ Error cargando las normas:", error);
    return null;
  }
}

// ¿El usuario ya aceptó esta versión de las normas?
// employee_id es la relación (M2O) al usuario logueado.
export async function yaAceptoNormas(userId: string, version: number): Promise<boolean> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_rules_acceptance", {
          fields: ["id"],
          filter: { _and: [{ employee_id: { _eq: userId } }, { version: { _eq: version } }] },
          limit: 1,
        })
      )
    );
    return (items || []).length > 0;
  } catch (error) {
    console.error("❌ Error verificando aceptación de normas:", error);
    // Ante error de lectura, no forzamos el modal repetidamente.
    return true;
  }
}

export async function registrarAceptacionNormas(userId: string, version: number) {
  return await withAutoRefresh(() =>
    directus.request(
      createItem("com_rules_acceptance", {
        employee_id: userId,
        version,
        // date_created lo asigna Directus automáticamente.
      })
    )
  );
}

export async function yaAceptoNormasEmpleado(employeeId: number, ruleId: number, version?: number): Promise<boolean> {
  try {
    const filter: any = {
      _and: [
        { employee_id: { _eq: employeeId } },
        {
          _or: [
            { rule_id: { _eq: ruleId } },
            ...(version != null ? [{ version: { _eq: version } }] : []),
          ]
        }
      ]
    };
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("com_rules_acceptance", {
          fields: ["id"],
          filter,
          limit: 1,
        })
      )
    );
    return (items || []).length > 0;
  } catch (error) {
    console.error("❌ Error verificando aceptación de normas del empleado:", error);
    // En caso de error (permisos, campo inexistente, etc.) asumimos que ya aceptó
    // para no mostrar el botón innecesariamente a todos los colaboradores.
    return true;
  }
}

export async function registrarAceptacionNormasEmpleado(employeeId: number, version: number, ruleId: number) {
  try {
    return await withAutoRefresh(() =>
      directus.request(
        createItem("com_rules_acceptance", {
          employee_id: employeeId,
          version,
          rule_id: ruleId
        })
      )
    );
  } catch (error: any) {
    console.error("❌ Error registrando aceptación de normas del empleado:", error);
    throw new Error(error?.errors?.[0]?.message || 'Error al guardar aceptación de normas');
  }
}
