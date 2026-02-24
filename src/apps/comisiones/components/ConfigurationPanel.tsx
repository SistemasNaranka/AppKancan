import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  Badge,
  SettingsSuggest,
  Event,
  AddCircleOutline,
  DeleteOutline,
  InfoOutlined,
} from "@mui/icons-material";
import {
  obtenerCargos,
  obtenerPorcentajesMensuales,
} from "../api/directus/read";
import { saveRoleBudgetConfiguration } from "../api/directus/create";

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

interface ConfigurationPanelProps {
  open: boolean;
  onClose: () => void;
  initialMonth?: string;
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

interface RoleConfigRow {
  id: string;
  rol: string;
  tipo_calculo: "Fijo" | "Distributivo";
  porcentaje: string;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  open,
  onClose,
  initialMonth,
}) => {
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
    (idPrefix: string = "row"): RoleConfigRow => ({
      id: `${idPrefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      rol: "",
      tipo_calculo: "Fijo",
      porcentaje: "",
    }),
    [],
  );

  const [roleConfigs, setRoleConfigs] = useState<RoleConfigRow[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Estado para guardar el ID del registro actual (si existe)
  const [currentRecordId, setCurrentRecordId] = useState<
    number | string | undefined
  >(undefined);

  // Inicialización de la primera fila al abrir
  useEffect(() => {
    if (open && roleConfigs.length === 0) {
      setRoleConfigs([createEmptyRow("init")]);
    }
  }, [open, roleConfigs.length, createEmptyRow]);

  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

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
      setCurrentRecordId(undefined); // Resetear ID al cambiar de mes
      const mesNombre =
        MESES.find((m) => m.value === selectedMonth)?.label.substring(0, 3) ||
        "Ene";
      const data = await obtenerPorcentajesMensuales(
        undefined,
        `${mesNombre} ${selectedYear}`,
      );

      if (data && data.length > 0) {
        const item = data[0] as any;
        setCurrentRecordId(item.id); // Guardamos el ID del registro encontrado
        if (
          item.configuracion_roles &&
          Array.isArray(item.configuracion_roles) &&
          item.configuracion_roles.length > 0
        ) {
          const configs: RoleConfigRow[] = item.configuracion_roles.map(
            (c: any, index: number) => ({
              id: `row-${index}-${Date.now()}`,
              rol: c.rol,
              tipo_calculo:
                c.tipo_calculo === "Distributivo" ? "Distributivo" : "Fijo",
              porcentaje: c.porcentaje?.toString() || "",
            }),
          );
          setRoleConfigs(configs);
        } else {
          setRoleConfigs([createEmptyRow("empty")]);
        }
      } else {
        setRoleConfigs([createEmptyRow("new")]);
      }
    } catch (err) {
      setRoleConfigs([createEmptyRow("err")]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open, createEmptyRow]);

  useEffect(() => {
    loadExistingConfigs();
  }, [loadExistingConfigs]);

  const handleAddRow = () => {
    setRoleConfigs([...roleConfigs, createEmptyRow("added")]);
  };

  const handleRemoveRow = (id: string) => {
    if (roleConfigs.length === 1) {
      setRoleConfigs([createEmptyRow("reset")]);
      return;
    }
    setRoleConfigs(roleConfigs.filter((row) => row.id !== id));
  };

  const handleRowChange = (
    id: string,
    field: keyof RoleConfigRow,
    value: any,
  ) => {
    setRoleConfigs((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === "tipo_calculo" && value === "Distributivo") {
            updated.porcentaje = "0";
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

    const validConfigs = roleConfigs.filter((c) => c.rol.trim() !== "");
    if (validConfigs.length === 0) {
      setError("Debe configurar al menos un rol.");
      return;
    }

    const roles = validConfigs.map((c) => c.rol);
    if (new Set(roles).size !== roles.length) {
      setError("No se pueden repetir roles en la misma configuración.");
      return;
    }

    for (const config of validConfigs) {
      if (config.tipo_calculo === "Fijo") {
        const p = parseFloat(config.porcentaje);
        if (isNaN(p) || p < 0 || p > 100) {
          setError(
            `El porcentaje para ${config.rol} debe estar entre 0 y 100.`,
          );
          return;
        }
      }
    }

    try {
      setLoading(true);
      await saveRoleBudgetConfiguration({
        id: currentRecordId, // Le pasamos el ID explícito para que sepa exactamente qué actualizar
        mes: `${selectedYear}-${selectedMonth}`,
        roleConfigs: validConfigs.map((c) => ({
          rol: c.rol,
          tipo_calculo: c.tipo_calculo,
          porcentaje: parseFloat(c.porcentaje) || 0,
        })),
      });
      setSuccess("Configuraciones guardadas exitosamente.");

      // Recargar datos para confirmar que se guardó y refrescar el ID si fuera nuevo
      await loadExistingConfigs();

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
          <SettingsSuggest sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
              Configuración de Presupuesto
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Gestión masiva de porcentajes mensuales
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
            <FormControl fullWidth size="small">
              <InputLabel>Mes de Aplicación</InputLabel>
              <Select
                value={selectedMonth}
                label="Mes de Aplicación"
                onChange={(e) => setSelectedMonth(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" />
                  </InputAdornment>
                }
                sx={{ fontSize: "1rem" }}
              >
                {MESES.map((m) => (
                  <MenuItem
                    key={m.value}
                    value={m.value}
                    sx={{ fontSize: "0.95rem" }}
                  >
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Año"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              slotProps={{
                input: {
                  sx: { fontSize: "1rem" },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Event fontSize="small" />
                    </InputAdornment>
                  ),
                },
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
            Configuración por Roles
          </Typography>
        </Divider>

        {loadingData || loadingCargos ? (
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
            {roleConfigs.map((row) => (
              <Grid container spacing={2} key={row.id} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={row.rol}
                      label="Rol"
                      onChange={(e) =>
                        handleRowChange(row.id, "rol", e.target.value)
                      }
                      startAdornment={
                        <InputAdornment position="start">
                          <Badge sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      }
                      sx={{ fontSize: "1rem" }}
                    >
                      {cargos.map((c) => (
                        <MenuItem
                          key={c.id || c.nombre}
                          value={c.nombre}
                          sx={{ fontSize: "0.95rem" }}
                        >
                          {c.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 7, sm: 3.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Cálculo</InputLabel>
                    <Select
                      value={row.tipo_calculo}
                      label="Tipo de Cálculo"
                      onChange={(e) =>
                        handleRowChange(row.id, "tipo_calculo", e.target.value)
                      }
                      sx={{ fontSize: "1rem" }}
                    >
                      <MenuItem value="Fijo" sx={{ fontSize: "0.95rem" }}>
                        Fijo
                      </MenuItem>
                      <MenuItem
                        value="Distributivo"
                        sx={{ fontSize: "0.95rem" }}
                      >
                        Distributivo
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 5, sm: 3.5 }}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Porcentaje"
                    type="number"
                    value={row.porcentaje}
                    onChange={(e) =>
                      handleRowChange(row.id, "porcentaje", e.target.value)
                    }
                    disabled={row.tipo_calculo === "Distributivo"}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Percent sx={{ fontSize: 16 }} />
                          </InputAdornment>
                        ),
                        sx: { fontWeight: "600", fontSize: "1rem" },
                      },
                    }}
                  />
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 1 }}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Tooltip title="Eliminar este rol">
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
            ))}

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
              Agregar otro rol
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
          Los roles con cálculo <b>Distributivo</b> se ajustan automáticamente a
          0%.
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
          disabled={loading || loadingData}
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
