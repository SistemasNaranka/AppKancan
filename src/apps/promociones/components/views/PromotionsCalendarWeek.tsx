import React, { useMemo, useCallback, useRef, useState } from "react";
import { Box, Typography, IconButton, Tooltip, useTheme } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Instance } from "@popperjs/core";
import { Promotion } from "../../types/promotion";
import { usePromotionsFilter } from "../../hooks/usePromotionsFilter";
import { useFilteredPromotions } from "../../hooks/useFilteredPromotions";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);

interface DayCellProps {
  date: Dayjs;
  promos: Promotion[];
  isToday: boolean;
  onClick?: () => void;
  onPointerMove?: (
    e: React.PointerEvent,
    promos: Promotion[],
    cell: HTMLDivElement
  ) => void;
  onPointerLeave?: () => void;
}

const DayCell: React.FC<DayCellProps> = React.memo(
  ({ date, promos, isToday, onClick, onPointerMove, onPointerLeave }) => {
    const theme = useTheme();
    const visiblePromos = promos.slice(0, 5);
    const extraPromos = promos.length - visiblePromos.length;

    const cellRef = useRef<HTMLDivElement | null>(null);

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
          minHeight: 120,
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 1,
          bgcolor: isToday ? "action.hover" : "background.paper",
          overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s",
          "&:hover": onClick
            ? {
                bgcolor: isToday ? "action.selected" : "action.hover",
                borderColor: theme.palette.primary.main,
              }
            : {},
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              fontSize: "0.9rem",
              color: isToday ? "primary.main" : "text.primary",
            }}
          >
            {date.format("DD")}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
            }}
          >
            {date.format("ddd")}
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={0.5}>
          {visiblePromos.map((promo) => (
            <Box
              key={promo.id}
              sx={{
                height: 16,
                width: promo.fecha_final ? "100%" : "30%", // Para fijas, solo una marca pequeña
                backgroundColor: promo.color || theme.palette.primary.main,
                borderRadius: 0.5,
                display: "flex",
                alignItems: "center",
                px: 0.5,
              }}
              title={`${promo.tipo}: ${promo.descuento}%`}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: "white",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {promo.tipo} {promo.descuento}%
              </Typography>
            </Box>
          ))}

          {extraPromos > 0 && (
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: "text.secondary",
                textAlign: "center",
                mt: 0.5,
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

const PromotionsCalendarWeek: React.FC = () => {
  const promotions = useFilteredPromotions();
  const { focusedDate, setFocusedDate, setSelectedView } =
    usePromotionsFilter();

  // Tooltip virtual refs/state
  const popperRef = useRef<Instance | null>(null);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement | null>(null); // current cell element
  const [openTooltip, setOpenTooltip] = useState(false);
  const [hoveredPromos, setHoveredPromos] = useState<Promotion[]>([]);

  // week start (Monday)
  const weekStart = useMemo(
    () => focusedDate.startOf("week").add(1, "day"),
    [focusedDate]
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day")),
    [weekStart]
  );

  const getPromotionsForDay = useCallback(
    (date: Dayjs): Promotion[] => {
      const dayStart = date.startOf("day");
      return promotions.filter((p) => {
        const start = dayjs(p.fecha_inicio).startOf("day");
        const end = p.fecha_final ? dayjs(p.fecha_final).endOf("day") : null;
        if (end) {
          return dayStart.isSameOrAfter(start) && dayStart.isSameOrBefore(end);
        }
        return dayStart.isSame(start, "day");
      });
    },
    [promotions]
  );

  const handleDayClick = useCallback(
    (date: Dayjs) => {
      setFocusedDate(date);
      setSelectedView("dia");
    },
    [setFocusedDate, setSelectedView]
  );

  const handlePrevWeek = useCallback(() => {
    setFocusedDate(focusedDate.subtract(1, "week"));
  }, [focusedDate, setFocusedDate]);

  const handleNextWeek = useCallback(() => {
    setFocusedDate(focusedDate.add(1, "week"));
  }, [focusedDate, setFocusedDate]);

  // Pointer handler: receives cell DOM element so areaRef is guaranteed to be the cell
  const handlePointerMove = (
    event: React.PointerEvent,
    promos: Promotion[],
    cellEl: HTMLDivElement
  ) => {
    if (!promos || promos.length === 0) {
      setOpenTooltip(false);
      setHoveredPromos([]);
      return;
    }

    // make tooltip follow cursor
    positionRef.current = { x: event.clientX, y: event.clientY };
    // anchor to the whole cell (rect), not inner elements
    areaRef.current = cellEl;

    setHoveredPromos(promos);
    setOpenTooltip(true);

    if (popperRef.current) popperRef.current.update();
  };

  const handlePointerLeave = () => {
    setOpenTooltip(false);
    setHoveredPromos([]);
  };

  // build tooltip content
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

  const today = dayjs();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <IconButton onClick={handlePrevWeek} size="small">
          <ArrowBackIos fontSize="small" />
        </IconButton>

        <Box textAlign="center" width="200px">
          <Typography variant="h6" fontWeight="bold" textTransform="capitalize">
            {weekStart.format("MMMM YYYY")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Semana {weekStart.week()} · {weekStart.format("DD MMM")} -{" "}
            {weekStart.add(6, "day").format("DD MMM")}
          </Typography>
        </Box>

        <IconButton onClick={handleNextWeek} size="small">
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* Tooltip virtual */}
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

      {/* Grid week */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)",
          md: "repeat(7, 1fr)",
        }}
        gap={1}
      >
        {weekDays.map((date) => (
          <DayCell
            key={date.format("YYYY-MM-DD")}
            date={date}
            promos={getPromotionsForDay(date)}
            isToday={date.isSame(today, "day")}
            onClick={() => handleDayClick(date)}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PromotionsCalendarWeek;
