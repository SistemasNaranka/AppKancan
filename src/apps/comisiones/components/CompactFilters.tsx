import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompactFiltersProps {
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  filterTienda: string;
  onFilterTiendaChange: (tienda: string) => void;
  filterRol: string;
  onFilterRolChange: (rol: string) => void;
  uniqueTiendas: string[];
  onClearFilters: () => void;
}

export const CompactFilters: React.FC<CompactFiltersProps> = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
  filterTienda,
  onFilterTiendaChange,
  filterRol,
  onFilterRolChange,
  uniqueTiendas,
  onClearFilters,
}) => {
  return (
    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
      {/* Month Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Mes:
        </label>
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Store Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Tienda:
        </label>
        <Select value={filterTienda || "all"} onValueChange={onFilterTiendaChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {uniqueTiendas.map(tienda => (
              <SelectItem key={tienda} value={tienda}>{tienda}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Rol:
        </label>
        <Select value={filterRol || "all"} onValueChange={onFilterRolChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="asesor">Asesor</SelectItem>
            <SelectItem value="cajero">Cajero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={onClearFilters}
        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
      >
        Limpiar
      </button>
    </div>
  );
};