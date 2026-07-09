import React from 'react';
import {
    Box, Typography, Paper, Button,
    Dialog, DialogTitle, DialogContent,
    IconButton as MuiIconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { getNovedadIcon } from './ModalDetalleTiendaUtils';

interface NovedadDetalleModalProps {
    open: boolean;
    onClose: () => void;
    tipo: string;
    observacion: string;
    empleadoNombre: string;
}

export default function NovedadDetalleModal({
    open,
    onClose,
    tipo,
    observacion,
    empleadoNombre,
}: NovedadDetalleModalProps) {
    const icon = getNovedadIcon(tipo || 'Novedad');
    const fecha = dayjs().format('DD [de] MMMM [de] YYYY');
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {React.cloneElement(icon, { sx: { fontSize: 32, color: '#fff' } })}
                    <Typography variant="h6" fontWeight={700}>Detalle de Novedad</Typography>
                </Box>
                <MuiIconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></MuiIconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Empleado</Typography>
                        <Typography variant="h6" fontWeight={700} color="#0a1929" sx={{ mt: 0.5 }}>{empleadoNombre}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo de Novedad</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
                            <Typography variant="h6" fontWeight={700} color="#0a1929">{tipo}</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Fecha de Registro</Typography>
                        <Typography variant="body1" fontWeight={500} color="#0a1929" sx={{ mt: 0.5 }}>{fecha}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Observación</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#f8fafc', borderRadius: 2, borderColor: '#e2e8f0', minHeight: 60 }}>
                            <Typography variant="body2" color="text.secondary">{observacion || 'Sin observación'}</Typography>
                        </Paper>
                    </Box>
                </Box>
                <Button fullWidth variant="contained" onClick={onClose} sx={{ mt: 4, bgcolor: '#004680', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#003366' } }}>Cerrar</Button>
            </DialogContent>
        </Dialog>
    );
}
