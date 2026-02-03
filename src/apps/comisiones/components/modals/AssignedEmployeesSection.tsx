import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  alpha,
} from "@mui/material";
import { Person, Groups, Close } from "@mui/icons-material";
import dayjs from "dayjs";

interface AssignedEmployeesSectionProps {
  empleadosAsignados: any[];
  fecha: string;
  onQuitarEmpleado: (id: number) => void;
}

export const AssignedEmployeesSection: React.FC<
  AssignedEmployeesSectionProps
> = ({ empleadosAsignados, fecha, onQuitarEmpleado }) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Groups sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h6" fontWeight="600">
            Empleados Asignados
          </Typography>
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: "0.875rem",
              fontWeight: 600,
              minWidth: 32,
              textAlign: "center",
            }}
          >
            {empleadosAsignados.length}
          </Box>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "capitalize", fontSize: "0.8rem" }}
        >
          empleados del día{" "}
          {dayjs(fecha).locale("es").format("dddd D [de] MMMM [de] YYYY")}
        </Typography>
      </Box>

      {empleadosAsignados.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            color: "text.secondary",
            border: "2px dashed",
            borderColor: "grey.300",
            borderRadius: 2,
            bgcolor: "grey.50",
          }}
        >
          <Person sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography variant="body1" fontWeight="500">
            No hay empleados asignados
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.8rem" }}>
            Agregue empleados usando el formulario de arriba
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {empleadosAsignados.map((empleado) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={empleado.id}>
              <Card
                sx={{
                  position: "relative",
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.2),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: 2,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    borderColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.3),
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "error.lighter",
                    color: "error.main",
                    "&:hover": { bgcolor: "error.main", color: "white" },
                    width: 24,
                    height: 24,
                    zIndex: 1,
                  }}
                  size="small"
                  onClick={() => onQuitarEmpleado(empleado.id)}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>

                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      pr: 3,
                      mb: 0.5,
                      lineHeight: 1.2,
                      fontSize: "1rem",
                    }}
                  >
                    {empleado.nombre}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        empleado.cargo_nombre === "Gerente"
                          ? "success.main"
                          : "primary.main",
                      fontWeight: 700,
                      mb: 1,
                      display: "block",
                      fontSize: "0.85rem",
                    }}
                  >
                    • {empleado.cargo_nombre}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 1,
                      borderTop: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="600"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      Cod. {empleado.codigo}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "success.dark",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        lineHeight: 1,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          color: "success.main",
                          fontSize: "0.9rem",
                          mr: 0.5,
                        }}
                      >
                        $
                      </Box>
                      {Number(empleado.presupuesto).toLocaleString("en-US")}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
