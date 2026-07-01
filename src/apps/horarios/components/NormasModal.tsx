import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Checkbox, FormControlLabel, CircularProgress, Divider,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Normas } from '../api/directus/rules';

const AZUL = '#004680';

// Da formato al texto plano de las normas en una columna vertical con estilos condicionales.
function renderContenido(content: string) {
  const lineas = content.split('\n').map(l => l.trim()).filter(Boolean);
  let enSeccionProhibiciones = false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {lineas.map((linea, i) => {
        let text = linea;
        let esBold = false;

        // Detectar si la línea empieza con *
        if (text.startsWith('*')) {
          esBold = true;
          text = text.substring(1).trim();
        }

        const esTituloGrave = /falta|prohibi|importante/i.test(text) && (esBold || text === text.toUpperCase());

        if (esTituloGrave) {
          enSeccionProhibiciones = true;
        }

        const esSubtitulo = !esTituloGrave && text.endsWith(':') && text.length < 60;
        const esBullet = text.startsWith('- ') || text.startsWith('• ');

        if (esTituloGrave) {
          return (
            <Typography
              key={i}
              sx={{
                fontWeight: 800,
                color: AZUL, 
                fontSize: '0.88rem',
                letterSpacing: 0.1,
                mt: 2.25,
                mb: 1
              }}
            >
              {text}
            </Typography>
          );
        }

        if (esSubtitulo || (esBold && !esBullet)) {
          return (
            <Typography
              key={i}
              sx={{
                fontWeight: 700,
                color: AZUL, // Azul corporativo para subtítulos
                fontSize: '0.88rem',
                mt: 1.5,
                mb: 0.75
              }}
            >
              {text}
            </Typography>
          );
        }

        if (esBullet) {
          const contenidoBullet = text.replace(/^[-•]\s*/, '');

          // Separar la etiqueta en negrita si tiene formato "Etiqueta: Contenido"
          const partes = contenidoBullet.split(':');
          let label = '';
          let resto = contenidoBullet;
          if (partes.length > 1 && partes[0].length < 30) {
            label = partes[0] + ':';
            resto = partes.slice(1).join(':');
          }

          return (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 0.75, pl: 0.5 }}>
              <Box sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: enSeccionProhibiciones ? '#f87171' : '#10b981', // ÚNICAMENTE el punto en rojo suave para prohibiciones
                mt: '7px',
                flexShrink: 0
              }} />
              <Typography sx={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                {label ? (
                  <>
                    <strong style={{ color: '#0f2c4a' }}>{label}</strong>
                    {resto}
                  </>
                ) : (
                  contenidoBullet
                )}
              </Typography>
            </Box>
          );
        }

        return (
          <Typography
            key={i}
            sx={{
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: 1.5,
              mb: 0.5,
              fontWeight: esBold ? 'bold' : 'normal'
            }}
          >
            {text}
          </Typography>
        );
      })}
    </Box>
  );
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
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={obligatorio}
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle
        component="div"
        sx={{
          color: '#fff', py: 2.5, px: 3, display: 'flex', alignItems: 'center', gap: 1.75,
          background: 'linear-gradient(135deg, #004680 0%, #0a5aa0 100%)', // Gradiente azul corporativo original
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
        {/* Aviso destacado en azul corporativo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#eaf2fb', border: '1px solid #cfe2f7' }}>
          <InfoOutlinedIcon sx={{ color: AZUL, fontSize: 22, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.82rem', color: '#0f2c4a', lineHeight: 1.4 }}>
            El uso del registro de horarios es <b>obligatorio</b>. Léelas con atención.
          </Typography>
        </Box>

        {/* Cuerpo de las normas en una columna */}
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid #eef2f6' }}>
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
