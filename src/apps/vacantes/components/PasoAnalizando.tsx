import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, CircularProgress, Button } from '@mui/material';
import {
  CheckCircle as CheckIcon, RadioButtonUnchecked as PendienteIcon,
} from '@mui/icons-material';
import { AZUL, AZUL_BG } from '../page/VacantesPage';
import { Postulacion } from '../api/directus/read';

// SIMULACIÓN: se reemplaza por el progreso real cuando exista el backend de IA
const MS_POR_HOJA = 900;

interface Props {
  seleccion: Postulacion[];
  cargo: string;
  onCancelar: () => void;
  onTerminar: () => void;
}

const PasoAnalizando: React.FC<Props> = ({ seleccion, cargo, onCancelar, onTerminar }) => {
  const [hechas, setHechas] = useState(0);
  const total = seleccion.length;

  useEffect(() => {
    if (hechas >= total) {
      const t = setTimeout(onTerminar, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setHechas((h) => h + 1), MS_POR_HOJA);
    return () => clearTimeout(t); // al cancelar o cerrar, el temporizador muere con el componente
  }, [hechas, total, onTerminar]);

  return (
    <Box sx={{ mt: 3, maxWidth: 560, mx: 'auto' }}>
      <Typography fontWeight={700} fontSize="1rem">Analizando…</Typography>
      <Typography fontSize="0.8rem" color="#64748B" mb={2}>
        {cargo} · {total} {total === 1 ? 'hoja' : 'hojas'} de vida
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography fontSize="0.85rem" fontWeight={600}>Progreso</Typography>
        <Typography fontSize="0.85rem" color="#64748B">{Math.min(hechas, total)} de {total}</Typography>
      </Box>
      <LinearProgress
        variant="determinate" value={(Math.min(hechas, total) / total) * 100}
        sx={{ height: 8, borderRadius: 4, bgcolor: AZUL_BG, '& .MuiLinearProgress-bar': { bgcolor: AZUL } }}
      />

      <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
        {seleccion.map((p, i) => {
          const estado = i < hechas ? 'ok' : i === hechas ? 'leyendo' : 'espera';
          return (
            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
              {estado === 'ok' && <CheckIcon sx={{ fontSize: 20, color: AZUL }} />}
              {estado === 'leyendo' && <CircularProgress size={18} thickness={5} sx={{ color: AZUL, mx: '1px' }} />}
              {estado === 'espera' && <PendienteIcon sx={{ fontSize: 20, color: '#CBD5E1' }} />}
              <Typography fontSize="0.85rem" fontWeight={estado === 'leyendo' ? 700 : 500} sx={{ flex: 1 }} noWrap>
                {p.full_name}
              </Typography>
              <Typography fontSize="0.75rem" color="#64748B">
                {estado === 'ok' ? 'Leída' : estado === 'leyendo' ? 'Leyendo PDF…' : 'En espera'}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Button
        fullWidth variant="outlined" onClick={onCancelar}
        sx={{ mt: 3, height: 44, borderRadius: 2, textTransform: 'none', fontWeight: 700, color: AZUL, borderColor: AZUL }}
      >
        Cancelar
      </Button>
    </Box>
  );
};

export default PasoAnalizando;