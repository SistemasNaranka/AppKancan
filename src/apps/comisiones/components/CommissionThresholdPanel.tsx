import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  styled,
  Divider,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  Save,
  Percent,
  Close,
  CalendarMonth,
  SettingsSuggest,
  AddCircleOutline,
  DeleteOutline,
  InfoOutlined,
  TrendingUp,
} from "@mui/icons-material";
import {
  obtenerUmbralesComisiones,
  CommissionThresholdConfigWithId,
} from "../api/directus/read";
import { guardarUmbralesComisiones } from "../api/directus/create";
import { CommissionThreshold } from "../types";

// Estilo corregido para ocultar las flechas del input numérico
const StyledTextField = styled(TextField)({
  "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
});

interface CommissionThresholdPanelProps {
  open: boolean;
  onClose: () => void;
  initialMonth?: string;
  onThresholdSaved?: () => void;
}

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

interface ThresholdRow {
  id: string; // ID temporal para UI, no se guarda en BD
  cumplimiento_min: string;
  comision_pct: string;
  nombre: string;
}

export const CommissionThresholdPanel: React.FC<
  CommissionThresholdPanelProps
> = ({ open, onClose, initialMonth, onThresholdSaved }) => {
  const now = new Date();

  const parseInitialDate = (input?: string) => {
    if (!input)
      return {
        mes: (now.getMonth() + 1).toString().padStart(2, "0"),
        anio: now.getFullYear().toString(),
      };
    if (input.includes("-")) {
      const [y, m] = input.split("-");
      return { mes: m.padStart(2, "0"), anio: y };
    }
    return {
      mes: (now.getMonth() + 1).toString().padStart(2, "0"),
      anio: now.getFullYear().toString(),
    };
  };

  const initialDate = parseInitialDate(initialMonth);

  const [selectedMonth, setSelectedMonth] = useState(initialDate.mes);
  const [selectedYear, setSelectedYear] = useState(initialDate.anio);

  const createEmptyRow = useCallback(
    (idPrefix: string = "row"): ThresholdRow => ({
      id: `${idPrefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      cumplimiento_min: "",
      comision_pct: "",
      nombre: "",
    }),
    []
  );

  // Valores por defecto
  const createDefaultRows = (): ThresholdRow[] => [
    {
      ...createEmptyRow("d1"),
      cumplimiento_min: "90",
      comision_pct: "0.35",
      nombre: "Muy Regular",
    },
    {
      ...createEmptyRow("d2"),
      cumplimiento_min: "95",
      comision_pct: "0.50",
      nombre: "Regular",
    },
    {
      ...createEmptyRow("d3"),
      cumplimiento_min: "100",
      comision_pct: "0.70",
      nombre: "Buena",
    },
    {
      ...createEmptyRow("d4"),
      cumplimiento_min: "110",
      comision_pct: "1.00",
      nombre: "Excelente",
    },
  ];

  const [thresholdRows, setThresholdRows] = useState<ThresholdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentRecordId, setCurrentRecordId] = useState<
    number | string | undefined
  >(undefined);

  // Flag para controlar si ya se cargaron los datos
  const dataLoadedRef = useRef(false);

  // Inicialización al abrir el modal
  useEffect(() => {
    if (open && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadExistingConfigs();
    }
  }, [open]);

  // Resetear flag cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      dataLoadedRef.current = false;
      setThresholdRows([]);
      setError("");
      setSuccess("");
    }
  }, [open]);

  // Actualizar mes/año cuando cambia initialMonth con el modal abierto
  useEffect(() => {
    if (initialMonth && open) {
      const d = parseInitialDate(initialMonth);
      setSelectedMonth(d.mes);
      setSelectedYear(d.anio);
    }
  }, [initialMonth, open]);

  const loadExistingConfigs = useCallback(async () => {
    if (!open || !selectedMonth || !selectedYear) return;

    try {
      setLoadingData(true);
      setCurrentRecordId(undefined);
      const mesNombre =
        MESES.find((m) => m.value === selectedMonth)?.label.substring(0, 3) ||
        "Ene";
      const data = await obtenerUmbralesComisiones(
        `${mesNombre} ${selectedYear}`
      );

      if (
        data &&
        data.cumplimiento_valores &&
        data.cumplimiento_valores.length > 0
      ) {
        // Usar el ID del registro directamente
        setCurrentRecordId(data.id);

        const rows: ThresholdRow[] = data.cumplimiento_valores.map(
          (t, index) => ({
            id: `row-${index}-${Date.now()}`,
            cumplimiento_min: t.cumplimiento_min.toString(),
            comision_pct: (t.comision_pct * 100).toString(), // Convertir de decimal a porcentaje para mostrar
            nombre: t.nombre || "",
          })
        );
        setThresholdRows(rows);
      } else {
        setThresholdRows(createDefaultRows());
      }
    } catch (err) {
      setThresholdRows(createDefaultRows());
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open, createDefaultRows]);

  const handleAddRow = () => {
    setThresholdRows([...thresholdRows, createEmptyRow("added")]);
  };

  const handleRemoveRow = (id: string) => {
    const newRows = thresholdRows.filter((row) => row.id !== id);
    setThresholdRows(newRows);
  };

  const handleRowChange = (
    id: string,
    field: keyof ThresholdRow,
    value: string
  ) => {
    setThresholdRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
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
      (r) => r.cumplimiento_min.trim() !== "" && r.comision_pct.trim() !== ""
    );

    if (validRows.length === 0) {
      setError("Debe configurar al menos un umbral.");
      return;
    }

    // Validar que no haya duplicados en cumplimiento_min
    const cumplimientoValues = validRows.map((r) =>
      parseFloat(r.cumplimiento_min)
    );
    const uniqueValues = new Set(cumplimientoValues);
    if (uniqueValues.size !== cumplimientoValues.length) {
      setError("No pueden haber valores duplicados de cumplimiento mínimo.");
      return;
    }

    // Validar rangos
    for (const row of validRows) {
      const cumplimiento = parseFloat(row.cumplimiento_min);
      const comision = parseFloat(row.comision_pct);

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

      // Convertir porcentaje a decimal (0.35 -> 0.0035)
      const valores: CommissionThreshold[] = validRows.map((r) => ({
        cumplimiento_min: parseFloat(r.cumplimiento_min),
        comision_pct: parseFloat(r.comision_pct) / 100,
        nombre: r.nombre.trim() || "",
      }));

      await guardarUmbralesComisiones({
        id: currentRecordId,
        mes: `${selectedYear}-${selectedMonth}`,
        cumplimiento_valores: valores,
      });

      setSuccess("Configuración de umbrales guardada exitosamente.");

      // Recargar datos
      await loadExistingConfigs();

      // Notificar al componente padre para recargar cálculos
      onThresholdSaved?.();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, boxShadow: 24 } }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#004b8d",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2.5,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TrendingUp sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
              Configuración de Umbrales de Comisión
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Definir niveles de cumplimiento y sus comisiones
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              variant="filled"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {success}
            </Alert>
          )}
        </Box>

        <Grid container spacing={3} sx={{ mb: 4, mt: 5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Mes de Aplicación"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              SelectProps={{ native: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" />
                  </InputAdornment>
                ),
                sx: { fontSize: "1rem" },
              }}
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Año"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              InputProps={{
                sx: { fontSize: "1rem" },
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight="700"
          >
            Niveles de Cumplimiento
          </Typography>
        </Divider>

        {loadingData ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
              gap: 2,
            }}
          >
            <CircularProgress size={32} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              Cargando información...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {thresholdRows.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <Typography variant="body1" gutterBottom>
                  No hay umbrales configurados
                </Typography>
                <Typography variant="body2">
                  Agrega al menos un umbral para guardar la configuración
                </Typography>
              </Box>
            ) : (
              thresholdRows.map((row) => (
                <Grid container spacing={2} key={row.id} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <StyledTextField
                      fullWidth
                      size="small"
                      label="Cumplimiento Mínimo (%)"
                      type="number"
                      value={row.cumplimiento_min}
                      onChange={(e) =>
                        handleRowChange(
                          row.id,
                          "cumplimiento_min",
                          e.target.value
                        )
                      }
                      InputProps={{
                        sx: { fontWeight: "600", fontSize: "1rem" },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <StyledTextField
                      fullWidth
                      size="small"
                      label="Comisión (%)"
                      type="number"
                      value={row.comision_pct}
                      onChange={(e) =>
                        handleRowChange(row.id, "comision_pct", e.target.value)
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Percent sx={{ fontSize: 16 }} />
                          </InputAdornment>
                        ),
                        sx: { fontWeight: "600", fontSize: "1rem" },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <StyledTextField
                      fullWidth
                      size="small"
                      label="Nombre"
                      value={row.nombre}
                      onChange={(e) =>
                        handleRowChange(row.id, "nombre", e.target.value)
                      }
                      placeholder="Ej: Muy Regular, Regular, Buena..."
                      InputProps={{
                        sx: { fontSize: "1rem" },
                      }}
                    />
                  </Grid>
                  <Grid
                    size={{ xs: 12, sm: 1 }}
                    sx={{ display: "flex", justifyContent: "center" }}
                  >
                    <Tooltip title="Eliminar este umbral">
                      <IconButton
                        onClick={() => handleRemoveRow(row.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))
            )}

            <Button
              startIcon={<AddCircleOutline />}
              onClick={handleAddRow}
              sx={{
                alignSelf: "flex-start",
                mt: 1,
                textTransform: "none",
                fontWeight: "700",
                color: "#004b8d",
                fontSize: "0.95rem",
              }}
              disabled={loading}
            >
              Agregar otro umbral
            </Button>
          </Box>
        )}
      </DialogContent>

      <Box
        sx={{
          p: 4,
          pt: 0,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "text.secondary",
          px: 4,
        }}
      >
        <InfoOutlined fontSize="small" />
        <Typography variant="caption" sx={{ fontSize: "0.9rem" }}>
          Los umbrales se aplican en orden descendente. El primer umbral cuyo
          cumplimiento mínimo sea menor o igual al cumplimiento del empleado
          será el utilizado para calcular su comisión.
        </Typography>
      </Box>

      <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          sx={{ textTransform: "none", fontWeight: "600", fontSize: "1.1rem" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingData || thresholdRows.length === 0}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : <Save />
          }
          sx={{
            bgcolor: "#004b8d",
            textTransform: "none",
            px: 5,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            boxShadow: 4,
            fontSize: "1.1rem",
          }}
        >
          {loading ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
