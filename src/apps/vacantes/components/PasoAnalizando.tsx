import React from 'react';
import { Box, Typography, LinearProgress, Button, Alert } from '@mui/material';
import { Description as HojaIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG } from '../page/VacantesPage';
import { Postulacion } from '../api/directus/read';

interface Props {
  seleccion: Postulacion[];
  cargo: string;
  error: string | null;
  onCancelar: () => void;
}

// Gemini analiza todas las hojas en una sola llamada: no hay progreso por hoja que mostrar
const PasoAnalizando: React.FC<Props> = ({ seleccion, cargo, error, onCancelar }) => {
  const total = seleccion.length;

  return (
    <Box sx={{ mt: 3, maxWidth: 560, mx: 'auto' }}>
      <Typography fontWeight={700} fontSize="1rem">
        {error ? 'No se pudo completar el análisis' : 'Analizando…'}
      </Typography>
      <Typography fontSize="0.8rem" color="#64748B" mb={2}>
        {cargo} · {total} {total === 1 ? 'hoja' : 'hojas'} de vida
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : (
        <>
          <LinearProgress
            sx={{ height: 8, borderRadius: 4, bgcolor: AZUL_BG, '& .MuiLinearProgress-bar': { bgcolor: AZUL } }}
          />
          <Typography fontSize="0.75rem" color="#64748B" mt={1}>
            Puede tardar unos segundos.
          </Typography>
        </>
      )}

      <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
        {seleccion.map((p) => (
          <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
            <HojaIcon sx={{ fontSize: 20, color: error ? '#CBD5E1' : AZUL }} />
            <Typography fontSize="0.85rem" fontWeight={500} sx={{ flex: 1 }} noWrap>
              {p.full_name}
            </Typography>
          </Box>
        ))}
      </Box>

      <Button
        fullWidth variant="outlined" onClick={onCancelar}
        sx={{ mt: 3, height: 44, borderRadius: 2, textTransform: 'none', fontWeight: 700, color: AZUL, borderColor: AZUL }}
      >
        {error ? 'Volver' : 'Cancelar'}
      </Button>
    </Box>
  );
};

export default PasoAnalizando;