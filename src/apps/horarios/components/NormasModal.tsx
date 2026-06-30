import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Checkbox, FormControlLabel, CircularProgress, Divider,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Normas } from '../api/directus/rules';

const AZUL = '#004680';

// Da formato al texto plano de las normas: títulos, "faltas graves" y viñetas.
function renderContenido(content: string) {
  const lineas = content.split('\n');
  return lineas.map((raw, i) => {
    const linea = raw.trim();
    if (!linea) return <Box key={i} sx={{ height: 6 }} />;

    const esTituloGrave = /falta/i.test(linea) && linea === linea.toUpperCase();
    const esSubtitulo = !esTituloGrave && linea.endsWith(':') && linea.length < 60;
    const esBullet = linea.startsWith('- ') || linea.startsWith('• ');

    if (esTituloGrave) {
      return (
        <Typography key={i} sx={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.92rem', letterSpacing: 0.2, mt: 1.5, mb: 0.75 }}>
          {linea}
        </Typography>
      );
    }
    if (esSubtitulo) {
      return (
        <Typography key={i} sx={{ fontWeight: 700, color: AZUL, fontSize: '0.9rem', mt: 1.25, mb: 0.5 }}>
          {linea}
        </Typography>
      );
    }
    if (esBullet) {
      return (
        <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 0.85, pl: 0.5 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#cbd5e1', mt: '7px', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>{linea.replace(/^[-•]\s*/, '')}</Typography>
        </Box>
      );
    }
    return (
      <Typography key={i} sx={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, mb: 0.85 }}>
        {linea}
      </Typography>
    );
  });
}

interface Props {
  open: boolean;
  normas: Normas | null;
  obligatorio: boolean;
  aceptando: boolean;
  onClose: () => void;
  onAceptar: () => void;
}

export default function NormasModal({ open, normas, obligatorio, aceptando, onClose, onAceptar }: Props) {
  const [acepto, setAcepto] = useState(false);

  useEffect(() => { if (open) setAcepto(false); }, [open]);

  return (
    <Dialog
      open={open}
      onClose={obligatorio ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={obligatorio}
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle
        component="div"
        sx={{
          color: '#fff', py: 2.5, px: 3, display: 'flex', alignItems: 'center', gap: 1.75,
          background: 'linear-gradient(135deg, #004680 0%, #0a5aa0 100%)',
        }}
      >
        <Box sx={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.18)' }}>
          <GavelIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
            {normas?.title || 'Normas de uso'}
          </Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.25 }}>
            Lectura obligatoria · Versión {normas?.version ?? '—'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#fbfdff' }}>
        {/* Aviso destacado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#eaf2fb', border: '1px solid #cfe2f7' }}>
          <InfoOutlinedIcon sx={{ color: AZUL, fontSize: 22, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.85rem', color: '#0f2c4a', lineHeight: 1.4 }}>
            El uso del registro de horarios es <b>obligatorio</b>. Léelas con atención: su incumplimiento puede constituir una <b>falta grave</b>.
          </Typography>
        </Box>

        {/* Cuerpo de las normas */}
        <Box sx={{ p: 2.25, borderRadius: 2, bgcolor: '#fff', border: '1px solid #eef2f6' }}>
          {normas?.content
            ? renderContenido(normas.content)
            : <Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>No hay normas configuradas.</Typography>}
        </Box>

        {obligatorio && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: acepto ? '#eaf7ee' : '#f8fafc', border: `1px solid ${acepto ? '#bfe6cb' : '#e2e8f0'}`, transition: 'all 0.2s' }}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Checkbox checked={acepto} onChange={(e) => setAcepto(e.target.checked)} sx={{ color: AZUL, '&.Mui-checked': { color: AZUL } }} />}
                label={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f2c4a' }}>He leído y acepto las normas.</Typography>}
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {obligatorio ? (
          <Button
            onClick={onAceptar}
            variant="contained"
            disableElevation
            disabled={!acepto || aceptando}
            startIcon={aceptando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
            sx={{ bgcolor: AZUL, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#003a6b' } }}
          >
            {aceptando ? 'Guardando…' : 'Aceptar y continuar'}
          </Button>
        ) : (
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{ bgcolor: AZUL, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#003a6b' } }}
          >
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
