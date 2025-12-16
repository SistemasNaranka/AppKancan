import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { EmpleadoAsignado } from "../../types/modal";

interface AssignedEmployeesListProps {
  empleadosAsignados: EmpleadoAsignado[];
  saving: boolean;
  onRemoveEmpleado: (asesorId: number) => void;
  getCargoNombre: (cargoId: any) => string;
  getTiendaNombre: (tiendaId: any) => string;
}

export const AssignedEmployeesList: React.FC<AssignedEmployeesListProps> = ({
  empleadosAsignados,
  saving,
  onRemoveEmpleado,
  getCargoNombre,
  getTiendaNombre,
}) => {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Empleados Asignados Hoy ({empleadosAsignados.length})
      </Typography>
      <Box
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {empleadosAsignados.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No hay empleados asignados para hoy
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {empleadosAsignados.map((empleado, index) => (
              <ListItem
                key={`empleado-${empleado.asesor.id}-${index}`}
                sx={{
                  borderBottom:
                    index < empleadosAsignados.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: "#f9f9f9",
                  },
                }}
                secondaryAction={
                  <IconButton
                    onClick={() => onRemoveEmpleado(empleado.asesor.id)}
                    size="small"
                    sx={{ color: "text.secondary" }}
                    disabled={saving}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body1" fontWeight={500}>
                        {empleado.asesor.nombre ||
                          `Empleado ${empleado.asesor.id}`}
                      </Typography>
                      <Chip
                        label={`Código: ${empleado.asesor.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.75rem" }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${empleado.cargoAsignado}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.75rem" }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
