import React from 'react';
import {
  Drawer, Box, Typography, IconButton, Chip, LinearProgress, Link,
} from '@mui/material';
import { AutoAwesome as SparkIcon, Close as CloseIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG } from '../page/VacantesPage';
import { abrirCv, Postulacion, EstadoContratacion } from '../api/directus/read';
import { ResultadoIA, nivelEducativo } from '../api/ia';
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

const Lista: React.FC<{ titulo: string; color: string; items: string[] }> = ({ titulo, color, items }) => (
  <Box>
    <Typography fontSize="0.7rem" fontWeight={800} color={color} mb={0.5}>{titulo}</Typography>
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {items.map((t) => <Typography component="li" key={t} fontSize="0.8rem">{t}</Typography>)}
    </Box>
  </Box>
);

const PanelResultado: React.FC<Props> = ({
  resultado, open, onClose, postulaciones, onCambiarEstado,
}) => {
  const estadoActual = new Map(postulaciones.map((p) => [p.id, p.status]));

  return (
  <Drawer
    anchor="right" open={open} onClose={onClose}
    PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, display: 'flex', flexDirection: 'column' } }}
  >
    {resultado && (
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
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Box sx={{ bgcolor: AZUL_BG, borderRadius: 2, p: 2 }}>
            <Typography fontSize="0.85rem">
              <b>Resumen:</b> {resultado.resumen}
            </Typography>
            {resultado.ejemplo && (
              <Chip label="datos de ejemplo" size="small"
                sx={{ mt: 1, height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#FFEDD5', color: '#C2410C' }} />
            )}
          </Box>

          {resultado.ranking.map((c, i) => {
            const p = c.postulacion;
            const primero = i === 0;
            const estado = (estadoActual.get(p.id) ?? p.status) as EstadoContratacion;
            return (
              <Box key={p.id} sx={{
                mt: 2, p: 2, display: 'flex', gap: 2, borderRadius: 2,
                border: primero ? `2px solid ${AZUL}` : '1px solid #E2E8F0',
              }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: primero ? AZUL : AZUL_BG, color: primero ? '#fff' : AZUL,
                }}>
                  {i + 1}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography fontWeight={700}>{p.full_name}</Typography>
                    {primero && (
                      <Chip label="RECOMENDADA" size="small"
                        sx={{ bgcolor: AZUL, color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                    )}
                  </Box>
                  <Typography fontSize="0.75rem" color="#64748B">
                    {p.city} · {nivelEducativo(p.education_level)} · {p.years_experience} años
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1.5 }}>
                    <Lista titulo="FORTALEZAS" color="#15803D" items={c.fortalezas} />
                    <Lista titulo="A VERIFICAR" color="#C2410C" items={c.aVerificar} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                    {p.cv && (
                      <Link component="button" onClick={() => verPdf(p)}
                        sx={{ fontSize: '0.8rem', color: AZUL, fontWeight: 600 }}>
                        Ver PDF
                      </Link>
                    )}
                    <EstadoSelect value={estado} onChange={(n) => onCambiarEstado(p.id, n)} />
                  </Box>
                </Box>

                <Box sx={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                  <Typography fontWeight={800} fontSize="1.6rem" color={AZUL} lineHeight={1}>
                    {c.puntaje}
                    <Typography component="span" fontSize="0.75rem" color="#64748B">/100</Typography>
                  </Typography>
                  <LinearProgress variant="determinate" value={c.puntaje}
                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: AZUL_BG, '& .MuiLinearProgress-bar': { bgcolor: AZUL } }} />
                  <Typography fontSize="0.65rem" color="#64748B" mt={0.5}>Ajuste al cargo</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Pie: las acciones van en el paso 5 */}
        <Box sx={{ borderTop: '1px solid #E2E8F0', px: 3, py: 1.5 }}>
          <Typography fontSize="0.75rem" color="#64748B">
            La IA sugiere un orden; la decisión final es de Gestión Humana.
          </Typography>
        </Box>
      </>
    )}
  </Drawer>
  );
};

export default PanelResultado;