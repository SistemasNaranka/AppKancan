import { Card } from "@resoluciones/components/ui/card";
import { ScrollArea } from "@resoluciones/components/ui/scroll-area";
import { Promotion } from "@resoluciones/types/promotion";
import { PromotionCard } from "@resoluciones/components/PromotionCard";
import { List } from "lucide-react";

interface PromotionListPanelProps {
  promotions: Promotion[];
  onPromotionClick?: (promotion: Promotion) => void;
}

export const PromotionListPanel = ({
  promotions,
  onPromotionClick,
}: PromotionListPanelProps) => {
  return (
    <Card className="p-6 h-[80vh] sticky top-4 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Promociones</h2>
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          {promotions.length > 0 ? (
            promotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onClick={() => onPromotionClick?.(promo)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay promociones disponibles con los filtros actuales.
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
