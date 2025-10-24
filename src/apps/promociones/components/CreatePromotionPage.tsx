import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Stack,
  SelectChangeEvent,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Save } from "@mui/icons-material";
import CustomSelectionModal from "@/shared/components/selectionmodal/CustomSelectionModal";
import { useSelectionModal } from "@/shared/components/selectionmodal/useSelectionModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerTiendas, obtenerTiposPromocion } from "../api/directus/read";
import { crearPromocionCompleta } from "../api/directus/create";
import { PromotionDuration } from "../types/promotion";

const CreatePromotionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open, openModal, closeModal } = useSelectionModal();

  // Estados
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState<PromotionDuration>("temporal");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [descuento, setDescuento] = useState<number>(10);
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState<(string | number)[]>([]);
  const [error, setError] = useState<string>("");

  // Query para obtener los tipos de promoción desde Directus
  const { data: tiposPromocion = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ["tipos_promocion"],
    queryFn: obtenerTiposPromocion,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Query para obtener las tiendas
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["prom_tiendas"],
    queryFn: obtenerTiendas,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para crear promoción
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

  // Tipos disponibles según duración (filtrados desde Directus)
  const availablePromotionTypes = useMemo(() => {
    return tiposPromocion.filter((tipo) => tipo.duracion === duracion);
  }, [tiposPromocion, duracion]);

  // Inicializar tipo cuando se carguen los tipos o cambie la duración
  React.useEffect(() => {
    if (availablePromotionTypes.length > 0) {
      // Si el tipo actual no está en los disponibles, seleccionar el primero
      const tipoActualValido = availablePromotionTypes.find((t) => t.id === tipoId);
      if (!tipoActualValido) {
        setTipoId(availablePromotionTypes[0].id);
      }
    }
  }, [availablePromotionTypes, tipoId]);

  // Manejar cambio de duración
  const handleDuracionChange = useCallback((isTemporal: boolean) => {
    const newDuracion = isTemporal ? "temporal" : "fija";
    setDuracion(newDuracion);
    
    // Limpiar campos que no aplican para promociones fijas
    if (!isTemporal) {
      setFechaFinal("");
      setHoraFinal("");
    }
  }, []);

  // Validaciones
  const validateForm = useCallback((): string | null => {
    // Validar tipo
    if (!tipoId) {
      return "Por favor selecciona un tipo de promoción";
    }

    // Validar nombre
    if (!nombre.trim()) {
      return "Por favor ingresa un nombre para la promoción";
    }

    // Validar fecha de inicio
    if (!fechaInicio) {
      return "Por favor ingresa una fecha de inicio";
    }

    // Validar hora de inicio
    if (!horaInicio) {
      return "Por favor ingresa una hora de inicio";
    }

    // Validaciones específicas para promociones temporales
    if (duracion === "temporal") {
      if (!fechaFinal) {
        return "Las promociones temporales requieren fecha final";
      }
      
      if (!horaFinal) {
        return "Las promociones temporales requieren hora final";
      }

      // Validar que fecha final sea posterior a fecha inicio
      const inicio = new Date(`${fechaInicio}T${horaInicio}`);
      const final = new Date(`${fechaFinal}T${horaFinal}`);

      if (final <= inicio) {
        return "La fecha/hora final debe ser posterior a la fecha/hora de inicio";
      }
    }

    // Validar que fecha de inicio no sea en el pasado
    const ahora = new Date();
    const fechaInicioDate = new Date(`${fechaInicio}T${horaInicio}`);
    
    if (fechaInicioDate < ahora) {
      return "La fecha de inicio no puede ser anterior a la fecha actual";
    }

    // Validar descuento
    if (descuento < 1 || descuento > 100) {
      return "El descuento debe estar entre 1% y 100%";
    }

    // Validar tiendas
    if (tiendasSeleccionadas.length === 0) {
      return "Por favor selecciona al menos una tienda";
    }

    return null;
  }, [tipoId, nombre, fechaInicio, fechaFinal, horaInicio, horaFinal, descuento, tiendasSeleccionadas, duracion]);

  // Manejar submit
  const handleSubmit = useCallback(async () => {
    setError("");

    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Preparar datos para Directus
      const promocionData = {
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        fecha_final: duracion === "temporal" ? fechaFinal : null,
        hora_inicio: horaInicio,
        hora_fin: duracion === "temporal" ? horaFinal : null,
        descuento: descuento,
        tipo_id: tipoId!,
      };

      // Crear promoción
      await createPromoMutation.mutateAsync({
        promocionData,
        tiendasIds: tiendasSeleccionadas,
      });
    } catch (err) {
      console.error("Error en submit:", err);
    }
  }, [nombre, fechaInicio, fechaFinal, horaInicio, horaFinal, descuento, tipoId, tiendasSeleccionadas, duracion, validateForm, createPromoMutation]);

  const handleCancel = useCallback(() => {
    navigate("/promociones");
  }, [navigate]);

  // Adaptar tiendas para el modal
  const storeItems = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        label: s.nombre,
        description: s.empresa || "",
      })),
    [stores]
  );

  // Obtener nombres de tiendas seleccionadas
  const selectedStoreNames = useMemo(() => {
    return stores
      .filter((s) => tiendasSeleccionadas.includes(s.id))
      .map((s) => s.nombre);
  }, [stores, tiendasSeleccionadas]);

  // Obtener el tipo seleccionado
  const tipoSeleccionado = tiposPromocion.find((t) => t.id === tipoId);

  const isLoading = isLoadingTipos || isLoadingStores;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Crear Nueva Promoción
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} mt={3}>
            {/* Duración (arriba para definir el flujo) */}
            <FormControlLabel
              control={
                <Switch
                  checked={duracion === "temporal"}
                  onChange={(e) => handleDuracionChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography fontWeight={500}>
                  {duracion === "temporal" ? "Promoción Temporal" : "Promoción Fija"}
                </Typography>
              }
            />

            {/* Tipo - Dinámico desde Directus */}
            <FormControl fullWidth>
              <InputLabel>Tipo de Promoción</InputLabel>
              <Select
                value={tipoId || ""}
                label="Tipo de Promoción"
                onChange={(e: SelectChangeEvent<number>) =>
                  setTipoId(Number(e.target.value))
                }
              >
                {availablePromotionTypes.length === 0 ? (
                  <MenuItem disabled>
                    No hay tipos disponibles para {duracion === "temporal" ? "promociones temporales" : "promociones fijas"}
                  </MenuItem>
                ) : (
                  availablePromotionTypes.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            bgcolor: tipo.color || "#cccccc",
                          }}
                        />
                        {tipo.nombre}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Nombre */}
            <TextField
              fullWidth
              label="Nombre de la Promoción"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Ej: Promoción ${tipoSeleccionado?.nombre || ""} 2025`}
              required
            />

            {/* Fechas */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                helperText="Fecha cuando inicia la promoción"
              />
              <TextField
                fullWidth
                label="Fecha Final"
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={duracion === "fija"}
                required={duracion === "temporal"}
                helperText={
                  duracion === "fija"
                    ? "No aplica para promociones fijas"
                    : "Fecha cuando termina la promoción"
                }
              />
            </Box>

            {/* Horas */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                fullWidth
                label="Hora de Inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                helperText="Hora cuando inicia la promoción"
              />
              <TextField
                fullWidth
                label="Hora Final"
                type="time"
                value={horaFinal}
                onChange={(e) => setHoraFinal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={duracion === "fija"}
                required={duracion === "temporal"}
                helperText={
                  duracion === "fija"
                    ? "No aplica para promociones fijas"
                    : "Hora cuando termina la promoción"
                }
              />
            </Box>

            {/* Descuento */}
            <TextField
              fullWidth
              label="Descuento (%)"
              type="number"
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
              required
              helperText="Porcentaje de descuento (1-100)"
            />

            {/* Tiendas */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Tiendas Aplicables: *
              </Typography>

              <Button
                variant="outlined"
                onClick={openModal}
                disabled={isLoadingStores}
                sx={{ mb: 2 }}
              >
                {tiendasSeleccionadas.length > 0
                  ? `${tiendasSeleccionadas.length} tienda(s) seleccionada(s)`
                  : "Seleccionar tiendas"}
              </Button>

              <CustomSelectionModal
                title="Seleccionar Tiendas"
                open={open}
                onClose={closeModal}
                onConfirm={(selected) => setTiendasSeleccionadas(selected)}
                items={storeItems}
                initialSelected={tiendasSeleccionadas}
                labelKey="label"
              />

              {selectedStoreNames.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedStoreNames.map((storeName) => (
                    <Chip key={storeName} label={storeName} color="primary" size="small" />
                  ))}
                </Box>
              )}
            </Box>

            {/* Botones */}
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={createPromoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={createPromoMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSubmit}
                disabled={createPromoMutation.isPending}
              >
                {createPromoMutation.isPending ? "Guardando..." : "Guardar Promoción"}
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default CreatePromotionPage;