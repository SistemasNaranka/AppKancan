import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { IPremioResponse, IFormularioGanador } from '../interfaces/ruleta.interface';

const ModalContent = styled(Paper)({
  background: 'radial-gradient(circle at top, #004680, #0a2a4a)', // Azul Kancan
  padding: '40px 35px',
  borderRadius: '40px',
  textAlign: 'center',
  border: '2px solid #FFD700',
  boxShadow: '0 0 80px rgba(255,215,0,0.2)',
  maxWidth: '480px',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  outline: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background:
      'conic-gradient(from 0deg, transparent, rgba(255,215,0,0.05), transparent, rgba(255,215,0,0.05), transparent)',
    animation: 'spinBg 10s linear infinite',
  },
  '@keyframes spinBg': {
    '100%': { transform: 'rotate(360deg)' },
  },
});

interface ModalPremioProps {
  open: boolean;
  premioData: IPremioResponse | null;
  onClose: () => void;
  onCanjear: (datos: IFormularioGanador, codigo: string) => void;
}

const ModalPremio: React.FC<ModalPremioProps> = ({
  open,
  premioData,
  onClose,
  onCanjear,
}) => {
  const [formulario, setFormulario] = useState<IFormularioGanador>({
    nombre: '',
    email: '',
    telefono: '',
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorCampos, setErrorCampos] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (!premioData?.couponCode) return;
    navigator.clipboard.writeText(premioData.couponCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formulario.nombre.trim() || !formulario.email.trim() || !formulario.telefono.trim()) {
      setErrorCampos('Todos los campos son obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
      setErrorCampos('Correo electrónico inválido');
      return;
    }
    setErrorCampos(null);
    if (premioData?.couponCode) {
      onCanjear(formulario, premioData.couponCode);
      onClose();
    }
  };

  if (!premioData) return null;

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 2,
          }}
        >
          <ModalContent elevation={0}>
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: '#FFD700',
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h1"
              sx={{ fontSize: '4rem', mb: 1, position: 'relative', zIndex: 2 }}
            >
              🏆
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: '#FFD700',
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 2,
              }}
            >
              ¡Felicidades!
            </Typography>

            <Typography
              variant="h2"
              sx={{
                color: '#fff',
                fontSize: '2.4rem',
                fontWeight: 900,
                pt: 2,
                position: 'relative',
                zIndex: 2,
                textShadow: '0 0 40px rgba(255,215,0,0.3)',
              }}
            >
              {premioData.prize}
            </Typography>

            {/* Cupón */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 2,
                p: 1.5,
                bgcolor: 'rgba(255,215,0,0.1)',
                borderRadius: '12px',
                border: '1px dashed #FFD700',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <Typography
                sx={{
                  color: '#FFD700',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  letterSpacing: '2px',
                }}
              >
                {premioData.couponCode}
              </Typography>
              <IconButton
                onClick={handleCopyCode}
                size="small"
                sx={{
                  color: '#FFD700',
                  '&:hover': { bgcolor: 'rgba(255,215,0,0.15)' },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>

            {premioData.expiresAt && (
              <Typography
                sx={{
                  color: '#b8aa8a',
                  fontSize: '0.75rem',
                  mt: 1,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                Válido hasta: {new Date(premioData.expiresAt).toLocaleDateString('es-ES')}
              </Typography>
            )}

            {/* Formulario */}
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                zIndex: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#d4c9b0', textAlign: 'left', fontWeight: 600 }}
              >
                Completa tus datos para canjear el premio:
              </Typography>

              <TextField
                label="Nombre completo"
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={{
                  input: { color: '#fff' },
                  label: { color: '#b8aa8a' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#b8aa8a' },
                    '&:hover fieldset': { borderColor: '#FFD700' },
                    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                  },
                }}
              />
              <TextField
                label="Correo electrónico"
                name="email"
                type="email"
                value={formulario.email}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={{
                  input: { color: '#fff' },
                  label: { color: '#b8aa8a' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#b8aa8a' },
                    '&:hover fieldset': { borderColor: '#FFD700' },
                    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                  },
                }}
              />
              <TextField
                label="Teléfono"
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={{
                  input: { color: '#fff' },
                  label: { color: '#b8aa8a' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#b8aa8a' },
                    '&:hover fieldset': { borderColor: '#FFD700' },
                    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                  },
                }}
              />

              {errorCampos && (
                <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                  {errorCampos}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{
                  mt: 1,
                  py: '14px',
                  background: 'linear-gradient(135deg, #FFD700, #F0A500)',
                  borderRadius: '50px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#0a0a0f',
                  boxShadow: '0 4px 25px rgba(255,215,0,0.3)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    background: 'linear-gradient(135deg, #FFD700, #F0A500)',
                  },
                }}
              >
                Canjear Premio
              </Button>
            </Box>
          </ModalContent>
        </Box>
      </Modal>

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">¡Código copiado al portapapeles!</Alert>
      </Snackbar>
    </>
  );
};

export default ModalPremio;