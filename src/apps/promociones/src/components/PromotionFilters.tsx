import { useState, useMemo } from "react";
import {
  PromotionType,
  PromotionDuration,
  promotionTypeLabels,
  stores,
} from "@resoluciones/types/promotion";
import { Card } from "@resoluciones/components/ui/card";
import { Label } from "@resoluciones/components/ui/label";
import { Checkbox } from "@resoluciones/components/ui/checkbox";
import { ScrollArea } from "@resoluciones/components/ui/scroll-area";
import { Filter } from "lucide-react";

import SelectionModal, {
  SelectionItem,
} from "@/shared/components/selectionmodal/SelectionModal";
import {useSelectionModal} from "@/shared/components/selectionmodal/useSelectionModal";

interface PromotionFiltersProps {
  selectedStores: string[];
  selectedTypes: PromotionType[];
  selectedDurations: PromotionDuration[];
  onStoreChange: (store: string) => void;
  onTypeChange: (type: PromotionType) => void;
  onDurationChange: (duration: PromotionDuration) => void;
}

export const PromotionFilters = ({
  selectedStores,
  selectedTypes,
  selectedDurations,
  onStoreChange,
  onTypeChange,
  onDurationChange,
}: PromotionFiltersProps) => {
  const { open, openModal, closeModal } = useSelectionModal();

  // 🔹 Adaptamos el array de `stores` (string[]) a `SelectionItem[]`
  const storeItems: SelectionItem[] = useMemo(
    () =>
      stores.map((store) => ({
        id: store,
        label: store,
      })),
    []
  );

  // Estado temporal de selección dentro del modal
  const [tempSelectedIds, setTempSelectedIds] = useState<(string | number)[]>(
    selectedStores
  );

  // 🔹 Tipos de promoción según duración seleccionada
  const filteredTypes = (() => {
    const hasFija = selectedDurations.includes("fija");
    const hasTemporal = selectedDurations.includes("temporal");

    if ((hasFija && hasTemporal) || (!hasFija && !hasTemporal)) {
      return Object.keys(promotionTypeLabels) as PromotionType[];
    }

    if (hasFija && !hasTemporal) {
      return ["discount", "clearance"] as PromotionType[];
    }

    return (Object.keys(promotionTypeLabels) as PromotionType[]).filter(
      (type) => !["discount", "clearance"].includes(type)
    );
  })();

  // 🔹 Confirmar selección del modal
  const handleConfirmSelection = (newSelected: (string | number)[]) => {
    // Aplica los cambios al filtro principal
    const newStoreIds = newSelected.map(String);

    // Agrega los nuevos
    newStoreIds.forEach((store) => {
      if (!selectedStores.includes(store)) onStoreChange(store);
    });

    // Elimina los desmarcados
    selectedStores.forEach((store) => {
      if (!newStoreIds.includes(store)) onStoreChange(store);
    });

    setTempSelectedIds(newStoreIds);
    closeModal();
  };

  return (
    <>
      <Card className="p-6 h-fit sticky top-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="space-y-6">
          {/* Duración */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Duración</Label>
            <div className="space-y-3">
              {(["fija", "temporal"] as PromotionDuration[]).map((duration) => (
                <div key={duration} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`duration-${duration}`}
                    name="promotion-duration"
                    checked={selectedDurations.includes(duration)}
                    onChange={() => onDurationChange(duration)}
                    className="accent-primary w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor={`duration-${duration}`}
                    className="text-sm cursor-pointer flex-1 capitalize"
                  >
                    {duration}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de promoción */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Tipo de Promoción
            </Label>
            <ScrollArea className="h-[180px]">
              <div className="space-y-3">
                {filteredTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => onTypeChange(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {promotionTypeLabels[type]}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Tiendas */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Tiendas</Label>
            <button
              onClick={openModal}
              className="w-full py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-md transition"
            >
              Seleccionar tiendas ({selectedStores.length})
            </button>
          </div>
        </div>
      </Card>

      {/* 🔹 Modal de selección de tiendas */}
      <SelectionModal
        maxColumns ={4}
        open={open}
        onClose={closeModal}
        title="Seleccionar tiendas"
        items={storeItems}
        initialSelected={tempSelectedIds}
        onConfirm={handleConfirmSelection}
      />
    </>
  );
};
