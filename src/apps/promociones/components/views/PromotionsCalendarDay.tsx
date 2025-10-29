import React, { useMemo, useCallback } from "react";
import { Box, Typography, IconButton, Paper, useTheme, Chip, Divider } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos, CalendarToday } from "@mui/icons-material";
import { promotionColors } from "../../data/mockPromotionsColors";
import { usePromotionsFilter } from "../../hooks/usePromotionsFilter";
import { useFilteredPromotions } from "../../hooks/useFilteredPromotions";
import { Promotion } from "../../types/promotion";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/es"; // 👈 añade esto
dayjs.locale("es");


dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Horas del día cada 2 horas
const timeSlots = Array.from({ length: 12 }, (_, i) => i * 2);

interface TimelineBarProps {
  promo: Promotion;
  index: number;
}

const TimelineBar: React.FC<TimelineBarProps> = ({ promo, index }) => {
  const theme = useTheme();

  // Calcular posición y ancho de la barra
  const { start, width } = useMemo(() => {
    // Si es promoción fija (todo el día)
    if (!promo.hora_fin) {
      return { start: 0, width: 100 };
    }

    const horaInicio = parseInt(promo.hora_inicio.split(":")[0]);
    const minutosInicio = parseInt(promo.hora_inicio.split(":")[1] || "0");
    const horaFinal = parseInt(promo.hora_fin.split(":")[0]);
    const minutosFinal = parseInt(promo.hora_fin.split(":")[1] || "0");

    const startPercent = ((horaInicio + minutosInicio / 60) / 24) * 100;
    const endPercent = ((horaFinal + minutosFinal / 60) / 24) * 100;
    const widthPercent = endPercent - startPercent;

    return { start: startPercent, width: widthPercent };
  }, [promo]);

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${start}%`,
        width: `${width}%`,
        height: 40,
        top: index * 50,
        bgcolor: promo.color,
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        overflow: "hidden",
        boxShadow: theme.shadows[2],
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[4],
        },
      }}
      title={`${promo.tipo}: ${promo.hora_inicio}${promo.hora_fin ? ` - ${promo.hora_fin}` : " (Todo el día)"}`}
    >
      <Typography
        variant="caption"
        sx={{
          color: "white",
          fontWeight: "bold",
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {promo.tipo}
      </Typography>
      <Chip
        label={`${promo.descuento}%`}
        size="small"
        sx={{
          bgcolor: "rgba(255,255,255,0.3)",
          color: "white",
          fontWeight: "bold",
          height: 22,
        }}
      />
    </Box>
  );
};

const PromotionsCalendarDay: React.FC = () => {
  const theme = useTheme();
  const promotions = useFilteredPromotions();
  const { focusedDate, setFocusedDate } = usePromotionsFilter();

  // Obtener promociones del día
  const dayPromotions = useMemo(() => {
    const dayStart = focusedDate.startOf("day");
    return promotions.filter((p) => {
      const start = dayjs(p.fecha_inicio).startOf("day");
      const end = p.fecha_final ? dayjs(p.fecha_final).endOf("day") : null;

      if (end) {
        return dayStart.isSameOrAfter(start) && dayStart.isSameOrBefore(end);
      }
      return dayStart.isSame(start, "day");
    });
  }, [promotions, focusedDate]);

  const handlePrevDay = useCallback(() => {
    setFocusedDate(focusedDate.subtract(1, "day"));
  }, [focusedDate, setFocusedDate]);

  const handleNextDay = useCallback(() => {
    setFocusedDate(focusedDate.add(1, "day"));
  }, [focusedDate, setFocusedDate]);

  const handleToday = useCallback(() => {
    setFocusedDate(dayjs());
  }, [setFocusedDate]);

  const isToday = focusedDate.isSame(dayjs(), "day");

  return (
    <Box>
      {/* Header con navegación */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
        
        <IconButton onClick={handlePrevDay} size="small">
          <ArrowBackIos fontSize="small" />
        </IconButton>

        <Box textAlign="center" width="350px" >
          <Typography variant="h5" fontWeight="bold" textTransform="capitalize">
            {focusedDate.locale("es").format("dddd, D [de] MMMM")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {focusedDate.format("YYYY")}
          </Typography>
        </Box>

        <IconButton onClick={handleNextDay} size="small">
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* Botón ir a hoy */}
      {!isToday && (
        <Box display="flex" justifyContent="center" mb={2}>
          <Chip
            icon={<CalendarToday sx={{ fontSize: 16 }} />}
            label="Ir a hoy"
            onClick={handleToday}
            size="small"
            variant="outlined"
            sx={{ cursor: "pointer" }}
          />
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {dayPromotions.length > 0 ? (
        <Box>
          {/* Timeline horizontal */}
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 3,
              mb: 3,
              bgcolor: theme.palette.mode === "dark" 
                ? "rgba(255,255,255,0.02)" 
                : "rgba(0,0,0,0.01)",
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Timeline de Promociones del Día
            </Typography>

            {/* Línea de tiempo con horas */}
            <Box sx={{ position: "relative", mt: 3 }}>
              {/* Marcadores de hora (cada 2 horas) */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  px: 0.5,
                }}
              >
                {timeSlots.map((hour) => (
                  <Typography
                    key={hour}
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      flex: 1,
                      textAlign: hour === 0 ? "left" : "center",
                    }}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </Typography>
                ))}
              </Box>

              {/* Línea base */}
              <Box
                sx={{
                  height: 2,
                  bgcolor: theme.palette.divider,
                  mb: 2,
                  borderRadius: 1,
                }}
              />

              {/* Marcadores verticales cada 2 horas */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  pointerEvents: "none",
                }}
              >
                {timeSlots.map((hour) => (
                  <Box
                    key={hour}
                    sx={{
                      width: 1,
                      height: "100%",
                      bgcolor: theme.palette.divider,
                      opacity: 0.3,
                    }}
                  />
                ))}
              </Box>

              {/* Barras de promociones */}
              <Box 
                sx={{ 
                  position: "relative", 
                  minHeight: Math.max(100, dayPromotions.length * 50),
                }}
              >
                {dayPromotions.map((promo, index) => (
                  <TimelineBar key={promo.id} promo={promo} index={index} />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Lista detallada de promociones */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Detalles de Promociones
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {dayPromotions.map((promo) => (
              <Paper
                key={promo.id}
                elevation={0}
                sx={{
                  border: `2px solid ${promotionColors[promo.tipo]}`,
                  borderRadius: 2,
                  p: 2,
                  bgcolor: theme.palette.mode === "dark" 
                    ? "rgba(255,255,255,0.03)" 
                    : "rgba(0,0,0,0.02)",
                }}
              >
                {/* Header de la promoción */}
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ color: promotionColors[promo.tipo] }}
                    >
                      {promo.tipo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {promo.duracion === "temporal" ? "Promoción Temporal" : "Promoción Fija"}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${promo.descuento}% OFF`}
                    sx={{
                      bgcolor: promo.color,
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>

                {/* Descripción */}
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {promo.descripcion}
                </Typography>

                {/* Horario */}
                <Box display="flex" gap={1} mb={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Horario:</strong> {promo.hora_inicio}
                    {promo.hora_fin ? ` - ${promo.hora_fin}` : " (Todo el día)"}
                  </Typography>
                </Box>

                {/* Fechas */}
                <Box display="flex" gap={1} mb={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Vigencia:</strong> {dayjs(promo.fecha_inicio).locale("es").format("DD/MM/YYYY")}
                  </Typography>
                  {promo.fecha_final && (
                    <>
                      <Typography variant="caption" color="text.secondary">→</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(promo.fecha_final).locale("es").format("DD/MM/YYYY")}
                      </Typography>
                    </>
                  )}
                  {!promo.fecha_final && (
                    <Typography variant="caption" color="text.secondary">
                      (Promoción permanente)
                    </Typography>
                  )}
                </Box>

                {/* Tiendas */}
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Tiendas aplicables:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {promo.tiendas.map((tienda) => (
                      <Chip
                        key={tienda}
                        size="small"
                        label={tienda}
                        sx={{
                          fontSize: "0.7rem",
                          border: `1px solid ${promotionColors[promo.tipo]}`,
                          color: promotionColors[promo.tipo],
                          bgcolor: "transparent",
                          height: 20,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No hay promociones para este día
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PromotionsCalendarDay;