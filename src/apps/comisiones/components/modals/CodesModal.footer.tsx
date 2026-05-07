import React from "react";
import { DialogActions, Box, useTheme } from "@mui/material";

interface CodesModalFooterProps {
  showMultipleStoresWarning: boolean;
  saving: boolean;
  hasExistingData: boolean;
  hasChanges: boolean;
  canSave: boolean;
  empleadosAsignados: any[];
  hasPermission: boolean;
  onClose: () => void;
  onClear: () => void;
  onSave: () => Promise<void>;
}

export const CodesModalFooter: React.FC<CodesModalFooterProps> = ({
  showMultipleStoresWarning,
  saving,
  hasExistingData,
  hasChanges,
  canSave,
  empleadosAsignados,
  hasPermission,
  onClose,
  onClear,
  onSave,
}) => {
  const theme = useTheme();

  const getButtonConfig = () => {
    if (saving) {
      return {
        text: "Guardando...",
        bgColor: theme.palette.grey[50],
        cursor: "not-allowed",
        disabled: true,
        reason: "",
      };
    }

    if (hasExistingData) {
      if (!hasChanges) {
        return {
          text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
          bgColor: theme.palette.grey[400],
          cursor: "not-allowed",
          disabled: true,
          reason: "Sin cambios - No hay modificaciones",
        };
      }

      if (!canSave) {
        return {
          text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
          bgColor: theme.palette.warning.main,
          cursor: "not-allowed",
          disabled: true,
          reason: "Requiere: Asesor + Gerente/Coadministrador",
        };
      }

      return {
        text: `Actualizar Asignación (${empleadosAsignados.length} empleados)`,
        bgColor: theme.palette.primary.main,
        cursor: "pointer",
        disabled: false,
        reason: "",
      };
    }

    if (empleadosAsignados.length === 0) {
      return {
        text: "Guardar Asignación",
        bgColor: theme.palette.warning.main,
        cursor: "not-allowed",
        disabled: true,
        reason: "Agregue empleados primero",
      };
    }

    if (!canSave) {
      return {
        text: `Guardar Asignación (${empleadosAsignados.length} empleados)`,
        bgColor: theme.palette.warning.main,
        cursor: "not-allowed",
        disabled: true,
        reason: "Requiere: Asesor + Gerente/Coadministrador",
      };
    }

    return {
      text: `Guardar Asignación (${empleadosAsignados.length} empleados)`,
      bgColor: theme.palette.primary.main,
      cursor: "pointer",
      disabled: false,
      reason: "",
    };
  };

  const config = getButtonConfig();

  return (
    <DialogActions
      sx={{
        px: { xs: 1, sm: 3 },
        py: { xs: 1, sm: 2 },
        backgroundColor: theme.palette.grey[100],
        borderTop: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      {showMultipleStoresWarning ? (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              px: 4, py: 1.5, borderRadius: 2,
              backgroundColor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText,
              border: "none", cursor: "pointer",
            }}
          >
            Cerrar y Ir al Inicio
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: "100%", display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Box
            component="button"
            onClick={onClear}
            disabled={empleadosAsignados.length === 0 || saving}
            sx={{
              px: 1, py: 1.25, borderRadius: 2,
              backgroundColor: "transparent",
              color: theme.palette.text.secondary,
              border: `1px solid ${theme.palette.grey[300]}`,
              cursor: empleadosAsignados.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Limpiar
          </Box>
          <Box
            component="button"
            onClick={onSave}
            disabled={config.disabled || !hasPermission}
            title={config.reason}
            sx={{
              px: 4, py: 1.25, borderRadius: 2,
              backgroundColor: config.bgColor,
              color: theme.palette.primary.contrastText,
              border: "none", cursor: config.cursor,
              minWidth: 180,
            }}
          >
            {config.text}
          </Box>
        </Box>
      )}
    </DialogActions>
  );
};