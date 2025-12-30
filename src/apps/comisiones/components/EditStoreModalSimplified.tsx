import React, { useState, useEffect } from "react";
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
  Alert,
  IconButton,
  Card,
  CardContent,
  useTheme,
  alpha,
  Autocomplete,
} from "@mui/material";
import { InlineMessage } from "./modal/InlineMessage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es"; // Localización español
import {
  Close,
  Save,
  Add,
  Person,
  Search,
  Store,
  CalendarToday,
  Groups,
  CheckCircle,
} from "@mui/icons-material";
import {
  obtenerTiendas,
  obtenerEmpleadosPorFechaExacta,
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerPorcentajesMensuales,
} from "../api/directus/read";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations";
import {
  guardarPresupuestosEmpleados,
  eliminarPresupuestosEmpleados,
} from "../api/directus/create";

interface EditStoreModalSimplifiedProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  selectedMonth?: string;
}

export const EditStoreModalSimplified: React.FC<
  EditStoreModalSimplifiedProps
> = ({ isOpen, onClose, onSaveComplete, selectedMonth }) => {
  // Estados principales
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">("");
  const [tiendaNombre, setTiendaNombre] = useState("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState<number | "">("");
  const [codigoEmpleado, setCodigoEmpleado] = useState("");
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<any | null>(
    null
  );
  const [empleadosAsignados, setEmpleadosAsignados] = useState<any[]>([]);

  // Datos de catálogos
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [todosEmpleados, setTodosEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cargar catálogos al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadCatalogos();
      resetForm();
    }
  }, [isOpen]);

  // Cargar empleados asignados cuando cambian fecha o tienda
  useEffect(() => {
    if (fecha && tiendaSeleccionada) {
      loadEmpleadosAsignados();
    } else {
      setEmpleadosAsignados([]);
    }
  }, [fecha, tiendaSeleccionada]);

  // Buscar empleado automáticamente cuando se escribe código
  useEffect(() => {
    // Solo buscar si ya se cargaron los empleados
    if (codigoEmpleado.length >= 1 && todosEmpleados.length > 0) {
      buscarEmpleadoPorCodigo();
    } else if (codigoEmpleado.length === 0) {
      setEmpleadoEncontrado(null);
      setError(""); // Limpiar error al borrar
    }
  }, [codigoEmpleado, todosEmpleados]);

  const resetForm = () => {
    setFecha(new Date().toISOString().split("T")[0]);
    setTiendaSeleccionada("");
    setTiendaNombre("");

    // Default to Asesor if available
    const cargoAsesor = cargos.find((c) => c.nombre.toLowerCase() === "asesor");
    setCargoSeleccionado(cargoAsesor ? cargoAsesor.id : "");

    setCodigoEmpleado("");
    setEmpleadoEncontrado(null);
    setEmpleadosAsignados([]);
    setError("");
    setSuccess("");
  };

  const loadCatalogos = async () => {
    try {
      setLoading(true);
      const [tiendasData, empleadosData, cargosData] = await Promise.all([
        obtenerTiendas(),
        obtenerAsesores(),
        obtenerCargos(),
      ]);

      setTiendas(tiendasData);
      setTodosEmpleados(empleadosData);
      setCargos(cargosData);

      // Set default cargo to Asesor
      const cargoAsesor = cargosData.find(
        (c: any) => c.nombre.toLowerCase() === "asesor"
      );
      if (cargoAsesor) {
        setCargoSeleccionado(cargoAsesor.id);
      }
    } catch (err: any) {
      console.error("Error al cargar catálogos:", err);
      setError("Error al cargar catálogos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleadosAsignados = async () => {
    if (!tiendaSeleccionada || !fecha) {
      setEmpleadosAsignados([]);
      return;
    }

    try {
      setLoading(true);

      // ✅ Usar la nueva función que filtra por fecha EXACTA
      const presupuestos = await obtenerEmpleadosPorFechaExacta(
        [tiendaSeleccionada as number],
        fecha
      );

      // Mapear los datos de la BD al formato del modal
      const empleadosConInfo = presupuestos.map((p: any) => {
        const empleado = todosEmpleados.find((e) => e.id === p.asesor);
        const cargo = cargos.find((c) => c.id === p.cargo);

        return {
          id: p.asesor,
          id_presupuesto: p.id, // ← ID del registro en presupuesto_diario_empleados
          nombre: empleado?.nombre || `Empleado ${p.asesor} `,
          codigo: p.asesor, // ← El código es el ID del asesor
          cargo_id: p.cargo,
          cargo_nombre: cargo?.nombre || "Asesor",
          presupuesto: p.presupuesto || 0,
          fecha: p.fecha,
        };
      });

      setEmpleadosAsignados(empleadosConInfo);
    } catch (err: any) {
      console.error("Error al cargar empleados asignados:", err);
      setError("Error al cargar empleados: " + err.message);
      setEmpleadosAsignados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTiendaChange = (tiendaId: number) => {
    setTiendaSeleccionada(tiendaId);
    const tienda = tiendas.find((t) => t.id === tiendaId);
    setTiendaNombre(tienda?.nombre || "");
  };

  const buscarEmpleadoPorCodigo = () => {
    if (!codigoEmpleado.trim()) {
      setEmpleadoEncontrado(null);
      setError("");
      return;
    }

    // Verificar que los empleados estén cargados
    if (todosEmpleados.length === 0) {
      setError("Cargando empleados...");
      return;
    }

    // ✅ El código del asesor es su ID en la tabla asesores
    const codigoNumerico = parseInt(codigoEmpleado.trim());

    if (isNaN(codigoNumerico)) {
      setEmpleadoEncontrado(null);
      setError("El código debe ser un número válido");
      return;
    }

    // ✅ Comparar convirtiendo ambos a número para evitar problemas de tipo
    const empleado = todosEmpleados.find((e) => {
      const empleadoId = typeof e.id === "string" ? parseInt(e.id) : e.id;
      return empleadoId === codigoNumerico;
    });

    if (empleado) {
      setEmpleadoEncontrado(empleado);
      setError("");
    } else {
      setEmpleadoEncontrado(null);
      setError(`No se encontró empleado con código ${codigoEmpleado} `);
    }
  };

  // ✅ Manejar Enter para agregar empleado
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && empleadoEncontrado && cargoSeleccionado) {
      e.preventDefault();
      handleAgregarEmpleado();
    }
  };

  // ✅ Función para recalcular presupuestos
  const recalculateBudgets = async (empleados: any[]) => {
    if (!tiendaSeleccionada || empleados.length === 0) return empleados;

    try {
      // 1. Obtener presupuesto diario de la tienda
      const presupuestosTienda = await obtenerPresupuestosDiarios(
        tiendaSeleccionada as number,
        fecha,
        fecha
      );

      if (!presupuestosTienda || presupuestosTienda.length === 0) {
        console.warn(
          "No hay presupuesto diario asignado para esta tienda y fecha"
        );
        return empleados.map((e) => ({ ...e, presupuesto: 0 }));
      }

      const presupuestoTotal = presupuestosTienda[0].presupuesto;

      // 2. Obtener porcentajes mensuales
      const mesAnio = fecha.substring(0, 7);
      const porcentajes = await obtenerPorcentajesMensuales(undefined, mesAnio);

      if (!porcentajes || porcentajes.length === 0) {
        console.warn("No hay porcentajes configurados para este mes");
        return empleados.map((e) => ({ ...e, presupuesto: 0 }));
      }

      const porcentajeConfig = porcentajes[0];

      // 3. Contar empleados por rol
      const empleadosPorRol = {
        gerente: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "gerente"
        ).length,
        asesor: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "asesor"
        ).length,
        coadministrador: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "coadministrador"
        ).length,
        cajero: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "cajero"
        ).length,
        logistico: empleados.filter(
          (e) => e.cargo_nombre.toLowerCase() === "logistico"
        ).length,
        gerente_online: empleados.filter(
          (e) =>
            e.cargo_nombre.toLowerCase() === "gerente online" ||
            e.cargo_nombre.toLowerCase().includes("online")
        ).length,
      };

      // 4. Calcular distribución
      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
        presupuestoTotal,
        porcentajeConfig,
        empleadosPorRol
      );

      // 5. Asignar presupuestos individuales
      return empleados.map((empleado) => {
        const rolLower = empleado.cargo_nombre.toLowerCase();
        let presupuestoNuevo = 0;

        // Casos especiales con presupuesto fijo de 1
        if (
          rolLower === "cajero" ||
          rolLower === "logistico" ||
          rolLower === "gerente online" ||
          rolLower.includes("online")
        ) {
          presupuestoNuevo = 1;
        } else if (
          ["gerente", "asesor", "coadministrador"].includes(rolLower)
        ) {
          // Roles con distribución normal
          const cantidadEnRol =
            empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
          const totalRol =
            presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol];

          if (cantidadEnRol > 0) {
            presupuestoNuevo = Math.round(totalRol / cantidadEnRol);
          }
        }

        return {
          ...empleado,
          presupuesto: presupuestoNuevo,
        };
      });
    } catch (error) {
      console.error("Error al recalcular presupuestos:", error);
      // En caso de error, mantener los actuales o devolver 0
      return empleados;
    }
  };

  const handleAgregarEmpleado = async () => {
    if (!tiendaSeleccionada) {
      setError("Debe seleccionar una tienda primero");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!empleadoEncontrado || !cargoSeleccionado) {
      setError("Debe seleccionar un cargo");
      return;
    }

    // Verificar que no esté ya asignado
    const yaAsignado = empleadosAsignados.find(
      (e) => e.id === empleadoEncontrado.id
    );
    if (yaAsignado) {
      setError("Este empleado ya está asignado");
      return;
    }

    const cargo = cargos.find((c) => c.id === cargoSeleccionado);

    // Crear nuevo empleado
    const nuevoEmpleado = {
      id: empleadoEncontrado.id,
      nombre: empleadoEncontrado.nombre,
      codigo: empleadoEncontrado.id,
      cargo_id: cargoSeleccionado,
      cargo_nombre: cargo?.nombre || "Asesor",
      presupuesto: 0,
      fecha: fecha,
    };

    // Crear lista temporal con el nuevo empleado
    const nuevaLista = [...empleadosAsignados, nuevoEmpleado];

    // Calcular presupuestos con la nueva lista
    setLoading(true);
    try {
      const listaCalculada = await recalculateBudgets(nuevaLista);
      setEmpleadosAsignados(listaCalculada);

      // Limpiar campos
      setCodigoEmpleado("");
      // Resetear a cargo por defecto "Asesor"
      const cargoAsesor = cargos.find(
        (c) => c.nombre.toLowerCase() === "asesor"
      );
      setCargoSeleccionado(cargoAsesor ? cargoAsesor.id : "");

      setEmpleadoEncontrado(null);
      setSuccess(`Empleado ${empleadoEncontrado.nombre} agregado`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error al agregar y calcular:", err);
      // Fallback: agregar sin calcular
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarEmpleado = async (empleadoId: number) => {
    const nuevaLista = empleadosAsignados.filter((e) => e.id !== empleadoId);

    setLoading(true);
    try {
      const listaCalculada = await recalculateBudgets(nuevaLista);
      setEmpleadosAsignados(listaCalculada);
    } catch (err) {
      console.error("Error al quitar y calcular:", err);
      setEmpleadosAsignados(nuevaLista);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setEmpleadosAsignados([]);
  };

  const handleGuardar = async () => {
    if (!tiendaSeleccionada) {
      setError("Debe seleccionar una tienda");
      return;
    }

    if (empleadosAsignados.length === 0) {
      setError("Debe asignar al menos un empleado");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Eliminar asignaciones existentes para esta fecha y tienda
      await eliminarPresupuestosEmpleados(tiendaSeleccionada as number, fecha);

      // 2️⃣ Crear nuevas asignaciones
      const presupuestosParaGuardar = empleadosAsignados.map((emp) => ({
        asesor: emp.id,
        tienda_id: tiendaSeleccionada as number,
        cargo: emp.cargo_id,
        fecha: fecha,
        presupuesto: emp.presupuesto || 0, // ✅ Usar el presupuesto calculado, asegurando que no sea undefined
      }));

      await guardarPresupuestosEmpleados(presupuestosParaGuardar);

      setSuccess("✅ Asignación actualizada correctamente");

      // 3️⃣ Esperar un momento y cerrar el modal
      setTimeout(() => {
        // Llamar al callback para refrescar datos en el componente padre
        if (onSaveComplete) {
          onSaveComplete();
        }
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error al guardar:", err);
      setError("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
                    tiendas.find((t) => t.id === tiendaSeleccionada) || null
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
                    md: "1 1 calc(20.83% - 8px)",
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
                    md: "1 1 calc(16.67% - 8px)",
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

              {/* Empleado Encontrado */}
              <Box
                sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(45.83% - 8px)" } }}
              >
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
                    }}
                  />
                )}
              </Box>

              {/* Botón Agregar */}
              <Box
                sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(16.67% - 8px)" } }}
              >
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
              <Typography variant="caption" color="text.secondary">
                empleados para hoy
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {empleadosAsignados.map((empleado) => (
                  <Box key={empleado.id}>
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
                              "en-US"
                            )}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
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
            onClick={handleGuardar}
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
