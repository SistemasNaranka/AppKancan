import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Traslado } from './TrasladoCard';




// esta parte es para que aparezca de estado pendiente ha estado de embarque 
interface Props {
  traslado: Traslado;
  onTrasladoClick?: (t: Traslado) => void;
  compact?: boolean;
  estado?: 'pendiente' | 'embarque' | 'aprobado'; 
}


const TrasladoListItem: React.FC<Props> = ({ traslado, onTrasladoClick, compact, estado = 'pendiente' }) => (
  // --- MODIFICACIÓN: id único para animación visual desde PanelSeleccionados ---
  <Paper
    id={`traslado-card-${traslado.id}`}
    sx={{
      display: 'flex',
      flexDirection : 'column',
      alignItems: 'flex-start',
      p: compact ? 0.5 : 1.3,
      mb: compact ?0.5 : 1.3,
      border: '1px solid #e0e0e0',
      boxShadow: 2,
      borderRadius: compact ? 1.5 : 2,
      background: 'white',
      transition: 'all 0.25s',
      cursor: onTrasladoClick ? 'pointer' : 'default',
      minWidth: compact ? 0 : undefined,
      maxWidth: compact ? 280 : 340 ,
      width: '100%',
      '&:hover': onTrasladoClick ? { boxShadow: 6, transform: 'translateY(-2px)' } : {},
      userSelect: 'none', 
    }}
    onClick={() => onTrasladoClick && onTrasladoClick(traslado)}

    
  >
    <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <LocalShippingIcon sx={{ fontSize: compact ? 20 : 28, color: '#26c6da', mb: 0.3 }} />
      <Chip
  label={
    estado === 'embarque'
      ? 'En embarque'
      : estado === 'aprobado'
      ? 'Aprobado'
      : 'Pendiente'
  }
  color={
    estado === 'embarque'
      ? 'info'
      : estado === 'aprobado'
      ? 'success'
      : 'warning'
  }
  size="small"
  icon={
    estado === 'embarque' ? (
      <LocalShippingIcon sx={{ fontSize: compact ? 15 : 18 }} />
    ) : estado === 'aprobado' ? (
      <CheckCircleIcon sx={{ fontSize: compact ? 15 : 18 }} />
    ) : (
      <PendingActionsIcon sx={{ fontSize: compact ? 13 : 16 }} />
    )
  }
  sx={{ fontWeight: 700, borderRadius: 1, mt: 0.5 }}
/>
    </Box>

    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={700}
       color="text.primary"
       fontSize={compact ? 12 : 13}>
      {traslado.nombre_Origen} <span style={{ fontWeight: 400, color: '#888' }}>→</span> {traslado.nombre_Destino}
      </Typography>


      <Typography variant="body2"
       color="text.secondary" fontSize={compact ? 11.5 : 14}>
        Fecha: {traslado.fecha}
        </Typography>

      <Typography variant="body2"
       color="text.secondary"
       fontSize={compact ? 11 : 13}>
        Unidades: {traslado.unidades} | Origen: {traslado.bodega_Origen} | Destino: {traslado.bodega_Destino}
      </Typography>

    </Box>
  </Paper>
);

export default TrasladoListItem;