import React, { useMemo, useState, useCallback } from "react";
import { Box, Typography, Paper, useTheme, Chip, IconButton } from "@mui/material";
import dayjs from "dayjs";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { promotionColors } from "../data/mockPromotionsColors";
import { useFilteredPromotions } from "../hooks/useFilteredPromotions";

interface YearViewSummaryProps {
  onMonthClick?: (monthIdx: number) => void;
}

const YearViewSummary: React.FC<YearViewSummaryProps> = ({ onMonthClick }) => {
  const theme = useTheme();
  const [year, setYear] = useState(dayjs().year()); // Año actual
  const promotions = useFilteredPromotions();

  const months = Array.from({ length: 12 }, (_, i) => i);

  // Funciones para cambiar de año
  const handlePrevYear = useCallback(() => setYear((prev) => prev - 1), []);
  const handleNextYear = useCallback(() => setYear((prev) => prev + 1), []);

  /** Agrupar promociones por mes */
  const promotionsByMonth = useMemo(() => {
    return months.map((monthIdx) => {
      const monthPromos = promotions.filter((p) => {
        const start = dayjs(p.fecha_inicio);
        const end = p.fecha_final ? dayjs(p.fecha_final) : null;
        const monthStart = dayjs().year(year).month(monthIdx).startOf("month");
        const monthEnd = dayjs().year(year).month(monthIdx).endOf("month");

        if (end) {
          // Promoción temporal: mostrar si cae dentro del mes
          return (start.isBefore(monthEnd) || start.isSame(monthEnd)) &&
                 (end.isAfter(monthStart) || end.isSame(monthStart));
        } else {
          // Promoción fija: solo mostrar en el día de inicio
          return start.isSame(monthStart, "month");
        }
      });

      return { monthIdx, monthPromos };
    });
  }, [months, promotions, year]);

  return (
    <Box>
      {/* Selector de año */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={2} gap={1}>
        <IconButton size="small" onClick={handlePrevYear}><ArrowBackIos fontSize="small" /></IconButton>
        <Typography variant="h6" fontWeight="bold">{year}</Typography>
        <IconButton size="small" onClick={handleNextYear}><ArrowForwardIos fontSize="small" /></IconButton>
      </Box>

      {/* Vista anual */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "1fr 1fr",
          lg: "1fr 1fr 1fr",
        }}
        gap={2}
      >
        {promotionsByMonth.map(({ monthIdx, monthPromos }) => (
          <Paper
            key={monthIdx}
            elevation={0}
            onClick={() => onMonthClick?.(monthIdx)}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              bgcolor: theme.palette.background.paper,
              cursor: onMonthClick ? "pointer" : "default",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                textAlign: "center",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {dayjs().year(year).month(monthIdx).format("MMMM").toUpperCase()}
            </Typography>

            {monthPromos.length > 0 ? (
              monthPromos.map((promo) => (
                <Box
                  key={promo.id}
                  sx={{
                    borderLeft: `4px solid ${promotionColors[promo.tipo]}`,
                    pl: 1,
                    py: 0.5,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: promotionColors[promo.tipo] }}
                  >
                    {promo.tipo} — {promo.descuento}%
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ display: "block", color: "text.secondary" }}
                  >
                    {dayjs(promo.fecha_inicio).format("DD MMM")} →{" "}
                    {promo.fecha_final ? dayjs(promo.fecha_final).format("DD MMM") : "-"}
                  </Typography>

                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {promo.descripcion}
                  </Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {promo.tiendas.slice(0, 5).map((tienda) => (
                      <Chip
                        key={tienda}
                        size="small"
                        label={tienda}
                        sx={{
                          fontSize: "0.65rem",
                          bgcolor: "transparent",
                          border: `1px solid ${promotionColors[promo.tipo]}`,
                          color: promotionColors[promo.tipo],
                          height: 18,
                          "& .MuiChip-label": { px: 0.5 },
                        }}
                      />
                    ))}

                    {promo.tiendas.length > 5 && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", alignSelf: "center", ml: 0.5 }}
                      >
                        +{promo.tiendas.length - 5} más
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))
            ) : (
              <Typography
                variant="caption"
                sx={{
                  textAlign: "center",
                  color: "text.disabled",
                  mt: 1,
                  fontStyle: "italic",
                }}
              >
                Sin promociones
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default YearViewSummary;
