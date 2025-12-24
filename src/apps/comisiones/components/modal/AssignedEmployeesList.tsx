import React from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import { Close, Groups } from "@mui/icons-material";
import { EmpleadoAsignado } from "../../types/modal";

interface AssignedEmployeesListProps {
  empleadosAsignados: EmpleadoAsignado[];
  saving: boolean;
  onRemoveEmpleado: (asesorId: number) => void;
  getCargoNombre: (cargoId: any, cargosDisponibles: any[]) => string;
  getTiendaNombre: (tiendaId: any) => string;
  isMobile?: boolean;
}

export const AssignedEmployeesList: React.FC<AssignedEmployeesListProps> = ({
  empleadosAsignados,
  saving,
  onRemoveEmpleado,
  getCargoNombre,
  getTiendaNombre,
  isMobile = false,
}) => {
  const theme = useTheme();

  if (empleadosAsignados.length === 0) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          border: `1px dashed ${theme.palette.grey[300]}`,
          p: { xs: 2, sm: 4 },
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.grey[600],
            fontWeight: 500,
            mb: 1,
          }}
        >
          No hay empleados asignados
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            lineHeight: 1.5,
          }}
        >
          Use el formulario arriba para agregar empleados a la asignación de hoy
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[200]}`,
        p: { xs: 1, sm: 2 },
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Título de la sección */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Groups
              sx={{
                fontSize: 24,
                color: theme.palette.success.main,
              }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.grey[900],
              fontSize: "1.125rem",
            }}
          >
            Empleados Asignados
          </Typography>
          <Chip
            label={empleadosAsignados.length}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.dark,
              fontWeight: 600,
              ml: 1,
            }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[500],
            fontWeight: 500,
          }}
        >
          {empleadosAsignados.length === 1 ? "empleado" : "empleados"} para hoy
        </Typography>
      </Box>

      {/* Grid de empleados */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          maxHeight: { xs: 400, sm: 350 },
          overflowY: "auto",
          pr: 1,
          pb: 1,
        }}
      >
        {empleadosAsignados
          .sort((a, b) => a.asesor.id - b.asesor.id) // Ordenar por código de menor a mayor
          .map((empleado, index) => (
            <Box
              key={`empleado-${empleado.asesor.id}-${index}`}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 2,
                p: 1.4,
                mt: 2,
                transition: "all 0.2s ease",
                minHeight: "80px",
                height: "auto",
                overflow: "visible",
                position: "relative",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  transform: "translateY(-1px)",
                  boxShadow: theme.shadows[4],
                  zIndex: 1,
                },
              }}
            >
              {/* Botón X en la esquina superior derecha - MÁS VISIBLE */}
              <IconButton
                onClick={() => onRemoveEmpleado(empleado.asesor.id)}
                disabled={saving}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: alpha(theme.palette.error.main, 0.15),
                  color: theme.palette.error.dark,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  zIndex: 1,
                  "&:hover": {
                    backgroundColor: saving
                      ? alpha(theme.palette.error.main, 0.15)
                      : alpha(theme.palette.error.main, 0.25),
                    transform: saving ? "none" : "scale(1.1)",
                  },
                }}
                size="small"
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>

              {/* Contenido de la tarjeta */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                  pr: 1,
                  gap: 1,
                }}
              >
                {/* Nombre del empleado - primera línea - LETRA MÁS GRANDE */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[900],
                    fontSize: "0.9rem", // MÁS GRANDE
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  {empleado.asesor.nombre || `Empleado ${empleado.asesor.id}`}
                </Typography>

                {/* Cargo - segunda línea - LETRA MÁS GRANDE */}
                <Chip
                  label={empleado.cargoAsignado}
                  size="small"
                  sx={{
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.dark,
                    fontWeight: 500,
                    fontSize: "0.8rem", // MÁS GRANDE
                    height: 22, // MÁS ALTO
                    alignSelf: "flex-start",
                    "& .MuiChip-label": {
                      px: 0.75,
                      lineHeight: 1,
                    },
                  }}
                />

                {/* Código y valor - tercera línea - LETRA MÁS GRANDE */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Chip
                    label={`Cod. ${empleado.asesor.id}`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.dark,
                      fontWeight: 500,
                      fontSize: "0.8rem", // MÁS GRANDE
                      height: 20, // MÁS ALTO
                      "& .MuiChip-label": {
                        px: 0.75,
                        lineHeight: 1,
                      },
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.success.dark,
                      fontWeight: 700,
                      fontSize: "0.9rem", // MÁS GRANDE
                      display: "flex",
                      alignItems: "center",
                      lineHeight: 1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        color: theme.palette.success.main,
                        fontSize: "0.9rem",
                      }}
                    >
                      $
                    </Box>
                    {empleado.presupuesto.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );
};
