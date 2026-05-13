import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStores, getPromotionTypes } from "../api/directus/read";
import { createCompletePromotion } from "../api/directus/create";

import { usePromotionForm } from "../hooks/usePromotionForm";
import { PromotionFormFields } from "./promotionComponents/PromotionFormFields";
import { PromotionStoresSection } from "./promotionComponents/PromotionStoresSection";

dayjs.locale("es");

const CreatePromotionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    formState,
    error,
    setError,
    updateField,
    handleDuracionChange,
    validateForm,
    getFormattedData,
  } = usePromotionForm();

  const { data: tiposPromocion = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ["tipos_promocion"],
    queryFn: getPromotionTypes,
    staleTime: 1000 * 60 * 60,
  });


  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["prom_tiendas"],
    queryFn: getStores,
    staleTime: 1000 * 60 * 10,
  });


  React.useEffect(() => {
    const availableTypes = tiposPromocion.filter(
      (tipo) => tipo.duration === formState.duration
    );
    if (
      availableTypes.length > 0 &&
      !availableTypes.find((t) => t.id === formState.typeId)
    ) {
      updateField("typeId", availableTypes[0].id);
    }
  }, [tiposPromocion, formState.duration, formState.typeId, updateField]);


  const createPromoMutation = useMutation({
    mutationFn: createCompletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promociones"] });
      navigate("/promociones", {
        state: { successMessage: "¡Promoción creada exitosamente!" },
      });
    },
    onError: (error: any) => {
      setError(error?.message || "Error al crear la promoción");
    },
  });

  const handleSubmit = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const formattedData = getFormattedData();
      const promocionData = {
        name: formState.name.trim(),
        ...formattedData,
        discount_value: formState.discount,
        type_id: formState.typeId!,
        notes: formState.notes.trim() || null,
      };

      await createPromoMutation.mutateAsync({
        promocionData,
        tiendasIds: formState.selectedStores,
      });


    } catch (err) {

      console.error("Error en submit:", err);
    }
  };

  const isLoading = isLoadingTipos || isLoadingStores;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/promociones")}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Crear Nueva Promoción
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mt: 2, mb: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <Stack spacing={3} mt={3}>
              <PromotionFormFields
                tipoId={formState.typeId}
                tiposPromocion={tiposPromocion}
                nombre={formState.name}
                duracion={formState.duration}
                fechaInicio={formState.startDate}
                fechaFinal={formState.endDate}
                horaInicio={formState.startTime}
                horaFinal={formState.endTime}
                descuento={formState.discount}
                observaciones={formState.notes}
                onTipoChange={(value) => updateField("typeId", value)}
                onNombreChange={(value) => updateField("name", value)}
                onDuracionChange={handleDuracionChange}
                onFechaInicioChange={(value) =>
                  updateField("startDate", value)
                }
                onFechaFinalChange={(value) => updateField("endDate", value)}
                onHoraInicioChange={(value) => updateField("startTime", value)}
                onHoraFinalChange={(value) => updateField("endTime", value)}
                onDescuentoChange={(value) => updateField("discount", value)}
                onObservacionesChange={(value) =>
                  updateField("notes", value)
                }

              />


              <PromotionStoresSection
                stores={stores}
                tiendasSeleccionadas={formState.selectedStores}
                isLoadingStores={isLoadingStores}
                onStoresSelected={(selected) =>
                  updateField("selectedStores", selected)
                }

              />


              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/promociones")}
                  disabled={createPromoMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    createPromoMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Save />
                    )
                  }
                  onClick={handleSubmit}
                  disabled={createPromoMutation.isPending}
                >
                  {createPromoMutation.isPending
                    ? "Guardando..."
                    : "Guardar Promoción"}
                </Button>
              </Box>
            </Stack>
          </LocalizationProvider>
        )}
      </Paper>
    </Box>
  );
};

export default CreatePromotionPage;
