import React from 'react';
import { MesResumen } from '../types';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

interface SummaryCardsProps {
  mesResumen: MesResumen | null;
}

const formatCommission = (value: number): string => {
  const rounded = Math.round(value / 100) * 100;
  return rounded.toLocaleString('es-CO');
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ mesResumen }) => {
  if (!mesResumen) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const totalComisiones = mesResumen.total_comisiones;
  const comisionGerente = mesResumen.comisiones_por_rol.gerente;
  const comisionAsesor = mesResumen.comisiones_por_rol.asesor;
  const comisionCajero = mesResumen.comisiones_por_rol.cajero;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Comisiones</p>
            <p className="text-2xl font-bold text-blue-900 mt-1 text-center">${formatCommission(totalComisiones)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Gerentes</p>
            <p className="text-2xl font-bold text-purple-900 mt-1 text-center">${formatCommission(comisionGerente)}</p>
          </div>
          <Users className="w-8 h-8 text-purple-600 opacity-20" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Asesores</p>
            <p className="text-2xl font-bold text-green-900 mt-1 text-center">${formatCommission(comisionAsesor)}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Cajeros</p>
            <p className="text-2xl font-bold text-orange-900 mt-1 text-center">${formatCommission(comisionCajero)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-orange-600 opacity-20" />
        </div>
      </div>
    </div>
  );
};
