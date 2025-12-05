import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { Add, Delete, Error, Store } from "@mui/icons-material";
import { useCommission } from "../contexts/CommissionContext";
import { validateManagerPercentage } from "../lib/validation";
import { StaffMember, BudgetRecord } from "../types";
import { v4 as uuidv4 } from "uuid";
import { obtenerTiendas } from "../api/directus/read";

interface ConfigurationPanelProps {
  mes: string;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  mes,
}) => {
  const {
    state,
    updateMonthConfig,
    addStaffMember,
    removeStaffMember,
    getMonthConfig,
    setBudgets,
  } = useCommission();
  const [porcentajeGerente, setPorcentajeGerente] = useState(
    getMonthConfig(mes)?.porcentaje_gerente || 10
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    nombre: "",
    tienda: "",
    fecha: "",
    rol: "asesor" as "gerente" | "asesor" | "cajero",
  });
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    tienda: "",
    fecha: new Date().toISOString().split("T")[0],
    presupuesto_total: 0,
  });
  const [tiendas, setTiendas] = useState<any[]>([]);

  // Cargar tiendas al montar el componente
  useEffect(() => {
    const loadTiendas = async () => {
      try {
        const tiendasData = await obtenerTiendas();
        setTiendas(tiendasData);
      } catch (error) {
        console.error("Error cargando tiendas:", error);
        setTiendas([]);
      }
    };
    loadTiendas();
  }, []);

  const handleUpdatePercentage = () => {
    const validationErrors = validateManagerPercentage(porcentajeGerente);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
    } else {
      updateMonthConfig(mes, porcentajeGerente);
      setErrors([]);
    }
  };

  const handleAddStaff = () => {
    if (
      !newStaff.nombre.trim() ||
      !newStaff.tienda.trim() ||
      !newStaff.fecha.trim()
    ) {
      setErrors(["Por favor completa todos los campos"]);
      return;
    }

    const member: StaffMember = {
      id: uuidv4(),
      nombre: newStaff.nombre,
      tienda: newStaff.tienda,
      fecha: newStaff.fecha,
      rol: newStaff.rol,
    };

    addStaffMember(member);
    setNewStaff({
      nombre: "",
      tienda: "",
      fecha: "",
      rol: "asesor" as "gerente" | "asesor" | "cajero",
    });
    setShowAddStaff(false);
    setErrors([]);
  };

  const handleAddBudget = () => {
    if (
      !newBudget.tienda.trim() ||
      !newBudget.fecha.trim() ||
      newBudget.presupuesto_total <= 0
    ) {
      setErrors(["Por favor completa todos los campos con valores válidos"]);
      return;
    }

    const budget: BudgetRecord = {
      tienda: newBudget.tienda,
      fecha: newBudget.fecha,
      presupuesto_total: newBudget.presupuesto_total,
    };

    // Agregar al estado existente
    setBudgets([...state.budgets, budget]);

    setNewBudget({
      tienda: "",
      fecha: new Date().toISOString().split("T")[0],
      presupuesto_total: 0,
    });
    setShowAddBudget(false);
    setErrors([]);
  };

  const staffForMonth = state.staff.filter((s) => {
    const staffDate = new Date(s.fecha + "T00:00:00Z");
    const [mesStr, yearStr] = mes.split(" ");
    const months: Record<string, number> = {
      Ene: 0,
      Feb: 1,
      Mar: 2,
      Abr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Ago: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dic: 11,
    };
    return (
      staffDate.getUTCMonth() === months[mesStr] &&
      staffDate.getUTCFullYear() === parseInt(yearStr)
    );
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Configuración de Comisiones
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Configuración de Porcentaje de Gerente */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Configuración de Porcentaje - {mes}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "end", gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Porcentaje fijo del gerente (0-10%)"
              inputProps={{ min: 0, max: 10, step: 0.1 }}
              value={porcentajeGerente}
              onChange={(e) =>
                setPorcentajeGerente(parseFloat(e.target.value) || 0)
              }
              placeholder="Ingrese el porcentaje del gerente"
            />
            <Button onClick={handleUpdatePercentage} variant="contained">
              Guardar Configuración
            </Button>
          </Box>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" icon={<Error />}>
            {errors.map((error, i) => (
              <Typography
                key={`error-${i}-${Date.now()}-${Math.random()}`}
                variant="body2"
              >
                {error}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Gestión de Presupuestos de Tienda */}
        <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Presupuestos Diarios de Tienda</Typography>
            <Button
              onClick={() => setShowAddBudget(!showAddBudget)}
              variant="outlined"
              size="small"
              startIcon={<Store />}
            >
              Agregar Presupuesto
            </Button>
          </Box>

          {showAddBudget && (
            <Box
              sx={{
                bgcolor: "grey.50",
                p: 3,
                borderRadius: 1,
                border: "1px solid #e0e0e0",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <FormControl sx={{ flex: "1 1 45%", minWidth: "200px" }}>
                    <InputLabel>Tienda</InputLabel>
                    <Select
                      value={newBudget.tienda}
                      label="Tienda"
                      onChange={(e) =>
                        setNewBudget({ ...newBudget, tienda: e.target.value })
                      }
                    >
                      {tiendas.map((tienda) => (
                        <MenuItem key={tienda.id} value={tienda.nombre}>
                          {tienda.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    sx={{ flex: "1 1 45%", minWidth: "200px" }}
                    type="date"
                    label="Fecha"
                    InputLabelProps={{ shrink: true }}
                    value={newBudget.fecha}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, fecha: e.target.value })
                    }
                  />
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  label="Presupuesto Total Diario"
                  inputProps={{ min: 0, step: 1000 }}
                  value={newBudget.presupuesto_total}
                  onChange={(e) =>
                    setNewBudget({
                      ...newBudget,
                      presupuesto_total: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ingrese el presupuesto total para el día"
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  onClick={handleAddBudget}
                  variant="contained"
                  size="small"
                >
                  Agregar Presupuesto
                </Button>
                <Button
                  onClick={() => setShowAddBudget(false)}
                  variant="outlined"
                  size="small"
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          )}

          {state.budgets.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No hay presupuestos configurados
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {state.budgets.map((budget, index) => (
                <Box
                  key={`budget-${budget.tienda}-${budget.fecha}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "grey.50",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {budget.tienda}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {budget.fecha} • $
                      {budget.presupuesto_total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Gestión de Personal */}
        <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Personal del mes</Typography>
            <Button
              onClick={() => setShowAddStaff(!showAddStaff)}
              variant="outlined"
              size="small"
              startIcon={<Add />}
            >
              Agregar Personal
            </Button>
          </Box>

          {showAddStaff && (
            <Box
              sx={{
                bgcolor: "grey.50",
                p: 3,
                borderRadius: 1,
                border: "1px solid #e0e0e0",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    sx={{ flex: "1 1 45%", minWidth: "200px" }}
                    label="Nombre"
                    placeholder="Nombre"
                    value={newStaff.nombre}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, nombre: e.target.value })
                    }
                  />
                  <TextField
                    sx={{ flex: "1 1 45%", minWidth: "200px" }}
                    label="Tienda"
                    placeholder="Tienda"
                    value={newStaff.tienda}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, tienda: e.target.value })
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    sx={{ flex: "1 1 45%", minWidth: "200px" }}
                    type="date"
                    label="Fecha"
                    InputLabelProps={{ shrink: true }}
                    value={newStaff.fecha}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, fecha: e.target.value })
                    }
                  />
                  <FormControl sx={{ flex: "1 1 45%", minWidth: "200px" }}>
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={newStaff.rol}
                      label="Rol"
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          rol: e.target.value as
                            | "gerente"
                            | "asesor"
                            | "cajero",
                        })
                      }
                    >
                      <MenuItem value="gerente">Gerente</MenuItem>
                      <MenuItem value="asesor">Asesor</MenuItem>
                      <MenuItem value="cajero">Cajero</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  onClick={handleAddStaff}
                  variant="contained"
                  size="small"
                >
                  Agregar
                </Button>
                <Button
                  onClick={() => setShowAddStaff(false)}
                  variant="outlined"
                  size="small"
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          )}

          {staffForMonth.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No hay personal asignado para este mes
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {staffForMonth.map((staff, index) => (
                <Box
                  key={`staff-${staff.id}-${index}-${Date.now()}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "grey.50",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {staff.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {staff.tienda} • {staff.rol} • {staff.fecha}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => removeStaffMember(staff.id)}
                    size="small"
                    sx={{ color: "error.main" }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
};
