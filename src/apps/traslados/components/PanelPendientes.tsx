import React from 'react';
import { Paper, Typography, Box, Button, Divider, Fade } from '@mui/material';
import { Global } from '@emotion/react'; 
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import type { Traslado } from './TrasladoCard';
import PendientesFilters from './PendientesFilters';
import TrasladoListItem from './TrasladoListItem';
import { useCountAnimation } from '../hooks/useCountAnimation'; // Ajusta la ruta si es necesario

type PanelPendientesProps = {
  filtroBodega: string;
  setFiltroBodega: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  filtrados: Traslado[];
  handleAprobarTodosPendientes: () => void;
  loading: boolean;
  onTrasladoClick?: (t: Traslado) => void;
  todasLasBodegas: string[];
  totalPendientes: number; 
};

export const PanelPendientes: React.FC<PanelPendientesProps> = ({
  filtroBodega,
  setFiltroBodega,
  filtroNombre,
  setFiltroNombre,
  filtrados,
  todasLasBodegas,
  handleAprobarTodosPendientes,
  loading,
  onTrasladoClick,
  totalPendientes,
}) => {
  // Animación del contador
  const animatedCount = useCountAnimation(totalPendientes);

  //  Detectar si el número disminuyó para activar el "pulso"
  const prevCountRef = React.useRef(totalPendientes);
  const [shouldPulse, setShouldPulse] = React.useState(false);

  React.useEffect(() => {
    if (totalPendientes < prevCountRef.current) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalPendientes;
  }, [totalPendientes]);

  return (
    <Paper
      elevation={8}
      sx={{
        p: 3,
        borderRadius: 5,
        minHeight: 500,
        background: 'linear-gradient(135deg, 0%,  100%)',
        backgroundColor: 'background.paper', 
        boxShadow: '0 1px 5px 0 #004680',
        border: '1.5px solid ',
        borderColor:'primary.main',
      }}
    >
      {/* Definir la animación global */}
      <Global
        styles={{
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.15)', color: '#5eb0b6ff' },
            '100%': { transform: 'scale(1)' },
          },
        }}
      />

      {/* 📌 Título con contador animado */}
      <Typography
        variant="h5"
        fontWeight={900}
        color="primary.main"
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
          userSelect: 'none',
          
        }}
      >
        <PendingActionsIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        Traslados Pendientes (<span>{animatedCount}</span>)
      </Typography>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, userSelect: 'none' }}>
        Visualiza y filtra los traslados pendientes que deseas Aprobar.
      </Typography>

      <PendientesFilters
        filtroBodega={filtroBodega}
        setFiltroBodega={setFiltroBodega}
        filtroNombre={filtroNombre}
        setFiltroNombre={setFiltroNombre}
        bodegas={todasLasBodegas}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAprobarTodosPendientes}
          disabled={filtrados.length === 0 || loading}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          PASAR TODOS
        </Button>
      </Box>

      <Divider sx={{ mb: 2, borderColor: '#b2dfdb' }} />

      <Box
        sx={{
          overflowX: 'hidden',
          pr: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          boxSizing: 'border-box',
          alignItems: 'start',
        }}
      >
        {filtrados.length === 0 ? (
          <Fade in timeout={500}>
            <Box sx={{ userSelect: 'none' }}>
              <Typography color="text.secondary">No hay traslados pendientes.</Typography>
            </Box>
          </Fade>
        ) : (
          filtrados.map((t, idx) => (
            <TrasladoListItem
              key={t.id ?? idx}
              traslado={t}
              onTrasladoClick={() => onTrasladoClick && onTrasladoClick(t)}
              compact
            />
          ))
        )}
      </Box>
    </Paper>
  );
};