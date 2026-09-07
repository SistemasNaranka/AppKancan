import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ISegment, IPremioResponse, IFormularioGanador } from '../interfaces/ruleta.interface';
import { drawWheel } from '../utils/drawWheel';
import { useRuleta } from '../hooks/useRuleta';


// ============================================================
// 🎯 PREMIOS KANCAN (VISUALES) - DEBEN COINCIDIR CON PREMIOS_MOCK
// ============================================================
const defaultSegments: ISegment[] = [
  { label: 'JEAN DE LÍNEA', color: '#003366' },
  { label: 'JEAN BÁSICO', color: '#1A3A5C' },
  { label: 'BONOS 100 MIL', color: '#FFD700' },
  { label: 'BONO 50 MIL', color: '#F0A500' },
  { label: 'BONO 30 MIL', color: '#FF8C00' },
  { label: 'BLUSAS BASICAS', color: '#2E5077' },
  { label: 'TOTE BAGS denim', color: '#4A6B8A' },
  { label: 'TOPS', color: '#6A8CAF' },
  { label: 'PAÑOLETAS', color: '#8DA6C9' },
  { label: 'BAMBAS', color: '#B0C4DE' },
];

// ============================================================
// ESTILOS (Diseño Claro Kancan)
// ============================================================
const Container = styled(Paper)({
  background: '#ffffff',
  padding: '30px 35px 40px',
  borderRadius: '32px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  border: '1px solid #e9edf4',
  textAlign: 'center',
  maxWidth: '700px',
  width: '100%',
  margin: '0 auto',
});

const CanvasWrapper = styled(Box)({
  position: 'relative',
  display: 'inline-block',
  width: '100%',
  maxWidth: '480px',
  aspectRatio: '1/1',
  margin: '0 auto',
});

const StyledCanvas = styled('canvas')({
  width: '100% !important',
  height: '100% !important',
  display: 'block',
  borderRadius: '50%',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  border: '3px solid #004680',
  cursor: 'default',
  backgroundColor: '#ffffff',
});

const Pointer = styled(Box)({
  position: 'absolute',
  top: '-10px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  width: 0,
  height: 0,
  borderLeft: '20px solid transparent',
  borderRight: '20px solid transparent',
  borderTop: '35px solid #004680',
  filter: 'drop-shadow(0 0 10px rgba(0,70,128,0.3))',
  '&::after': {
    content: '"▲"',
    position: 'absolute',
    top: '-42px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.6rem',
    color: '#004680',
    textShadow: '0 0 15px rgba(0,70,128,0.4)',
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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
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

  // Dibujar la ruleta cuando cambia la rotación
  useEffect(() => {
    drawWheel(canvasRef.current, segments, rotation);
  }, [rotation, segments]);

  // Manejar el giro
  const handleSpin = async () => {
    try {
      await girar((data: IPremioResponse) => {
        setPremioData(data);
        setModalOpen(true);
        if (onPremioGanado) onPremioGanado(data);
      });
    } catch (err: any) {
      // El error ya está manejado en el hook, pero mostramos snackbar por si acaso
      setSnackbar({
        open: true,
        message: err.message || 'Error al girar la ruleta',
        severity: 'error',
      });
    }
  };

  // Mostrar errores del hook
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
    // Aquí puedes enviar los datos a tu backend para guardar el registro
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
      <Container elevation={0}>
        {/* Cabecera Kancan */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            pb: 2,
            mb: 2,
            borderBottom: '2px solid #004680',
          }}
        >
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.6rem', sm: '2.2rem' },
                fontWeight: 800,
                color: '#004680',
                letterSpacing: '2px',
                lineHeight: 1,
              }}
            >
              KANCAN
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.8rem', sm: '1.1rem' },
                fontWeight: 700,
                color: '#FFD700',
                background: '#004680',
                px: 2,
                borderRadius: '30px',
                border: '1px solid #FFD700',
              }}
            >
              
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: { xs: '0.7rem', sm: '1rem' },
              fontWeight: 500,
              color: '#6b7a8f',
              fontFamily: 'Courier New, monospace',
              letterSpacing: '1px',
              background: '#f0f4f8',
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
            fontSize: { xs: '0.7rem', sm: '0.95rem' },
            letterSpacing: { xs: '1px', sm: '3px' },
            textTransform: 'uppercase',
            color: '#004680',
            mb: 3,
            fontWeight: 700,
            '& span': { color: '#FFD700', fontWeight: 800 },
          }}
        >
          🎰 <span>GRAN SORTEO KANCAN</span> · RULETA DE PREMIOS 
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
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #004680, #003366)',
            borderRadius: '60px',
            boxShadow: '0 6px 25px rgba(0,70,128,0.3)',
            width: '100%',
            maxWidth: '320px',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.03) translateY(-2px)',
              boxShadow: '0 10px 35px rgba(0,70,128,0.4)',
              background: 'linear-gradient(135deg, #003366, #002244)',
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
              transform: 'scale(0.98)',
              filter: 'grayscale(0.3)',
            },
          }}
        >
          {isSpinning ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={24} sx={{ color: '#ffffff' }} />
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
              color: '#d32f2f',
              fontSize: '0.9rem',
              fontWeight: 500,
              bgcolor: '#fde8e8',
              p: 1.5,
              borderRadius: '12px',
              border: '1px solid #f5c6c6',
            }}
          >
            {error}
          </Typography>
        )}
      </Container>

    

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