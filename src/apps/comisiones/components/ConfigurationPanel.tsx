import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCommission } from "../contexts/CommissionContext";
import { validateManagerPercentage } from "../lib/validation";
import { StaffMember } from "../types";
import { Plus, Trash2, AlertCircle } from "lucide-react";
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
    rol: "asesor" as const,
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
    setNewStaff({ nombre: "", tienda: "", fecha: "", rol: "asesor" });
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
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      {/* Configuración de Porcentaje de Gerente */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Configuración de Porcentaje - {mes}
        </h3>

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje fijo del gerente (0-10%)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={porcentajeGerente}
              onChange={(e) =>
                setPorcentajeGerente(parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={handleUpdatePercentage} variant="default">
            Guardar Configuración
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              {errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          </div>
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
            <Plus className="w-4 h-4" />
            Agregar Personal
          </Button>
        </div>

        {showAddStaff && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={newStaff.nombre}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, nombre: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Tienda"
                value={newStaff.tienda}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, tienda: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newStaff.fecha}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, fecha: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newStaff.rol}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, rol: e.target.value as any })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gerente">Gerente</option>
                <option value="asesor">Asesor</option>
                <option value="cajero">Cajero</option>
              </select>
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
