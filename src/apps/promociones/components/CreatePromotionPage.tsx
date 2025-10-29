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
import { ArrowBack, Save } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerTiendas, obtenerTiposPromocion } from "../api/directus/read";
import { crearPromocionCompleta } from "../api/directus/create";
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
    queryFn: obtenerTiposPromocion,
    staleTime: 1000 * 60 * 60,
  });

  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["prom_tiendas"],
    queryFn: obtenerTiendas,
    staleTime: 1000 * 60 * 10,
  });

  React.useEffect(() => {
    const availableTypes = tiposPromocion.filter(
      (tipo) => tipo.duracion === formState.duracion
    );
    if (
      availableTypes.length > 0 &&
      !availableTypes.find((t) => t.id === formState.tipoId)
    ) {
      updateField("tipoId", availableTypes[0].id);
    }
  }, [tiposPromocion, formState.duracion, formState.tipoId, updateField]);

  const createPromoMutation = useMutation({
    mutationFn: crearPromocionCompleta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promociones"] });
      navigate("/promociones");
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
        nombre: formState.nombre.trim(),
        ...formattedData,
        descuento: formState.descuento,
        tipo_id: formState.tipoId!,
      };

      await createPromoMutation.mutateAsync({
        promocionData,
        tiendasIds: formState.tiendasSeleccionadas,
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
                tipoId={formState.tipoId}
                tiposPromocion={tiposPromocion}
                nombre={formState.nombre}
                duracion={formState.duracion}
                fechaInicio={formState.fechaInicio}
                fechaFinal={formState.fechaFinal}
                horaInicio={formState.horaInicio}
                horaFinal={formState.horaFinal}
                descuento={formState.descuento}
                onTipoChange={(value) => updateField("tipoId", value)}
                onNombreChange={(value) => updateField("nombre", value)}
                onDuracionChange={handleDuracionChange}
                onFechaInicioChange={(value) =>
                  updateField("fechaInicio", value)
                }
                onFechaFinalChange={(value) => updateField("fechaFinal", value)}
                onHoraInicioChange={(value) => updateField("horaInicio", value)}
                onHoraFinalChange={(value) => updateField("horaFinal", value)}
                onDescuentoChange={(value) => updateField("descuento", value)}
              />

              <PromotionStoresSection
                stores={stores}
                tiendasSeleccionadas={formState.tiendasSeleccionadas}
                isLoadingStores={isLoadingStores}
                onStoresSelected={(selected) =>
                  updateField("tiendasSeleccionadas", selected)
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
