import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';

interface GiroHistorial {
  id: number;
  fecha: string;
  premio: string;
  codigo: string;
  estado: 'canjeado' | 'pendiente' | 'expirado';
}

const HistorialGiros: React.FC = () => {
  const [historial, setHistorial] = useState<GiroHistorial[]>([]);

  useEffect(() => {
    // Cargar historial desde localStorage o usar datos de ejemplo
    const historialGuardado = localStorage.getItem('historialRuleta');
    if (historialGuardado) {
      setHistorial(JSON.parse(historialGuardado));
    } else {
      setHistorial([
        {
          id: 1,
          fecha: '2025-01-15 14:30',
          premio: 'JEAN DE LÍNEA',
          codigo: 'KAN-7X9K2M',
          estado: 'canjeado',
        },
        {
          id: 2,
          fecha: '2025-01-14 10:15',
          premio: 'BONO 50 MIL',
          codigo: 'KAN-3A5F8Q',
          estado: 'pendiente',
        },
        {
          id: 3,
          fecha: '2025-01-13 18:45',
          premio: 'TOTE BAGS denim',
          codigo: 'KAN-9Z1W4P',
          estado: 'expirado',
        },
      ]);
    }
  }, []);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'canjeado':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'pendiente':
        return { bg: '#fff3e0', color: '#e65100' };
      case 'expirado':
        return { bg: '#fde8e8', color: '#c62828' };
      default:
        return { bg: '#f5f5f5', color: '#757575' };
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} color="#004680" gutterBottom>
        Historial de Giros
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Registro de todos los giros realizados y su estado actual.
      </Typography>

      {historial.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8f9fa', borderRadius: '16px' }}>
          <Typography variant="body1" color="text.secondary">
            No hay giros registrados todavía.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ¡Gira la ruleta para comenzar!
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e9edf4' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Premio</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((item) => {
                const estadoStyle = getEstadoColor(item.estado);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.fecha}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.premio}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: 'Courier New, monospace', fontWeight: 700, color: '#004680' }}>
                        {item.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                        size="small"
                        sx={{
                          bgcolor: estadoStyle.bg,
                          color: estadoStyle.color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HistorialGiros;