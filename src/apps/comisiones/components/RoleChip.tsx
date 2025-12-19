import React, { useCallback } from "react";
import { Chip } from "@mui/material";
import {
  Person as PersonIcon,
  Work as WorkIcon,
  CreditCard as CreditCardIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { Role } from "../types";

interface RoleChipProps {
  rol: Role;
}

/**
 * Componente para mostrar el rol del empleado como un chip
 * Incluye iconos y colores según el tipo de rol
 */
export const RoleChip = React.memo<RoleChipProps>(({ rol }) => {
  const getRoleIcon = useCallback(() => {
    switch (rol) {
      case "gerente":
        return <PersonIcon fontSize="small" color="action" />;
      case "asesor":
        return <WorkIcon fontSize="small" color="action" />;
      case "cajero":
        return <CreditCardIcon fontSize="small" color="action" />;
      case "gerente_online":
        return <BusinessIcon fontSize="small" color="action" />;
      case "coadministrador":
        return <PersonIcon fontSize="small" color="action" />;
      case "logistico":
        return <WorkIcon fontSize="small" color="action" />;
      default:
        return <PersonIcon fontSize="small" color="action" />;
    }
  }, [rol]);

  const getRoleColor = useCallback(
    (
      rol: Role
    ):
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning" => {
      switch (rol) {
        case "gerente":
          return "primary";
        case "asesor":
          return "primary";
        case "cajero":
          return "primary";
        case "gerente_online":
          return "info"; // Color especial para gerente online
        case "coadministrador":
          return "secondary";
        case "logistico":
          return "default";
        default:
          return "primary";
      }
    },
    []
  );

  // Función para formatear el nombre del rol
  const getRoleLabel = useCallback((rol: Role): string => {
    switch (rol) {
      case "gerente_online":
        return "Gerente Online";
      case "coadministrador":
        return "Coadministrador";
      case "logistico":
        return "Logístico";
      default:
        // Capitalizar primera letra para otros casos
        return rol.charAt(0).toUpperCase() + rol.slice(1);
    }
  }, []);

  return (
    <Chip
      icon={getRoleIcon()}
      label={getRoleLabel(rol)}
      size="small"
      variant="outlined"
      color={getRoleColor(rol)}
      sx={{ textTransform: "capitalize" }}
    />
  );
});
