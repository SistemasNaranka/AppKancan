import React from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, Avatar, Divider,
  CircularProgress, Chip,
} from '@mui/material';
import {
  AutoAwesome as SparkIcon, Close as CloseIcon, CheckRounded as CheckIcon,
  HelpOutlineRounded as DudaIcon, DescriptionOutlined as DocIcon,
} from '@mui/icons-material';
import { AZUL } from '../page/VacantesPage';
import { abrirCv, Postulacion, EstadoContratacion } from '../api/directus/read';
import { CandidatoEvaluado, NIVELES_AJUSTE, nivelDe, nivelEducativo } from '../api/ia';
import EstadoSelect from './EstadoSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  cargo: string;
  candidato: CandidatoEvaluado | null;
  fecha: Date | null;
  postulacionViva?: Postulacion | null;
  onCambiarEstado: (id: number, nuevo: EstadoContratacion) => void;
  cargando?: boolean;
  candidatoBase?: Postulacion | null;
  error?: string | null;
}

const hora = (d: Date) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

const FONDO_AVATAR: Record<string, string> = {
  alto: '#DCFCE7', medio: '#FFEDD5', bajo: '#FEE2E2', sin: '#E2E8F0',
};

const Linea: React.FC<{ icono: React.ReactNode; texto: string }> = ({ icono, texto }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
    <Box sx={{ mt: '1px', display: 'flex' }}>{icono}</Box>
    <Typography fontSize="0.85rem" color="#334155" lineHeight={1.55}>{texto}</Typography>
  </Box>
);

export const ModalAnalisisIA: React.FC<Props> = ({
  open, onClose, cargo, candidato, fecha, postulacionViva, onCambiarEstado,
  cargando = false, candidatoBase = null, error = null,
}) => {
  const p = candidato?.postulacion ?? candidatoBase;
  if (!p) return null;

  const nivel = candidato ? nivelDe(candidato) : 'sin';
  const cfg = NIVELES_AJUSTE[nivel];
  const estadoActual = (postulacionViva?.status ?? p.status) as EstadoContratacion;
  const sinEvaluar = !candidato || nivel === 'sin';

  const verPdf = () => abrirCv(p.cv).catch(() => alert('No se pudo abrir la hoja de vida.'));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Encabezado */}
      <Box sx={{ bgcolor: AZUL, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SparkIcon />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700}>Resultado del análisis</Typography>
          <Typography fontSize="0.8rem" sx={{ opacity: 0.85 }}>
            {cargo} · 1 hoja de vida · {fecha ? `hoy ${hora(fecha)}` : 'analizando...'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Cuerpo con scroll */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Rango del nivel */}
        {!cargando && !error && candidato && (
          <Box
            sx={{
              bgcolor: cfg.fondo,
              borderRadius: 3,
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography fontSize="0.9rem" color={cfg.texto} fontWeight={700}>
              Nivel: {cfg.nombre}
            </Typography>
            <Typography fontSize="0.75rem" color={cfg.texto} sx={{ opacity: 0.8 }}>
              {cfg.rango}
            </Typography>
          </Box>
        )}

        {/* Tarjeta del candidato */}
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 3,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            border: `2px solid ${cargando ? '#E9D5FF' : cfg.fondo}`,
          }}
        >
          {/* Header del candidato */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: FONDO_AVATAR[nivel],
                color: cfg.texto,
              }}
            >
              {iniciales(p.full_name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700} fontSize="1.05rem" noWrap>{p.full_name}</Typography>
              <Typography fontSize="0.8rem" color="#64748B">
                {p.city} · {nivelEducativo(p.education_level)} · {p.years_experience} años
              </Typography>
            </Box>

            {/* Chip de RANGO en lugar del puntaje numérico */}
            {!cargando && !sinEvaluar && candidato && (
              <Chip
                label={cfg.nombre}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  height: 34,
                  px: 1.75,
                  bgcolor: cfg.texto,
                  color: '#fff',
                  letterSpacing: '0.05em',
                }}
              />
            )}
          </Box>

          <Divider />

          {/* ESTADO DE CARGA */}
          {cargando && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={44} sx={{ color: '#7C3AED' }} />
              <Typography fontWeight={700} color="#7C3AED">Analizando con IA...</Typography>
              <Typography fontSize="0.8rem" color="#64748B" textAlign="center">
                Gemini está leyendo la hoja de vida y comparando contra la descripción del cargo.
              </Typography>
            </Box>
          )}

          {/* ERROR */}
          {!cargando && error && (
            <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 2, p: 2, border: '1px solid #FECACA' }}>
              <Typography fontSize="0.85rem" color="#B91C1C" fontWeight={600}>
                ⚠ {error}
              </Typography>
            </Box>
          )}

          {/* RESULTADO */}
          {!cargando && !error && candidato && (
            <>
              {/* Fortalezas */}
              {!sinEvaluar && candidato.fortalezas.length > 0 && (
                <Box>
                  <Typography
                    fontSize="0.72rem"
                    fontWeight={800}
                    color="#16A34A"
                    mb={0.75}
                    letterSpacing="0.05em"
                  >
                    FORTALEZAS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {candidato.fortalezas.map((f, i) => (
                      <Linea key={i} icono={<CheckIcon sx={{ fontSize: 18, color: '#16A34A' }} />} texto={f} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* A verificar */}
              {candidato.aVerificar.length > 0 && (
                <Box>
                  <Typography
                    fontSize="0.72rem"
                    fontWeight={800}
                    color="#EA580C"
                    mb={0.75}
                    letterSpacing="0.05em"
                  >
                    A VERIFICAR
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {candidato.aVerificar.map((a, i) => (
                      <Linea key={i} icono={<DudaIcon sx={{ fontSize: 18, color: '#EA580C' }} />} texto={a} />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Botones */}
          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {p.cv && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DocIcon />}
                onClick={verPdf}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  color: AZUL,
                  borderColor: '#CBD5E1',
                }}
              >
                Hoja de vida
              </Button>
            )}
            <Box sx={{ ml: 'auto' }}>
              <EstadoSelect value={estadoActual} onChange={(n) => onCambiarEstado(p.id, n)} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid #F1F5F9', px: 3, py: 1.5 }}>
        <Typography fontSize="0.75rem" color="#64748B">
          La decisión final es de Gestión Humana.
        </Typography>
      </Box>
    </Drawer>
  );
};

export default ModalAnalisisIA;


