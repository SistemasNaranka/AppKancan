import { useState, useCallback } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { PromotionDuration } from "../types/promotion";

export interface IPromotionFormState {
  typeId: number | null;
  name: string;
  duration: PromotionDuration;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  discount: number;
  notes: string;
  selectedStores: (string | number)[];
}


export const usePromotionForm = () => {
  const [formState, setFormState] = useState<IPromotionFormState>({
    typeId: null,
    name: "",
    duration: "temporal",
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    discount: 10,
    notes: "",
    selectedStores: [],
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
    const newDuration = isTemporal ? "temporal" : "fija";
    setFormState((prev) => ({
      ...prev,
      duration: newDuration,
      typeId: null, // Reset typeId when changing duration
      ...(isTemporal
        ? {}
        : {
            endDate: null,
            endTime: null,
            startTime: dayjs("00:01", "HH:mm"),
          }),
    }));
  }, []);


  const validateForm = useCallback((): string | null => {
    const {
      typeId,
      name,
      startDate,
      startTime,
      endDate,
      endTime,
      discount,
      selectedStores,
      duration,
    } = formState;

    if (!typeId) return "Por favor selecciona un tipo de promoción";
    if (!name.trim()) return "Por favor ingresa un nombre para la promoción";
    if (!startDate) return "Por favor selecciona una fecha de inicio";
    if (!startTime) return "Por favor selecciona una hora de inicio";
    if (name.trim().length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }

    if (duration === "temporal") {
      if (!endDate)
        return "Las promociones temporales requieren fecha final";
      if (!endTime) return "Las promociones temporales requieren hora final";

      const datetimeInicio = startDate
        .clone()
        .hour(startTime.hour())
        .minute(startTime.minute());
      const datetimeFinal = endDate
        .clone()
        .hour(endTime.hour())
        .minute(endTime.minute());

      if (
        datetimeFinal.isBefore(datetimeInicio) ||
        datetimeFinal.isSame(datetimeInicio)
      ) {
        return "La fecha/hora final debe ser posterior a la fecha/hora de inicio";
      }
    }


    const ahora = dayjs();
    const datetimeInicio = startDate
      .clone()
      .hour(startTime.hour())
      .minute(startTime.minute());

    if (duration === "temporal" && endDate && endTime) {
      const datetimeFinal = endDate
        .clone()
        .hour(endTime.hour())
        .minute(endTime.minute());

      if (datetimeFinal.isBefore(ahora)) {
        return "La fecha final no puede ser anterior a la fecha actual";
      }
    }
    if (discount < 1 || discount > 100) {
      return "El descuento debe estar entre 1% y 100%";
    }

    if (selectedStores.length === 0) {
      return "Por favor selecciona al menos una tienda";
    }


    return null;
  }, [formState]);

  const getFormattedData = useCallback(() => {
    const { startDate, startTime, endDate, endTime, duration } =
      formState;
    return {
      start_date: startDate?.format("YYYY-MM-DD") || "",
      start_time: startTime?.format("HH:mm") || "",
      end_date:
        duration === "temporal" ? endDate?.format("YYYY-MM-DD") : null,
      end_time: duration === "temporal" ? endTime?.format("HH:mm") : null,
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
