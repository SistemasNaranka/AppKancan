import React from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { keyframes } from '@mui/material/styles';
import { IPremioResponse } from '../interfaces/ruleta.interface';

// ============================================================
// 🎨 ANIMACIONES
// ============================================================
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

// ============================================================
// 🎨 COLORES Y EMOJIS (SOLO ROPA + K)
// ============================================================
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#54A0FF',
  '#A29BFE', '#FD79A8', '#00D2D3', '#FDCB6E', '#E17055',
];

const CLOTHING_ITEMS = ['K', '👖', '👕', '👟', '👚', '🧥', '👜', '👗', '👠'];

// ============================================================
// 🎊 CONFETI (K BLANCA CON BORDE AZUL #004680 MUY GRUESO)
// ============================================================
const Confeti: React.FC = () => {
  const items = Array.from({ length: 50 }).map((_, i) => {
    const isClothing = Math.random() < 0.7;
    const color = COLORS[i % COLORS.length];
    const item = CLOTHING_ITEMS[i % CLOTHING_ITEMS.length];
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    let size = 12 + Math.random() * 14;
    const isK = isClothing && item === 'K';
    const finalSize = isK ? size * 2.5 : size;
    const specialColor = isK ? '#FFFFFF' : color;

    return { isClothing, color, item, shape, size: finalSize, specialColor, isK };
  });

  return (
    <>
      {items.map((item, i) => {
        const left = Math.random() * 100;
        const duration = 2.5 + Math.random() * 2.5;
        const delay = Math.random() * 3;
        const rotation = Math.random() * 360;

        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              width: item.size,
              height: item.size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: item.isClothing ? 'transparent' : item.color,
              borderRadius: item.isClothing ? '0%' : item.shape,
              fontSize: item.isClothing ? `${item.size * 1.2}px` : '0',
              fontWeight: item.isK ? 900 : 500,
              fontFamily: item.isK ? "'Poppins', sans-serif" : 'inherit',
              color: item.isClothing ? item.specialColor : 'transparent',
              // ✅ Borde azul #004680 DE 5px (muy grueso)
              WebkitTextStroke: item.isK ? `5px #004680` : 'none',
              paintOrder: item.isK ? 'stroke fill' : 'unset',
              animation: `${fall} ${duration}s ease-in-out ${delay}s infinite`,
              textShadow: item.isClothing
                ? item.isK
                  ? '0 0 20px rgba(0,70,128,0.5)' // Sombra más intensa
                  : '0 0 10px rgba(255,255,255,0.6)'
                : 'none',
              zIndex: 2,
              pointerEvents: 'none',
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {item.isClothing ? item.item : ''}
          </Box>
        );
      })}
    </>
  );
};

// ============================================================
// 🏆 MODAL PRINCIPAL (SIN CAMBIOS)
// ============================================================
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