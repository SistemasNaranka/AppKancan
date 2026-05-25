import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Button, Divider, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import { INotification } from '../interfaces/notification.interface';

// Extendemos la interfaz localmente de forma segura para que no te marque error de TypeScript
interface INotificationExtendida extends INotification {
  sender_name?: string;
  duration_seconds?: number | string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notificacion: INotificationExtendida | null;
}

export default function NotificationDetailModal({ open, onClose, notificacion }: Props) {
  if (!notificacion) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
      
      {/* HEADER DEL MODAL */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Detalle de Notificación</Typography>
        <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* CONTENIDO PRINCIPAL */}
      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#004a99', fontWeight: 800, fontSize: '0.85rem' }}>
              {notificacion.id}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5, lineHeight: 1.2 }}>
              {notificacion.titulo}
            </Typography>
          </Box>
          <Chip 
            label={notificacion.tipo_notificacion} 
            sx={{ 
              fontWeight: 700, 
              bgcolor: notificacion.tipo_notificacion?.toUpperCase() === 'ENTREGADO' || notificacion.tipo_notificacion?.toUpperCase() === 'SUCCESS' ? '#e2f4f2' : 
                       notificacion.tipo_notificacion?.toUpperCase() === 'ERROR' ? '#f9e2e4' : 
                       notificacion.tipo_notificacion?.toUpperCase() === 'ADVERTENCIA' ? '#fff6e2' : '#e2ebf8',
              color: notificacion.tipo_notificacion?.toUpperCase() === 'ENTREGADO' || notificacion.tipo_notificacion?.toUpperCase() === 'SUCCESS' ? '#16a34a' : 
                     notificacion.tipo_notificacion?.toUpperCase() === 'ERROR' ? '#dc2626' : 
                     notificacion.tipo_notificacion?.toUpperCase() === 'ADVERTENCIA' ? '#ca8a04' : '#2563eb'
            }} 
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* CUERPO DEL MENSAJE */}
        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>
          Mensaje Completo
        </Typography>
        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', mb: 3 }}>
          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, fontWeight: 500 }}>
            {notificacion.mensaje}
          </Typography>
        </Box>

        {/* INFORMACIÓN ADICIONAL DE LA BASE DE DATOS (REMITENTE Y DURACIÓN) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          
          {/* Quién envió la notificación */}
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonIcon sx={{ color: '#004a99' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                ENVIADO POR
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {notificacion.sender_name || 'Apps Kancan'}
              </Typography>
            </Box>
          </Box>

          {/* Cuánto duró */}
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TimerIcon sx={{ color: '#ca8a04' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                DURACIÓN
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {notificacion.duration_seconds ? `${notificacion.duration_seconds} segundos` : '480 segundos'}
              </Typography>
            </Box>
          </Box>

        </Box>

        {/* METADATOS: FECHA Y HORA */}
        <Box sx={{ bgcolor: '#f1f5f9', p: 2.5, borderRadius: '16px' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5, letterSpacing: '0.5px' }}>
            REGISTRO DE FECHA Y HORA
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {notificacion.fecha} — <span style={{ color: '#475569', fontWeight: 600 }}>{notificacion.hora}</span>
          </Typography>
        </Box>

        {/* ACCIONES INFERIORES */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={onClose} 
            sx={{ 
              borderRadius: '10px', 
              bgcolor: '#004a99', 
              fontWeight: 700, 
              textTransform: 'none', 
              px: 4,
              '&:hover': { bgcolor: '#003366' } 
            }}
          >
            Cerrar
          </Button>
        </Box>

      </DialogContent>
    </Dialog>
  );
}