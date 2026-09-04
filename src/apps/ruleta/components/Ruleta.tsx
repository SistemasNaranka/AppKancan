import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ISegment, IPremioResponse, IFormularioGanador } from '../interfaces/ruleta.interface'; // ✅ Ruta correcta a interfaces
import { drawWheel } from '../utils/drawWheel'; // ✅ Ruta correcta a utils
import { useRuleta } from '../hooks/useRuleta'; // ✅ Ruta correcta a hooks
import ModalPremio from './ModalPremio'; // ✅ Ruta correcta (misma carpeta components)

// ============================================================
// 🔥 PREMIOS DE LA RULETA (CAMBIA SEGÚN EL PLAN DE NEGOCIO)
// ============================================================
const defaultSegments: ISegment[] = [
  { label: '5% OFF', color: '#1A1A2E' },
  { label: 'Envío Gratis', color: '#16213E' },
  { label: '10% OFF', color: '#0F3460' },
  { label: 'Producto Gratis', color: '#E94560' },
  { label: '15% OFF', color: '#533483' },
  { label: '20% OFF', color: '#FFD700' },
];

// ===== STYLED COMPONENTS =====
const Container = styled(Box)({
  background: 'rgba(20, 18, 16, 0.85)',
  backdropFilter: 'blur(12px)',
  padding: '25px 30px 40px',
  borderRadius: '50px 50px 30px 30px',
  boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,215,0,0.15)',
  borderBottom: '3px solid #FFD700',
  textAlign: 'center',
  maxWidth: '650px',
  width: '100%',
  margin: '0 auto',
});

const CanvasWrapper = styled(Box)({
  position: 'relative',
  display: 'inline-block',
  width: '100%',
  maxWidth: '450px',
  aspectRatio: '1/1',
  margin: '0 auto',
});

const StyledCanvas = styled('canvas')({
  width: '100% !important',
  height: '100% !important',
  display: 'block',
  borderRadius: '50%',
  boxShadow:
    '0 0 60px rgba(255,215,0,0.15), 0 0 120px rgba(255,215,0,0.05), inset 0 0 40px rgba(0,0,0,0.5)',
  border: '4px solid #2a251a',
  cursor: 'default',
});

const Pointer = styled(Box)({
  position: 'absolute',
  top: '-10px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  width: 0,
  height: 0,
  borderLeft: '22px solid transparent',
  borderRight: '22px solid transparent',
  borderTop: '38px solid #FFD700',
  filter: 'drop-shadow(0 0 25px #FFD700)',
  '&::after': {
    content: '"◆"',
    position: 'absolute',
    top: '-48px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.8rem',
    color: '#FFD700',
    textShadow: '0 0 30px #FFD700',
    lineHeight: 1,
  },
  '@media (max-width:480px)': {
    borderLeftWidth: '14px',
    borderRightWidth: '14px',
    borderTopWidth: '28px',
    top: '-6px',
    '&::after': {
      fontSize: '1.2rem',
      top: '-36px',
    },
  },
});

interface RuletaProps {
  segments?: ISegment[];
  userEmail?: string;
  onPremioGanado?: (data: IPremioResponse) => void;
}

const Ruleta: React.FC<RuletaProps> = ({
  segments = defaultSegments,
  userEmail,
  onPremioGanado,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [premioData, setPremioData] = useState<IPremioResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const { rotation, isSpinning, error, premio, girar, reset } = useRuleta(segments, userEmail);

  useEffect(() => {
    drawWheel(canvasRef.current, segments, rotation);
  }, [rotation, segments]);

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

  const handleCanjear = (datos: IFormularioGanador, codigo: string) => {
    console.log('Datos del ganador:', datos);
    console.log('Código canjeado:', codigo);
    setSnackbar({
      open: true,
      message: `✅ ¡Premio canjeado con éxito! Código: ${codigo}`,
      severity: 'success',
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Container>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            pb: 2,
            mb: 2,
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.6rem', sm: '2.2rem' },
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '3px',
                lineHeight: 1,
              }}
            >
              KRAICAN
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.8rem', sm: '1.1rem' },
                fontWeight: 700,
                color: '#FFD700',
                background: 'rgba(255,215,0,0.15)',
                px: 2,
                borderRadius: '30px',
                border: '1px solid rgba(255,215,0,0.3)',
              }}
            >
              2.0
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: { xs: '0.7rem', sm: '1rem' },
              fontWeight: 300,
              color: '#aaa',
              fontFamily: 'Courier New, monospace',
              letterSpacing: '2px',
              background: 'rgba(255,255,255,0.05)',
              px: 2,
              py: 0.5,
              borderRadius: '20px',
            }}
          >
            {currentTime}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: '0.65rem', sm: '0.9rem' },
            letterSpacing: { xs: '1px', sm: '3px' },
            textTransform: 'uppercase',
            color: '#d4c9b0',
            mb: 3,
            fontWeight: 300,
            '& span': { color: '#FFD700', fontWeight: 600 },
          }}
        >
          🎰 <span>GRAN SORTEO KRAICAN</span> · RULETA MILLONARIA 💰
        </Typography>

        <CanvasWrapper>
          <StyledCanvas ref={canvasRef} width={600} height={600} />
          <Pointer />
        </CanvasWrapper>

        <Button
          variant="contained"
          disabled={isSpinning}
          onClick={handleSpin}
          sx={{
            mt: 4,
            py: { xs: '14px', sm: '18px' },
            px: { xs: '20px', sm: '50px' },
            fontSize: { xs: '1.2rem', sm: '1.6rem' },
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            color: '#0a0a0f',
            background: 'linear-gradient(135deg, #FFD700, #F0A500)',
            borderRadius: '60px',
            boxShadow: '0 8px 35px rgba(255,215,0,0.4)',
            width: '100%',
            maxWidth: '320px',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.05) translateY(-2px)',
              boxShadow: '0 15px 50px rgba(255,215,0,0.6)',
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
              transform: 'scale(0.98)',
              filter: 'grayscale(0.6)',
            },
          }}
        >
          {isSpinning ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={28} sx={{ color: '#0a0a0f' }} />
              GIRANDO...
            </Box>
          ) : (
            '¡GIRAR!'
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

      <ModalPremio
        open={modalOpen}
        premioData={premioData}
        onClose={handleCloseModal}
        onCanjear={handleCanjear}
      />

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