import { Promotion } from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { IconButton, Box, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

interface MonthCalendarProps {
  year: number;
  month: number;
  promotions: Promotion[];
  onPromotionClick: (promotion: Promotion) => void;
  onDaySelect: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const MonthCalendar = ({
  year,
  month,
  promotions,
  onPromotionClick,
  onDaySelect,
  onPreviousMonth,
  onNextMonth,
}: MonthCalendarProps) => {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const getPromotionsForDay = (day: Date) => {
    return promotions.filter((promo) => promo.startDate <= day && promo.endDate >= day);
  };

  return (
    <Card className="p-6">
      {/* Barra superior con navegación de mes */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={onPreviousMonth}>
          <ArrowBackIos fontSize="small" />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" className="capitalize">
          {format(monthStart, "MMMM yyyy", { locale: es })}
        </Typography>
        <IconButton onClick={onNextMonth}>
          <ArrowForwardIos fontSize="small" />
        </IconButton>
      </Box>

      {/* Encabezado de días */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Días del mes */}
        {days.map((day, idx) => {
          const dayPromotions = getPromotionsForDay(day);
          const isCurrentMonth = day >= monthStart && day <= monthEnd;

          return (
            <div
              key={idx}
              className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${
                isCurrentMonth ? "bg-card hover:bg-muted/40" : "bg-muted/30"
              }`}
              onClick={() => onDaySelect(day)}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayPromotions.slice(0, 3).map((promo) => (
                  <div
                    key={promo.id}
                    className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                    style={{
                      backgroundColor: `hsl(var(--promo-${promo.type}))`,
                      color: "white",
                    }}
                    title={promo.title}
                    onClick={() => onPromotionClick(promo)}
                  >
                    {promo.title}
                  </div>
                ))}
                {dayPromotions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayPromotions.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
