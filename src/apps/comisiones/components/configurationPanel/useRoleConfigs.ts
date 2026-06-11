// Hook que maneja la pestaña "Distribución por Rol": estado de filas, carga, validación y guardado.

import { useCallback, useEffect, useState } from "react";
import {
  obtenerCargos,
  obtenerPorcentajesMensuales,
} from "../../api/directus/read";
import { saveRoleBudgetConfiguration } from "../../api/directus/create";
import type { RoleConfigRow } from "./configurationPanel.types";
import { MESES } from "./configurationPanel.constants";

interface UseRoleConfigsParams {
  open: boolean;
  selectedMonth: string;
  selectedYear: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
}

const createEmptyRoleRow = (idPrefix: string = "row"): RoleConfigRow => ({
  id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  role: "",
  calculation_type: "Fijo",
  percentage: "",
});

export function useRoleConfigs({
  open,
  selectedMonth,
  selectedYear,
  setError,
  setSuccess,
}: UseRoleConfigsParams) {
  const [roleConfigs, setRoleConfigs] = useState<RoleConfigRow[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [currentRoleRecordId, setCurrentRoleRecordId] = useState<
    number | string | undefined
  >(undefined);

  useEffect(() => {
    if (open && roleConfigs.length === 0) {
      setRoleConfigs([createEmptyRoleRow("init")]);
    }
  }, [open, roleConfigs.length]);

  useEffect(() => {
    if (!open) return;
    const fetchCargos = async () => {
      try {
        setLoadingCargos(true);
        const data = await obtenerCargos();
        setCargos(data);
      } catch (err) {
        setError("No se pudieron cargar los roles.");
      } finally {
        setLoadingCargos(false);
      }
    };
    fetchCargos();
  }, [open, setError]);

  const loadExistingRoleConfigs = useCallback(async () => {
    if (!open || !selectedMonth || !selectedYear) return;
    try {
      setLoadingData(true);
      setCurrentRoleRecordId(undefined);
      const mesNombre =
        MESES.find((m) => m.value === selectedMonth)?.label.substring(0, 3) ||
        "Ene";
      const data = await obtenerPorcentajesMensuales(
        undefined,
        `${mesNombre} ${selectedYear}`,
      );

      if (data && data.length > 0) {
        const item = data[0] as any;
        setCurrentRoleRecordId(item.id);
        if (
          item.role_config &&
          Array.isArray(item.role_config) &&
          item.role_config.length > 0
        ) {
          const configs: RoleConfigRow[] = item.role_config.map(
            (c: any, index: number) => ({
              id: `row-${index}-${Date.now()}`,
              role: c.role,
              calculation_type:
                c.calculation_type === "Distributive" ? "Distributivo" : "Fijo",
              percentage: c.percentage?.toString() || "",
            }),
          );
          setRoleConfigs(configs);
        } else {
          setRoleConfigs([createEmptyRoleRow("empty")]);
        }
      } else {
        setRoleConfigs([createEmptyRoleRow("new")]);
      }
    } catch (err) {
      setRoleConfigs([createEmptyRoleRow("err")]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open]);

  useEffect(() => {
    if (open) loadExistingRoleConfigs();
  }, [open, selectedMonth, selectedYear, loadExistingRoleConfigs]);

  const handleAddRoleRow = () => {
    setRoleConfigs([...roleConfigs, createEmptyRoleRow("added")]);
  };

  const handleRemoveRoleRow = (id: string) => {
    if (roleConfigs.length === 1) {
      setRoleConfigs([createEmptyRoleRow("reset")]);
      return;
    }
    setRoleConfigs(roleConfigs.filter((row) => row.id !== id));
  };

  const handleRoleRowChange = (
    id: string,
    field: keyof RoleConfigRow,
    value: any,
  ) => {
    setRoleConfigs((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === "calculation_type" && value === "Distributivo") {
            updated.percentage = "0";
          }
          return updated;
        }
        return row;
      }),
    );
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedMonth || !selectedYear) {
      setError("El mes y el año son obligatorios.");
      return;
    }

    const validConfigs = roleConfigs.filter((c) => c.role.trim() !== "");
    if (validConfigs.length === 0) {
      setError("Debe configurar al menos un rol.");
      return;
    }

    const roles = validConfigs.map((c) => c.role);
    if (new Set(roles).size !== roles.length) {
      setError("No se pueden repetir roles en la misma configuración.");
      return;
    }

    for (const config of validConfigs) {
      if (config.calculation_type === "Fijo") {
        const p = parseFloat(config.percentage);
        if (isNaN(p) || p < 0 || p > 100) {
          setError(
            `El porcentaje para ${config.role} debe estar entre 0 y 100.`,
          );
          return;
        }
      }
    }

    try {
      setLoading(true);
      await saveRoleBudgetConfiguration({
        id: currentRoleRecordId,
        mes: `${selectedYear}-${selectedMonth}`,
        roleConfigs: validConfigs.map((c) => ({
          role: c.role,
          calculation_type: c.calculation_type,
          percentage: parseFloat(c.percentage) || 0,
        })),
      });
      setSuccess("Configuraciones de roles guardadas exitosamente.");
      await loadExistingRoleConfigs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    roleConfigs,
    cargos,
    loading,
    loadingCargos,
    loadingData,
    handleAddRoleRow,
    handleRemoveRoleRow,
    handleRoleRowChange,
    handleSubmit,
  };
}
