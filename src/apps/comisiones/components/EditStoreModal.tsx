import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  IconButton,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close,
  Store,
  CalendarToday,
  AttachMoney,
  People,
  Add,
  Delete,
  Save,
  Edit,
} from "@mui/icons-material";
import { DirectusTienda, DirectusAsesor } from "../types";
import { useStoreManagement } from "../hooks/useStoreManagement";
import { useUserPolicies } from "../hooks/useUserPolicies";
import { obtenerTiendas } from "../api/directus/read";

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  selectedMonth?: string;
}

export const EditStoreModal: React.FC<EditStoreModalProps> = ({
  isOpen,
  onClose,
  onSaveComplete,
  selectedMonth,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { canAssignEmployees } = useUserPolicies();

  const {
    tienda,
    presupuesto,
    fecha,
    empleados,
    empleadosSeleccionados,
    loading,
    error,
    success,
    canSave,
    saving,
    setTienda,
    setPresupuesto,
    setFecha,
    handleAddEmpleado,
    handleRemoveEmpleado,
    handleSaveChanges,
    handleLoadStoreData,
    handleClearForm,
    clearMessages,
    getStoreEmployees,
    validateForm,
  } = useStoreManagement(onSaveComplete);

  // Estados locales
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">("");
  const [presupuestoInput, setPresupuestoInput] = useState("");
  const [fechaInput, setFechaInput] = useState(new Date().toISOString().split("T")[0]);
  const [tiendasDisponibles, setTiendasDisponibles] = useState<DirectusTienda[]>([]);
  const [tiendasLoading, setTiendasLoading] = useState(false);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      handleClearForm();
      clearMessages();
      setTiendaSeleccionada("");
      setPresupuestoInput("");
      setFechaInput(new Date().toISOString().split("T")[0]);
      loadTiendas();
    }
  }, [isOpen, handleClearForm, clearMessages]);

  // Cargar tiendas desde la API
  const loadTiendas = async () => {
    try {
      setTiendasLoading(true);
      const tiendasData = await obtenerTiendas();
      setTiendasDisponibles(tiendasData);
    } catch (err: any) {
      console.error('Error al cargar tiendas:', err.message);
    } finally {
      setTiendasLoading(false);
    }
  };

  // Sincronizar empleadosSeleccionados del hook con el estado local
  useEffect(() => {
    // Esta línea asegura que React re-renderice cuando cambien los empleados seleccionados
    // La lógica de filtrado ya usa empleadosSeleccionados del hook directamente
  }, [empleadosSeleccionados]);

  // Manejar carga de datos de tienda
  const handleTiendaChange = async (tiendaId: number) => {
    setTiendaSeleccionada(tiendaId);
    clearMessages();
    
    if (tiendaId) {
      await handleLoadStoreData(tiendaId, fechaInput);
    }
  };

  // Manejar cambio de presupuesto
  const handlePresupuestoChange = (value: string) => {
    setPresupuestoInput(value);
    setPresupuesto?.(value);
  };

  // Manejar cambio de fecha
  const handleFechaChange = (value: string) => {
    setFechaInput(value);
    setFecha?.(value);
    // Si hay una tienda seleccionada, recargar datos con la nueva fecha
    if (tiendaSeleccionada && typeof tiendaSeleccionada === 'number') {
      handleLoadStoreData?.(tiendaSeleccionada, value);
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    clearMessages();
    handleClearForm();
    onClose();
  };

  // Manejar guardado
  const handleSave = async () => {
    if (validateForm()) {
      await handleSaveChanges();
      if (success && !error) {
        setTimeout(() => {
          if (onSaveComplete) {
            onSaveComplete();
          }
          handleClose();
        }, 1500);
      }
    }
  };

  // Obtener empleados disponibles para agregar (no seleccionados)
  const empleadosParaAgregar = empleados.filter(
    emp => !empleadosSeleccionados.find(sel => sel.id === emp.id)
  );

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[24],
          maxHeight: isMobile ? "95vh" : "85vh",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Edit color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Editar Tienda
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Mensajes */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Formulario principal */}
        <Grid container spacing={3}>
          {/* Selección de tienda */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Tienda</InputLabel>
              <Select
                value={tiendaSeleccionada}
                onChange={(e) => handleTiendaChange(e.target.value as number)}
                disabled={loading || tiendasLoading}
                label="Seleccionar Tienda"
              >
                {tiendasDisponibles.map((tienda) => (
                  <MenuItem key={tienda.id} value={tienda.id}>
                    {tienda.nombre} - {tienda.empresa}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Fecha */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              value={fechaInput}
              onChange={(e) => handleFechaChange(e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Presupuesto */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Presupuesto Total"
              value={presupuestoInput}
              onChange={(e) => handlePresupuestoChange(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: <AttachMoney />,
              }}
              placeholder="0.00"
            />
          </Grid>
        </Grid>

        {/* Información de la tienda seleccionada */}
        {tienda && (
          <Paper sx={{ p: 2, mt: 3, backgroundColor: theme.palette.grey[50] }}>
            <Typography variant="h6" gutterBottom>
              Información de la Tienda
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Nombre: {tienda.nombre}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Empresa: {tienda.empresa}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Gestión de empleados */}
        {tienda && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gestión de Empleados
            </Typography>
            
            <Grid container spacing={3}>
              {/* Empleados seleccionados */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Empleados Seleccionados ({empleadosSeleccionados.length})
                  </Typography>
                  <List dense sx={{ height: 300, overflow: 'auto' }}>
                    {empleadosSeleccionados.map((empleado) => (
                      <ListItem key={empleado.id} divider>
                        <ListItemText
                          primary={empleado.nombre || `Empleado ${empleado.id}`}
                          secondary={`Documento: ${empleado.documento}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveEmpleado(empleado.id)}
                            disabled={saving}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {empleadosSeleccionados.length === 0 && (
                      <Box sx={{ 
                        textAlign: 'center', 
                        color: 'text.secondary', 
                        mt: 4 
                      }}>
                        No hay empleados seleccionados
                      </Box>
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* Empleados disponibles */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Empleados Disponibles ({empleadosParaAgregar.length})
                  </Typography>
                  <List dense sx={{ height: 300, overflow: 'auto' }}>
                    {empleadosParaAgregar.map((empleado) => (
                      <ListItem key={empleado.id} divider>
                        <ListItemText
                          primary={empleado.nombre || `Empleado ${empleado.id}`}
                          secondary={`Documento: ${empleado.documento}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => {
                              handleAddEmpleado(empleado);
                              // Forzar actualización de la interfaz
                              setTimeout(() => {
                                // Trigger re-render
                              }, 100);
                            }}
                            disabled={saving}
                            color="primary"
                          >
                            <Add />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {empleadosParaAgregar.length === 0 && (
                      <Box sx={{ 
                        textAlign: 'center', 
                        color: 'text.secondary', 
                        mt: 4 
                      }}>
                        No hay empleados disponibles para agregar
                      </Box>
                    )}
                  </List>
                </Paper>
              </Grid>
            </Grid>

            {/* Resumen */}
            <Paper sx={{ p: 2, mt: 2, backgroundColor: theme.palette.primary.light }}>
              <Typography variant="subtitle1" gutterBottom>
                Resumen
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">
                    Presupuesto Total: ${parseFloat(presupuestoInput || "0").toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2">
                    Presupuesto por Empleado: ${empleadosSeleccionados.length > 0 
                      ? (parseFloat(presupuestoInput || "0") / empleadosSeleccionados.length).toFixed(2)
                      : "0.00"
                    }
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2">
                    Total Empleados: {empleadosSeleccionados.length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!canSave || saving}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};