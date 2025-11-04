import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Instance } from "@popperjs/core";
import dayjs, { Dayjs } from "dayjs";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useFilteredPromotions } from "../../hooks/useFilteredPromotions";
import { usePromotionsFilter } from "../../hooks/usePromotionsFilter";

// 🎯 Interface para las promociones con datos de posicionamiento
interface PromoWithPosition {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_final: string | null;
  descuento: number;
  color: string;
  // Datos calculados para el posicionamiento
  startOffset: number; // % donde empieza la barra en el mes
  widthPercent: number; // % del ancho que ocupa la barra
}

const YearViewSummary: React.FC = () => {
  const theme = useTheme();
  const promotions = useFilteredPromotions();
  const { focusedDate, setFocusedDate, setSelectedView } =
    usePromotionsFilter();

  const year = focusedDate.year();
  const months = Array.from({ length: 12 }, (_, i) => i);

  const handlePrevYear = React.useCallback(() => {
    setFocusedDate(focusedDate.subtract(1, "year"));
  }, [focusedDate, setFocusedDate]);

  const handleNextYear = React.useCallback(() => {
    setFocusedDate(focusedDate.add(1, "year"));
  }, [focusedDate, setFocusedDate]);

  const handleMonthClick = React.useCallback(
    (monthIdx: number) => {
      setFocusedDate(dayjs().year(year).month(monthIdx).startOf("month"));
      setSelectedView("mensual");
    },
    [year, setFocusedDate, setSelectedView]
  );

  // 🔹 Función para calcular posición y ancho de la barra dentro del mes
  const calculatePromoPosition = React.useCallback(
    (promo: any, monthIdx: number): PromoWithPosition | null => {
      const monthStart = dayjs().year(year).month(monthIdx).startOf("month");
      const monthEnd = dayjs().year(year).month(monthIdx).endOf("month");
      const daysInMonth = monthEnd.date();

      const promoStart = dayjs(promo.fecha_inicio);
      const promoEnd = promo.fecha_final
        ? dayjs(promo.fecha_final)
        : promoStart.endOf("year"); // Si es fija, asumimos que dura todo el año

      // Verificar si la promo intersecta con este mes
      if (
        promoEnd.isBefore(monthStart, "day") ||
        promoStart.isAfter(monthEnd, "day")
      ) {
        return null; // No está en este mes
      }

      // Calcular el día de inicio dentro del mes (1-31)
      const effectiveStart = promoStart.isBefore(monthStart, "day")
        ? monthStart
        : promoStart;

      // Calcular el día de fin dentro del mes (1-31)
      const effectiveEnd = promoEnd.isAfter(monthEnd, "day")
        ? monthEnd
        : promoEnd;

      // Calcular días de duración dentro del mes
      const daysInThisMonth = effectiveEnd.diff(effectiveStart, "day") + 1;

      // Calcular offset (día de inicio - 1) / días del mes * 100
      const startDay = effectiveStart.date(); // 1-31
      const startOffset = ((startDay - 1) / daysInMonth) * 100;

      // Calcular ancho (días de promo / días del mes * 100)
      const widthPercent = (daysInThisMonth / daysInMonth) * 100;

      return {
        ...promo,
        startOffset: Math.max(0, startOffset),
        widthPercent: Math.min(100 - startOffset, widthPercent),
      };
    },
    [year]
  );

  // 🔹 Agrupar promociones por mes con posicionamiento
  const promotionsByMonth = React.useMemo(() => {
    return months.map((monthIdx) => {
      const monthPromos = promotions
        .map((p) => calculatePromoPosition(p, monthIdx))
        .filter((p): p is PromoWithPosition => p !== null);

      return { monthIdx, monthPromos };
    });
  }, [months, promotions, calculatePromoPosition]);

  // ===============================
  // 🎯 Tooltip sincronizado al mouse
  // ===============================
  const popperRef = React.useRef<Instance>(null);
  const positionRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const areaRef = React.useRef<HTMLDivElement | null>(null);

  const [openTooltip, setOpenTooltip] = React.useState(false);
  const [hoveredPromos, setHoveredPromos] = React.useState<PromoWithPosition[]>(
    []
  );

  const handleMouseMove = (
    event: React.MouseEvent,
    promos: PromoWithPosition[]
  ) => {
    if (promos.length === 0) {
      setOpenTooltip(false);
      return;
    }

    positionRef.current = { x: event.clientX, y: event.clientY };
    areaRef.current = event.currentTarget as HTMLDivElement;
    setHoveredPromos(promos);
    setOpenTooltip(true);

    if (popperRef.current) {
      popperRef.current.update();
    }
  };

  const handleMouseLeave = () => {
    setOpenTooltip(false);
    setHoveredPromos([]);
  };

  // Tooltip personalizado
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
              backgroundColor: `${promo.color}15`,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: promo.color || "#1976d2" }}
            >
              {promo.tipo} — {promo.descuento}%
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {`${dayjs(promo.fecha_inicio).locale("es").format("D MMM")} → ${
                promo.fecha_final
                  ? dayjs(promo.fecha_final).locale("es").format("D MMM")
                  : "Fija"
              }`}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      ""
    );

  return (
    <Box>
      {/* 🔸 Selector de año */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        gap={1}
      >
        <IconButton size="small" onClick={handlePrevYear}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          {year}
        </Typography>
        <IconButton size="small" onClick={handleNextYear}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* 🔸 Tooltip virtual sincronizado */}
      <Tooltip
        open={openTooltip}
        title={tooltipContent}
        arrow
        placement="top"
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
                const areaRect = areaRef.current?.getBoundingClientRect();
                return new DOMRect(
                  positionRef.current.x,
                  areaRect ? areaRect.y : positionRef.current.y,
                  0,
                  0
                );
              },
            },
          },
        }}
      >
        <span />
      </Tooltip>

      {/* 🔸 Vista anual con barras proporcionales */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }}
        gap={2}
      >
        {promotionsByMonth.map(({ monthIdx, monthPromos }) => (
          <Paper
            key={monthIdx}
            elevation={0}
            onClick={() => handleMonthClick(monthIdx)}
            onMouseMove={(e) => handleMouseMove(e, monthPromos)}
            onMouseLeave={handleMouseLeave}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              height: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflow: "hidden",
              bgcolor: theme.palette.background.paper,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                textAlign: "center",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              {dayjs().year(year).month(monthIdx).format("MMMM").toUpperCase()}
            </Typography>

            {/* 🎯 Container para las barras proporcionales */}
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              {monthPromos.map((promo) => (
                <Box
                  key={promo.id}
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 12,
                  }}
                >
                  {/* 🔹 Barra proporcional */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${promo.startOffset}%`,
                      width: `${promo.widthPercent}%`,
                      height: "100%",
                      borderRadius: 1,
                      backgroundColor: promo.color || "#90caf9",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        opacity: 0.8,
                        transform: "scaleY(1.1)",
                      },
                    }}
                  />
                </Box>
              ))}

              {/* Mensaje si no hay promociones */}
              {monthPromos.length === 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    textAlign: "center",
                    mt: 2,
                  }}
                >
                  Sin promociones
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default YearViewSummary;
