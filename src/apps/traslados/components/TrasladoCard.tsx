import React from 'react';
import { Box, Typography, Paper, Checkbox } from '@mui/material';

export interface Traslado {
  id: number;
  fecha: string;
  bodega_Origen: string;
  nombre_Origen: string;
  bodega_Destino: string;
  nombre_Destino: string;
  unidades: number;
  
}

interface TrasladoCardProps {
  traslado: Traslado;
  checked: boolean;
  onCheck: (id: number) => void;
  color?: 'primary' | 'success';
}


const TrasladoCard: React.FC<TrasladoCardProps> = ({ traslado, checked, onCheck, color = 'primary' }) => (
  <Paper
    sx={{
      display: 'flex',
      alignItems: 'center',
      p: 2,
      mb: 1.5,
      border: checked ? `2.5px solid` : '1px solid #e0e0e0',
      borderColor: checked ? (color === 'primary' ? 'primary.main' : 'success.main') : 'transparent',
      boxShadow: checked ? 6 : 2,
      borderRadius: 3,
      background: checked
        ? `linear-gradient(90deg, #e0f7fa 0%, #f1f8e9 100%)`
        : 'white',
      transition: 'all 0.35s cubic-bezier(.4,2,.6,1)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        boxShadow: 10,
        transform: 'translateY(-2px) scale(1.02)',
        background: 'linear-gradient(90deg, #e3f2fd 0%, #e8f5e9 100%)',
        
      },
      animation: 'fadeinCard 0.7s',
    }}
    onClick={() => onCheck(traslado.id)}
  >
    <Checkbox
      checked={checked}
      onChange={e => { e.stopPropagation(); onCheck(traslado.id); }}
      color={color}
      sx={{ mr: 1.5, zIndex: 2 }}
    />
    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={700} color={checked ? (color === 'primary' ? 'primary.main' : 'success.main') : 'text.primary'}>
        {traslado.nombre_Origen} <span style={{fontWeight:400, color:'#888'}}>→</span> {traslado.nombre_Destino}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        Fecha: {traslado.fecha}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Unidades: {traslado.unidades} | Origen: {traslado.bodega_Origen} | Destino: {traslado.bodega_Destino}
      </Typography>
      width: 150,
      height: 150,
    </Box>
    <style>{`
      @keyframes fadeinCard {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </Paper>
);

export default TrasladoCard;
