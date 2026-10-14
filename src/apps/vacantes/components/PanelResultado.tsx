import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Chip, Button, ButtonBase, Avatar,
} from '@mui/material';
import {
  AutoAwesome as SparkIcon, Close as CloseIcon, CheckRounded as CheckIcon,
  HelpOutlineRounded as DudaIcon, DescriptionOutlined as DocIcon,
} from '@mui/icons-material';
import { AZUL, AZUL_BG } from '../page/VacantesPage';
import { abrirCv, Postulacion, EstadoContratacion } from '../api/directus/read';
import {
  ResultadoIA, CandidatoEvaluado, NivelAjuste, NIVELES_AJUSTE, ORDEN_NIVELES,
  nivelDe, nivelEducativo,
} from '../api/ia';
import EstadoSelect from './EstadoSelect';

interface Props {
  resultado: ResultadoIA | null;
  open: boolean;
  onClose: () => void;
  postulaciones: Postulacion[]; // datos vivos: el estado puede cambiar después del análisis
  onCambiarEstado: (id: number, nuevo: EstadoContratacion) => void;
}

const hora = (d: Date) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const verPdf = (p: Postulacion) => abrirCv(p.cv).catch((err) => {
  console.error('[vacantes] No se pudo abrir la hoja de vida:', err);
  alert('No se pudo abrir la hoja de vida. Intenta de nuevo.');
});

const unir = (items: string[]) => items.filter(Boolean).join('; ') || '—';

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

// Fondo del círculo de iniciales: un tono más fuerte que el fondo del nivel
const FONDO_AVATAR: Record<NivelAjuste, string> = {
  alto: '#DCFCE7', medio: '#FFEDD5', bajo: '#FEE2E2', sin: '#E2E8F0',
};

// Reparte por nivel; dentro de cada nivel, orden de llegada (más antigua primero)
const agrupar = (ranking: CandidatoEvaluado[]) => {
  const g: Record<NivelAjuste, CandidatoEvaluado[]> = { alto: [], medio: [], bajo: [], sin: [] };
  ranking.forEach((c) => g[nivelDe(c)].push(c));
  ORDEN_NIVELES.forEach((n) => g[n].sort((a, b) =>
    String(a.postulacion.date_created).localeCompare(String(b.postulacion.date_created))));
  return g;
};

const Linea: React.FC<{ icono: React.ReactNode; texto: string }> = ({ icono, texto }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
    <Box sx={{ mt: '1px', display: 'flex' }}>{icono}</Box>
    <Typography fontSize="0.8rem" color="#334155" lineHeight={1.5}>{texto}</Typography>
  </Box>
);

