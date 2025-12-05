import React from 'react';
import { MesResumen } from '../types';
import { AttachMoney, TrendingUp, People } from '@mui/icons-material';
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
} from '@mui/material';

interface SummaryCardsProps {
  mesResumen: MesResumen | null;
}

const formatCommission = (value: number): string => {
  const rounded = Math.round(value / 100) * 100;
  // Format with comma thousands separators
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ mesResumen }) => {
  if (!mesResumen) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <MuiCard key={i} className="animate-pulse" sx={{ background: '#F3F4F6' }}>
            <MuiCardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-10 bg-gray-300 rounded w-2/3"></div>
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>
    );
  }

  const totalComisiones = mesResumen.total_comisiones;
  const comisionGerente = mesResumen.comisiones_por_rol.gerente;
  const comisionAsesor = mesResumen.comisiones_por_rol.asesor;
  const comisionCajero = mesResumen.comisiones_por_rol.cajero;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MuiCard 
        sx={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          color: 'white',
          border: '2px solid #1E40AF',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)',
          }
        }}
      >
        <MuiCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Comisiones</p>
              <p className="text-3xl font-bold mt-2">$ {formatCommission(totalComisiones)}</p>
            </div>
            <AttachMoney sx={{ fontSize: 48, opacity: 0.7 }} />
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard 
        sx={{ 
          background: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
          color: 'white',
          border: '2px solid #5B21B6',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
          }
        }}
      >
        <MuiCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Gerentes</p>
              <p className="text-3xl font-bold mt-2">$ {formatCommission(comisionGerente)}</p>
            </div>
            <People sx={{ fontSize: 48, opacity: 0.7 }} />
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard 
        sx={{ 
          background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          color: 'white',
          border: '2px solid #047857',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(16, 185, 129, 0.4)',
          }
        }}
      >
        <MuiCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Asesores</p>
              <p className="text-3xl font-bold mt-2">$ {formatCommission(comisionAsesor)}</p>
            </div>
            <TrendingUp sx={{ fontSize: 48, opacity: 0.7 }} />
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard 
        sx={{ 
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: 'white',
          border: '2px solid #D97706',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.4)',
          }
        }}
      >
        <MuiCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Cajeros</p>
              <p className="text-3xl font-bold mt-2">$ {formatCommission(comisionCajero)}</p>
            </div>
            <AttachMoney sx={{ fontSize: 48, opacity: 0.7 }} />
          </div>
        </MuiCardContent>
      </MuiCard>
    </div>
  );
};
