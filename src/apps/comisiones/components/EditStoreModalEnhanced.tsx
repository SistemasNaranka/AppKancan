import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Tab,
  Tabs,
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
  TableChart,
  AccountTree,
} from "@mui/icons-material";
import { DirectusTienda, DirectusAsesor, DirectusCargo } from "../types";
import { useStoreManagementEnhanced } from "../hooks/useStoreManagementEnhanced";
import EditStoreModalTable from "./EditStoreModalTable";

interface EditStoreModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  selectedMonth?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`edit-store-tabpanel-${index}`}
      aria-labelledby={`edit-store-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const EditStoreModalEnhanced: React.FC<EditStoreModalEnhancedProps> = ({
  isOpen,
  onClose,
  onSaveComplete,
  selectedMonth,
}) => {


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const {
    tienda,
    presupuesto,
    fecha,
    empleados,
    empleadosSeleccionados,
    empleadosFecha,
    loading,
    error,
    success,
    canSave,
    saving,
    cargos,
    tiendasDisponibles,
    distribucionCalculada,
    totalDistribucion,
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
  } = useStoreManagementEnhanced(onSaveComplete);

  // Estados locales
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">("");
  const [presupuestoInput, setPresupuestoInput] = useState("");
  const [fechaInput, setFechaInput] = useState(new Date().toISOString().split("T")[0]);
  const [tabValue, setTabValue] = useState(0);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      handleClearForm();
      clearMessages();
      setTiendaSeleccionada("");
      setPresupuestoInput("");
      setFechaInput(new Date().toISOString().split("T")[0]);
      setTabValue(0);
    } else {
      // Limpiar cuando el modal se cierra
      clearMessages();
      handleClearForm();
    }
  }, [isOpen, handleClearForm, clearMessages]);

  // Sincronizar con el hook
  useEffect(() => {
    setPresupuestoInput(presupuesto);
    setFechaInput(fecha);
  }, [presupuesto, fecha]);



  // Manejar carga de datos de tienda
  const handleTiendaChange = async (tiendaId: number) => {
    setTiendaSeleccionada(tiendaId);
    clearMessages();
    
    if (tiendaId) {
      await handleLoadStoreData(tiendaId, fechaInput);
      // Cambiar automáticamente a la pestaña de tabla
      setTabValue(1);
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
        // Cerrar inmediatamente sin delay
        if (onSaveComplete) {
          onSaveComplete();
        }
        handleClose();
      }
    }
  };

  // Obtener empleados disponibles para agregar (no seleccionados)
  const empleadosParaAgregar = empleadosFecha.filter(
    emp => !empleadosSeleccionados.find(sel => sel.id === emp.id)
  );

  // Obtener roles únicos de los empleados
  const rolesUnicos = useMemo(() => {
    const roles = new Set<string>();
    empleadosSeleccionados.forEach(emp => {
      const cargoNombre = cargos.find(c => c.id === (typeof emp.cargo_id === 'object' ? emp.cargo_id.id : emp.cargo_id))?.nombre || '';
      roles.add(cargoNombre);
    });
    return Array.from(roles);
  }, [empleadosSeleccionados, cargos]);

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
            Editar Tienda - Distribución Automática
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Store />} label="Configuración" />
          <Tab icon={<TableChart />} label="Vista Previa Tabla" disabled={!tienda} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Mensajes */}
        {(error || success) && (
          <Box sx={{ p: 2 }}>
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
          </Box>
        )}

        <TabPanel value={tabValue} index={0}>
          {/* Formulario principal */}
          <Grid container spacing={3}>
            {/* Selección de tienda */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Tienda</InputLabel>
                <Select
                  value={tiendaSeleccionada}
                  onChange={(e) => handleTiendaChange(e.target.value as number)}
                  disabled={loading}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Empleados disponibles: {empleados.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Empleados trabajaron el {fechaInput}: {empleadosFecha.length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Gestión de empleados */}
          {tienda && empleadosFecha.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestión de Empleados (Fecha: {fechaInput})
              </Typography>
              
              <Grid container spacing={3}>
                {/* Empleados seleccionados */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Empleados Seleccionados ({empleadosSeleccionados.length})
                    </Typography>
                    <List dense sx={{ height: 300, overflow: 'auto' }}>
                      {empleadosSeleccionados.map((empleado) => {
                        const cargo = cargos.find(c => c.id === (typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id));
                        return (
                          <ListItem key={empleado.id} divider>
                            <ListItemText
                              primary={empleado.nombre || `Empleado ${empleado.id}`}
                              secondary={
                                <Box>
                                  <Typography variant="caption">
                                    Doc: {empleado.documento}
                                  </Typography>
                                  <br />
                                  <Chip 
                                    label={cargo?.nombre || 'Sin cargo'} 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              }
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
                        );
                      })}
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
                      {empleadosParaAgregar.map((empleado) => {
                        const cargo = cargos.find(c => c.id === (typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id));
                        return (
                          <ListItem key={empleado.id} divider>
                            <ListItemText
                              primary={empleado.nombre || `Empleado ${empleado.id}`}
                              secondary={
                                <Box>
                                  <Typography variant="caption">
                                    Doc: {empleado.documento}
                                  </Typography>
                                  <br />
                                  <Chip 
                                    label={cargo?.nombre || 'Sin cargo'} 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleAddEmpleado(empleado)}
                                disabled={saving}
                                color="primary"
                              >
                                <Add />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                      {empleadosParaAgregar.length === 0 && (
                        <Box sx={{ 
                          textAlign: 'center', 
                          color: 'text.secondary', 
                          mt: 4 
                        }}>
                          Todos los empleados disponibles ya están seleccionados
                        </Box>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              {/* Resumen de distribución */}
              {empleadosSeleccionados.length > 0 && presupuesto && parseFloat(presupuesto) > 0 && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: theme.palette.primary.light }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resumen de Distribución
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2">
                        Presupuesto Total: ${parseFloat(presupuesto).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2">
                        Por Empleado: ${empleadosSeleccionados.length > 0 
                          ? (parseFloat(presupuesto) / empleadosSeleccionados.length).toFixed(2)
                          : "0.00"
                        }
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2">
                        Total Empleados: {empleadosSeleccionados.length}
                      </Typography>
                    </Grid>
                    {rolesUnicos.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" gutterBottom>
                          Roles:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {rolesUnicos.map(rol => (
                            <Chip key={rol} label={rol} size="small" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {tienda && empleadosSeleccionados.length > 0 && presupuesto ? (
            <EditStoreModalTable
              tienda={tienda}
              presupuestoTotal={parseFloat(presupuesto) || 0}
              empleadosSeleccionados={empleadosSeleccionados}
              cargos={cargos}
              fecha={fecha}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Selecciona una tienda, fecha y presupuesto para ver la vista previa de la tabla
              </Typography>
            </Box>
          )}
        </TabPanel>
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

export default EditStoreModalEnhanced;