// Hook que maneja la pestaña "Umbrales de Cumplimiento": estado de filas, carga, validación y guardado.

import { useCallback, useEffect, useState } from "react";
import { obtenerUmbralesComisiones } from "../../api/directus/read";
import { guardarUmbralesComisiones } from "../../api/directus/create";
import type { CommissionThreshold } from "../../types";
import type { ThresholdRow } from "./configurationPanel.types";
import { MESES } from "./configurationPanel.constants";

interface UseThresholdConfigsParams {
  open: boolean;
  selectedMonth: string;
  selectedYear: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  onThresholdSaved?: () => void;
}

const createEmptyThresholdRow = (idPrefix: string = "row"): ThresholdRow => ({
  id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  min_compliance: "",
  pct_commission: "",
  name: "",
  color: "",
});

const createDefaultThresholdRows = (): ThresholdRow[] => [
  {
    ...createEmptyThresholdRow("d1"),
    min_compliance: "90",
    pct_commission: "0.0035",
    name: "Muy Regular",
    color: "pink",
  },
  {
    ...createEmptyThresholdRow("d2"),
    min_compliance: "95",
    pct_commission: "0.005",
    name: "Regular",
    color: "orange",
  },
  {
    ...createEmptyThresholdRow("d3"),
    min_compliance: "100",
    pct_commission: "0.007",
    name: "Buena",
    color: "blue",
  },
  {
    ...createEmptyThresholdRow("d4"),
    min_compliance: "110",
    pct_commission: "0.01",
    name: "Excelente",
    color: "green",
  },
];

export function useThresholdConfigs({
  open,
  selectedMonth,
  selectedYear,
  setError,
  setSuccess,
  onThresholdSaved,
}: UseThresholdConfigsParams) {
  const [thresholdRows, setThresholdRows] = useState<ThresholdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [currentThresholdRecordId, setCurrentThresholdRecordId] = useState<
    number | string | undefined
  >(undefined);

  useEffect(() => {
    if (open && thresholdRows.length === 0) {
      setThresholdRows(createDefaultThresholdRows());
    }
  }, [open, thresholdRows.length]);

  const loadExistingThresholdConfigs = useCallback(async () => {
    if (!open || !selectedMonth || !selectedYear) return;
    try {
      setLoadingData(true);
      setCurrentThresholdRecordId(undefined);
      const mesNombre =
        MESES.find((m) => m.value === selectedMonth)?.label.substring(0, 3) ||
        "Ene";
      const data = await obtenerUmbralesComisiones(
        `${mesNombre} ${selectedYear}`,
      );

      if (data && data.compliance_values && data.compliance_values.length > 0) {
        setCurrentThresholdRecordId(data.id);
        const rows: ThresholdRow[] = data.compliance_values.map((t, index) => ({
          id: `row-${index}-${Date.now()}`,
          min_compliance: t.min_compliance.toString(),
          pct_commission: t.pct_commission.toString(),
          name: t.name || "",
          color: t.color || "",
        }));
        setThresholdRows(rows);
      } else {
        setThresholdRows(createDefaultThresholdRows());
      }
    } catch (err) {
      setThresholdRows(createDefaultThresholdRows());
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open]);

  useEffect(() => {
    if (open) loadExistingThresholdConfigs();
  }, [open, selectedMonth, selectedYear, loadExistingThresholdConfigs]);

  const handleAddThresholdRow = () => {
    setThresholdRows([...thresholdRows, createEmptyThresholdRow("added")]);
  };

  const handleRemoveThresholdRow = (id: string) => {
    setThresholdRows(thresholdRows.filter((row) => row.id !== id));
  };

  const handleThresholdRowChange = (
    id: string,
    field: keyof ThresholdRow,
    value: string,
  ) => {
    setThresholdRows((prev) =>
      prev.map((row) => {
        if (row.id === id) return { ...row, [field]: value };
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

    const validRows = thresholdRows.filter(
      (r) => r.min_compliance.trim() !== "" && r.pct_commission.trim() !== "",
    );

    if (validRows.length === 0) {
      setError("Debe configurar al menos un umbral.");
      return;
    }

    const complianceValuesArr = validRows.map((r) =>
      parseFloat(r.min_compliance),
    );
    const uniqueValues = new Set(complianceValuesArr);
    if (uniqueValues.size !== complianceValuesArr.length) {
      setError("No pueden haber valores duplicados de cumplimiento mínimo.");
      return;
    }

    for (const row of validRows) {
      const cumplimiento = parseFloat(row.min_compliance);
      const comision = parseFloat(row.pct_commission);

      if (isNaN(cumplimiento) || cumplimiento < 0) {
        setError("El cumplimiento mínimo debe ser un número válido mayor a 0.");
        return;
      }

      if (isNaN(comision) || comision < 0 || comision > 100) {
        setError("El porcentaje de comisión debe estar entre 0 y 100.");
        return;
      }
    }

    try {
      setLoading(true);
      const valores: CommissionThreshold[] = validRows.map((r) => ({
        min_compliance: parseFloat(r.min_compliance),
        pct_commission: parseFloat(r.pct_commission),
        name: r.name.trim() || "",
        color: r.color?.trim() || "",
      }));

      await guardarUmbralesComisiones({
        id: currentThresholdRecordId,
        mes: `${selectedYear}-${selectedMonth}`,
        compliance_values: valores,
      });

      setSuccess("Configuración de umbrales guardada exitosamente.");
      await loadExistingThresholdConfigs();
      onThresholdSaved?.();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    thresholdRows,
    loading,
    loadingData,
    handleAddThresholdRow,
    handleRemoveThresholdRow,
    handleThresholdRowChange,
    handleSubmit,
  };
}