const PanelResultado: React.FC<Props> = ({
  resultado, open, onClose, postulaciones, onCambiarEstado,
}) => {
  const estadoActual = new Map(postulaciones.map((p) => [p.id, p.status]));
  const grupos = useMemo(() => (resultado ? agrupar(resultado.ranking) : null), [resultado]);
  const [nivel, setNivel] = useState<NivelAjuste>('alto');

  // Con cada resultado nuevo, abre en el primer nivel que tenga personas
  useEffect(() => {
    if (grupos) setNivel(ORDEN_NIVELES.find((n) => grupos[n].length > 0) ?? 'alto');
  }, [grupos]);

  const cfg = NIVELES_AJUSTE[nivel];
  const lista = grupos?.[nivel] ?? [];

  return (
    <Drawer
      anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, display: 'flex', flexDirection: 'column' } }}
    >
      {resultado && grupos && (
        <>
          {/* Encabezado */}
          <Box sx={{ bgcolor: AZUL, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SparkIcon />
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={700}>Resultado del análisis</Typography>
              <Typography fontSize="0.8rem" sx={{ opacity: 0.85 }}>
                {resultado.cargo} · {resultado.ranking.length} hojas de vida · hoy {hora(resultado.fecha)}
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: '#fff' }} aria-label="Cerrar">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Cuerpo con scroll */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Resumen (estilo B) */}
            <Box sx={{ bgcolor: AZUL_BG, borderRadius: 3, px: 2, py: 1.75, display: 'flex', gap: 1.25 }}>
              <SparkIcon sx={{ color: AZUL, fontSize: 20, mt: '1px' }} />
              <Box>
                <Typography fontWeight={700} fontSize="0.8rem" color={AZUL} mb={0.25}>Resumen del grupo</Typography>
                <Typography fontSize="0.85rem" color="#1E293B" lineHeight={1.55}>{resultado.resumen}</Typography>
                {resultado.ejemplo && (
                  <Chip label="datos de ejemplo" size="small"
                    sx={{ mt: 1, height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#FFEDD5', color: '#C2410C' }} />
                )}
              </Box>
            </Box>

            {/* Pestañas */}
            <Box role="tablist" aria-label="Nivel de ajuste" sx={{
              display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.5,
              bgcolor: '#F1F5F9', borderRadius: 3, p: 0.5,
            }}>
              {ORDEN_NIVELES.map((n) => {
                const activa = n === nivel;
                const c = NIVELES_AJUSTE[n];
                return (
                  <ButtonBase
                    key={n} role="tab" aria-selected={activa} onClick={() => setNivel(n)}
                    sx={{
                      minHeight: 44, borderRadius: 2.25, px: 0.5, fontFamily: 'inherit', fontSize: '0.8rem',
                      bgcolor: activa ? c.fondo : 'transparent',
                      color: activa ? c.texto : '#475569',
                      fontWeight: activa ? 700 : 600,
                    }}
                  >
                    {c.nombre} · {grupos[n].length}
                  </ButtonBase>
                );
              })}
            </Box>

            {/* Personas del nivel elegido */}
            <Box role="tabpanel" sx={{ bgcolor: cfg.fondo, borderRadius: 4, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography fontSize="0.75rem" color="#475569" px={0.5}>{cfg.rango}</Typography>

              {lista.length === 0 && (
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 2.5, textAlign: 'center' }}>
                  <Typography fontSize="0.8rem" color="#475569">No hay personas en este nivel.</Typography>
                </Box>
              )}

              {lista.map((c) => {
                const p = c.postulacion;
                const estado = (estadoActual.get(p.id) ?? p.status) as EstadoContratacion;
                const sinEvaluar = nivel === 'sin';
                return (
                  <Box key={p.id} sx={{ bgcolor: '#fff', borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 40, height: 40, fontSize: '0.85rem', fontWeight: 700, bgcolor: FONDO_AVATAR[nivel], color: cfg.texto }}>
                        {iniciales(p.full_name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600} fontSize="0.95rem" noWrap>{p.full_name}</Typography>
                        <Typography fontSize="0.75rem" color="#64748B">
                          {p.city} · {nivelEducativo(p.education_level)} · {p.years_experience} años
                        </Typography>
                      </Box>
                      {!sinEvaluar && (
                        <Typography fontSize="0.75rem" color="#94A3B8">{c.puntaje}</Typography>
                      )}
                    </Box>

                    {!sinEvaluar && (
                      <Linea icono={<CheckIcon sx={{ fontSize: 18, color: '#16A34A' }} />} texto={unir(c.fortalezas)} />
                    )}
                    <Linea icono={<DudaIcon sx={{ fontSize: 18, color: '#EA580C' }} />} texto={unir(c.aVerificar)} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderTop: '1px solid #F1F5F9', pt: 1.25 }}>
                      {p.cv && (
                        <Button
                          variant="outlined" size="small" startIcon={<DocIcon />} onClick={() => verPdf(p)}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, color: AZUL, borderColor: '#CBD5E1' }}
                        >
                          Hoja de vida
                        </Button>
                      )}
                      <Box sx={{ ml: 'auto' }}>
                        <EstadoSelect value={estado} onChange={(nuevo) => onCambiarEstado(p.id, nuevo)} />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ borderTop: '1px solid #F1F5F9', px: 3, py: 1.5 }}>
            <Typography fontSize="0.75rem" color="#64748B">La decisión final es de Gestión Humana.</Typography>
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default PanelResultado;