import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@resoluciones/components/ui/dialog";
import { Promotion, promotionTypeLabels } from "@resoluciones/types/promotion";
import { Badge } from "@resoluciones/components/ui/badge";
import { Calendar, Store, Tag, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PromotionDialogProps {
  promotion: Promotion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromotionDialog = ({ promotion, open, onOpenChange }: PromotionDialogProps) => {
  if (!promotion) return null;

  const duration = Math.ceil(
    (promotion.endDate.getTime() - promotion.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{promotion.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">{promotion.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tiendas */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-primary" />
                <span className="font-medium">Tiendas:</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-2">
                {promotion.stores.map((store) => (
                  <Badge key={store} variant="outline" className="text-xs flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {store}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tipo de promoción */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-medium">Tipo:</span>
              </div>
              <Badge 
                className="ml-6"
                style={{
                  backgroundColor: `hsl(var(--promo-${promotion.type}))`,
                  color: "white"
                }}
              >
                {promotionTypeLabels[promotion.type]}
              </Badge>
            </div>

            {/* Fechas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">Fecha de inicio:</span>
              </div>
              <p className="text-sm ml-6">
                {format(promotion.startDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">Fecha de fin:</span>
              </div>
              <p className="text-sm ml-6">
                {format(promotion.endDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>

            {/* Duración */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">Duración:</span>
              </div>
              <p className="text-sm ml-6">
                {duration} {duration === 1 ? "día" : "días"}
              </p>
            </div>

            {/* Descuento */}
            {promotion.discount && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium">Descuento:</span>
                </div>
                <Badge className="ml-6 bg-destructive text-destructive-foreground">
                  {promotion.discount}% OFF
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
