import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Card,
  CardContent,
  alpha,
  Grid,
  Autocomplete,
} from "@mui/material";
import { InlineMessage } from "./InlineMessage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es"; // Localización español
import {
  Close,
  Save,
  Person,
  Search,
  Store,
  CalendarToday,
  Groups,
  CheckCircle,
} from "@mui/icons-material";
import { useEditStoreModalLogic } from "../../hooks/useEditStoreModalLogic";

interface EditStoreModalSimplifiedProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth?: string;
  onSaveComplete?: () => void;
}

export const EditStoreModalSimplified: React.FC<
  EditStoreModalSimplifiedProps
> = ({ isOpen, onClose, selectedMonth, onSaveComplete }) => {
  // Estado para controlar si se ha guardado correctamente
  const [, setSaveCompleted] = React.useState(false);
  const [, setSaveError] = React.useState(false);

  // Usar el hook para toda la lógica de negocio (sin onSaveComplete, la recarga se maneja en onClose)
  const {
    // Estados
    fecha,
    tiendaSeleccionada,
    tiendaNombre,
    cargoSeleccionado,
    codigoEmpleado,
    empleadoEncontrado,
    empleadosAsignados,
    tiendas,
    cargos,
    loading,
    error,
    success,
    // Handlers
    handleTiendaChange,
    handleKeyPress,
    handleAgregarEmpleado,
    handleQuitarEmpleado,
    handleLimpiar,
    handleGuardar,
    // Utils
    setError,
    setSuccess,
    setFecha,
    setCargoSeleccionado,
    setCodigoEmpleado,
  } = useEditStoreModalLogic({
    isOpen,
    onClose,
    selectedMonth,
    onSaveComplete,
    onStateChange: undefined,
  });

  const handleGuardarWrapper = async () => {
    const success = await handleGuardar();
    if (!success) {
      setSaveError(true);
    }
  };

  // 🚀 NUEVO: Efecto para limpiar estados cuando se cierra el modal
  React.useEffect(() => {
    if (!isOpen) {
      // El modal se cerró, limpiar estados
      setSaveCompleted(false);
      setSaveError(false);
    }
  }, [isOpen]);

  return (
    <>
      <InlineMessage
        message={success || error}
        type={success ? "success" : "error"}
        onHide={() => {
          setError("");
          setSuccess("");
        }}
      />

      <Dialog
        open={isOpen || false}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* Header Premium */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Store sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="700">
                {tiendaNombre
                  ? `Editar Asignación - ${tiendaNombre} `
                  : "Editar Asignación"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Gestione los empleados asignados para la fecha seleccionada
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
          {/* Selectores de Fecha y Tienda - REDISEÑADOS */}
          <Box
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "primary.lighter",
                      p: 0.75,
                      borderRadius: 1,
                      display: "flex",
                    }}
                  >
                    <CalendarToday
                      sx={{ color: "primary.main", fontSize: 20 }}
                    />
                  </Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    Seleccionar Fecha
                  </Typography>
                </Box>
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="es"
                >
                  <DatePicker
                    value={dayjs(fecha)}
                    format="DD/MM/YYYY"
                    onChange={(newValue) =>
                      setFecha(newValue ? newValue.format("YYYY-MM-DD") : "")
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "medium",
                        sx: {
                          bgcolor: "white",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            p: "7.5px !important",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderWidth: 2,
                              borderColor: "grey.300",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderWidth: 2,
                            },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "success.lighter",
                      p: 0.75,
                      borderRadius: 1,
                      display: "flex",
                    }}
                  >
                    <Store sx={{ color: "success.main", fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    Seleccionar Tienda
                  </Typography>
                </Box>
                <Autocomplete
                  options={tiendas}
                  getOptionLabel={(option) =>
                    `${option.nombre} - ${option.empresa}`
                  }
                  value={
                    tiendas.find((t) => t.id == tiendaSeleccionada) || null
                  }
                  onChange={(_, newValue) =>
                    handleTiendaChange(newValue ? newValue.id : 0)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Buscar tienda..."
                      fullWidth
                      size="medium"
                      sx={{
                        bgcolor: "white",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          p: "7.5px !important", // Ajuste para igualar altura
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderWidth: 2,
                            borderColor: "grey.300",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          {/* Sección Agregar Empleado - REDISEÑADA */}
          <Box
            sx={{
              p: 3,
              mb: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              bgcolor: "#fafafa",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
            >
              <Search sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight="600">
                Agregar Empleado
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "flex-end",
              }}
            >
              {/* Cargo del Día */}
              <Box
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 8px)",
                    md: "2", // Flex relativo para distribuir mejor
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    mb: 0.5,
                    fontWeight: 600,
                    color: "text.secondary",
                    display: "block",
                  }}
                >
                  Cargo del Día
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={cargoSeleccionado}
                    onChange={(e) => {
                      console.log("📋 CARGO SELECCIONADO:", e.target.value);
                      setCargoSeleccionado(e.target.value as number);
                    }}
                    displayEmpty
                    sx={{
                      bgcolor: "white",
                      borderRadius: 2,
                      "& .MuiSelect-select": {
                        py: 1,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderWidth: 2,
                        borderColor: "grey.300",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderWidth: 2,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {cargos.map((cargo) => (
                      <MenuItem key={cargo.id} value={cargo.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                            }}
                          />
                          {cargo.nombre}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Código */}
              <Box
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 8px)",
                    md: "1.5", // Menos espacio que cargo
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    mb: 0.5,
                    fontWeight: 600,
                    color: "text.secondary",
                    display: "block",
                  }}
                >
                  Código
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="..."
                  value={codigoEmpleado}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 4);
                    setCodigoEmpleado(value);
                  }}
                  onKeyDown={handleKeyPress}
                  type="number"
                  inputProps={{ maxLength: 4 }}
                  sx={{
                    bgcolor: "white",
                    "& .MuiInputBase-input": {
                      py: 1,
                      textAlign: "center",
                      fontWeight: 600,
                      // Hide Spinners
                      "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button":
                        {
                          WebkitAppearance: "none",
                          margin: 0,
                        },
                      "&[type=number]": {
                        MozAppearance: "textfield",
                      },
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "grey.300",
                        borderWidth: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused fieldset": {
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Box>

              {/* Nuevo contenedor agrupado para Empleado y Botón (para forzarlos juntos) */}
              <Box
                sx={{
                  flex: { xs: "1 1 100%", md: "4" }, // Ocupa el resto del espacio
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-end",
                  flexWrap: { xs: "wrap", sm: "nowrap" }, // Wrap en móvil, fila en desktop
                }}
              >
                {/* Empleado Encontrado */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {empleadoEncontrado ? (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: "#e8f5e9", // Green lighter
                        border: "1px solid",
                        borderColor: "#66bb6a", // Green light
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        height: "40px",
                      }}
                    >
                      <CheckCircle sx={{ color: "#2e7d32", fontSize: 20 }} />
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        color="#1b5e20"
                        noWrap
                        sx={{ fontSize: "0.9rem" }}
                      >
                        {empleadoEncontrado.nombre}
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "rgba(46, 125, 50, 0.1)",
                          borderRadius: 1.5,
                          px: 0.8,
                          py: 0.2,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="600"
                          color="#2e7d32"
                          sx={{ fontSize: "0.7rem" }}
                        >
                          Cod. {empleadoEncontrado.id}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        height: "40px", // Placeholder height equal to input
                        border: "1px dashed #e0e0e0",
                        borderRadius: 2,
                        bgcolor: "#fafafa",
                      }}
                    />
                  )}
                </Box>

                {/* Botón Agregar */}
                <Box sx={{ minWidth: "120px" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Person />}
                    onClick={handleAgregarEmpleado}
                    disabled={
                      !tiendaSeleccionada ||
                      !empleadoEncontrado ||
                      !cargoSeleccionado
                    }
                    sx={{
                      py: 1,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: "none",
                      bgcolor: "primary.dark",
                      height: "40px",
                      boxShadow: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        bgcolor: "primary.main",
                        boxShadow: 2,
                      },
                    }}
                  >
                    Agregar
                  </Button>
                </Box>
              </Box>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1,
                display: "block",
                fontStyle: "normal",
                textAlign: "left",
                pl: 1,
              }}
            >
              Ingrese el código de 4 dígitos del empleado y seleccione el cargo
              correspondiente. El sistema validará automáticamente la
              información antes de agregarlo a la lista.
            </Typography>
          </Box>

          {/* Empleados Asignados - REDISEÑADO */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Groups sx={{ color: "primary.main", fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600">
                  Empleados Asignados
                </Typography>
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    minWidth: 32,
                    textAlign: "center",
                  }}
                >
                  {empleadosAsignados.length}
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "capitalize" }}
              >
                empleados del día{" "}
                {dayjs(fecha).format("dddd D [de] MMMM [de] YYYY")}
              </Typography>
            </Box>

            {empleadosAsignados.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  color: "text.secondary",
                  border: "2px dashed",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  bgcolor: "grey.50",
                }}
              >
                <Person sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography variant="body1" fontWeight="500">
                  No hay empleados asignados
                </Typography>
                <Typography variant="caption">
                  Agregue empleados usando el formulario de arriba
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {empleadosAsignados.map((empleado) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={empleado.id}>
                    <Card
                      sx={{
                        position: "relative",
                        border: "1px solid",
                        borderColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.2),
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.05),
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.1),
                          borderColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.3),
                          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: "error.lighter", // SOFTER RED
                          color: "error.main", // ICON COLOR RED
                          "&:hover": { bgcolor: "error.main", color: "white" }, // Stronger Red on Hover
                          width: 24, // Slightly larger button
                          height: 24,
                          zIndex: 1,
                        }}
                        size="small"
                        onClick={() => handleQuitarEmpleado(empleado.id)}
                      >
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>

                      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{
                            pr: 3,
                            mb: 0.5,
                            lineHeight: 1.2,
                            fontSize: "1rem",
                          }}
                        >
                          {" "}
                          {/* Increased Name Size slightly */}
                          {empleado.nombre}
                        </Typography>
                        <Typography
                          variant="body2" // Increased from caption
                          sx={{
                            color:
                              empleado.cargo_nombre === "Gerente"
                                ? "success.main"
                                : "primary.main",
                            fontWeight: 700, // Bolder
                            mb: 1,
                            display: "block",
                            fontSize: "0.85rem", // Specifically set larger size
                          }}
                        >
                          • {empleado.cargo_nombre}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            pt: 1,
                            borderTop: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="600"
                            sx={{ fontSize: "0.8rem" }}
                          >
                            {" "}
                            {/* Increased Code Size */}
                            Cod. {empleado.codigo}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "success.dark",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              display: "flex",
                              alignItems: "center",
                              lineHeight: 1,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                color: "success.main",
                                fontSize: "0.9rem",
                                mr: 0.5,
                              }}
                            >
                              $
                            </Box>
                            {Number(empleado.presupuesto).toLocaleString(
                              "en-US",
                            )}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: "1px solid #e0e0e0",
            bgcolor: "#f5f5f5",
            gap: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: 100 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLimpiar}
            disabled={loading || empleadosAsignados.length === 0}
            color="warning"
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Limpiar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleGuardarWrapper}
            disabled={
              loading || !tiendaSeleccionada || empleadosAsignados.length === 0
            }
            sx={{
              minWidth: 200,
              fontWeight: 600,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            {loading
              ? "Guardando..."
              : `Actualizar Asignación(${empleadosAsignados.length} empleados)`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
