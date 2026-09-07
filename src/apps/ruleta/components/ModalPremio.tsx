import React from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { keyframes } from '@mui/material/styles';
import { IPremioResponse } from '../interfaces/ruleta.interface';

const fall = keyframes`
  0% { transform: translateY(-30px) rotate(0); opacity: 1; }
  100% { transform: translateY(110vh) rotate(400deg); opacity: 0; }
`;
const pop = keyframes`
  0% { transform: scale(0.6) translateY(20px); opacity: 0; }
  65% { transform: scale(1.03); }
  100% { transform: scale(1); opacity: 1; }
`;
const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const COLORS = ['#FB7185', '#38BDF8', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#FB923C', '#22D3EE', '#fff'];

const Confeti: React.FC = () => (
  <>
    {Array.from({ length: 40 }).map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          top: 0,
          left: `${Math.random() * 100}%`,
          width: 10,
          height: 10,
          background: COLORS[i % COLORS.length],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `${fall} ${2.2 + Math.random() * 2}s linear ${Math.random() * 2.5}s infinite`,
        }}
      />
    ))}
  </>
);

interface Props {
  open: boolean;
  premioData: IPremioResponse | null;
  onClose: () => void;
}

const ModalPremio: React.FC<Props> = ({ open, premioData, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
          <Confeti />
        </Box>

        <Box
          sx={{
            position: 'relative',
            zIndex: 6,
            width: 540,
            maxWidth: '94%',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 22px 55px rgba(0,0,0,0.4)',
            animation: `${pop} 0.55s ease-out`,
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1E88E5, #1565C0)',
              padding: '26px 24px 22px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <CloseIcon
              onClick={onClose}
              sx={{ position: 'absolute', top: 14, right: 16, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}
            />
            <CelebrationIcon sx={{ fontSize: 44, color: '#FFD54F' }} />
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '3px',
                color: '#fff',
                textTransform: 'uppercase',
                mt: 0.5,
              }}
            >
              ¡Ganaste!
            </Typography>
          </Box>

          <Box sx={{ background: '#fff', height: 18, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: -10, top: -2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(15,23,42,0.5)' }} />
            <Box sx={{ position: 'absolute', right: -10, top: -2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(15,23,42,0.5)' }} />
            <Box sx={{ borderTop: '2px dashed #CBD5E1', mx: '22px', mt: '8px' }} />
          </Box>

          <Box sx={{ background: '#fff', borderRadius: '0 0 24px 24px', padding: '6px 30px 30px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#94A3B8', letterSpacing: '2px', textTransform: 'uppercase', mb: 1 }}>
              Tu premio
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.05,
                mb: 3,
                background: 'linear-gradient(90deg, #0D47A1, #42A5F5, #0D47A1)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shine} 3s linear infinite`,
              }}
            >
              {premioData?.prize ?? ''}
            </Typography>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                background: '#1976D2',
                borderRadius: '12px',
                padding: '14px 60px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalPremio;