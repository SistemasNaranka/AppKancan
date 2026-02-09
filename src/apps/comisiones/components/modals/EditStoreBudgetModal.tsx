import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
import { InlineMessage } from "./InlineMessage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Close, Save, CalendarToday, Storefront } from "@mui/icons-material";
import { useEditStoreBudgetModalLogic } from "../../hooks/useEditStoreBudgetModalLogic";
import { AddEmployeeSection } from "./AddEmployeeSection";
import { AssignedEmployeesSection } from "./AssignedEmployeesSection";
import { DaysWithoutBudgetPanel } from "./DaysWithoutBudgetPanel";
import { useApps } from "@/apps/hooks/useApps";

interface EditStoreBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth?: string;
  onSaveComplete?: () => void;
}

export const EditStoreBudgetModal: React.FC<EditStoreBudgetModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  onSaveComplete,
}) => {
  const { area } = useApps();
  const [, setSaveCompleted] = React.useState(false);
  const [, setSaveError] = React.useState(false);

  const {
    fecha,
    tiendaId,
    tiendaNombre,
    cargoSeleccionado,
    codigoEmpleado,
    empleadoEncontrado,
    empleadosAsignados,
    cargos,
    loading,
    error,
    success,
    diasSinPresupuesto,
    diasConPresupuestoCero,
    diasConAsignacion, // NUEVO
    selectedDays,
    tiendas,
    toggleDaySelection,
    selectAllPendingDays,
    clearDaySelection,
    handleKeyPress,
    handleAgregarEmpleado,
    handleQuitarEmpleado,
    handleLimpiar,
    handleGuardar,
    handleTiendaChange,
    setError,
    setSuccess,
    setFecha,
    setCargoSeleccionado,
    setCodigoEmpleado,
    isValidStaffCombination, // NUEVO
    hasChanges, // NUEVO
  } = useEditStoreBudgetModalLogic({
    isOpen,
    onClose,
    selectedMonth,
    onSaveComplete,
  });

  const isAdmin = area?.toLowerCase() !== "tienda" || tiendas.length > 1;
  const hideStoreSelector = area?.toLowerCase() === "tienda" || tiendas.length <= 1;

  const handleGuardarWrapper = async () => {
    const success = await handleGuardar();
    if (!success) {
      setSaveError(true);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
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
        {/* Header */}
        {/* Header Premium (Dark Blue) */}
        <Box
          sx={{
            bgcolor: "#003e7e", // Blue from image
            color: "white",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Storefront sx={{ fontSize: 40 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: -0.5 }}>
                {tiendaNombre
                  ? `Editar Asignación - ${tiendaNombre}`
                  : "Editar Asignación"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontWeight: 500 }}>
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

        <DialogContent sx={{ p: 1.5, bgcolor: "#fafafa" }}>
          {/* Panel de días sin presupuesto - Arriba */}
          {(isAdmin || diasSinPresupuesto.length > 0 || (diasConAsignacion || []).length > 0) && (
            <Box sx={{ mb: 1.5 }}>
              <DaysWithoutBudgetPanel
                diasSinPresupuesto={diasSinPresupuesto}
                diasConPresupuestoCero={diasConPresupuestoCero}
                diasAsignados={diasConAsignacion}
                selectedDays={selectedDays}
                currentDate={fecha}
                hideWhenComplete={!isAdmin}
                onToggleDay={toggleDaySelection}
                onSelectAll={selectAllPendingDays}
                onClearAll={clearDaySelection}
              />
            </Box>
          )}

          {/* Selectores Laterales: Fecha y Tienda */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {/* Selector de Fecha */}
            <Grid size={{ xs: 12, md: hideStoreSelector ? 12 : 6 }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "white",
                  borderRadius: 1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  border: "1px solid",
                  borderColor: "grey.200",
                  height: '100%'
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                  <CalendarToday sx={{ color: "#1a237e", fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight="600" color="#37474f">
                    Seleccionar Fecha
                  </Typography>
                </Box>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    value={dayjs(fecha)}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    shouldDisableDate={(date) => {
                      const dateStr = dayjs(date as any).format("YYYY-MM-DD");
                      return (diasConPresupuestoCero || []).includes(dateStr);
                    }}
                    onChange={(newValue) => {
                      const dayjsValue = dayjs(newValue as any);
                      setFecha(dayjsValue.isValid() ? dayjsValue.format("YYYY-MM-DD") : "");
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "medium",
                        readOnly: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#f8f9fa",
                            "& fieldset": { borderColor: "transparent" },
                            "&:hover fieldset": { borderColor: "primary.main" },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>

            {/* Selector de Tienda - Solo visible para Administradores */}
            {!hideStoreSelector && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 1.5,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    border: "1px solid",
                    borderColor: "grey.200",
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                    <Storefront sx={{ color: "#2e7d32", fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight="600" color="#37474f">
                      Seleccionar Tienda
                    </Typography>
                  </Box>
                  <TextField
                    select
                    fullWidth
                    value={tiendaId || ""}
                    onChange={(e) => handleTiendaChange(Number(e.target.value))}
                    disabled={loading || tiendas.length <= 1}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8f9fa",
                        "& fieldset": { borderColor: "transparent" },
                        "&:hover fieldset": { borderColor: "primary.main" },
                      },
                    }}
                  >
                    {tiendas.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Sección Agregar Empleado */}
          <AddEmployeeSection
            cargoSeleccionado={cargoSeleccionado}
            codigoEmpleado={codigoEmpleado}
            empleadoEncontrado={empleadoEncontrado}
            cargos={cargos}
            onCargoChange={(cargo) => setCargoSeleccionado(cargo as number)}
            onCodigoChange={setCodigoEmpleado}
            onKeyPress={handleKeyPress}
            onAgregar={handleAgregarEmpleado}
          />

          {/* Empleados Asignados */}
          {diasConPresupuestoCero.includes(fecha) ? (
            <Box sx={{
              p: 4,
              textAlign: "center",
              bgcolor: "rgba(245, 124, 0, 0.05)",
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "warning.light",
              mt: 2
            }}>
              <Typography variant="h6" color="warning.dark" fontWeight="600">
                Meta de Presupuesto en $0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No se pueden asignar empleados a un día sin meta de ventas configurada.
              </Typography>
            </Box>
          ) : (
            <AssignedEmployeesSection
              empleadosAsignados={empleadosAsignados}
              fecha={fecha}
              onQuitarEmpleado={handleQuitarEmpleado}
            />
          )}
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
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {!isValidStaffCombination && empleadosAsignados.length > 0 && (
              <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600, bgcolor: 'rgba(255, 152, 0, 0.08)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                ⚠️ Se requiere al menos un Asesor y un Superior (Gerente/Coadmin)
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleGuardarWrapper}
            disabled={loading || (!hasChanges && diasSinPresupuesto.length === 0) || empleadosAsignados.length === 0 || !isValidStaffCombination}
            sx={{
              minWidth: 200,
              fontWeight: 600,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
              "&.Mui-disabled": {
                bgcolor: empleadosAsignados.length > 0 ? "rgba(0, 0, 0, 0.12)" : undefined
              }
            }}
          >
            {loading
              ? "Guardando..."
              : selectedDays.length > 1
                ? `Actualizar ${selectedDays.length} Días en Lote`
                : `Actualizar Asignación (${empleadosAsignados.length} empleados)`}
          </Button>
          {/* 🔧 Mensaje de estado del botón */}
          {!loading && !hasChanges && diasSinPresupuesto.length === 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
              (Todos los días asignados)
            </Typography>
          )}
          {!loading && !hasChanges && diasSinPresupuesto.length > 0 && (
            <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600, ml: 1 }}>
              (Sin cambios - Hay días pendientes)
            </Typography>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
