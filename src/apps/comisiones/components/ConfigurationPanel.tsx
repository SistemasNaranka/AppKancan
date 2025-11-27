import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCommission } from "../contexts/CommissionContext";
import { validateManagerPercentage } from "../lib/validation";
import { StaffMember } from "../types";
import { Add, Delete, Error } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

interface ConfigurationPanelProps {
  mes: string;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  mes,
}) => {
  const {
    state,
    updateMonthConfig,
    addStaffMember,
    removeStaffMember,
    getMonthConfig,
  } = useCommission();
  const [porcentajeGerente, setPorcentajeGerente] = useState(
    getMonthConfig(mes)?.porcentaje_gerente || 10
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    nombre: "",
    tienda: "",
    fecha: "",
    rol: "asesor" as "gerente" | "asesor" | "cajero",
  });

  const handleUpdatePercentage = () => {
    const validationErrors = validateManagerPercentage(porcentajeGerente);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
    } else {
      updateMonthConfig(mes, porcentajeGerente);
      setErrors([]);
    }
  };

  const handleAddStaff = () => {
    if (
      !newStaff.nombre.trim() ||
      !newStaff.tienda.trim() ||
      !newStaff.fecha.trim()
    ) {
      setErrors(["Por favor completa todos los campos"]);
      return;
    }

    const member: StaffMember = {
      id: uuidv4(),
      nombre: newStaff.nombre,
      tienda: newStaff.tienda,
      fecha: newStaff.fecha,
      rol: newStaff.rol,
    };

    addStaffMember(member);
    setNewStaff({ nombre: "", tienda: "", fecha: "", rol: "asesor" as "gerente" | "asesor" | "cajero" });
    setShowAddStaff(false);
    setErrors([]);
  };

  const staffForMonth = state.staff.filter((s) => {
    const staffDate = new Date(s.fecha + "T00:00:00Z");
    const [mesStr, yearStr] = mes.split(" ");
    const months: Record<string, number> = {
      Ene: 0,
      Feb: 1,
      Mar: 2,
      Abr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Ago: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dic: 11,
    };
    return (
      staffDate.getUTCMonth() === months[mesStr] &&
      staffDate.getUTCFullYear() === parseInt(yearStr)
    );
  });

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle className="text-lg">Configuración de Comisiones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración de Porcentaje de Gerente */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Configuración de Porcentaje - {mes}
            </Label>

            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="gerente-percentage">
                  Porcentaje fijo del gerente (0-10%)
                </Label>
                <Input
                  id="gerente-percentage"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={porcentajeGerente}
                  onChange={(e) =>
                    setPorcentajeGerente(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Ingrese el porcentaje del gerente"
                />
              </div>
              <Button onClick={handleUpdatePercentage} variant="default">
                Guardar Configuración
              </Button>
            </div>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <Error className="h-4 w-4" />
              <AlertDescription>
                {errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Gestión de Personal */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Personal del mes</h3>
            <Button
              onClick={() => setShowAddStaff(!showAddStaff)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Add className="w-4 h-4" />
              Agregar Personal
            </Button>
          </div>

        {showAddStaff && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Nombre</Label>
                <Input
                  id="staff-name"
                  type="text"
                  placeholder="Nombre"
                  value={newStaff.nombre}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, nombre: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-store">Tienda</Label>
                <Input
                  id="staff-store"
                  type="text"
                  placeholder="Tienda"
                  value={newStaff.tienda}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, tienda: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-date">Fecha</Label>
                <Input
                  id="staff-date"
                  type="date"
                  value={newStaff.fecha}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, fecha: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Rol</Label>
                <Select
                  value={newStaff.rol}
                  onValueChange={(value) =>
                    setNewStaff({ ...newStaff, rol: value as "gerente" | "asesor" | "cajero" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="asesor">Asesor</SelectItem>
                    <SelectItem value="cajero">Cajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStaff} variant="default" size="sm">
                Agregar
              </Button>
              <Button
                onClick={() => setShowAddStaff(false)}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {staffForMonth.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay personal asignado para este mes
          </p>
        ) : (
          <div className="space-y-2">
            {staffForMonth.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200"
              >
                <div>
                  <p className="font-medium">{staff.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {staff.tienda} • {staff.rol} • {staff.fecha}
                  </p>
                </div>
                <Button
                  onClick={() => removeStaffMember(staff.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Delete className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};
