import React from 'react';
import { Role } from '../types';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentMonth } from '../lib/calculations';

interface FilterControlsProps {
  /** Mes seleccionado actualmente */
  selectedMonth: string;
  /** Lista de meses disponibles */
  availableMonths: string[];
  /** Callback para cambiar el mes */
  onMonthChange: (month: string) => void;
  /** Filtro de tienda actualmente aplicado */
  filterTienda: string;
  /** Callback para cambiar filtro de tienda */
  onFilterTiendaChange: (tienda: string) => void;
  /** Filtro de rol actualmente aplicado */
  filterRol: Role | '';
  /** Callback para cambiar filtro de rol */
  onFilterRolChange: (rol: Role | '') => void;
  /** Lista única de tiendas para el dropdown */
  uniqueTiendas: string[];
  /** Total de tiendas disponibles */
  totalTiendas: number;
}

/**
 * Componente especializado para el manejo de filtros de la aplicación.
 * Centraliza toda la lógica de filtrado en un componente dedicado.
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
  filterTienda,
  onFilterTiendaChange,
  filterRol,
  onFilterRolChange,
  uniqueTiendas,
  totalTiendas,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  /**
   * Limpia todos los filtros y vuelve al mes actual
   */
  const clearFilters = () => {
    // Resetear mes al mes actual
    const currentMonth = getCurrentMonth();
    if (availableMonths.includes(currentMonth)) {
      onMonthChange(currentMonth);
    }
    // Resetear filtros de tienda y rol
    onFilterTiendaChange('');
    onFilterRolChange('');
  };

  // Si no hay datos, no mostrar controles de filtro
  if (totalTiendas === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filtros</h3>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro de Mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Tienda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tienda
            </label>
            <select
              value={filterTienda}
              onChange={(e) => onFilterTiendaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las tiendas</option>
              {uniqueTiendas.map(tienda => (
                <option key={tienda} value={tienda}>{tienda}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={filterRol}
              onChange={(e) => onFilterRolChange(e.target.value as Role | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los roles</option>
              <option value="gerente">Gerente</option>
              <option value="asesor">Asesor</option>
              <option value="cajero">Cajero</option>
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex items-end">
            <Button
              onClick={(e) => {
                e.preventDefault();
                clearFilters();
              }}
              variant="outline"
              className="w-full"
              type="button"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
