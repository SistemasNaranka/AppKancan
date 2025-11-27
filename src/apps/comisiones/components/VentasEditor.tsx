import React, { useCallback, useEffect } from 'react';
import { TiendaResumen } from '../types';
import { formatCurrency } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface VentasEditorProps {
  /** Datos de la tienda */
  tienda: TiendaResumen;
  /** Valor temporal de ventas de la tienda */
  ventasTiendaInput: number;
  /** Callback para cambiar ventas de tienda */
  onVentasTiendaChange: (value: number) => void;
  /** Callback para guardar ventas */
  onSaveVentas: () => void;
  /** Si es true, el componente será de solo lectura */
  readOnly?: boolean;
}

/**
 * Componente especializado para editar las ventas de una tienda.
 * Proporciona una interfaz clara para modificar las ventas totales.
 */
const VentasEditorComponent: React.FC<VentasEditorProps> = ({
   tienda,
   ventasTiendaInput,
   onVentasTiendaChange,
   onSaveVentas,
   readOnly = false,
 }) => {
  /**
   * Obtiene el color del cumplimiento para mostrar en el editor
   */
  const getCumplimientoColor = useCallback((cumplimiento: number): string => {
    if (cumplimiento >= 110) return 'text-green-600';
    if (cumplimiento >= 100) return 'text-blue-600';
    if (cumplimiento >= 95) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  /**
   * Determina si las ventas han cambiado para mostrar el botón de guardar
   */
  const hasChanges = ventasTiendaInput !== tienda.ventas_tienda;

  /**
    * Maneja el cambio en el input de ventas
    */
   const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
     const value = parseFloat(e.target.value) || 0;
     onVentasTiendaChange(value);
   }, [onVentasTiendaChange]);

   // Implementar debouncing para la actualización de ventas
   useEffect(() => {
     const handler = setTimeout(() => {
       if (ventasTiendaInput !== tienda.ventas_tienda) {
         // Aquí se podría llamar a una función para actualizar las ventas
         // con un cierto delay para evitar actualizaciones frecuentes
       }
     }, 500); // 500ms delay

     return () => {
       clearTimeout(handler);
     };
   }, [ventasTiendaInput, tienda.ventas_tienda]);

  /**
   * Maneja el botón de guardar
   */
  const handleSave = useCallback(() => {
    if (hasChanges) {
      onSaveVentas();
    }
  }, [hasChanges, onSaveVentas]);

  /**
   * Resetea las ventas al valor original
   */
  const handleReset = useCallback(() => {
    onVentasTiendaChange(tienda.ventas_tienda);
  }, [onVentasTiendaChange, tienda.ventas_tienda]);

  return (
    <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        {/* Input de Ventas Totales */}
        <div className={`${readOnly ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-2`}>
          <Label className="text-sm font-medium">
            💰 Ventas Totales de la Tienda
          </Label>
          <div className="relative">
            {readOnly ? (
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-lg font-semibold text-gray-900">
                ${formatCurrency(ventasTiendaInput || tienda.ventas_tienda)}
              </div>
            ) : (
              <>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">$</span>
                </div>
                <Input
                  type="number"
                  value={ventasTiendaInput || ''}
                  onChange={handleInputChange}
                  className="pl-8 text-lg font-semibold"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </>
            )}
          </div>
          {!readOnly && hasChanges && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              ⚠️ Hay cambios sin guardar
            </p>
          )}
        </div>

        {/* Botones de Acción - Solo si no es readOnly */}
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              disabled={!hasChanges}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              🔄 Resetear
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="sm"
              className="flex-1"
            >
              💾 {hasChanges ? 'Guardar' : 'Guardado'}
            </Button>
          </div>
        )}
      </div>

      {/* Información Adicional */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Card>
          <CardContent className="p-3">
            <div className="text-gray-500">Presupuesto</div>
            <div className="font-semibold text-gray-900">
              ${formatCurrency(tienda.presupuesto_tienda)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-gray-500">Ventas Actuales</div>
            <div className="font-semibold text-green-600">
              ${formatCurrency(tienda.ventas_tienda)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-gray-500">Cumplimiento</div>
            <div className={`font-bold ${getCumplimientoColor(tienda.cumplimiento_tienda_pct)}`}>
              📊 {tienda.cumplimiento_tienda_pct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const VentasEditor = React.memo(VentasEditorComponent);
