import { Promotion } from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { Badge } from "@resoluciones/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayCalendarProps {
  date: Date;
  promotions: Promotion[];
  onPromotionClick: (promotion: Promotion) => void;
  onPreviousDay: () => void; // Navegar al día anterior
  onNextDay: () => void;     // Navegar al día siguiente
}

export const DayCalendar = ({
  date,
  promotions,
  onPromotionClick,
  onPreviousDay,
  onNextDay,
}: DayCalendarProps) => {
  // Rango de 2 h → 0, 2, 4 ... 22
  const hours = Array.from({ length: 12 }, (_, i) => i * 2);

  /** Filtra promociones activas en este día */
  const getPromotionsForDay = () => {
    return promotions.filter((promo) => {
      const sameDay =
        promo.startDate <= date && (!promo.endDate || promo.endDate >= date);
      return sameDay;
    });
  };

  const dayPromotions = getPromotionsForDay();

  /** Convierte hora:minutos en posición relativa dentro del día (0-24) */
  const getHourPosition = (hour: number, minute: number = 0) => hour + minute / 60;

  /** Calcula estilos de posición para cada promoción */
  const getPromotionStyle = (promo: Promotion) => {
    const start = promo.startDate.getHours() + promo.startDate.getMinutes() / 60;
    const end =
      promo.endDate?.getHours() + (promo.endDate?.getMinutes() || 0) / 60 || 24;
    const totalHours = 24;
    const leftPercent = (start / totalHours) * 100;
    const widthPercent = ((end - start) / totalHours) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: `hsl(var(--promo-${promo.type}))`,
      color: "white",
    };
  };

  return (
    <Card className="p-6 overflow-x-auto">
      {/* Controles de navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPreviousDay} className="p-2 rounded hover:bg-muted/20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold capitalize text-center flex-1">
          {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </h2>
        <button onClick={onNextDay} className="p-2 rounded hover:bg-muted/20">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {dayPromotions.length > 0 ? (
        <div className="space-y-6">
          {/* Encabezado de horas */}
          <div className="relative border-b pb-2 mb-2 min-w-[1200px]">
            <div className="flex justify-between">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="text-xs font-medium text-muted-foreground border-l last:border-r-0"
                  style={{ width: `${100 / 12}%`, textAlign: "center" }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* Línea de tiempo horizontal */}
          <div
            className="relative h-32 border rounded-lg bg-muted/10 min-w-[1200px]"
            style={{ position: "relative" }}
          >
            {/* Líneas divisorias cada 2 horas */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute top-0 bottom-0 border-l border-muted/40"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {/* Promociones posicionadas por hora */}
            <div className="space-y-2">
              {dayPromotions.map((promo) => (
                <div
                  key={promo.id}
                  className="p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={getPromotionStyle(promo)}
                  onClick={() => onPromotionClick(promo)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{promo.title}</p>
                      <p className="text-sm opacity-90">{promo.stores.join(", ")}</p>
                      <p className="text-xs opacity-80 mt-1">{promo.description}</p>
                    </div>
                    {promo.discount && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {promo.discount}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No hay promociones activas para este día
        </div>
      )}
    </Card>
  );
};
