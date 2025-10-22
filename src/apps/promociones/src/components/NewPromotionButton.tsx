// src/components/NewPromotionButton.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@resoluciones/components/ui/button";
import { Plus } from "lucide-react";
import { Label } from "@resoluciones/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@resoluciones/components/ui/dialog";
import { Input } from "@resoluciones/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resoluciones/components/ui/select";
import {
  Promotion,
  PromotionType,
  PromotionDuration,
  stores,
  promotionTypeLabels,
} from "@resoluciones/types/promotion";

interface NewPromotionButtonProps {
  onCreate: (promotion: Promotion) => void;
}

export const NewPromotionButton: React.FC<NewPromotionButtonProps> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [type, setType] = useState<PromotionType>("discount");
  const [duration, setDuration] = useState<PromotionDuration>("temporal");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [discount, setDiscount] = useState<number>(0);

  const handleCreate = () => {
    if (!title || !description || selectedStores.length === 0 || !startDate) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    const newPromotion: Promotion = {
      id: Date.now().toString(),
      title,
      description,
      stores: selectedStores,
      type,
      duration,
      startDate: new Date(startDate),
      endDate: duration === "temporal" ? new Date(endDate) : new Date(startDate),
      discount,
    };

    onCreate(newPromotion);
    setOpen(false);

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedStores([]);
    setType("discount");
    setDuration("temporal");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setDiscount(0);
  };

  const handleStoreChange = (store: string) => {
    setSelectedStores(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  // Filtrar tipos de promoción según duración
  const filteredPromotionTypes = Object.entries(promotionTypeLabels).filter(([key]) =>
    duration === "fija"
      ? key === "discount" || key === "clearance"
      : key !== "discount" && key !== "clearance"
  );

  // Ajustar tipo automáticamente si ya no es válido
  useEffect(() => {
    if (!filteredPromotionTypes.find(([key]) => key === type)) {
      setType(filteredPromotionTypes[0][0] as PromotionType);
    }
  }, [filteredPromotionTypes, type]);

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Nueva Promoción
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Promoción</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

            {/* Tiendas con scroll */}
{/* Tiendas con scroll y selección rápida */}
<div className="space-y-2">
  <Label className="text-sm font-medium block">Tiendas</Label>

  {/* Botones de selección rápida */}
  <div className="flex gap-2 mb-1">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setSelectedStores([...stores])}
    >
      Seleccionar todas
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setSelectedStores([])}
    >
      Deseleccionar todas
    </Button>
  </div>

  {/* Contenedor de tiendas con scroll */}
  <div className="h-32 overflow-y-auto flex flex-wrap gap-2 border rounded p-2">
    {stores.map(store => (
      <Button
        key={store}
        variant={selectedStores.includes(store) ? "default" : "outline"}
        onClick={() => handleStoreChange(store)}
        size="sm"
      >
        {store}
      </Button>
    ))}
  </div>
</div>


            {/* Duración */}
            <Select value={duration} onValueChange={(val) => setDuration(val as PromotionDuration)}>
              <SelectTrigger>
                <SelectValue placeholder="Duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporal">Temporal</SelectItem>
                <SelectItem value="fija">Fija</SelectItem>
              </SelectContent>
            </Select>

            {/* Tipo de promoción filtrado */}
            <Select key={duration} value={type} onValueChange={(val) => setType(val as PromotionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Promoción" />
              </SelectTrigger>
              <SelectContent>
                {filteredPromotionTypes.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Fechas */}
            <label className="block">
              Fecha de inicio
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded p-2 mt-1"
              />
            </label>

            {/* Fecha final siempre visible, deshabilitada si duración es fija */}
            <label className="block">
              Fecha final
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded p-2 mt-1"
                disabled={duration === "fija"}
                style={{ backgroundColor: duration === "fija" ? "#f3f3f3" : "white" }}
              />
            </label>

            <Input
              type="number"
              placeholder="Descuento (%)"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value))}
            />
          </div>

          <DialogFooter>
            <Button onClick={handleCreate}>Crear Promoción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
