import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Typography,
  Divider,
  FormHelperText,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import * as yup from "yup";
import { sileo } from "sileo";
import { SILEO_STATE_FILL } from "@/shared/components/SnackbarsPosition/SnackbarContext";
import { DirectusPosition, DirectusTienda } from "../../types";
import { checkAdvisorIdExists, obtenerCargos, obtenerTodasLasTiendas } from "../../api/directus/read";
import { crearAsesor } from "../../api/directus/create";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AZUL_ACCENT = "#004680";

const initialFormState = {
  id: "",
  position_id: 0,
  store_id: 0,
  name: "",
  document: "",
};

export const CreateAdvisorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cargos, setCargos] = useState<DirectusPosition[]>([]);
  const [tiendas, setTiendas] = useState<DirectusTienda[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [validatingId, setValidatingId] = useState(false);

  // Esquema de validación Yup
  const schema = yup.object().shape({
    id: yup
      .string()
      .trim()
      .required("El ID es obligatorio")
      .matches(/^\d{4}$/, "El ID debe ser un número de 4 cifras")
      .test("check-dup-id", "El ID del asesor ya existe", async (val) => {
        if (!val || !/^\d{4}$/.test(val)) return true;
        setValidatingId(true);
        try {
          const exists = await checkAdvisorIdExists(Number(val));
          return !exists;
        } finally {
          setValidatingId(false);
        }
      }),
    position_id: yup
      .number()
      .moreThan(0, "Selecciona un cargo")
      .required("Selecciona un cargo"),
    store_id: yup
      .number()
      .moreThan(0, "Selecciona una tienda")
      .required("Selecciona una tienda"),
    name: yup
      .string()
      .trim()
      .required("El nombre completo es obligatorio"),
    document: yup
      .string()
      .trim()
      .required("El número de documento es obligatorio"),
  });

  // Cargar cargos y tiendas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setErrors({});
      setLoadingOptions(true);

      Promise.all([obtenerCargos(), obtenerTodasLasTiendas()])
        .then(([cargosData, tiendasData]) => {
          setCargos(cargosData || []);
          setTiendas(tiendasData || []);
        })
        .catch((err) => {
          console.error("Error al cargar cargos o tiendas:", err);
        })
        .finally(() => {
          setLoadingOptions(false);
        });
    }
  }, [isOpen]);

  const setCampo = (campo: string, valor: any) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errors[campo]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[campo];
        return copy;
      });
    }
  };

  const handleBlurId = async () => {
    const val = form.id.trim();
    if (!val) return;
    if (!/^\d{4}$/.test(val)) {
      setErrors((prev) => ({ ...prev, id: "El ID debe ser un número de 4 cifras" }));
      return;
    }

    setValidatingId(true);
    try {
      const exists = await checkAdvisorIdExists(Number(val));
      if (exists) {
        setErrors((prev) => ({ ...prev, id: "El ID del asesor ya existe" }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.id;
          return copy;
        });
      }
    } catch (e) {
      console.error("Error validando ID:", e);
    } finally {
      setValidatingId(false);
    }
  };

  const handleGuardar = async () => {
    setErrors({});
    const nuevosErrores: Record<string, string> = {};

    try {
      await schema.validate(form, { abortEarly: false });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((i) => {
          if (i.path) nuevosErrores[i.path] = i.message;
        });
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrors(nuevosErrores);
      return;
    }

    setGuardando(true);
    onClose();

    sileo.promise(
      (async () => {
        await crearAsesor({
          id: Number(form.id),
          position_id: Number(form.position_id),
          store_id: Number(form.store_id),
          name: form.name.trim(),
          document: form.document.trim(),
        });

        if (onSuccess) {
          await onSuccess();
        }
      })(),
      {
        loading: {
          title: "Creando asesor…",
          fill: SILEO_STATE_FILL.loading,
        },
        success: {
          title: "Asesor creado correctamente",
          description: `El asesor ${form.name} (ID: ${form.id}) ha sido registrado.`,
          duration: 5000,
          fill: SILEO_STATE_FILL.success,
        },
        error: {
          title: "Error al crear el asesor",
          fill: SILEO_STATE_FILL.error,
          duration: 5000,
        },
      }
    ).finally(() => {
      setGuardando(false);
    });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={guardando ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3, overflow: "hidden" },
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: AZUL_ACCENT,
          color: "#fff",
          py: 2,
          px: 3,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PersonAddIcon />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            Crear Asesor
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={guardando}
          sx={{ color: "#fff" }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loadingOptions ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="ID (4 cifras) *"
                placeholder="Ej: 2819"
                value={form.id}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCampo("id", val);
                }}
                onBlur={handleBlurId}
                error={Boolean(errors.id)}
                helperText={
                  errors.id ||
                  (validatingId
                    ? "Verificando disponibilidad de ID..."
                    : "Código numérico de 4 cifras único.")
                }
                slotProps={{
                  input: {
                    endAdornment: validatingId ? (
                      <CircularProgress size={18} />
                    ) : undefined,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Número de Documento *"
                placeholder="Ej: 1006171088"
                value={form.document}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCampo("document", val);
                }}
                error={Boolean(errors.document)}
                helperText={errors.document}
              />
            </Box>

            <TextField
              fullWidth
              label="Nombre Completo *"
              placeholder="Ej: Viviana Calero Guerrero"
              value={form.name}
              onChange={(e) => setCampo("name", e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />

            <Divider textAlign="left">
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                ASIGNACIÓN
              </Typography>
            </Divider>

            <FormControl fullWidth error={Boolean(errors.position_id)}>
              <InputLabel id="cargo-select-label">Cargo (Position) *</InputLabel>
              <Select
                labelId="cargo-select-label"
                label="Cargo (Position) *"
                value={form.position_id === 0 ? "" : form.position_id}
                onChange={(e) => setCampo("position_id", Number(e.target.value))}
              >
                <MenuItem value="" disabled>
                  Selecciona un cargo…
                </MenuItem>
                {cargos.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.position_id && (
                <FormHelperText>{errors.position_id}</FormHelperText>
              )}
            </FormControl>

            <Autocomplete
              options={tiendas}
              getOptionLabel={(o) => o.name}
              value={tiendas.find((t) => t.id === form.store_id) ?? null}
              onChange={(_, v) => setCampo("store_id", v ? v.id : 0)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tienda (Store) *"
                  placeholder="Buscar tienda…"
                  error={Boolean(errors.store_id)}
                  helperText={errors.store_id}
                />
              )}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={guardando}
          sx={{
            color: "#475569",
            borderColor: "#cbd5e1",
            "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disableElevation
          disabled={guardando || loadingOptions || validatingId}
          startIcon={
            guardando ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : undefined
          }
          sx={{
            bgcolor: AZUL_ACCENT,
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { bgcolor: "#003663" },
          }}
        >
          {guardando ? "Guardando…" : "Crear Asesor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
