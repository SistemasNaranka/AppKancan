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
import dayjs from "dayjs";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { promotionColors } from "../../data/mockPromotionsColors";
import { useFilteredPromotions } from "../../hooks/useFilteredPromotions";
import { usePromotionsFilter } from "../../hooks/usePromotionsFilter";
import { es } from "date-fns/locale";
import { format } from "date-fns";

const YearViewSummary: React.FC = () => {
  const theme = useTheme();
  const promotions = useFilteredPromotions();
  const { focusedDate, setFocusedDate, setSelectedView } = usePromotionsFilter();

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

  // 🔹 Agrupar promociones por mes
  const promotionsByMonth = React.useMemo(() => {
    return months.map((monthIdx) => {
      const monthPromos = promotions.filter((p) => {
        const start = dayjs(p.fecha_inicio);
        const end = p.fecha_final ? dayjs(p.fecha_final) : null;
        const monthStart = dayjs().year(year).month(monthIdx).startOf("month");
        const monthEnd = dayjs().year(year).month(monthIdx).endOf("month");

        if (end) {
          return (
            (start.isBefore(monthEnd) || start.isSame(monthEnd)) &&
            (end.isAfter(monthStart) || end.isSame(monthStart))
          );
        } else {
          return start.isSame(monthStart, "month");
        }
      });

      return { monthIdx, monthPromos };
    });
  }, [months, promotions, year]);

  // ===============================
  // 🎯 Tooltip sincronizado al mouse
  // ===============================
  const popperRef = React.useRef<Instance>(null);
  const positionRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const areaRef = React.useRef<HTMLDivElement | null>(null);

  const [openTooltip, setOpenTooltip] = React.useState(false);
  const [hoveredPromos, setHoveredPromos] = React.useState<any[]>([]);

  const handleMouseMove = (event: React.MouseEvent, promos: any[]) => {
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
    backgroundColor: `${promo.color}15`, // fondo suave translúcido
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
      : "-"
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
      <Box display="flex" justifyContent="center" alignItems="center" mb={2} gap={1}>
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
      

      {/* 🔸 Vista anual */}
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

            <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5 }}>



              {monthPromos.map((promo) => (
  <Box
    key={promo.id}
    sx={{
      width: "100%",
      height: 12,
      borderRadius: 1,
      mb: 0.5,
      backgroundColor: promo.color || "#90caf9", // 🎨 usa color de base de datos
      transition: "background-color 0.2s ease",
    }}
  />
))}


            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default YearViewSummary;
