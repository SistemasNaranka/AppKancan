import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { promotionColors } from "../data/mockPromotionsColors";
import { Promotion } from "../types/promotion";


import dayjs from "dayjs";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("es");
import { useFilteredPromotions } from "../hooks/useFilteredPromotions";

dayjs.locale("es");

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface PromotionsCalendarMonthProps {
  month?: number; // 0-11
}

interface DayCellProps {
  day: number | null;
  promos: Promotion[];
}

const DayCell: React.FC<DayCellProps> = React.memo(({ day, promos }) => {
  if (!day) return <Box sx={{ border: "0.5px solid rgba(0,0,0,0.1)" }} />;

  const visiblePromos = promos.slice(0, 4);
  const extraPromos = promos.length - visiblePromos.length;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        border: "0.5px solid rgba(0,0,0,0.15)",
        p: 0,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Número del día */}
      <Typography
        variant="body2"
        fontWeight="bold"
        sx={{
          px: 0.5,
          pt: 0.3,
          fontSize: "0.8rem",
          textAlign: "right",
          color: "text.primary",
        }}
      >
        {day}
      </Typography>

      {/* Promociones visibles */}
      <Box
        sx={{
          mt: "auto",
          pb: 0.4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: "2px",
        }}
      >
        {visiblePromos.map((promo) => (
          <Box
            key={promo.id}
            sx={{
              height: 12,
              width: "100%",
              backgroundColor: promotionColors[promo.tipo],
              borderRadius: 1,
              opacity: promo.fecha_final ? 1 : 0.9, // opcional: destacar fijas ligeramente diferente
            }}
            title={`${promo.tipo}${promo.fecha_final ? `: ${promo.descuento}%` : " (Fija)"}`}
          />
        ))}

        {extraPromos > 0 && (
          <Typography
            variant="caption"
            sx={{
              textAlign: "center",
              fontSize: "0.65rem",
              color: "text.secondary",
              mt: "1px",
            }}
          >
            +{extraPromos} más
          </Typography>
        )}
      </Box>
    </Box>
  );
});




const PromotionsCalendarMonth: React.FC<PromotionsCalendarMonthProps> = ({ month }) => {
  const promotions = useFilteredPromotions();

  // Inicializar con el mes recibido o el actual
  const [currentDate, setCurrentDate] = useState(() =>
    month != null ? dayjs().month(month) : dayjs()
  );

  // Sincronizar si cambia el prop `month`
  useEffect(() => {
    if (month != null) {
      setCurrentDate(dayjs().month(month));
    }
  }, [month]);

  // Generar días del mes
  const days = useMemo(() => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;
    const daysInMonth = endOfMonth.date();
    return Array.from({ length: startDay + daysInMonth }, (_, i) =>
      i < startDay ? null : i - startDay + 1
    );
  }, [currentDate]);

  // Obtener promociones por día
  const getPromotionsForDay = useCallback(
  (day: number): Promotion[] => {
    const date = dayjs(currentDate).date(day).startOf("day");
    return promotions.filter((p) => {
      const start = dayjs(p.fecha_inicio).startOf("day");
      const end = p.fecha_final ? dayjs(p.fecha_final).endOf("day") : null;

      if (end) {
        // Promoción temporal: se muestra entre inicio y fin
        return date.isSameOrAfter(start) && date.isSameOrBefore(end);
      }

      // Promoción fija: solo se muestra el día de inicio
      return date.isSame(start, "day");
    });
  },
  [promotions, currentDate]
);

  const handlePrevMonth = useCallback(
    () => setCurrentDate((prev) => prev.subtract(1, "month")),
    []
  );
  const handleNextMonth = useCallback(
    () => setCurrentDate((prev) => prev.add(1, "month")),
    []
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton onClick={handlePrevMonth}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" textTransform="capitalize">
          {currentDate.format("MMMM YYYY")}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap={0}
        mt={2}
        sx={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {daysOfWeek.map((day) => (
          <Box
            key={day}
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              pb: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {day}
          </Box>
        ))}

        {days.map((day, i) => (
          <DayCell key={i} day={day} promos={day ? getPromotionsForDay(day) : []} />
        ))}
      </Box>
    </Box>
  );
};

export default PromotionsCalendarMonth;
