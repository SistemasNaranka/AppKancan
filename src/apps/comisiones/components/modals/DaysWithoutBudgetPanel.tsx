import React from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  CalendarMonth,
  EventBusy,
  CheckCircle,
  HighlightOff,
  InfoOutlined,
  CheckCircleRounded,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface DaysWithoutBudgetPanelProps {
  diasSinPresupuesto: string[];
  diasConPresupuestoCero?: string[];
  diasAsignados?: string[];
  selectedDays: string[];
  currentDate?: string;
  hideWhenComplete?: boolean;
  onToggleDay: (dia: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const DaysWithoutBudgetPanel: React.FC<DaysWithoutBudgetPanelProps> = ({
  diasSinPresupuesto,
  diasConPresupuestoCero = [],
  diasAsignados = [],
  selectedDays,
  currentDate,
  hideWhenComplete = false,
  onToggleDay,
  onSelectAll,
  onClearAll,
}) => {
  const isComplete = diasSinPresupuesto.length === 0;

  // NUEVO: Verificar si hay algún día pendiente HASTA EL DÍA DE HOY
  const hasPendingPastOrToday = diasSinPresupuesto.some(dia =>
    dayjs(dia).isBefore(dayjs(), 'day') || dayjs(dia).isSame(dayjs(), 'day')
  );

  if (hideWhenComplete && !hasPendingPastOrToday) {
    return null;
  }

  const referenceDate = currentDate
    ? dayjs(currentDate)
    : diasSinPresupuesto.length > 0
      ? dayjs(diasSinPresupuesto[0])
      : diasAsignados.length > 0
        ? dayjs(diasAsignados[0])
        : dayjs();

  const firstDay = referenceDate.startOf("month");
  const daysInMonth = firstDay.daysInMonth();

  const daysList = [];
  for (let i = 1; i <= daysInMonth; i++) {
    daysList.push(firstDay.date(i).format("YYYY-MM-DD"));
  }

  const monthName = referenceDate.format("MMMM");

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e0e6ed",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        overflow: "hidden",
        mb: 2.5
      }}
    >
      {/* Banner de Estado Premium */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.5,
          bgcolor: isComplete ? "#f1fbf1" : "#fff9f1",
          m: 1.5,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: isComplete ? "#e1efe1" : "#ffe4c4",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isComplete ? "#4caf50" : "#ff9800",
              color: "white",
            }}
          >
            {isComplete ? <CheckCircle sx={{ fontSize: 18 }} /> : <EventBusy sx={{ fontSize: 18 }} />}
          </Box>
          <Box>
            <Typography variant="body1" fontWeight="700" color={isComplete ? "#2e7d32" : "#856404"} sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
              {isComplete ? "Asignaciones Completadas" : `${diasSinPresupuesto.length} días pendientes de asignación`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {isComplete
                ? `Todo el personal está asignado correctamente para ${monthName}`
                : "Se requiere asignar personal para los días marcados"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {!isComplete && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={onSelectAll}
              startIcon={<CheckCircleRounded />}
              sx={{
                textTransform: "none",
                bgcolor: "#f57c00",
                "&:hover": { bgcolor: "#e65100" },
                borderRadius: 2,
                px: 2,
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Seleccionar Todos
            </Button>
          )}
          {selectedDays.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={onClearAll}
              startIcon={<HighlightOff />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.85rem',
                borderColor: "rgba(0,0,0,0.12)",
                bgcolor: "white"
              }}
            >
              Limpiar ({selectedDays.length})
            </Button>
          )}
        </Box>
      </Box>

      {/* Calendario de Gestión Horizontal */}
      <Box sx={{ px: 3, pb: 3, pt: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CalendarMonth sx={{ fontSize: 18, color: "#1a237e" }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: "#455a64", textTransform: "uppercase", letterSpacing: 1 }}>
            CALENDARIO DE GESTIÓN
          </Typography>
          <IconButton size="small" sx={{ p: 0 }}>
            <InfoOutlined sx={{ fontSize: 16, color: "text.disabled" }} />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <Typography key={d} variant="caption" sx={{ fontSize: '0.75rem', color: "#9e9e9e", fontWeight: 600, width: 20, textAlign: 'center' }}>
              {d}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            rowGap: 2
          }}
        >
          {daysList.map((dia) => {
            const isPending = diasSinPresupuesto.includes(dia);
            const isAssigned = (diasAsignados || []).includes(dia);
            const isSelected = selectedDays.includes(dia);
            const isToday = dia === dayjs().format("YYYY-MM-DD");
            const isFuture = dayjs(dia).isAfter(dayjs(), 'day');
            const isBudgetZero = diasConPresupuestoCero.includes(dia);
            const isDisabled = isFuture || isBudgetZero;

            const content = (
              <Box
                key={dia}
                onClick={!isDisabled ? () => onToggleDay(dia) : undefined}
                sx={{
                  width: 36,
                  height: 36,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  borderRadius: "50%",
                  fontSize: "0.85rem",
                  transition: "all 0.1s",
                  borderColor: isSelected
                    ? "#1a237e"
                    : isPending
                      ? "#ff9800"
                      : isToday
                        ? "#1a237e"
                        : "#eef1f6",
                  bgcolor: isSelected
                    ? "#1a237e"
                    : isPending
                      ? "rgba(255, 152, 0, 0.15)"
                      : "white",
                  color: isSelected
                    ? "white"
                    : isPending
                      ? "#e65100"
                      : isDisabled
                        ? "text.disabled"
                        : "#455a64",
                  opacity: isDisabled ? 0.35 : 1,
                  "&:hover": !isDisabled ? {
                    borderColor: isSelected ? "#1a237e" : isPending ? "#f57c00" : "#1a237e",
                    bgcolor: isSelected ? "#1a237e" : isPending ? "rgba(255, 152, 0, 0.25)" : "#f8f9fa",
                    transform: "scale(1.05)",
                    transition: "all 0.15s ease"
                  } : {},
                }}
              >
                <Typography variant="body2" fontWeight={isSelected || isToday || isPending ? "700" : "500"}>
                  {dayjs(dia).date()}
                </Typography>

                {/* Point orange for pending */}
                {isPending && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 1,
                      right: 1,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: "#ff9800",
                      border: "1.5px solid white",
                    }}
                  />
                )}

                {/* Premium Green Checkmark for Assigned */}
                {isAssigned && !isPending && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      bgcolor: "#4caf50",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 13, color: "white" }} />
                  </Box>
                )}

                {/* Today indicator */}
                {isToday && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      bgcolor: "#1a237e",
                    }}
                  />
                )}
              </Box>
            );

            return isDisabled ? (
              <Tooltip key={dia} title={isFuture ? "Fecha futura" : "Sin presupuesto"}>
                {content}
              </Tooltip>
            ) : content;
          })}
        </Box>
      </Box>
    </Box>
  );
};
