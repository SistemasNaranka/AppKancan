import React from "react";
import { Box, Typography } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.locale("es");
dayjs.extend(localizedFormat);

interface DaysWithoutBudgetPanelProps {
  diasSinPresupuesto: string[];
  onDayClick: (dia: string) => void;
}

export const DaysWithoutBudgetPanel: React.FC<DaysWithoutBudgetPanelProps> = ({
  diasSinPresupuesto,
  onDayClick,
}) => {
  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      {/* Header informativo con fondo amarillo suave */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          bgcolor: "#fff3cd",
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          border: "1px solid #ffc107",
        }}
      >
        <WarningAmber sx={{ fontSize: 20, color: "#f57c00" }} />
        <Typography
          variant="body2"
          fontWeight="600"
          color="#856404"
          sx={{ fontSize: "0.9rem" }}
        >
          Días sin presupuesto asignado. Haz clic para asignar:
        </Typography>
      </Box>

      {/* Lista horizontal de días - Fondo gris suave, borde azul */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {diasSinPresupuesto.map((dia) => {
          const fecha = dayjs(dia);
          const esHoy = fecha.isSame(dayjs(), "day");

          return (
            <Box
              key={dia}
              onClick={() => onDayClick(dia)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                cursor: "pointer",
                transition: "all 0.2s",
                bgcolor: esHoy ? "primary.main" : "#f5f5f5",
                border: "1.5px solid",
                borderColor: esHoy ? "primary.main" : "primary.main",
                "&:hover": {
                  bgcolor: esHoy ? "primary.main" : "#e3f2fd",
                  borderColor: "primary.main",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
              }}
            >
              {/* Número del día - sin negrita */}
              <Typography
                variant="body2"
                color={esHoy ? "white" : "text.primary"}
                sx={{ fontSize: "0.9rem", fontWeight: 400, minWidth: 20 }}
              >
                {fecha.format("D")}
              </Typography>

              {/* Fecha completa en español */}
              <Typography
                variant="body2"
                color={esHoy ? "white" : "text.secondary"}
                sx={{
                  fontSize: "0.9rem",
                  textTransform: "capitalize",
                  fontWeight: 500,
                }}
              >
                {fecha.format("dddd, D MMM")}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
