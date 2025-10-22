import { Promotion } from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekCalendarProps {
  selectedDate: Date;
  year: number;
  month: number;
  weekIndex: number;
  promotions: Promotion[];
  onPromotionClick: (promotion: Promotion) => void;
  onDaySelect: (date: Date) => void;   // 🔹 nuevo
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export const WeekCalendar = ({
  year,
  month,
  weekIndex,
  promotions,
  onPromotionClick,
  onDaySelect,
  onPreviousWeek,
  onNextWeek,
}: WeekCalendarProps) => {
  const monthDate = new Date(year, month, 1);
  const firstWeekStart = startOfWeek(monthDate, { weekStartsOn: 1 });
  const weekStart = addWeeks(firstWeekStart, weekIndex);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });  // 🔹 solo una vez
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getPromotionsForDay = (day: Date) =>
    promotions.filter(promo => promo.startDate <= day && promo.endDate >= day);

  return (
    <Card className="p-6">
      {/* Controles de navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPreviousWeek} className="p-2 rounded hover:bg-muted/20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-center flex-1">
          Semana del {format(weekStart, "d")} al {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
        </h2>
        <button onClick={onNextWeek} className="p-2 rounded hover:bg-muted/20">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const dayPromotions = getPromotionsForDay(day);
          return (
            <div key={day.toISOString()} className="space-y-2 cursor-pointer" onClick={() => onDaySelect(day)}>
              {/* Cabecera del día */}
              <div className="text-center">
                <div className="font-semibold text-sm text-muted-foreground">
                  {format(day, "EEE", { locale: es })}
                </div>
                <div className="text-2xl font-bold">{format(day, "d")}</div>
              </div>

              {/* Contenedor de promociones */}
              <div className="space-y-2 min-h-[200px] border rounded-lg p-2 bg-card">
                {dayPromotions.slice(0, 3).map((promo) => (
                  <div
                    key={promo.id}
                    className="p-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity truncate"
                    style={{ backgroundColor: `hsl(var(--promo-${promo.type}))`, color: "white" }}
                    onClick={(e) => { e.stopPropagation(); onPromotionClick(promo); }}
                    title={promo.title}
                  >
                    <p className="text-xs font-medium truncate">{promo.title}</p>
                    <p className="text-xs opacity-90 truncate">{promo.stores.join(", ")}</p>
                  </div>
                ))}
                {dayPromotions.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayPromotions.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
