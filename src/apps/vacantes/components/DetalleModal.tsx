import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Button, Box, Typography, Chip, Divider, Stack,
} from '@mui/material';
import {
  Close as CloseIcon, Person as PersonIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, WorkOutline as WorkIcon,
  CalendarToday as CalendarIcon, Badge as BadgeIcon, School as SchoolIcon,
} from '@mui/icons-material';
import {
  Postulacion, getEstadoMeta, formatearFecha, getCargos, formatearEducacion,
} from '../api/directus/read';

const AZUL = '#004680';
const AZUL_BG = '#E6EEF5';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, px: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#F8FAFC' } }}>
    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: AZUL_BG, color: AZUL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, minWidth: 110 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600, ml: 'auto', textAlign: 'right', wordBreak: 'break-word' }}>
      {value}
    </Typography>
  </Box>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: AZUL, letterSpacing: '0.08em', mb: 1, ml: 0.5 }}>
    {children}
  </Typography>
);

interface Props { postulacion: Postulacion | null; onClose: () => void; }

const DetalleModal: React.FC<Props> = ({ postulacion, onClose }) => {
  const cargos = postulacion ? getCargos(postulacion) : [];
  const meta = getEstadoMeta(postulacion?.status);

  return (
    <Dialog
      open={!!postulacion}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          height: 'auto',
          maxHeight: 'calc(100vh - 64px)',
          my: 4,
        },
      }}
    >
      {postulacion && (
        <>
          <DialogTitle sx={{
            background: `linear-gradient(135deg, ${AZUL}, #003366)`,
            color: '#fff', p: 3, pb: 5,
            display: 'flex', alignItems: 'center', gap: 2,
            flexShrink: 0,
          }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.4rem',
            }}>
              {postulacion.full_name.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700} fontSize="1.15rem" noWrap>{postulacion.full_name}</Typography>
              <Typography fontSize="0.8rem" sx={{ opacity: 0.85, mt: 0.25 }}>{postulacion.email}</Typography>
              <Chip label={postulacion.status || 'Sin estado'} size="small"
                sx={{ mt: 1, bgcolor: meta.bg, color: meta.color, fontWeight: 800, fontSize: '0.72rem', height: 24 }} />
            </Box>
            <IconButton onClick={onClose} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 5, bgcolor: '#FAFBFC', overflowY: 'auto' }}>
            <SectionTitle>DATOS PERSONALES</SectionTitle>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 0.5, border: '1px solid #E2E8F0', mb: 3 }}>
              <InfoRow icon={<BadgeIcon sx={{ fontSize: 18 }} />} label="Tipo doc." value={postulacion.document_type || '—'} />
              <InfoRow icon={<BadgeIcon sx={{ fontSize: 18 }} />} label="Documento" value={postulacion.document_number || '—'} />
              <InfoRow icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Nombre" value={postulacion.full_name || '—'} />
              <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Correo" value={postulacion.email || '—'} />
              <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Teléfono" value={postulacion.phone || '—'} />
              <InfoRow icon={<LocationIcon sx={{ fontSize: 18 }} />} label="Ciudad" value={postulacion.city || '—'} />
            </Box>

            <SectionTitle>PERFIL PROFESIONAL</SectionTitle>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 0.5, border: '1px solid #E2E8F0', mb: 3 }}>
              <InfoRow icon={<SchoolIcon sx={{ fontSize: 18 }} />} label="Nivel educativo" value={formatearEducacion(postulacion.education_level)} />
              <InfoRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Experiencia" value={`${postulacion.years_experience ?? 0} años`} />
            </Box>

            <SectionTitle>CARGOS POSTULADOS</SectionTitle>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap
              sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.5, border: '1px solid #E2E8F0', mb: 3 }}>
              {cargos.length === 0
                ? <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Sin cargos</Typography>
                : cargos.map((c) => <Chip key={c} label={c} sx={{ bgcolor: AZUL_BG, color: AZUL, fontWeight: 700 }} />)}
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <CalendarIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Postuló el <strong style={{ color: '#475569' }}>{formatearFecha(postulacion.date_created)}</strong>
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #E2E8F0', bgcolor: '#fff', flexShrink: 0 }}>
            <Button onClick={onClose} variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#CBD5E1', color: '#64748B', px: 3 }}>
              Cerrar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DetalleModal;