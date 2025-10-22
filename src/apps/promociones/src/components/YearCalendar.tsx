import { Promotion } from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { Badge } from "@resoluciones/components/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { IconButton, Box, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useState } from "react";

interface YearCalendarProps {
  year: number;
  promotions: Promotion[];
  onPromotionClick: (promotion: Promotion) => void;
  onMonthSelect?: (monthIndex: number) => void;
  onYearChange?: (newYear: number) => void; // 👈 nuevo callback opcional
}

export const YearCalendar = ({
  year,
  promotions,
  onMonthSelect,
  onYearChange,
  onPromotionClick,
}: YearCalendarProps) => {

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  const handlePrevYear = () => onYearChange?.(year - 1);
  const handleNextYear = () => onYearChange?.(year + 1);

  const getPromotionsForMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return promotions.filter((promo) => {
      return (
        (promo.startDate >= monthStart && promo.startDate <= monthEnd) ||
        (promo.endDate >= monthStart && promo.endDate <= monthEnd) ||
        (promo.startDate <= monthStart && promo.endDate >= monthEnd)
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* 🔹 Barra superior con controles de año */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
        <IconButton onClick={handlePrevYear}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" className="capitalize">
          {format(new Date(year, 0, 1), "yyyy", { locale: es })}
        </Typography>
        <IconButton onClick={handleNextYear}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* 🔹 Cuadrícula de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month, i) => {
          const monthPromotions = getPromotionsForMonth(month);

          return (
            <Card
              key={month.toISOString()}
              className="p-4 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => onMonthSelect?.(i)}
            >
              <h3 className="font-semibold text-center mb-4 text-lg capitalize">
                {format(month, "MMMM yyyy", { locale: es })}
              </h3>

              {monthPromotions.length > 0 ? (
                <div className="space-y-2">
                  {monthPromotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                      style={{
                        borderLeftColor: `hsl(var(--promo-${promo.type}))`,
                      }}
                    >
                      <p className="text-sm font-medium truncate">{promo.title}</p>

                      {/* Tiendas */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {promo.stores.slice(0, 2).map((store) => (
                          <Badge
                            key={store}
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            {store}
                          </Badge>
                        ))}
                        {promo.stores.length > 2 && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            +{promo.stores.length - 2} más
                          </Badge>
                        )}
                      </div>

                      {/* Fechas */}
                      <div className="flex gap-1 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `hsl(var(--promo-${promo.type}))`,
                            color: "white",
                          }}
                        >
                          {format(promo.startDate, "d")}-{format(promo.endDate, "d")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Sin promociones
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
