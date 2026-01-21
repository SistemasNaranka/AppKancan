import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import { Resolucion } from '../types';
import StatusBadge from './StatusBadge';

interface ResolutionTableProps {
  resoluciones: Resolucion[];
  onSeleccionar: (resolucion: Resolucion) => void;
}

// Función para obtener el color de fondo según el estado
const getRowBackgroundColor = (estado: string, index: number): string => {
  switch (estado) {
    case 'Vencido':
      return '#ffebee'; // Rojo claro
    case 'Por vencer':
      return '#fff3e0'; // Naranja claro
    case 'Pendiente':
      return '#989898'; // Azul claro
    default:
      // Zebra striping para los demás
      return index % 2 === 0 ? '#ffffff' : '#f5f5f5';
  }
};

const ResolutionTable: React.FC<ResolutionTableProps> = ({
  resoluciones,
  onSeleccionar,
}) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#015aa3e8' }}>
            <TableCell sx={{ fontWeight: 'bold', width: 130, color: 'white' }}>Resolución</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 140, color: 'white' }}>Ubicación</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 70, color: 'white' }}>Prefijo</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 120, color: 'white' }}>Ente</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 80, color: 'white' }}>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resoluciones.length > 0 ? (
            resoluciones.map((resolucion, index) => (
              <TableRow
                key={resolucion.id}
                onClick={() => onSeleccionar(resolucion)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: getRowBackgroundColor(resolucion.estado, index),
                  '&:hover': { 
                    backgroundColor: '#026ac01d',
                    transform: 'scale(1.01)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>
                    {resolucion.numero_formulario}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{resolucion.tienda_nombre}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{resolucion.prefijo}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{resolucion.ente_facturador}</Typography>
                </TableCell>
                <TableCell>
                  <StatusBadge estado={resolucion.estado} mostrarTexto />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No hay resoluciones
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResolutionTable;