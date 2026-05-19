import { Dialog, DialogContent, DialogTitle, DialogActions, IconButton, Typography, Box, Button, Avatar, Chip, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Contactos } from '../types/contact';
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface Props {
    open: boolean;
    onClose: () => void;
    contacto: Contactos | null;
    onEditar: () => void;
}

const chipColor = (tipo: string): 'success' | 'warning' | 'default' => {
  if (tipo === 'Universal') return 'success';
  if (tipo === 'Restringido') return 'warning';
  return 'default';
};
export default function DetalleModal ({open, onClose, contacto, onEditar}: Props) {
    if (!contacto) return null;
    

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Detalle del Contacto
                <IconButton onClick={onClose} sx={{position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
  {/* Tarjeta de perfil */}
  <Box sx={{
    bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', p: 3, mb: 2, textAlign: 'center'
  }}>
    <Avatar sx={{ bgcolor: contacto.color, width: 56, height: 56, fontSize: '1.2rem', mx: 'auto', mb: 1 }}>
      {contacto.iniciales}
    </Avatar>
    <Typography variant="h6" fontWeight={700} color="#0f172a">{contacto.full_name}</Typography>
    <Chip label={contacto.department || 'N/A'} size="small" variant="outlined"
      sx={{ mt: 1, borderColor: '#004a99', color: '#004a99', fontWeight: 600 }} />
  </Box>

  {/* Tarjeta de información */}
  <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', p: 3 }}>
    <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
      Información de contacto
    </Typography>
    <Stack spacing={2} mt={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <EmailIcon fontSize="small" sx={{ color: '#004a99' }} />
        <Typography variant="body2">{contacto.email}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PhoneIcon fontSize="small" sx={{ color: '#004a99' }} />
        <Typography variant="body2">{contacto.phone_number}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <VisibilityIcon fontSize="small" sx={{ color: '#004a99' }} />
        <Chip label={contacto.visibility_type} size="small" color={chipColor(contacto.visibility_type)} variant="outlined" />
      </Box>
    </Stack>
  </Box>
</DialogContent>
            <DialogActions>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onClose(); onEditar(); }}>
                Editar
                </Button>
            </DialogActions>

        </Dialog>
    );
}


