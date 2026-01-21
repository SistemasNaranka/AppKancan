import React from 'react';
import { Button, Box } from '@mui/material';;
import { EstadoResolucion } from '../types';

interface StatusFiltersProps {
  estadoActivo: EstadoResolucion | null;
  onFiltrar: (estado: EstadoResolucion | null) => void;
}

const StatusFilters: React.FC<StatusFiltersProps> = ({ 
  estadoActivo, 
  onFiltrar 
}) => {
  const estados: { valor: EstadoResolucion; color: string }[] = [
    { valor: 'Pendiente', color: '#9E9E9E'},
    { valor: 'Por vencer', color: '#FFA000' },
    { valor: 'Vigente', color: '#4CAF50' },
    { valor: 'Vencido', color: '#F44336' },
  ];
      
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {estados.map((estado) => (
        <Button
          key={estado.valor}
          onClick={() => onFiltrar(estadoActivo === estado.valor ? null : estado.valor)}
          sx={{
            backgroundColor: estadoActivo === estado.valor ? estado.color : '#E0E0E0',
            color: estadoActivo === estado.valor ? 'white' : '#333',
            boxShadow: 'none',
            border: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
                backgroundColor: estado.color,
                color: 'white',
                boxShadow: 'none',
            },
            }}
        >
          {estado.valor}
        </Button>
      ))}
    </Box>
  );
};

export default StatusFilters;