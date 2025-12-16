import React from "react";
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { Close, Person, Badge } from "@mui/icons-material";
import { EmpleadoAsignado } from "../../types/modal";

interface AssignedEmployeesListProps {
  empleadosAsignados: EmpleadoAsignado[];
  saving: boolean;
  onRemoveEmpleado: (asesorId: number) => void;
  getCargoNombre: (cargoId: any) => string;
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
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: theme.palette.grey[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Person sx={{ fontSize: 32, color: theme.palette.grey[400] }} />
        </Box>
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
        p: { xs: 2, sm: 3 },
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Título de la sección */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Badge sx={{ fontSize: 18, color: theme.palette.success.main }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.grey[900],
              fontSize: '1.125rem',
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
          {empleadosAsignados.length === 1 ? 'empleado' : 'empleados'} para hoy
        </Typography>
      </Box>

      {/* Lista de empleados */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 1.5,
          maxHeight: { xs: 400, sm: 350 },
          overflowY: 'auto',
          pr: 0.5,
        }}
      >
        {empleadosAsignados.map((empleado, index) => (
          <Box
            key={`empleado-${empleado.asesor.id}-${index}`}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2,
              p: { xs: 1, sm: 1.25 },
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2],
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Avatar del empleado */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {empleado.asesor.nombre?.charAt(0)?.toUpperCase() || '?'}
              </Box>

              {/* Información del empleado */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[900],
                    fontSize: '0.875rem',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {empleado.asesor.nombre || `Empleado ${empleado.asesor.id}`}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${empleado.asesor.id}`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.dark,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 20,
                      minWidth: 'auto',
                      '& .MuiChip-label': {
                        px: 1,
                        lineHeight: 1,
                      },
                    }}
                  />
                  <Chip
                    label={empleado.cargoAsignado}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.dark,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 20,
                      minWidth: 'auto',
                      '& .MuiChip-label': {
                        px: 1,
                        lineHeight: 1,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Botón de eliminar */}
              <Box
                component="button"
                onClick={() => onRemoveEmpleado(empleado.asesor.id)}
                disabled={saving}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.dark,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: saving ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.error.main, 0.2),
                    transform: saving ? 'none' : 'scale(1.1)',
                  },
                }}
              >
                <Close sx={{ fontSize: 12 }} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Resumen de la asignación - Eliminado según solicitud del usuario */}
    </Box>
  );
};
