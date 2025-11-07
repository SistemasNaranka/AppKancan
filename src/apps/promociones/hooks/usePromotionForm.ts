import { useState, useCallback, useMemo } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { PromotionDuration } from "../types/promotion";

export interface IPromotionFormState {
  tipoId: number | null;
  nombre: string;
  duracion: PromotionDuration;
  fechaInicio: Dayjs | null;
  fechaFinal: Dayjs | null;
  horaInicio: Dayjs | null;
  horaFinal: Dayjs | null;
  descuento: number;
  tiendasSeleccionadas: (string | number)[];
}

export const usePromotionForm = () => {
  const [formState, setFormState] = useState<IPromotionFormState>({
    tipoId: null,
    nombre: "",
    duracion: "temporal",
    fechaInicio: null,
    fechaFinal: null,
    horaInicio: null,
    horaFinal: null,
    descuento: 10,
    tiendasSeleccionadas: [],
  });

  const [error, setError] = useState<string>("");

  const updateField = useCallback(
    <K extends keyof IPromotionFormState>(
      field: K,
      value: IPromotionFormState[K]
    ) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDuracionChange = useCallback((isTemporal: boolean) => {
    const newDuracion = isTemporal ? "temporal" : "fija";
    setFormState((prev) => ({
      ...prev,
      duracion: newDuracion,
      ...(isTemporal ? {} : { fechaFinal: null, horaFinal: null }),
    }));
  }, []);

  const validateForm = useCallback((): string | null => {
    const {
      tipoId,
      nombre,
      fechaInicio,
      horaInicio,
      fechaFinal,
      horaFinal,
      descuento,
      tiendasSeleccionadas,
      duracion,
    } = formState;

    if (!tipoId) return "Por favor selecciona un tipo de promoción";
    if (!nombre.trim()) return "Por favor ingresa un nombre para la promoción";
    if (!fechaInicio) return "Por favor selecciona una fecha de inicio";
    if (!horaInicio) return "Por favor selecciona una hora de inicio";
    if (nombre.trim().length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }

    if (duracion === "temporal") {
      if (!fechaFinal)
        return "Las promociones temporales requieren fecha final";
      if (!horaFinal) return "Las promociones temporales requieren hora final";

      const datetimeInicio = fechaInicio
        .clone()
        .hour(horaInicio.hour())
        .minute(horaInicio.minute());
      const datetimeFinal = fechaFinal
        .clone()
        .hour(horaFinal.hour())
        .minute(horaFinal.minute());

      if (
        datetimeFinal.isBefore(datetimeInicio) ||
        datetimeFinal.isSame(datetimeInicio)
      ) {
        return "La fecha/hora final debe ser posterior a la fecha/hora de inicio";
      }
    }

    const ahora = dayjs();
    const datetimeInicio = fechaInicio
      .clone()
      .hour(horaInicio.hour())
      .minute(horaInicio.minute());

    if (duracion === "temporal" && fechaFinal && horaFinal) {
      const datetimeFinal = fechaFinal
        .clone()
        .hour(horaFinal.hour())
        .minute(horaFinal.minute());

      if (datetimeFinal.isBefore(ahora)) {
        return "La fecha final no puede ser anterior a la fecha actual";
      }
    }
    if (descuento < 1 || descuento > 100) {
      return "El descuento debe estar entre 1% y 100%";
    }

    if (tiendasSeleccionadas.length === 0) {
      return "Por favor selecciona al menos una tienda";
    }

    return null;
  }, [formState]);

  const getFormattedData = useCallback(() => {
    const { fechaInicio, horaInicio, fechaFinal, horaFinal, duracion } =
      formState;
    return {
      fecha_inicio: fechaInicio?.format("YYYY-MM-DD") || "",
      hora_inicio: horaInicio?.format("HH:mm") || "",
      fecha_final:
        duracion === "temporal" ? fechaFinal?.format("YYYY-MM-DD") : null,
      hora_fin: duracion === "temporal" ? horaFinal?.format("HH:mm") : null,
    };
  }, [formState]);

  return {
    formState,
    error,
    setError,
    updateField,
    handleDuracionChange,
    validateForm,
    getFormattedData,
  };
};
