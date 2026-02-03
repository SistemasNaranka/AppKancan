import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { InlineMessage } from "./InlineMessage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Close, Save, CalendarToday } from "@mui/icons-material";
import { useEditStoreBudgetModalLogic } from "../../hooks/useEditStoreBudgetModalLogic";
import { AddEmployeeSection } from "./AddEmployeeSection";
import { AssignedEmployeesSection } from "./AssignedEmployeesSection";
import { DaysWithoutBudgetPanel } from "./DaysWithoutBudgetPanel";

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
  const [, setSaveCompleted] = React.useState(false);
  const [, setSaveError] = React.useState(false);

  const {
    fecha,
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
    handleKeyPress,
    handleAgregarEmpleado,
    handleQuitarEmpleado,
    handleLimpiar,
    handleGuardar,
    setError,
    setSuccess,
    setFecha,
    setCargoSeleccionado,
    setCodigoEmpleado,
  } = useEditStoreBudgetModalLogic({
    isOpen,
    onClose,
    selectedMonth,
    onSaveComplete,
  });

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
            <CalendarToday sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="700">
                {tiendaNombre
                  ? `Editar Presupuesto - ${tiendaNombre}`
                  : "Editar Presupuesto"}
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
          {/* Panel de días sin presupuesto - Arriba */}
          {diasSinPresupuesto.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <DaysWithoutBudgetPanel
                diasSinPresupuesto={diasSinPresupuesto}
                onDayClick={setFecha}
              />
            </Box>
          )}

          {/* Selector de Fecha */}
          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <CalendarToday sx={{ color: "primary.main", fontSize: 18 }} />
              <Typography
                variant="subtitle2"
                fontWeight="600"
                sx={{ fontSize: "0.85rem", textTransform: "capitalize" }}
              >
                {dayjs(fecha).format("dddd, D [de] MMMM [de] YYYY")}
              </Typography>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                value={dayjs(fecha)}
                format="DD/MM/YYYY"
                onChange={(newValue) =>
                  setFecha(newValue ? newValue.format("YYYY-MM-DD") : "")
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      bgcolor: "white",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderWidth: 1.5,
                          borderColor: "grey.300",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderWidth: 1.5,
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Sección Agregar Empleado */}
          <AddEmployeeSection
            cargoSeleccionado={cargoSeleccionado || 0}
            codigoEmpleado={codigoEmpleado}
            empleadoEncontrado={empleadoEncontrado}
            cargos={cargos}
            onCargoChange={(cargo) => setCargoSeleccionado(cargo as number)}
            onCodigoChange={setCodigoEmpleado}
            onKeyPress={handleKeyPress}
            onAgregar={handleAgregarEmpleado}
          />

          {/* Empleados Asignados */}
          <AssignedEmployeesSection
            empleadosAsignados={empleadosAsignados}
            fecha={fecha}
            onQuitarEmpleado={handleQuitarEmpleado}
          />
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
            disabled={loading || empleadosAsignados.length === 0}
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
