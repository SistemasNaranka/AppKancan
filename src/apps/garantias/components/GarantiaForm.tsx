import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import type { Garantia as DirectusGarantia, CreateGarantia, UpdateGarantia } from "../types/types";

// Opciones de tipo de garantía
const TIPO_GARANTIA_OPTIONS = [
  { value: "fabricante",  label: "Garantía de Fabricante" },
  { value: "comercial",   label: "Garantía Comercial" },
  { value: "extendida",   label: "Garantía Extendida" },
  { value: "otro",        label: "Otro" },
];

// Opciones de estado
const GARANTIA_STATUS_OPTIONS = [
  { value: "pendiente",   label: "Pendiente" },
  { value: "en_revision", label: "En Revisión" },
  { value: "aprobada",    label: "Aprobada" },
  { value: "rechazada",   label: "Rechazada" },
  { value: "completada",  label: "Completada" },
];

interface GarantiaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGarantia | UpdateGarantia) => void;
  garantia?: DirectusGarantia | null;
  isLoading?: boolean;
  mode: "create" | "edit";
}

// Valores iniciales del formulario
const initialFormData: CreateGarantia = {
  // Cliente
  cliente_nombre: "",
  cliente_documento: "",
  cliente_telefono: "",
  cliente_email: "",
  cliente_direccion: "",
  // Producto
  producto_nombre: "",
  producto_referencia: "",
  producto_sku: "",
  // Compra
  numero_factura: "",
  fecha_compra: "",
  valor_compra: 0,
  // Garantía
  tipo_garantia: "fabricante",
  descripcion_problema: "",
  fecha_solicitud: new Date().toISOString().split("T")[0],
  fecha_vence_garantia: "",   // ← siempre string, nunca undefined
  // Estado inicial
  estado: "pendiente",
  nota_interna: "",           // ← siempre string, nunca undefined
  resolucion: "",             // ← siempre string, nunca undefined
};

export const GarantiaForm: React.FC<GarantiaFormProps> = ({
  open,
  onClose,
  onSubmit,
  garantia,
  isLoading = false,
  mode,
}) => {
  const [formData, setFormData] = useState<CreateGarantia | UpdateGarantia>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos cuando se abre para edición
  useEffect(() => {
    if (mode === "edit" && garantia) {
      setFormData({
        cliente_nombre: garantia.cliente_nombre,
        cliente_documento: garantia.cliente_documento,
        cliente_telefono: garantia.cliente_telefono,
        cliente_email: garantia.cliente_email || "",
        cliente_direccion: garantia.cliente_direccion || "",
        producto_nombre: garantia.producto_nombre,
        producto_referencia: garantia.producto_referencia,
        producto_sku: garantia.producto_sku || "",
        numero_factura: garantia.numero_factura || "",
        fecha_compra: garantia.fecha_compra || "",
        valor_compra: garantia.valor_compra || 0,
        tipo_garantia: garantia.tipo_garantia,
        descripcion_problema: garantia.descripcion_problema,
        fecha_solicitud: garantia.fecha_solicitud,
        fecha_vence_garantia: garantia.fecha_vence_garantia || "",
        estado: garantia.estado,
        nota_interna: garantia.nota_interna || "",
        resolucion: garantia.resolucion || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [mode, garantia, open]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones requeridas
    if (!formData.cliente_nombre?.trim()) {
      newErrors.cliente_nombre = "El nombre del cliente es requerido";
    }
    if (!formData.cliente_documento?.trim()) {
      newErrors.cliente_documento = "El documento es requerido";
    }
    if (!formData.cliente_telefono?.trim()) {
      newErrors.cliente_telefono = "El teléfono es requerido";
    }
    if (!formData.producto_nombre?.trim()) {
      newErrors.producto_nombre = "El nombre del producto es requerido";
    }
    if (!formData.producto_referencia?.trim()) {
      newErrors.producto_referencia = "La referencia del producto es requerida";
    }
    if (!formData.descripcion_problema?.trim()) {
      newErrors.descripcion_problema = "La descripción del problema es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {mode === "create" ? "Nueva Garantía" : "Editar Garantía"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === "create"
              ? "Complete el formulario para registrar una nueva garantía"
              : "Actualice la información de la garantía"}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Sección: Información del Cliente */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Información del Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre del Cliente"
                name="cliente_nombre"
                value={formData.cliente_nombre}
                onChange={handleTextChange}
                error={!!errors.cliente_nombre}
                helperText={errors.cliente_nombre}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Documento"
                name="cliente_documento"
                value={formData.cliente_documento}
                onChange={handleTextChange}
                error={!!errors.cliente_documento}
                helperText={errors.cliente_documento}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                name="cliente_telefono"
                value={formData.cliente_telefono}
                onChange={handleTextChange}
                error={!!errors.cliente_telefono}
                helperText={errors.cliente_telefono}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="cliente_email"
                type="email"
                value={formData.cliente_email}
                onChange={handleTextChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dirección"
                name="cliente_direccion"
                value={formData.cliente_direccion}
                onChange={handleTextChange}
              />
            </Grid>

            {/* Sección: Información del Producto */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Información del Producto
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="producto_nombre"
                value={formData.producto_nombre}
                onChange={handleTextChange}
                error={!!errors.producto_nombre}
                helperText={errors.producto_nombre}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Referencia"
                name="producto_referencia"
                value={formData.producto_referencia}
                onChange={handleTextChange}
                error={!!errors.producto_referencia}
                helperText={errors.producto_referencia}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="SKU"
                name="producto_sku"
                value={formData.producto_sku}
                onChange={handleTextChange}
              />
            </Grid>

            {/* Sección: Información de la Compra */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Información de la Compra
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de Factura"
                name="numero_factura"
                value={formData.numero_factura}
                onChange={handleTextChange}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Fecha de Compra"
                name="fecha_compra"
                type="date"
                value={formData.fecha_compra}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Valor de Compra"
                name="valor_compra"
                type="number"
                value={formData.valor_compra}
                onChange={handleTextChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Sección: Detalles de la Garantía */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Detalles de la Garantía
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Garantía</InputLabel>
                <Select
                  name="tipo_garantia"
                  value={formData.tipo_garantia}
                  label="Tipo de Garantía"
                  onChange={handleSelectChange}
                >
                  {TIPO_GARANTIA_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Solicitud"
                name="fecha_solicitud"
                type="date"
                value={formData.fecha_solicitud}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fecha Vencimiento Garantía"
                name="fecha_vence_garantia"
                type="date"
                value={formData.fecha_vence_garantia ?? ""}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {mode === "edit" && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formData.estado}
                    label="Estado"
                    onChange={handleSelectChange}
                  >
                    {GARANTIA_STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción del Problema"
                name="descripcion_problema"
                value={formData.descripcion_problema}
                onChange={handleTextChange}
                error={!!errors.descripcion_problema}
                helperText={errors.descripcion_problema}
                required
                multiline
                rows={3}
              />
            </Grid>

            {mode === "edit" && (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nota Interna"
                    name="nota_interna"
                    value={formData.nota_interna ?? ""}
                    onChange={handleTextChange}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Resolución"
                    name="resolucion"
                    value={formData.resolucion ?? ""}
                    onChange={handleTextChange}
                    multiline
                    rows={2}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            startIcon={<CancelIcon />}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : mode === "create" ? "Crear Garantía" : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};