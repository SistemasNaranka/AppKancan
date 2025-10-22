import { Promotion, promotionTypeLabels } from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { Badge } from "@resoluciones/components/ui/badge";
import { Calendar, Store, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
}

const typeColorMap: Record<string, string> = {
  discount: "bg-promo-discount",
  season: "bg-promo-season",
  bogo: "bg-promo-bogo",
  bundle: "bg-promo-bundle",
  clearance: "bg-promo-clearance",
  special: "bg-promo-special"
};

export const PromotionCard = ({ promotion, onClick }: PromotionCardProps) => {
  const duration = Math.ceil(
    (promotion.endDate.getTime() - promotion.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 hover:scale-[1.02]"
      style={{
        borderLeftColor: `hsl(var(--promo-${promotion.type}))`
      }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              {promotion.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {promotion.description}
            </p>
          </div>
          {promotion.discount && (
            <Badge className="bg-destructive text-destructive-foreground ml-2">
              -{promotion.discount}%
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
  <Badge 
    variant="secondary" 
    className={`${typeColorMap[promotion.type]} text-white`}
  >
    <Tag className="w-3 h-3 mr-1" />
    {promotionTypeLabels[promotion.type]}
  </Badge>

  {promotion.stores.slice(0, 2).map((store) => (
    <Badge key={store} variant="outline" className="text-xs flex items-center gap-1">
      <Store className="w-3 h-3 mr-1" />
      {store}
    </Badge>
  ))}

  {promotion.stores.length > 2 && (
    <Badge variant="outline" className="text-xs flex items-center gap-1">
      +{promotion.stores.length - 2} más
    </Badge>
  )}
</div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            {format(promotion.startDate, "d MMM", { locale: es })} - {format(promotion.endDate, "d MMM yyyy", { locale: es })}
          </span>
          <span className="ml-auto">
            {duration} {duration === 1 ? "día" : "días"}
          </span>
        </div>
      </div>
    </Card>
  );
};
