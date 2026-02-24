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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Save,
  Percent,
  Close,
  CalendarMonth,
  Badge,
  SettingsSuggest,
  AddCircleOutline,
  DeleteOutline,
  InfoOutlined,
  TrendingUp,
} from "@mui/icons-material";
import {
  obtenerCargos,
  obtenerPorcentajesMensuales,
  obtenerUmbralesComisiones,
} from "../api/directus/read";
import {
  saveRoleBudgetConfiguration,
  guardarUmbralesComisiones,
} from "../api/directus/create";
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

interface ConfigurationTabsPanelProps {
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

// Opciones de colores disponibles
const COLOR_OPTIONS = [
  { value: "red", label: "Rojo", hex: "#f44336" },
  { value: "pink", label: "Rosa", hex: "#f06292" },
  { value: "orange", label: "Naranja", hex: "#fb8c00" },
  { value: "blue", label: "Azul", hex: "#1e88e5" },
  { value: "green", label: "Verde", hex: "#43a047" },
  { value: "purple", label: "Púrpura", hex: "#9c27b0" },
  { value: "yellow", label: "Amarillo", hex: "#ffeb3b" },
];

interface RoleConfigRow {
  id: string;
  rol: string;
  tipo_calculo: "Fijo" | "Distributivo";
  porcentaje: string;
}

interface ThresholdRow {
  id: string;
  cumplimiento_min: string;
  comision_pct: string;
  nombre: string;
  color: string;
}

export const ConfigurationTabsPanel: React.FC<ConfigurationTabsPanelProps> = ({
  open,
  onClose,
  initialMonth,
  onThresholdSaved,
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
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const createEmptyRoleRow = useCallback(
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

  const createEmptyThresholdRow = useCallback(
    (idPrefix: string = "row"): ThresholdRow => ({
      id: `${idPrefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      cumplimiento_min: "",
      comision_pct: "",
      nombre: "",
      color: "",
    }),
    [],
  );

  const createDefaultThresholdRows = (): ThresholdRow[] => [
    {
      ...createEmptyThresholdRow("d1"),
      cumplimiento_min: "90",
      comision_pct: "0.0035",
      nombre: "Muy Regular",
      color: "pink",
    },
    {
      ...createEmptyThresholdRow("d2"),
      cumplimiento_min: "95",
      comision_pct: "0.005",
      nombre: "Regular",
      color: "orange",
    },
    {
      ...createEmptyThresholdRow("d3"),
      cumplimiento_min: "100",
      comision_pct: "0.007",
      nombre: "Buena",
      color: "blue",
    },
    {
      ...createEmptyThresholdRow("d4"),
      cumplimiento_min: "110",
      comision_pct: "0.01",
      nombre: "Excelente",
      color: "green",
    },
  ];

  const [roleConfigs, setRoleConfigs] = useState<RoleConfigRow[]>([]);
  const [thresholdRows, setThresholdRows] = useState<ThresholdRow[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentRoleRecordId, setCurrentRoleRecordId] = useState<
    number | string | undefined
  >(undefined);
  const [currentThresholdRecordId, setCurrentThresholdRecordId] = useState<
    number | string | undefined
  >(undefined);

  useEffect(() => {
    if (open && roleConfigs.length === 0) {
      setRoleConfigs([createEmptyRoleRow("init")]);
    }
    if (open && thresholdRows.length === 0) {
      setThresholdRows(createDefaultThresholdRows());
    }
  }, [
    open,
    roleConfigs.length,
    thresholdRows.length,
    createEmptyRoleRow,
    createDefaultThresholdRows,
  ]);

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

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadExistingRoleConfigs();
      loadExistingThresholdConfigs();
    }
  }, [open, selectedMonth, selectedYear]);

  const loadExistingRoleConfigs = useCallback(async () => {
    if (!open || !selectedMonth || !selectedYear) return;

    try {
      setLoadingData(true);
      setCurrentRoleRecordId(undefined);
      const mesNombre =
        MESES.find((m) => m.value === selectedMonth)?.label.substring(0, 3) ||
        "Ene";
      const data = await obtenerPorcentajesMensuales(
        undefined,
        `${mesNombre} ${selectedYear}`,
      );

      if (data && data.length > 0) {
        const item = data[0] as any;
        setCurrentRoleRecordId(item.id);
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
          setRoleConfigs([createEmptyRoleRow("empty")]);
        }
      } else {
        setRoleConfigs([createEmptyRoleRow("new")]);
      }
    } catch (err) {
      setRoleConfigs([createEmptyRoleRow("err")]);
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open, createEmptyRoleRow]);

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

      if (
        data &&
        data.cumplimiento_valores &&
        data.cumplimiento_valores.length > 0
      ) {
        setCurrentThresholdRecordId(data.id);

        const rows: ThresholdRow[] = data.cumplimiento_valores.map(
          (t, index) => ({
            id: `row-${index}-${Date.now()}`,
            cumplimiento_min: t.cumplimiento_min.toString(),
            comision_pct: t.comision_pct.toString(),
            nombre: t.nombre || "",
            color: t.color || "",
          }),
        );
        setThresholdRows(rows);
      } else {
        setThresholdRows(createDefaultThresholdRows());
      }
    } catch (err) {
      setThresholdRows(createDefaultThresholdRows());
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear, open, createDefaultThresholdRows]);

  const handleAddRoleRow = () => {
    setRoleConfigs([...roleConfigs, createEmptyRoleRow("added")]);
  };

  const handleRemoveRoleRow = (id: string) => {
    if (roleConfigs.length === 1) {
      setRoleConfigs([createEmptyRoleRow("reset")]);
      return;
    }
    setRoleConfigs(roleConfigs.filter((row) => row.id !== id));
  };

  const handleRoleRowChange = (
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

  const handleAddThresholdRow = () => {
    setThresholdRows([...thresholdRows, createEmptyThresholdRow("added")]);
  };

  const handleRemoveThresholdRow = (id: string) => {
    const newRows = thresholdRows.filter((row) => row.id !== id);
    setThresholdRows(newRows);
  };

  const handleThresholdRowChange = (
    id: string,
    field: keyof ThresholdRow,
    value: string,
  ) => {
    setThresholdRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      }),
    );
  };

  const handleSubmitRoleConfigs = async () => {
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
        id: currentRoleRecordId,
        mes: `${selectedYear}-${selectedMonth}`,
        roleConfigs: validConfigs.map((c) => ({
          rol: c.rol,
          tipo_calculo: c.tipo_calculo,
          porcentaje: parseFloat(c.porcentaje) || 0,
        })),
      });
      setSuccess("Configuraciones de roles guardadas exitosamente.");

      await loadExistingRoleConfigs();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitThresholdConfigs = async () => {
    setError("");
    setSuccess("");

    if (!selectedMonth || !selectedYear) {
      setError("El mes y el año son obligatorios.");
      return;
    }

    const validRows = thresholdRows.filter(
      (r) => r.cumplimiento_min.trim() !== "" && r.comision_pct.trim() !== "",
    );

    if (validRows.length === 0) {
      setError("Debe configurar al menos un umbral.");
      return;
    }

    const cumplimientoValues = validRows.map((r) =>
      parseFloat(r.cumplimiento_min),
    );
    const uniqueValues = new Set(cumplimientoValues);
    if (uniqueValues.size !== cumplimientoValues.length) {
      setError("No pueden haber valores duplicados de cumplimiento mínimo.");
      return;
    }

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

      const valores: CommissionThreshold[] = validRows.map((r) => ({
        cumplimiento_min: parseFloat(r.cumplimiento_min),
        comision_pct: parseFloat(r.comision_pct),
        nombre: r.nombre.trim() || "",
        color: r.color?.trim() || "",
      }));

      await guardarUmbralesComisiones({
        id: currentThresholdRecordId,
        mes: `${selectedYear}-${selectedMonth}`,
        cumplimiento_valores: valores,
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
              Configuración de Comisiones
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Gestión de umbrales y distribución por rol
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255, 255, 255, 0.7)",
            zIndex: 1300,
          }}
        >
          <CircularProgress />
        </Box>
      )}

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
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: "1rem" },
                },
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
              slotProps={{
                input: {
                  sx: { fontSize: "1rem" },
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab
            label="Distribución por Rol"
            icon={<Badge />}
            iconPosition="start"
          />
          <Tab
            label="Umbrales de Cumplimiento"
            icon={<TrendingUp />}
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 0 && (
          <Box>
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
                            handleRoleRowChange(row.id, "rol", e.target.value)
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
                            handleRoleRowChange(
                              row.id,
                              "tipo_calculo",
                              e.target.value,
                            )
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
                          handleRoleRowChange(
                            row.id,
                            "porcentaje",
                            e.target.value,
                          )
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
                          onClick={() => handleRemoveRoleRow(row.id)}
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
                  onClick={handleAddRoleRow}
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
                Los roles con cálculo <b>Distributivo</b> se ajustan
                automáticamente a 0%.
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
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
                    <Grid
                      container
                      spacing={2}
                      key={row.id}
                      alignItems="center"
                    >
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <StyledTextField
                          fullWidth
                          size="small"
                          label="Cumplimiento Mínimo (%)"
                          type="number"
                          value={row.cumplimiento_min}
                          onChange={(e) =>
                            handleThresholdRowChange(
                              row.id,
                              "cumplimiento_min",
                              e.target.value,
                            )
                          }
                          slotProps={{
                            input: {
                              sx: { fontWeight: "600", fontSize: "1rem" },
                            },
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
                            handleThresholdRowChange(
                              row.id,
                              "comision_pct",
                              e.target.value,
                            )
                          }
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
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Color</InputLabel>
                          <Select
                            value={row.color || ""}
                            label="Color"
                            onChange={(e) =>
                              handleThresholdRowChange(
                                row.id,
                                "color",
                                e.target.value,
                              )
                            }
                            sx={{ fontSize: "1rem" }}
                            renderValue={(selected) => {
                              if (!selected) return "Seleccionar...";
                              const colorOption = COLOR_OPTIONS.find(
                                (c) => c.value === selected,
                              );
                              return (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        colorOption?.hex || "grey.400",
                                      border: "1px solid #ccc",
                                    }}
                                  />
                                  {colorOption?.label || selected}
                                </Box>
                              );
                            }}
                          >
                            <MenuItem value="">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    backgroundColor: "grey.400",
                                    border: "1px solid #ccc",
                                  }}
                                />
                                Seleccionar...
                              </Box>
                            </MenuItem>
                            {COLOR_OPTIONS.map((color) => (
                              <MenuItem key={color.value} value={color.value}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: "50%",
                                      backgroundColor: color.hex,
                                      border: "1px solid #ccc",
                                    }}
                                  />
                                  {color.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <StyledTextField
                          fullWidth
                          size="small"
                          label="Nombre"
                          value={row.nombre}
                          onChange={(e) =>
                            handleThresholdRowChange(
                              row.id,
                              "nombre",
                              e.target.value,
                            )
                          }
                          placeholder="Ej: Muy Regular, Regular, Buena..."
                          slotProps={{
                            input: {
                              sx: { fontSize: "1rem" },
                            },
                          }}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 12, sm: 1 }}
                        sx={{ display: "flex", justifyContent: "center" }}
                      >
                        <Tooltip title="Eliminar este umbral">
                          <IconButton
                            onClick={() => handleRemoveThresholdRow(row.id)}
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
                  onClick={handleAddThresholdRow}
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
                Los umbrales se aplican en orden descendente. El primer umbral
                cuyo cumplimiento mínimo sea menor o igual al cumplimiento del
                empleado será el utilizado para calcular su comisión.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          sx={{ textTransform: "none", fontWeight: "600", fontSize: "1.1rem" }}
        >
          Cancelar
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={handleSubmitRoleConfigs}
            variant="contained"
            disabled={loading || loadingData}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
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
        )}
        {activeTab === 1 && (
          <Button
            onClick={handleSubmitThresholdConfigs}
            variant="contained"
            disabled={loading || loadingData || thresholdRows.length === 0}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
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
        )}
      </DialogActions>
    </Dialog>
  );
};
