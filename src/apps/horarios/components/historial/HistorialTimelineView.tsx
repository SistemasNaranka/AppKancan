import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton as MuiIconButton, Avatar, Chip, Button
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { REGISTRO_META } from '../HistorialHorasModal';
import { formatearHoras } from '../ModalDetalleTiendaUtils';

interface HistorialTimelineViewProps {
  diaSeleccionado: any | null;
  onCloseDia: () => void;
  onCloseMain: () => void;
  onDayClick?: (date: string, employeeName: string) => void;
  empleadoNombre: string;
}

export const HistorialTimelineView: React.FC<HistorialTimelineViewProps> = React.memo(({
  diaSeleccionado,
  onCloseDia,
  onCloseMain,
  onDayClick,
  empleadoNombre,
}) => {
  return (
    <Dialog
      open={!!diaSeleccionado}
      onClose={onCloseDia}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}
    >
      <DialogTitle component="div" sx={{ bgcolor: '#0f2c4a', color: '#fff', py: 2, px: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Detalle de Asistencia
            </Typography>
          </Box>
          <MuiIconButton onClick={onCloseDia} sx={{ color: '#fff' }} size="small">
            <CloseIcon fontSize="small" />
          </MuiIconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: '#fff' }}>
        {diaSeleccionado && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ textTransform: 'uppercase', mb: 0.25 }}>
                JORNADA DIARIA
              </Typography>
              <Typography variant="subtitle2" fontWeight={850} color="#0f2c4a" sx={{ textTransform: 'capitalize' }}>
                {diaSeleccionado.fecha.locale('es').format('dddd, D [de] MMMM')}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="#004680" sx={{ mt: 0.5 }}>
                Tiempo Total: {formatearHoras(diaSeleccionado.minutos)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
              {(() => {
                const marcasOrdenadas = [...diaSeleccionado.records].sort((a, b) => {
                  const h1 = a.record_time || a.time || '00:00';
                  const h2 = b.record_time || b.time || '00:00';
                  return h1.localeCompare(h2);
                });

                if (marcasOrdenadas.length === 0) {
                  return <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>No se encontraron marcas de asistencia.</Typography>;
                }

                return marcasOrdenadas.map((r, idx) => {
                  const meta = REGISTRO_META[r.log_type] || { icon: <AssignmentIcon sx={{ fontSize: 18 }} />, color: '#64748b', bg: '#f1f5f9' };
                  const esUltimo = idx === marcasOrdenadas.length - 1;
                  const horaStr = r.record_time || r.time || '--:--';
                  const comentario = r.observations;

                  return (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: meta.bg, 
                            color: meta.color,
                            border: `1px solid ${meta.color}33`,
                            zIndex: 2 
                          }}
                        >
                          {meta.icon}
                        </Avatar>
                        {!esUltimo && (
                          <Box sx={{ width: 2, bgcolor: '#e2e8f0', flexGrow: 1, my: 0.5, zIndex: 1 }} />
                        )}
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0, pb: esUltimo ? 0 : 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="body2" fontWeight={800} color="#0f2c4a">
                            {r.log_type}
                          </Typography>
                          <Chip 
                            label={horaStr.substring(0, 5)} 
                            size="small" 
                            sx={{ bgcolor: '#f1f5f9', fontWeight: 800, fontSize: '0.72rem', height: 20 }} 
                          />
                        </Box>
                        
                        {comentario && comentario.trim() && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 0.75, 
                            mt: 0.75, 
                            p: 1, 
                            bgcolor: '#f8fafc', 
                            borderRadius: 2, 
                            border: '1px solid #f1f5f9',
                            maxWidth: '100%'
                          }}>
                            <CommentIcon sx={{ fontSize: 12, color: '#94a3b8', mt: 0.25, flexShrink: 0 }} />
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: '0.72rem', 
                                lineHeight: 1.35,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere'
                              }}
                            >
                              {comentario}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', gap: 1.5 }}>
        <Button 
          onClick={onCloseDia} 
          variant="outlined" 
          fullWidth={!onDayClick}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#0f2c4a', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
        >
          Volver al Historial
        </Button>
        {onDayClick && (
          <Button 
            onClick={() => {
              if (onDayClick && diaSeleccionado) {
                onDayClick(diaSeleccionado.fecha.format('YYYY-MM-DD'), empleadoNombre);
              }
              onCloseDia();
              onCloseMain();
            }} 
            variant="contained" 
            color="primary"
            disableElevation
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#004680', '&:hover': { bgcolor: '#003366' } }}
          >
            Ir a este día en tienda
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});
