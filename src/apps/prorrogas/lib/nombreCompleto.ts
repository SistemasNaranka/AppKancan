// Helper centralizado para formatear el nombre completo de un empleado a partir de los 4 campos de adm_employees.

interface NombrePartes {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
}

export function formatNombreCompleto(emp: NombrePartes | null | undefined): string {
  if (!emp) return "";
  const partes = [
    emp.first_name,
    emp.middle_name,
    emp.last_name,
    emp.second_last_name,
  ]
    .map((p) => (p ?? "").trim())
    .filter((p) => p !== "");
  return partes.join(" ");
}
