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
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Close,
  Store,
  AttachMoney,
  People,
  Add,
  Delete,
  Save,
  Edit,
  TableChart,
} from "@mui/icons-material";
import { DirectusTienda, DirectusAsesor, DirectusCargo } from "../types";
import { obtenerTiendas, obtenerAsesores, obtenerCargos } from "../api/directus/read";
import { 
  guardarPresupuestosTienda, 
  guardarPresupuestosEmpleados, 
  eliminarPresupuestosEmpleados 
} from "../api/directus/create";
import { useUnifiedCommissionData } from "../hooks/useUnifiedCommissionData";
import { formatCurrency } from "../lib/utils";
import { calculateEmployeeCommission } from "../lib/calculations.commissions";
import { calculateMesResumenAgrupado } from "../lib/calculations";
import { green, blue, orange, grey } from "@mui/material/colors";

// Fixed interface definition to resolve Vite caching issue

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
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

interface EditStoreModalFinalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  selectedMonth?: string;
}

export const EditStoreModalFinal: React.FC<EditStoreModalFinalProps> = ({
  isOpen,
  onClose,
  onSaveComplete,
  selectedMonth,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Estados principales
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number | "">("");
  const [presupuestoInput, setPresupuestoInput] = useState("");
  const [tabValue, setTabValue] = useState(0);
  
  const [tienda, setTienda] = useState<DirectusTienda | null>(null);
  const [empleados, setEmpleados] = useState<DirectusAsesor[]>([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<DirectusAsesor[]>([]);
  const [cargos, setCargos] = useState<DirectusCargo[]>([]);
  const [tiendasDisponibles, setTiendasDisponibles] = useState<DirectusTienda[]>([]);
  const [empleadosConDatos, setEmpleadosConDatos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Limpiar el formulario y cargar datos iniciales
      clearForm();
      loadInitialData();
    } else {
      // Limpiar todo cuando el modal se cierra
      cleanupOnClose();
    }
    

  }, [isOpen]);

  // Usar datos del mes seleccionado - CONFIGURACIÓN OPTIMIZADA para modal
  const { data: commissionData, refetch: refetchCommissionData, isLoading: isLoadingCommissionData } = useUnifiedCommissionData(selectedMonth || "Dic 2025");
  
  // NO refrescar datos automáticamente al abrir el modal para evitar conflictos de carga
  // useEffect(() => {
  //   if (isOpen && refetchCommissionData && !isLoadingCommissionData) {
  //     console.log('🔄 Refreshing modal data to match main table...');
  //     // Usar setTimeout para evitar múltiples llamadas simultáneas
  //     const timer = setTimeout(() => {
  //       if (isOpen) { // Verificar que el modal sigue abierto antes de refrescar
  //         refetchCommissionData();
  //       }
  //     }, 300);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [isOpen, refetchCommissionData, isLoadingCommissionData]);
  
  // Procesar datos usando la misma lógica que la tabla principal
  const mesResumen = useMemo(() => {
    if (!commissionData || !commissionData.budgets || commissionData.budgets.length === 0) {
      return null;
    }

    const { budgets = [], staff = [], ventas = [], presupuestosEmpleados = [] } = commissionData;
    const monthConfig = commissionData.monthConfigs?.find((c) => c.mes === selectedMonth);
    const porcentajeGerente = monthConfig?.porcentaje_gerente || 10;

    return calculateMesResumenAgrupado(
      selectedMonth || "Dic 2025",
      budgets,
      staff,
      ventas,
      porcentajeGerente,
      presupuestosEmpleados
    );
  }, [commissionData, selectedMonth]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const tiendasToUse = await obtenerTiendas();
      const cargosToUse = await obtenerCargos();
      
      setTiendasDisponibles(tiendasToUse);
      setCargos(cargosToUse);
    } catch (err: any) {
      setError(`Error al cargar datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTiendaSeleccionada("");
    setPresupuestoInput("");
    setTabValue(0);
    setTienda(null);
    setEmpleados([]);
    setEmpleadosSeleccionados([]);
    setEmpleadosConDatos([]);
    setError(null);
    setSuccess(null);
  };
  
  // Limpiar cuando el modal se cierra
  const cleanupOnClose = () => {
    clearForm();
    // Cancelar cualquier estado de carga activo
    setLoading(false);
    setSaving(false);
  };
  


  // Obtener datos de empleados del mes seleccionado
  const getEmpleadosDelMes = (tiendaNombre: string) => {
    if (!commissionData?.staff) return [];
    
    return commissionData.staff.filter(
      empleado => empleado.tienda === tiendaNombre
    );
  };

  // Cargar datos de una tienda específica usando la misma lógica que la tabla principal
  const handleTiendaChange = async (tiendaId: number) => {
    setTiendaSeleccionada(tiendaId);
    clearMessages();
    
    try {
      setLoading(true);
      
      // Encontrar la tienda
      const tiendaData = tiendasDisponibles.find(t => t.id === tiendaId);
      if (!tiendaData) {
        setError("Tienda no encontrada");
        return;
      }
      setTienda(tiendaData);

      // Cargar empleados de la tienda
      const asesoresData = await obtenerAsesores();
      const empleadosTienda = asesoresData.filter(asesor => {
        const asesorTiendaId = typeof asesor.tienda_id === 'object' 
          ? asesor.tienda_id.id 
          : asesor.tienda_id;
        return asesorTiendaId === tiendaId;
      });
      setEmpleados(empleadosTienda);

      // USAR LOS DATOS YA PROCESADOS DEL MES RESUMEN (igual que la tabla principal)
      if (!mesResumen) {
        console.warn('⚠️ No processed data available yet, loading basic store data...');
        
        // CARGAR DATOS BÁSICOS DE LA TIENDA SIN RESUMEN PROCESADO
        console.log('📊 Loading basic store data:', {
          tiendaNombre: tiendaData.nombre,
          totalEmpleadosTienda: empleadosTienda.length,
          commissionDataAvailable: !!commissionData,
          budgetsCount: commissionData?.budgets?.length || 0
        });
        
        // Configurar datos básicos sin resumen procesado
        setEmpleadosConDatos([]);
        setEmpleadosSeleccionados(empleadosTienda);
        setPresupuestoInput('0');
        
        setSuccess(`Tienda ${tiendaData.nombre} cargada (${empleadosTienda.length} empleados). Configure el presupuesto para comenzar.`);
        return;
      }
      
      console.log('✅ Using processed summary data:', {
        totalTiendas: mesResumen.tiendas.length,
        selectedStore: tiendaData.nombre,
        availableStores: mesResumen.tiendas.map(t => t.tienda)
      });
      
      // Buscar la tienda en el resumen procesado
      const tiendaResumen = mesResumen.tiendas.find(t => 
        t.tienda === tiendaData.nombre || 
        t.tienda_id === tiendaId ||
        t.tienda.includes(tiendaData.nombre)
      );
      
      if (!tiendaResumen) {
        console.error('❌ Store not found in processed data:', {
          lookingFor: tiendaData.nombre,
          tiendaId,
          availableStores: mesResumen.tiendas.map(t => ({
            name: t.tienda,
            id: t.tienda_id
          }))
        });
        
        // Fallback: mostrar mensaje informativo en lugar de error
        setError(`Tienda ${tiendaData.nombre} encontrada en base de datos, pero sin datos de comisiones para ${selectedMonth}. Los datos aparecerán después de guardar presupuestos.`);
        
        // Limpiar selección pero mantener la tienda seleccionada
        setEmpleadosConDatos([]);
        setEmpleadosSeleccionados([]);
        setPresupuestoInput('0');
        return;
      }
      
      // Debug logging
      console.log('🔍 Debug Modal Data Loading:', {
        selectedMonth,
        tiendaNombre: tiendaData.nombre,
        empleadosTienda: empleadosTienda.length,
        empleadosResumen: tiendaResumen.empleados.length,
        presupuestoTienda: tiendaResumen.presupuesto_tienda,
        ventasTienda: tiendaResumen.ventas_tienda
      });
      
      // CREAR EMPLEADOS CON DATOS DEL RESUMEN (igual que la tabla principal)
      const empleadosConDatosDelMes: any[] = [];
      
      // 1. AGREGAR EMPLEADOS QUE TIENEN DATOS EN EL RESUMEN CON MATCHING ROBUSTO
      const empleadosEncontrados = new Set();
      
      tiendaResumen.empleados.forEach(empleadoResumen => {
        console.log(`🔍 Looking for employee: "${empleadoResumen.nombre}" (ID: ${empleadoResumen.id})`);
        
        // Búsqueda múltiple para encontrar empleados
        let empleadoDB = null;
        
        // Método 1: Buscar por ID exacto
        empleadoDB = empleadosTienda.find(emp => emp.id.toString() === empleadoResumen.id.toString());
        
        // Método 2: Buscar por nombre exacto
        if (!empleadoDB) {
          empleadoDB = empleadosTienda.find(emp => 
            emp.nombre?.toLowerCase().trim() === empleadoResumen.nombre?.toLowerCase().trim()
          );
        }
        
        // Método 3: Buscar por nombre parcial (primer y último nombre)
        if (!empleadoDB && empleadoResumen.nombre) {
          const nombresResumen = empleadoResumen.nombre.toLowerCase().split(' ').filter(n => n.length > 2);
          empleadoDB = empleadosTienda.find(emp => {
            if (!emp.nombre) return false;
            const nombresDB = emp.nombre.toLowerCase().split(' ').filter(n => n.length > 2);
            // Buscar coincidencia de al menos 2 nombres
            const coincidencias = nombresResumen.filter(n => nombresDB.includes(n)).length;
            return coincidencias >= 2;
          });
        }
        
        // Método 4: Buscar por nombre completo como último recurso
        if (!empleadoDB && empleadoResumen.nombre) {
          empleadoDB = empleadosTienda.find(emp => 
            emp.nombre?.toLowerCase().includes(empleadoResumen.nombre.toLowerCase()) ||
            empleadoResumen.nombre.toLowerCase().includes(emp.nombre?.toLowerCase() || '')
          );
        }
        
        if (empleadoDB) {
          empleadosEncontrados.add(empleadoDB.id);
          
          // Obtener cargo nombre
          const cargo = cargos.find(c => c.id === (typeof empleadoDB.cargo_id === 'object' ? empleadoDB.cargo_id.id : empleadoDB.cargo_id));
          const cargoNombre = cargo?.nombre || 'asesor';
          
          empleadosConDatosDelMes.push({
            ...empleadoDB,
            presupuesto: empleadoResumen.presupuesto,
            ventas: empleadoResumen.ventas,
            diasLaborados: empleadoResumen.dias_laborados,
            cumplimiento_pct: empleadoResumen.cumplimiento_pct,
            comision_pct: empleadoResumen.comision_pct,
            comision_monto: empleadoResumen.comision_monto,
            rol: empleadoResumen.rol,
            cargoNombre: cargoNombre,
          });
          
          console.log(`✅ Found employee: ${empleadoResumen.nombre} -> ${empleadoDB.nombre} (${empleadoResumen.dias_laborados} days)`);
        } else {
          console.error(`❌ Employee from summary NOT FOUND in DB: "${empleadoResumen.nombre}" (ID: ${empleadoResumen.id})`);
          console.log('Available employees in DB:', empleadosTienda.map(e => `${e.id}: ${e.nombre}`));
        }
      });
      
      // 2. FILTRAR EMPLEADOS IGUAL QUE LA TABLA PRINCIPAL
      // La tabla principal filtra empleados que tienen ventas=0 Y presupuesto=0
      const empleadosFiltrados = empleadosConDatosDelMes.filter(emp => {
        const tieneActividad = !(emp.ventas === 0 && emp.presupuesto === 0);
        if (!tieneActividad) {
          console.log(`🚫 Filtering out employee with no activity: ${emp.nombre} (ventas: ${emp.ventas}, presupuesto: ${emp.presupuesto})`);
        }
        return tieneActividad;
      });
      
      console.log(`📊 Employee matching and filtering results:`, {
        totalInSummary: tiendaResumen.empleados.length,
        totalFromDB: empleadosTienda.length,
        empleadosEncontrados: empleadosEncontrados.size,
        empleadosSinMatch: tiendaResumen.empleados.length - empleadosEncontrados.size,
        combinedBeforeFilter: empleadosConDatosDelMes.length,
        finalAfterFilter: empleadosFiltrados.length,
        filteredOut: empleadosConDatosDelMes.length - empleadosFiltrados.length,
        empleadosConActividad: empleadosFiltrados.filter(e => e.ventas > 0 || e.presupuesto > 0).length
      });

      setEmpleadosConDatos(empleadosFiltrados);
      
      // Calcular presupuesto total de la tienda (del resumen)
      setPresupuestoInput(tiendaResumen.presupuesto_tienda.toString());
      
      // Seleccionar todos los empleados automáticamente (solo los filtrados)
      const empleadosSeleccionadosIds = empleadosFiltrados.map(emp => emp.id);
      const empleadosSeleccionados = empleadosTienda.filter(emp => empleadosSeleccionadosIds.includes(emp.id));
      setEmpleadosSeleccionados(empleadosSeleccionados);

      setSuccess(`Datos de ${tiendaData.nombre} cargados correctamente (${empleadosConDatosDelMes.length} empleados)`);
      
    } catch (err: any) {
      setError(`Error al cargar datos de la tienda: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de presupuesto
  const handlePresupuestoChange = (value: string) => {
    setPresupuestoInput(value);
    clearMessages();
  };

  // Agregar empleado a la selección
  const handleAddEmpleado = (empleado: DirectusAsesor) => {
    if (!empleadosSeleccionados.find(emp => emp.id === empleado.id)) {
      setEmpleadosSeleccionados(prev => [...prev, empleado]);
      setError(null);
    }
  };

  // Remover empleado de la selección
  const handleRemoveEmpleado = (empleadoId: number) => {
    setEmpleadosSeleccionados(prev => prev.filter(emp => emp.id !== empleadoId));
  };

  // Limpiar mensajes
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Obtener empleados disponibles para agregar
  const empleadosParaAgregar = empleados.filter(
    emp => !empleadosSeleccionados.find(sel => sel.id === emp.id)
  );

  // Usar los datos ya procesados del resumen (sin recálculo)
  const empleadosConCalculos = useMemo(() => {
    return empleadosSeleccionados.map(empleado => {
      const empleadoConDatos = empleadosConDatos.find(emp => emp.id === empleado.id);
      
      if (!empleadoConDatos) {
        return {
          ...empleado,
          cargoNombre: cargos.find(c => c.id === (typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id))?.nombre || 'asesor',
          presupuestoAsignado: 0,
          ventasReales: 0,
          diasLaborados: 0,
          comision: {
            cumplimiento_pct: 0,
            comision_pct: 0,
            comision_monto: 0
          }
        };
      }

      // USAR LOS DATOS YA CALCULADOS (del resumen procesado)
      const comision = {
        cumplimiento_pct: empleadoConDatos.cumplimiento_pct || 0,
        comision_pct: empleadoConDatos.comision_pct || 0,
        comision_monto: empleadoConDatos.comision_monto || 0
      };
      
      // Debug: Mostrar datos para empleados principales
      if (empleado.nombre?.includes('Daniela') || empleado.nombre?.includes('Angie')) {
        console.log(`💰 ${empleado.nombre} - Data from Summary:`, {
          presupuesto: empleadoConDatos.presupuesto,
          ventas: empleadoConDatos.ventas,
          diasLaborados: empleadoConDatos.diasLaborados,
          comision
        });
      }

      return {
        ...empleado,
        cargoNombre: empleadoConDatos.cargoNombre,
        presupuestoAsignado: empleadoConDatos.presupuesto || 0,
        ventasReales: empleadoConDatos.ventas || 0,
        diasLaborados: empleadoConDatos.diasLaborados || 0,
        comision: comision,
      };
    });
  }, [empleadosSeleccionados, empleadosConDatos, cargos]);

  // Guardar cambios
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const presupuestoTotal = parseFloat(presupuestoInput);
      
      // 1. Guardar presupuesto de la tienda
      const presupuestoTienda = {
        tienda_id: tienda!.id,
        presupuesto: presupuestoTotal,
        fecha: `${selectedMonth?.split(' ')[1]}-${getMonthNumber(selectedMonth?.split(' ')[0] || 'Dic')}-01`
      };
      
      await guardarPresupuestosTienda([presupuestoTienda] as any);

      // 2. Eliminar presupuestos existentes del mes
      const fechaMes = `${selectedMonth?.split(' ')[1]}-${getMonthNumber(selectedMonth?.split(' ')[0] || 'Dic')}-01`;
      await eliminarPresupuestosEmpleados(tienda!.id, fechaMes);

      // 3. Crear nuevos presupuestos para empleados
      const nuevosPresupuestos = empleadosSeleccionados.map(empleado => {
        const empleadoConDatos = empleadosConDatos.find(emp => emp.id === empleado.id);
        return {
          asesor: empleado.id,
          tienda_id: tienda!.id,
          cargo: typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id,
          fecha: fechaMes,
          presupuesto: empleadoConDatos?.presupuesto || 0
        };
      });

      await guardarPresupuestosEmpleados(nuevosPresupuestos as any);

      setSuccess("Cambios guardados correctamente");
      
      // Cerrar el modal sin ejecutar onSaveComplete para evitar redirección
      setTimeout(() => {
        onClose();
      }, 1500); // Cerrar después de mostrar el mensaje de éxito

    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!tienda) {
      setError("Debe seleccionar una tienda");
      return false;
    }
    if (empleadosSeleccionados.length === 0) {
      setError("Debe seleccionar al menos un empleado");
      return false;
    }
    return true;
  };

  const getMonthNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
    };
    return months[monthName] || '12';
  };

  const getCumplimientoColor = (pct: number) => {
    if (pct >= 100) return green[700];
    if (pct >= 70) return blue[700];
    if (pct >= 35) return orange[700];
    return grey[700];
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
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
            Editar Tienda - {selectedMonth || 'Dic 2025'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
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
          <Grid container spacing={3} sx={{ p: 3 }}>
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

            {/* Mes seleccionado */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="text"
                label="Mes"
                value={selectedMonth || 'Dic 2025'}
                disabled={true}
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

          {/* Información de la tienda */}
          {tienda && (
            <Paper sx={{ p: 2, mx: 3, mb: 3, backgroundColor: theme.palette.grey[50] }}>
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
                    Total empleados: {empleados.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Seleccionados: {empleadosSeleccionados.length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Gestión de empleados */}
          {tienda && empleados.length > 0 && (
            <Box sx={{ px: 3, pb: 3 }}>
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
                      {empleadosSeleccionados.map((empleado) => {
                        const cargo = cargos.find(c => c.id === (typeof empleado.cargo_id === 'object' ? empleado.cargo_id.id : empleado.cargo_id));
                        const empleadoConDatos = empleadosConDatos.find(emp => emp.id === empleado.id);
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
                                    label={empleadoConDatos?.cargoNombre || cargo?.nombre || 'Sin cargo'} 
                                    size="small"
                                    sx={{ mt: 0.5, mr: 0.5 }}
                                  />
                                  <Chip 
                                    label={`Días: ${empleadoConDatos?.diasLaborados || 0}`}
                                    size="small"
                                    color="secondary"
                                    sx={{ mt: 0.5, mr: 0.5 }}
                                  />
                                  <Chip 
                                    label={`Presupuesto: ${formatCurrency(empleadoConDatos?.presupuesto || 0)}`}
                                    size="small"
                                    color="primary"
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
                        <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
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
                        <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                          Todos los empleados ya están seleccionados
                        </Box>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              {/* Resumen de distribución */}
              {empleadosSeleccionados.length > 0 && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: theme.palette.primary.light }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resumen de Distribución
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2">
                        Presupuesto Total: {presupuestoInput ? formatCurrency(parseFloat(presupuestoInput)) : '$0.00'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2">
                        Total Distribuido: {formatCurrency(
                          empleadosConDatos.reduce((total, emp) => total + (emp.presupuesto || 0), 0)
                        )}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2">
                        Total Empleados: {empleadosSeleccionados.length}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2">
                        Con Presupuesto: {empleadosSeleccionados.filter(emp => {
                          const empleadoConDatos = empleadosConDatos.find(ed => ed.id === emp.id);
                          return (empleadoConDatos?.presupuesto || 0) > 0;
                        }).length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {tienda && empleadosSeleccionados.length > 0 ? (
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vista Previa de Distribución y Comisiones
              </Typography>
              
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Presupuesto Total:</strong> {presupuestoInput ? formatCurrency(parseFloat(presupuestoInput)) : '$0.00'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Empleados:</strong> {empleadosSeleccionados.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {selectedMonth || 'Dic 2025'}
                </Typography>
              </Paper>

              <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ 
                  overflow: 'auto', 
                  maxHeight: 400,
                  '& .MuiTableContainer-root': {
                    maxHeight: 400
                  }
                }}>
                  <Box sx={{ minWidth: 800, p: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell><strong>Nombre</strong></TableCell>
                          <TableCell><strong>Rol</strong></TableCell>
                          <TableCell align="center"><strong>Días Laborados</strong></TableCell>
                          <TableCell align="right"><strong>Presupuesto</strong></TableCell>
                          <TableCell align="right"><strong>Ventas</strong></TableCell>
                          <TableCell align="right"><strong>Cumplimiento</strong></TableCell>
                          <TableCell align="right"><strong>Comisión %</strong></TableCell>
                          <TableCell align="right"><strong>Valor Neto</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empleadosConCalculos.map((empleado) => (
                          <TableRow 
                            key={empleado.id}
                            sx={{ 
                              '&:hover': { backgroundColor: 'grey.50' },
                              borderBottom: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {empleado.nombre || `Empleado ${empleado.id}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={empleado.cargoNombre} 
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                {empleado.diasLaborados || 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(empleado.presupuestoAsignado)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(empleado.ventasReales)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                sx={{ color: getCumplimientoColor(empleado.comision.cumplimiento_pct) }}
                              >
                                {empleado.comision.cumplimiento_pct.toFixed(2)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {(empleado.comision.comision_pct * 100).toFixed(2)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {formatCurrency(empleado.comision.comision_monto)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              </Paper>

              {/* Totales */}
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'primary.light' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Totales:
                </Typography>
                <Typography variant="body2">
                  <strong>Total Presupuesto:</strong> {presupuestoInput ? formatCurrency(parseFloat(presupuestoInput)) : '$0.00'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Comisiones:</strong> {formatCurrency(
                    empleadosConCalculos.reduce((total, emp) => total + emp.comision.comision_monto, 0)
                  )}
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Selecciona una tienda y empleados para ver la vista previa de la tabla
              </Typography>
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!tienda || empleadosSeleccionados.length === 0 || saving}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStoreModalFinal;