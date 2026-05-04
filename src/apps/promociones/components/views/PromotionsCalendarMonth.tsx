import React, { useMemo, useCallback, useRef, useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { Instance } from "@popperjs/core";
import { Promotion } from "../../types/promotion";
import { usePromotionsFilter } from "../../hooks/usePromotionsFilter";
import { useFilteredPromotions } from "../../hooks/useFilteredPromotions";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface DayCellProps {
  day: number | null;
  promos: Promotion[];
  onClick?: () => void;
  // ahora usamos eventos pointer y le pasamos cellRef desde dentro
  onPointerMove?: (
    e: React.PointerEvent,
    promos: Promotion[],
    cell: HTMLDivElement
  ) => void;
  onPointerLeave?: () => void;
}

const DayCell: React.FC<DayCellProps> = React.memo(
  ({ day, promos, onClick, onPointerMove, onPointerLeave }) => {
    const cellRef = useRef<HTMLDivElement | null>(null); // ✅ siempre llamado

    if (!day) {
      return <Box sx={{ border: "0.5px solid rgba(0,0,0,0.1)" }} />;
    }

    const visiblePromos = promos.slice(0, 4);
    const extraPromos = promos.length - visiblePromos.length;

    return (
      <Box
        ref={cellRef}
        onClick={onClick}
        onPointerMove={(e) => {
          if (onPointerMove && cellRef.current)
            onPointerMove(e, promos, cellRef.current);
        }}
        onPointerLeave={onPointerLeave}
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
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.15s ease",
          "&:hover": onClick
            ? {
                bgcolor: "action.hover",
                borderColor: "primary.main",
              }
            : {},
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

        {/* Promociones visibles (barras) */}
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
                width: promo.fecha_final ? "100%" : "20%", // Para fijas, solo una marca pequeña
                backgroundColor: promo.color || "#90caf9", // 👈 usa el color de la base de datos
                borderRadius: 1,
                opacity: promo.fecha_final ? 1 : 0.95,
              }}
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
  }
);

const PromotionsCalendarMonth: React.FC = () => {
  const promotions = useFilteredPromotions();
  const { focusedDate, setFocusedDate, setSelectedView } =
    usePromotionsFilter();

  // ==========================
  // 🎯 Tooltip virtual dinámico (anclado a la celda, pero sigue el mouse)
  // ==========================
  const popperRef = useRef<Instance | null>(null);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement | null>(null); // la celda actual
  const [openTooltip, setOpenTooltip] = useState(false);
  const [hoveredPromos, setHoveredPromos] = useState<Promotion[]>([]);

  // handler que recibirá la referencia a la celda (cellEl)
  const handlePointerMove = (
    event: React.PointerEvent,
    promos: Promotion[],
    cellEl: HTMLDivElement
  ) => {
    if (!promos || promos.length === 0) {
      setOpenTooltip(false);
      return;
    }

    // posicion del cursor (para que el tooltip lo siga)
    positionRef.current = { x: event.clientX, y: event.clientY };

    // guardamos la celda en areaRef (anchor)
    areaRef.current = cellEl;

    setHoveredPromos(promos);
    setOpenTooltip(true);

    // forzar actualización del Popper para reposicionar
    if (popperRef.current) popperRef.current.update();
  };

  const handlePointerLeave = () => {
    setOpenTooltip(false);
    setHoveredPromos([]);
    // no borrar areaRef inmediatamente para evitar parpadeos; opcional:
    // areaRef.current = null;
  };

  const tooltipContent =
    hoveredPromos.length > 0 ? (
      <Box>
        {hoveredPromos.map((promo) => (
          <Box
            key={promo.id}
            sx={{
              borderLeft: `4px solid ${promo.color || "#90caf9"}`,
              pl: 1,
              mb: 0.5,
              backgroundColor: `${promo.color}20`, // 👈 fondo translúcido con alpha
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: promo.color || "#90caf9" }}
            >
              {promo.tipo} — {promo.descuento}%
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {dayjs(promo.fecha_inicio).locale("es").format("D MMM")} →{" "}
              {promo.fecha_final
                ? dayjs(promo.fecha_final).locale("es").format("D MMM")
                : "-Fija"}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      ""
    );

  // ==============================
  // 🗓️ Generación de calendario
  // ==============================
  const days = useMemo(() => {
    const startOfMonth = focusedDate.startOf("month");
    const endOfMonth = focusedDate.endOf("month");
    const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;
    const daysInMonth = endOfMonth.date();
    return Array.from({ length: startDay + daysInMonth }, (_, i) =>
      i < startDay ? null : i - startDay + 1
    );
  }, [focusedDate]);

  const getPromotionsForDay = useCallback(
    (day: number): Promotion[] => {
      const date = dayjs(focusedDate).date(day).startOf("day");
      return promotions.filter((p) => {
        const start = dayjs(p.fecha_inicio).startOf("day");
        const end = p.fecha_final ? dayjs(p.fecha_final).endOf("day") : null;
        if (end) {
          return date.isSameOrAfter(start) && date.isSameOrBefore(end);
        }
        return date.isSame(start, "day");
      });
    },
    [promotions, focusedDate]
  );

  const handlePrevMonth = useCallback(() => {
    setFocusedDate(focusedDate.subtract(1, "month"));
  }, [focusedDate, setFocusedDate]);

  const handleNextMonth = useCallback(() => {
    setFocusedDate(focusedDate.add(1, "month"));
  }, [focusedDate, setFocusedDate]);

  const handleDayClick = useCallback(
    (day: number) => {
      const newDate = dayjs(focusedDate).date(day);
      setFocusedDate(newDate);
      setSelectedView("dia");
    },
    [focusedDate, setFocusedDate, setSelectedView]
  );

  return (
    <Box>
      {/* Navegación */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <IconButton onClick={handlePrevMonth}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography
          variant="h5"
          fontWeight="bold"
          textTransform="capitalize"
          textAlign="center"
          width={210}
        >
          {focusedDate.format("MMMM YYYY")}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* Tooltip virtual (sigue mouse pero anclado al rect de la celda) */}
      {/* Tooltip virtual (sigue mouse pero anclado al rect de la celda) */}
      <Tooltip
        open={openTooltip}
        title={tooltipContent}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "1px solid #ccc",
              "& .MuiTooltip-arrow": {
                color: "#ffffff",
              },
            },
          },
          popper: {
            popperRef,
            anchorEl: {
              getBoundingClientRect: () => {
                const cellRect = areaRef.current?.getBoundingClientRect();
                return new DOMRect(
                  positionRef.current.x,
                  cellRect ? cellRect.y : positionRef.current.y,
                  0,
                  0
                );
              },
            },
          },
        }}
      >
        {/* Contenedor invisible para cumplir children */}
        <Box sx={{ width: 0, height: 0, position: "fixed", top: 0, left: 0 }} />
      </Tooltip>

      {/* Cabecera días */}
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

        {/* Días del mes */}
        {days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            promos={day ? getPromotionsForDay(day) : []}
            onClick={day ? () => handleDayClick(day) : undefined}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PromotionsCalendarMonth;
