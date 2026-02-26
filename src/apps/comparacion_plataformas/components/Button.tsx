import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { borderRadius } from '@mui/system';

interface ButtonProps {
  texto: string;
  onClick: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  disabled?: boolean;
  icono?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  texto, 
  onClick, 
  variante = 'primario',
  disabled = false,
  icono
}) => {
  const obtenerEstilo = () => {
    switch (variante) {
      case 'primario':
        return {
          backgroundColor: '#015aa3e8',
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': { backgroundColor: '#1565c0' },
        };
      case 'secundario':
        return {
          backgroundColor: '#ffffff3b',
          color: '#004680',
          border: '1px solid #004680',
          borderRadius: '4px',
          boxShadow: 'none',
           transition: 'all 0.3s ease',
          '&:hover': { 
            backgroundColor: '#00468010',
            boxShadow: 'none',
          },
        };
      case 'peligro':
        return {
          backgroundColor: '#d32f2f',
          color: '#ffebee',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': { 
            backgroundColor: '#cc1d1dff',
            border: '2px solid #transparent',
            boxShadow: 'none',
          },
        };
      default:
        return {};
    }
  };

  return (
    <MuiButton
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      startIcon={icono}
      sx={obtenerEstilo()}
    >
      {texto}
    </MuiButton>
  );
};

export default Button;