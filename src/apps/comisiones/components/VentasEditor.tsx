import React, { useCallback, useEffect } from 'react';
import { TiendaResumen } from '../types';
import { formatCurrency } from '../lib/utils';

interface VentasEditorProps {
  /** Datos de la tienda */
  tienda: TiendaResumen;
  /** Valor temporal de ventas de la tienda */
  ventasTiendaInput: number;
  /** Callback para cambiar ventas de tienda */
  onVentasTiendaChange: (value: number) => void;
  /** Callback para guardar ventas */
  onSaveVentas: () => void;
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
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Ventas Totales de la Tienda
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">$</span>
            </div>
            <input
              type="number"
              value={ventasTiendaInput || ''}
              onChange={handleInputChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          {hasChanges && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              ⚠️ Hay cambios sin guardar
            </p>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 Resetear
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            💾 {hasChanges ? 'Guardar' : 'Guardado'}
          </button>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-500">Presupuesto</div>
          <div className="font-semibold text-gray-900">
            ${formatCurrency(tienda.presupuesto_tienda)}
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-500">Ventas Actuales</div>
          <div className="font-semibold text-green-600">
            ${formatCurrency(tienda.ventas_tienda)}
          </div>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-500">Cumplimiento</div>
          <div className={`font-bold ${getCumplimientoColor(tienda.cumplimiento_tienda_pct)}`}>
            📊 {tienda.cumplimiento_tienda_pct.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export const VentasEditor = React.memo(VentasEditorComponent);
