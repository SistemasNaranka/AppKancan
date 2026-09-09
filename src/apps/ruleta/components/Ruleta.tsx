import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';
import { drawWheel } from '../utils/drawWheel';
import { useRuleta } from '../hooks/useRuleta';
import ModalPremio from './ModalPremio';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const zoomIn = keyframes`
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;
const tick = keyframes`
  0% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-14deg); }
  55% { transform: translateX(-50%) rotate(4deg); }
  100% { transform: translateX(-50%) rotate(0deg); }
`;

import { aplicarColorPorGrupo, GRUPO_POR_PREMIO } from '../utils/rangos';

const defaultSegments: ISegment[] = Object.entries(GRUPO_POR_PREMIO).map(
  ([label, grupo]) => aplicarColorPorGrupo(label, grupo)
);

const Container = styled(Box)({
  background: 'transparent',
  padding: 0,
  textAlign: 'center',
  maxWidth: '460px',
  width: '100%',
  margin: '0 auto',
});

const CanvasWrapper = styled(Box)({
  position: 'relative',
  display: 'inline-block',
  width: '100%',
  maxWidth: '440px',
  aspectRatio: '1/1',
  margin: '0 auto',
});

const StyledCanvas = styled('canvas')({
  width: '100% !important',
  height: '100% !important',
  display: 'block',
  borderRadius: '50%',
  cursor: 'default',
});

const Pointer = styled(Box)({
  position: 'absolute',
  top: '-14px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  width: '26px',
  height: '36px',
  filter: 'drop-shadow(0 0 1px #FFFFFF) drop-shadow(0 0 2.5px #FFFFFF) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  clipPath: 'polygon(50% 100%, 100% 42%, 85% 0%, 15% 0%, 0% 42%)',
  background: 'linear-gradient(180deg, #60A5FA 0%, #1D4ED8 50%, #0F172A 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '1.5px',
    clipPath: 'polygon(50% 100%, 100% 42%, 85% 0%, 15% 0%, 0% 42%)',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E2E8F0 65%, #94A3B8 100%)',
    boxShadow: '0 1.5px 3px rgba(0, 0, 0, 0.35), inset 0 1.5px 1.5px #FFFFFF, inset 0 -1px 1.5px rgba(0, 0, 0, 0.25)',
  },
});

interface RuletaProps {
  segments?: ISegment[];
  userEmail?: string;
  onPremioGanado?: (data: IPremioResponse) => void;
  facturaValida?: boolean;
  storeId?: number | null;
}

const Ruleta: React.FC<RuletaProps> = ({
  segments = defaultSegments,
  userEmail,
  onPremioGanado,
  facturaValida = false,
  storeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [premioData, setPremioData] = useState<IPremioResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const { rotation, isSpinning, error, girar, reset } = useRuleta(segments, userEmail);

  useEffect(() => {
    if (!isSpinning) {
      drawWheel(canvasRef.current, segments, 0);
    }
  }, [segments, isSpinning]);

  useEffect(() => {
    if (isSpinning || modalOpen) {
      drawWheel(bigCanvasRef.current, segments, rotation);
    }
  }, [rotation, segments, isSpinning, modalOpen]);

  const handleSpin = async () => {
    try {
      await girar((data: IPremioResponse) => {
        setPremioData(data);
        setModalOpen(true);
        if (onPremioGanado) onPremioGanado(data);
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Error al girar la ruleta',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleCloseModal = () => {
    setModalOpen(false);
    reset();
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      {(isSpinning || modalOpen) && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${fadeIn} 0.45s ease`,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 'min(70vh, 90vw)',
              aspectRatio: '1/1',
              animation: `${zoomIn} 0.5s ease-out`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '-26px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 12,
                width: '44px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: '50% 0%',
                clipPath: 'polygon(50% 100%, 100% 42%, 85% 0%, 15% 0%, 0% 42%)',
                background: 'linear-gradient(180deg, #60A5FA 0%, #1D4ED8 50%, #0F172A 100%)',
                filter: 'drop-shadow(0 0 2px #FFFFFF) drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 7px 14px rgba(0, 0, 0, 0.6))',
                animation: isSpinning ? `${tick} 0.28s ease-in-out infinite` : 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: '2.5px',
                  clipPath: 'polygon(50% 100%, 100% 42%, 85% 0%, 15% 0%, 0% 42%)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.35) 100%)',
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '8px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E2E8F0 65%, #94A3B8 100%)',
                  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.35), inset 0 2px 2px #FFFFFF, inset 0 -2px 3px rgba(0, 0, 0, 0.25)',
                },
              }}
            />
            <canvas
              ref={bigCanvasRef}
              width={600}
              height={600}
              style={{ width: '100%', height: '100%', display: 'block', borderRadius: '50%' }}
            />
          </Box>
        </Box>
      )}

      <Container>
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: '1.4rem', sm: '1.8rem' },
              fontWeight: 800,
              color: '#1E293B',
              fontFamily: "'Poppins', sans-serif",
              lineHeight: 1.15,
            }}
          >
            ¡Gira y llévate <Box component="span" sx={{ color: '#1976D2' }}>tu premio!</Box>
          </Typography>
          <Typography sx={{ mt: 1, fontSize: '0.85rem', color: '#64748B', maxWidth: 360, mx: 'auto' }}>
            Cada compra es una oportunidad. Gira la ruleta y descubre qué te ganaste.
          </Typography>
        </Box>

        <CanvasWrapper>
          <StyledCanvas ref={canvasRef} width={600} height={600} />
          <Pointer />
        </CanvasWrapper>

        <Button
          variant="contained"
          disabled={isSpinning || !facturaValida}
          onClick={handleSpin}
          sx={{
            mt: 3,
            py: '11px',
            px: '32px',
            fontSize: '0.95rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #1E88E5, #1565C0)',
            borderRadius: '11px',
            boxShadow: '0 4px 16px rgba(25,118,210,0.26)',
            width: '100%',
            maxWidth: '300px',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.03) translateY(-1px)',
              boxShadow: '0 8px 26px rgba(25,118,210,0.4)',
            },
            '&:disabled': {
              background: '#CBD5E1',
              color: '#ffffff',
              cursor: 'not-allowed',
              boxShadow: 'none',
            },
          }}
        >
          {isSpinning ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={28} sx={{ color: '#ffffff' }} />
              GIRANDO...
            </Box>
          ) : (
            'Girar ruleta'
          )}
        </Button>

        {error && (
          <Typography
            sx={{
              mt: 2,
              color: '#FF6B6B',
              fontSize: '0.9rem',
              fontWeight: 500,
              bgcolor: 'rgba(255,0,0,0.1)',
              p: 1.5,
              borderRadius: '12px',
              border: '1px solid rgba(255,0,0,0.2)',
            }}
          >
            {error}
          </Typography>
        )}
      </Container>

      <ModalPremio open={modalOpen} premioData={premioData} onClose={handleCloseModal} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Ruleta;