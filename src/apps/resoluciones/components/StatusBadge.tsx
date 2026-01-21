import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { EstadoResolucion } from '../types';

interface StatusBadgeProps {
  estado: EstadoResolucion;
  mostrarTexto?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, mostrarTexto = false }) => {
  const getConfig = () => {
    switch (estado) {
      case 'Vigente':
        return {
          icon: <CheckCircleIcon />,
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderColor: '#2e7d32',
        };
      case 'Por vencer':
        return {
          icon: <WarningIcon />,
          backgroundColor: '#fff3e0',
          color: '#ed6c02',
          borderColor: '#ed6c02',
        };
      case 'Vencido':
        return {
          icon: <CancelIcon />,
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderColor: '#d32f2f',
        };
      case 'Pendiente':
        return {
          icon: <PendingIcon />,
          backgroundColor: '#353a3e18',
          color: '#555151',
          borderColor: '#989898',
        };
      default:
        return {
          icon: <PendingIcon />,
          backgroundColor: '#f5f5f5',
          color: '#757575',
          borderColor: '#757575',
        };
    }
  };

  const config = getConfig();

  return (
    <Chip
      icon={config.icon}
      label={mostrarTexto ? estado : undefined}
      size="small"
      sx={{
        backgroundColor: config.backgroundColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: config.color,
        },
        ...(!mostrarTexto && {
          '& .MuiChip-label': {
            display: 'none',
          },
          px: 0,
        }),
      }}
    />
  );
};

export default StatusBadge;