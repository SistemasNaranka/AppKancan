import React from 'react';
import { Role } from '../types';
import { Filter as FilterIcon } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FilterIcon className="w-4 h-4" />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro de Mes */}
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={selectedMonth} onValueChange={onMonthChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tienda */}
            <div className="space-y-2">
              <Label>Tienda</Label>
              <Select value={filterTienda} onValueChange={onFilterTiendaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las tiendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las tiendas</SelectItem>
                  {uniqueTiendas.map(tienda => (
                    <SelectItem key={tienda} value={tienda}>{tienda}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Rol */}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={filterRol} onValueChange={(value) => onFilterRolChange(value as Role | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los roles</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="asesor">Asesor</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                </SelectContent>
              </Select>
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
        </CardContent>
      )}
    </Card>
  );
};
