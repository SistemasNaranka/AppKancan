import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Delete,
  Person,
  Work,
  Store,
  CheckCircle,
  Error,
} from "@mui/icons-material";
import {
  obtenerAsesores,
  obtenerCargos,
  obtenerPresupuestosDiarios,
  obtenerVentasEmpleados,
} from "../api/directus/read";
import {
  guardarPresupuestosEmpleados,
  guardarVentasEmpleados,
} from "../api/directus/create";
import {
  DirectusPresupuestoDiarioEmpleado,
  DirectusVentasDiariasEmpleado,
  DirectusCargo,
} from "../types";
import { DirectusAsesor } from "../types";
import {
  calculateBudgetsWithFixedDistributive,
  calculateManagerBudget,
  calculateAdvisorBudget,
} from "../lib/calculations";

interface CodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete?: (ventasData: any[]) => void;
  selectedMonth?: string; // Mes seleccionado en formato "MMM YYYY"
}

interface EmpleadoAsignado {
  asesor: DirectusAsesor;
  presupuesto: number;
  tiendaId: number;
  cargoAsignado: string; // Cargo asignado para el día (puede ser diferente al cargo base)
}

export const CodesModal: React.FC<CodesModalProps> = ({
  isOpen,
  onClose,
  onAssignmentComplete,
  selectedMonth,
}) => {
  const [codigoInput, setCodigoInput] = useState("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState("");
  const [empleadosAsignados, setEmpleadosAsignados] = useState<
    EmpleadoAsignado[]
  >([]);
  const [asesoresDisponibles, setAsesoresDisponibles] = useState<
    DirectusAsesor[]
  >([]);
  const [cargosDisponibles, setCargosDisponibles] = useState<DirectusCargo[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Convertir mes seleccionado a fecha (último día del mes)
  const getFechaActual = (mesSeleccionado?: string): string => {
    if (!mesSeleccionado) return "2025-11-30"; // fallback

    const [mes, anio] = mesSeleccionado.split(" ");
    const meses: { [key: string]: { numero: string; dias: number } } = {
      Ene: { numero: "01", dias: 31 },
      Feb: { numero: "02", dias: 28 },
      Mar: { numero: "03", dias: 31 },
      Abr: { numero: "04", dias: 30 },
      May: { numero: "05", dias: 31 },
      Jun: { numero: "06", dias: 30 },
      Jul: { numero: "07", dias: 31 },
      Ago: { numero: "08", dias: 31 },
      Sep: { numero: "09", dias: 30 },
      Oct: { numero: "10", dias: 31 },
      Nov: { numero: "11", dias: 30 },
      Dic: { numero: "12", dias: 31 },
    };

    const mesInfo = meses[mes] || { numero: "11", dias: 30 };
    return `${anio}-${mesInfo.numero}-${mesInfo.dias
      .toString()
      .padStart(2, "0")}`;
  };

  // Obtener fecha del mes seleccionado (primer día del mes para asignaciones)
  const fechaActual = getFechaActual(selectedMonth);

  // Cargar asesores disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Resetear estado al abrir el modal
      setCargoSeleccionado("");
      setEmpleadosAsignados([]);
      setError(null);
      setSuccess(null);
      loadAsesoresDisponibles();
      // No cargar asignaciones existentes automáticamente - dejar modal limpio
    }
  }, [isOpen]);

  // Establecer valor por defecto cuando se cargan los cargos
  useEffect(() => {
    if (cargosDisponibles.length > 0 && !cargoSeleccionado) {
      // Buscar "asesor" como valor por defecto, si no existe usar el primer cargo disponible
      const asesorCargo = cargosDisponibles.find(
        (c) => c.nombre.toLowerCase() === "asesor"
      );
      if (asesorCargo) {
        setCargoSeleccionado("asesor");
      } else {
        // Si no hay "asesor", usar el primer cargo disponible
        setCargoSeleccionado(cargosDisponibles[0].nombre.toLowerCase());
      }
    }
  }, [cargosDisponibles]);

  const loadAsesoresDisponibles = async () => {
    try {
      setLoading(true);

      // Obtener asesores y cargos desde BD Directus en paralelo
      const [asesores, cargos] = await Promise.all([
        obtenerAsesores(),
        obtenerCargos(),
      ]);

      setAsesoresDisponibles(asesores);
      setCargosDisponibles(cargos);
      setSuccess(
        `Cargados ${asesores.length} empleados y ${cargos.length} cargos desde BD`
      );
    } catch (err) {
      console.error("Error al cargar empleados y cargos desde BD:", err);
      setError("Error al cargar empleados y cargos desde BD");
      // No usar datos mock, dejar arrays vacíos
      setAsesoresDisponibles([]);
      setCargosDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmpleado = async () => {
    if (!codigoInput.trim()) return;

    const codigo = parseInt(codigoInput.trim());
    if (isNaN(codigo)) {
      setError("Código de asesor inválido");
      return;
    }

    // Buscar asesor por código (ahora id es el código)
    const asesor = asesoresDisponibles.find(
      (a) => a.id === codigo || a.id.toString() === codigoInput.trim()
    );
    if (!asesor) {
      setError(`No se encontró empleado con código ${codigo}`);
      return;
    }

    // Verificar si ya está asignado
    if (empleadosAsignados.some((e) => e.asesor.id === asesor.id)) {
      setError("Este empleado ya está asignado para hoy");
      return;
    }

    // Validar que no haya más de un gerente por tienda
    const gerenteCargo = cargosDisponibles.find(
      (c) => c.nombre.toLowerCase() === "gerente"
    );
    if (
      gerenteCargo &&
      cargoSeleccionado === gerenteCargo.nombre.toLowerCase()
    ) {
      const tiendaId =
        typeof asesor.tienda_id === "object"
          ? asesor.tienda_id.id
          : asesor.tienda_id;

      const gerenteExistente = empleadosAsignados.find(
        (e) =>
          e.cargoAsignado === gerenteCargo.nombre.toLowerCase() &&
          e.tiendaId === tiendaId
      );

      if (gerenteExistente) {
        setError(
          `Ya hay un gerente asignado para esta tienda: ${gerenteExistente.asesor.nombre}`
        );
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Agregar empleado temporalmente para calcular todos los presupuestos
      const empleadosConNuevo = [
        ...empleadosAsignados.map((e) => ({
          asesor: e.asesor,
          cargoAsignado: e.cargoAsignado,
        })),
        { asesor, cargoAsignado: cargoSeleccionado },
      ];

      // Calcular presupuestos para todos los empleados
      const presupuestosCalculados = await calcularPresupuestosTodosEmpleados(
        empleadosConNuevo
      );
      if (presupuestosCalculados === null) {
        setError(
          "No se pudo calcular el presupuesto. Verifique que existan datos de tienda y porcentajes."
        );
        return;
      }

      // Crear lista actualizada de empleados con presupuestos recalculados
      const empleadosActualizados: EmpleadoAsignado[] = empleadosConNuevo.map(
        (empleadoConRol) => {
          // Extraer tienda_id correctamente (puede ser objeto o número)
          let tiendaIdFinal: number;
          if (
            typeof empleadoConRol.asesor.tienda_id === "object" &&
            empleadoConRol.asesor.tienda_id !== null
          ) {
            tiendaIdFinal = empleadoConRol.asesor.tienda_id.id;
          } else {
            tiendaIdFinal = empleadoConRol.asesor.tienda_id as number;
          }

          return {
            asesor: empleadoConRol.asesor,
            presupuesto: presupuestosCalculados[empleadoConRol.asesor.id] || 0,
            tiendaId: tiendaIdFinal,
            cargoAsignado: empleadoConRol.cargoAsignado,
          };
        }
      );

      setEmpleadosAsignados(empleadosActualizados);
      setCodigoInput("");
      setSuccess(
        `Empleado ${
          asesor.nombre || `Código ${codigo}`
        } agregado correctamente.`
      );
    } catch (err) {
      console.error("Error agregando empleado:", err);
      setError("Error al agregar el empleado");
    } finally {
      setLoading(false);
    }
  };

  const calcularPresupuestosTodosEmpleados = async (
    empleadosConRoles: Array<{ asesor: DirectusAsesor; cargoAsignado: string }>
  ): Promise<{ [asesorId: number]: number } | null> => {
    try {
      if (empleadosConRoles.length === 0) return {};

      // Obtener tienda del primer empleado (todos deberían ser de la misma tienda)
      let tiendaId: number;
      if (
        typeof empleadosConRoles[0].asesor.tienda_id === "object" &&
        empleadosConRoles[0].asesor.tienda_id !== null
      ) {
        // Si es un objeto (viene de BD con relación), extraer el id
        tiendaId = empleadosConRoles[0].asesor.tienda_id.id;
      } else {
        // Si es un número (viene de mock data)
        tiendaId = empleadosConRoles[0].asesor.tienda_id as number;
      }

      // Obtener presupuesto diario de la tienda desde BD Directus
      const presupuestosTienda = await obtenerPresupuestosDiarios(
        tiendaId,
        fechaActual,
        fechaActual
      );

      if (presupuestosTienda.length === 0) {
        return null;
      }

      const presupuestoTienda = presupuestosTienda[0].presupuesto;

      // Obtener porcentajes mensuales desde BD
      const mesAnio = fechaActual.substring(0, 7); // YYYY-MM
      const { obtenerPorcentajesMensuales } = await import(
        "../api/directus/read"
      );
      const porcentajes = await obtenerPorcentajesMensuales(
        undefined, // Ya no usamos tiendaId para porcentajes
        mesAnio
      );

      if (porcentajes.length === 0) {
        return null;
      }

      const porcentajeConfig = porcentajes[0];

      // Contar empleados por CARGO ASIGNADO (mapeando a estructura estándar para cálculo)
      const empleadosPorRol = {
        gerente: empleadosConRoles.filter((e) => e.cargoAsignado === "gerente")
          .length,
        asesor: empleadosConRoles.filter((e) => e.cargoAsignado === "asesor")
          .length,
        cajero: empleadosConRoles.filter((e) => e.cargoAsignado === "cajero")
          .length,
        logistico: empleadosConRoles.filter(
          (e) => e.cargoAsignado === "logistico"
        ).length,
      };

      // Usar nueva lógica de fijo/distributivo
      const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
        presupuestoTienda,
        porcentajeConfig,
        empleadosPorRol
      );

      // Asignar presupuestos individuales usando CARGO ASIGNADO
      const presupuestos: { [asesorId: number]: number } = {};

      empleadosConRoles.forEach((empleadoConRol) => {
        const rolLower = empleadoConRol.cargoAsignado;

        if (
          rolLower === "gerente" ||
          rolLower === "asesor" ||
          rolLower === "cajero" ||
          rolLower === "logistico"
        ) {
          // Para distributivos, dividir el presupuesto total del rol entre empleados
          const cantidadEmpleadosRol =
            empleadosPorRol[rolLower as keyof typeof empleadosPorRol];
          if (cantidadEmpleadosRol > 0) {
            presupuestos[empleadoConRol.asesor.id] = Math.round(
              presupuestosPorRol[rolLower as keyof typeof presupuestosPorRol] /
                cantidadEmpleadosRol
            );
          }
        }
      });

      return presupuestos;
    } catch (err) {
      return null;
    }
  };

  const handleRemoveEmpleado = async (asesorId: number) => {
    try {
      // Filtrar empleado removido
      const empleadosRestantes = empleadosAsignados
        .filter((e) => e.asesor.id !== asesorId)
        .map((e) => e.asesor);

      // Si quedan empleados, recalcular presupuestos
      if (empleadosRestantes.length > 0) {
        const empleadosRestantesConRoles = empleadosRestantes.map(
          (empleado) => ({
            asesor: empleado,
            cargoAsignado: "asesor", // Default for existing employees
          })
        );
        const presupuestosCalculados = await calcularPresupuestosTodosEmpleados(
          empleadosRestantesConRoles
        );
        if (presupuestosCalculados) {
          const empleadosActualizados: EmpleadoAsignado[] =
            empleadosRestantes.map((empleado) => ({
              asesor: empleado,
              presupuesto: presupuestosCalculados[empleado.id] || 0,
              tiendaId: empleado.tienda_id as number,
              cargoAsignado: "asesor", // Default for existing employees
            }));
          setEmpleadosAsignados(empleadosActualizados);
        } else {
          // Si no se pueden calcular, solo filtrar
          setEmpleadosAsignados((prev) =>
            prev.filter((e) => e.asesor.id !== asesorId)
          );
        }
      } else {
        // No quedan empleados
        setEmpleadosAsignados([]);
      }

      setError(null);
      setSuccess("Empleado removido de la asignación diaria.");
    } catch (err) {
      setError("Error al remover el empleado");
    }
  };

  const handleSaveAsignaciones = async () => {
    if (empleadosAsignados.length === 0) {
      setError("Debe asignar al menos un empleado");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Mapear cargo asignado (string) a cargo_id (number)
      const mapearCargoACargoId = (cargoAsignado: string): number => {
        console.log(
          "🔍 Mapeando cargo:",
          cargoAsignado,
          "cargos disponibles:",
          cargosDisponibles
        );
        const cargo = cargosDisponibles.find(
          (c) => c.nombre.toLowerCase() === cargoAsignado.toLowerCase()
        );
        console.log("✅ Cargo encontrado:", cargo);
        return cargo?.id || 2; // Default a asesor si no encuentra
      };

      // Preparar datos para guardar en BD
      const presupuestosParaGuardar = empleadosAsignados.map((empleado) => ({
        asesor: empleado.asesor.id,
        fecha: fechaActual,
        presupuesto: empleado.presupuesto,
        tienda_id: empleado.tiendaId,
        cargo: empleado.cargoAsignado, // Guardar el nombre del cargo asignado para ese día
      }));

      console.log(
        "💾 Datos a guardar en presupuesto_diario_empleados:",
        presupuestosParaGuardar
      );

      console.log("💾 Guardando presupuestos en BD:", presupuestosParaGuardar);

      // Guardar presupuestos en BD
      const presupuestosGuardados = await guardarPresupuestosEmpleados(
        presupuestosParaGuardar
      );
      console.log("✅ Presupuestos guardados en BD:", presupuestosGuardados);

      // Obtener ventas reales de empleados desde la base de datos
      const ventasRealesEmpleados = await obtenerVentasEmpleados(
        undefined, // Todas las tiendas
        fechaActual
      );

      // Filtrar ventas solo para empleados asignados
      const empleadosAsignadosIds = presupuestosGuardados.map(
        (p) => p.asesor as number
      );

      const ventasFiltradas = ventasRealesEmpleados.filter((venta) =>
        empleadosAsignadosIds.includes(venta.asesor_id as number)
      );

      console.log(
        "📊 Ventas encontradas para empleados asignados:",
        ventasFiltradas
      );

      // Verificar que todos los empleados tengan ventas
      const empleadosSinVentas = presupuestosGuardados.filter(
        (presupuesto) =>
          !ventasFiltradas.some(
            (venta) => venta.asesor_id === presupuesto.asesor
          )
      );

      if (empleadosSinVentas.length > 0) {
        console.warn("⚠️ Empleados sin ventas:", empleadosSinVentas);
        // No bloquear si no tienen ventas, solo loggear
      }

      // Guardar ventas en BD si existen
      if (ventasFiltradas.length > 0) {
        const ventasGuardadas = await guardarVentasEmpleados(ventasFiltradas);
        console.log("✅ Ventas guardadas en BD:", ventasGuardadas);
      }

      setSuccess(
        `Empleados asignados correctamente. ${empleadosAsignados.length} empleados guardados en BD para ${fechaActual}`
      );

      // Recargar datos para mostrar la tabla actualizada
      onAssignmentComplete?.(ventasFiltradas);
    } catch (err) {
      console.error("❌ Error al guardar las asignaciones:", err);
      setError("Error al guardar las asignaciones en BD");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddEmpleado();
    }
  };

  const getCargoNombre = (cargoId: any): string => {
    // Si es un objeto con nombre, devolverlo
    if (typeof cargoId === "object" && cargoId?.nombre) {
      return cargoId.nombre;
    }
    // Si es un número, buscar en cargosDisponibles
    if (typeof cargoId === "number") {
      const cargo = cargosDisponibles.find(
        (c: DirectusCargo) => c.id === cargoId
      );
      return cargo?.nombre || "Asesor";
    }
    return "Asesor";
  };

  const getTiendaNombre = (tiendaId: any): string => {
    // Si es un objeto con nombre, devolverlo
    if (typeof tiendaId === "object" && tiendaId?.nombre) {
      return tiendaId.nombre;
    }
    // Si es un número, devolver el ID como string
    if (typeof tiendaId === "number") {
      return `Tienda ${tiendaId}`;
    }
    return `Tienda ${tiendaId}`;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={empleadosAsignados.length > 0}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Work />
        Asignar Empleados para {selectedMonth} - {fechaActual}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Seleccione los empleados que trabajarán hoy. El sistema calculará
          automáticamente sus presupuestos basados en los porcentajes mensuales
          y el presupuesto diario de la tienda.
        </DialogContentText>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Input para agregar empleado */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Agregar Empleado por Código
            </Typography>
            <Box
              sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}
            >
              <TextField
                sx={{ flex: 1 }}
                type="text"
                placeholder="Ingrese código de asesor"
                value={codigoInput}
                onChange={(e) =>
                  setCodigoInput(e.target.value.replace(/\D/g, ""))
                }
                onKeyPress={handleKeyPress}
                disabled={loading || saving}
              />
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={cargoSeleccionado}
                  onChange={(e) => setCargoSeleccionado(e.target.value)}
                  label="Cargo"
                  disabled={loading || saving}
                  size="small"
                >
                  {cargosDisponibles.map((cargo) => (
                    <MenuItem key={cargo.id} value={cargo.nombre.toLowerCase()}>
                      {cargo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={handleAddEmpleado}
                variant="outlined"
                disabled={!codigoInput.trim() || loading || saving}
                sx={{ minWidth: "auto", px: 2 }}
              >
                <Person />
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Ingrese el código del empleado y seleccione el cargo que tendrá
              hoy
            </Typography>
          </Box>

          {/* Mensajes de estado */}
          {error && (
            <Alert severity="error" icon={<Error />}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" icon={<CheckCircle />}>
              {success}
            </Alert>
          )}

          {/* Lista de empleados asignados */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Empleados Asignados Hoy ({empleadosAsignados.length})
            </Typography>
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 2,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {empleadosAsignados.length === 0 ? (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  No hay empleados asignados para hoy
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {empleadosAsignados.map((empleado, index) => (
                    <Card
                      key={`empleado-${empleado.asesor.id}-${index}`}
                      variant="outlined"
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {empleado.asesor.nombre ||
                                  `Empleado ${empleado.asesor.id}`}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Código: {empleado.asesor.id} • Documento:{" "}
                                {empleado.asesor.documento}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Chip
                                  label={`${getCargoNombre(
                                    empleado.asesor.cargo_id
                                  )} → ${empleado.cargoAsignado}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={getTiendaNombre(
                                    empleado.asesor.tienda_id
                                  )}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" color="primary">
                              ${empleado.presupuesto.toLocaleString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Presupuesto diario
                            </Typography>
                            <IconButton
                              onClick={() =>
                                handleRemoveEmpleado(empleado.asesor.id)
                              }
                              size="small"
                              sx={{ color: "error.main", ml: 1 }}
                              disabled={saving}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ mr: 1 }}
          disabled={saving}
        >
          {empleadosAsignados.length === 0 ? "Cerrar" : "Cancelar"}
        </Button>
        <Button
          onClick={handleSaveAsignaciones}
          variant="contained"
          disabled={empleadosAsignados.length === 0 || saving}
        >
          {saving
            ? "Guardando..."
            : `Guardar Asignación (${empleadosAsignados.length} empleados)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
