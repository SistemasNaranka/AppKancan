import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';
import { useRuleta } from '../hooks/useRuleta';
import ModalPremio from './ModalPremio';
import { aplicarColorPorGrupo, GRUPO_POR_PREMIO } from '../utils/rangos';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const zoomIn = keyframes`
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// 🎈 Flotación: sube y baja suavemente
const floating = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-14px); }
`;

// 🌑 Sombra que reacciona a la flotación (más chica cuando sube)
const shadowPulse = keyframes`
  0%, 100% { transform: scaleX(1);    opacity: 0.35; }
  50%      { transform: scaleX(0.85); opacity: 0.18; }
`;

// 🎏 Suave vaivén para los banderines de papel picado
const sway = keyframes`
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
`;

// 🌶️ Paleta fiesta latina — inspirada en papel picado / carnaval
const STITCH_COLORS = [
  { base: '#FF4D6D', dark: '#D6234A' }, // rojo coral / hibisco
  { base: '#FFB703', dark: '#F08C00' }, // amarillo dorado / sol
  { base: '#06D6A0', dark: '#00A884' }, // turquesa caribe
  { base: '#FF6B00', dark: '#E65100' }, // naranja mango
  { base: '#EF3DB8', dark: '#C2186F' }, // magenta buganvilia
  { base: '#7B2FF7', dark: '#5B1FC2' }, // púrpura fiesta
];

const defaultSegments: ISegment[] = Object.entries(GRUPO_POR_PREMIO).map(
  ([label, grupo]) => aplicarColorPorGrupo(label, grupo)
);

interface RuletaProps {
  segments?: ISegment[];
  documentos?: string;
  onPremioGanado?: (data: IPremioResponse) => void;
  facturaValida?: boolean;
  storeId?: number | null;
}

// Helpers
const gajoPath = (index: number, total: number, radius: number, cx: number, cy: number): string => {
  const anglePerSeg = (2 * Math.PI) / total;
  const startAngle = index * anglePerSeg - Math.PI / 2;
  const endAngle = startAngle + anglePerSeg;
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
};

const bubblePos = (index: number, total: number, radius: number, cx: number, cy: number) => {
  const anglePerSeg = (2 * Math.PI) / total;
  const midAngle = index * anglePerSeg + anglePerSeg / 2 - Math.PI / 2;
  return {
    x: cx + radius * 0.62 * Math.cos(midAngle),
    y: cy + radius * 0.62 * Math.sin(midAngle),
  };
};

const dotPos = (index: number, total: number, radius: number, cx: number, cy: number) => {
  const anglePerSeg = (2 * Math.PI) / total;
  const angle = index * anglePerSeg - Math.PI / 2;
  return {
    x: cx + radius * 0.94 * Math.cos(angle),
    y: cy + radius * 0.94 * Math.sin(angle),
  };
};

// 🌸 Posición de los "pétalos" del borde festón (un poco más afuera del aro)
const petalPos = (index: number, total: number, radius: number, cx: number, cy: number) => {
  const anglePerSeg = (2 * Math.PI) / total;
  const angle = index * anglePerSeg - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
};

const Ruleta: React.FC<RuletaProps> = ({
  segments = defaultSegments,
  documentos,
  onPremioGanado,
  facturaValida = false,
  storeId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [premioData, setPremioData] = useState<IPremioResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const { rotation, isSpinning, error, girar, reset } = useRuleta(segments, documentos, storeId);

  const handleSpin = async () => {
    try {
      await girar((data: IPremioResponse) => {
        setPremioData(data);
        setModalOpen(true);
        if (onPremioGanado) onPremioGanado(data);
      });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error al girar la ruleta', severity: 'error' });
    }
  };

  useEffect(() => {
    if (error) setSnackbar({ open: true, message: error, severity: 'error' });
  }, [error]);

  const handleCloseModal = () => {
    setModalOpen(false);
    reset();
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const numSegments = segments.length;
  const radius = 190;
  const cx = 200;
  const cy = 200;
  const petalCount = Math.max(numSegments * 2, 16);

  // 🎏 Banderines de papel picado (arriba del título)
  const BUNTING_COUNT = 9;
  const buntingFlags = Array.from({ length: BUNTING_COUNT }).map((_, i) => STITCH_COLORS[i % STITCH_COLORS.length]);

  const wheelSVG = (size: number = 400) => (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0 14px 18px rgba(120, 20, 60, 0.22))',
        overflow: 'visible',
      }}
    >
      <defs>
        {STITCH_COLORS.map((c, i) => (
          <radialGradient key={i} id={`stitchGrad${i}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="30%" stopColor={c.base} />
            <stop offset="100%" stopColor={c.dark} />
          </radialGradient>
        ))}
        <filter id="bubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" />
          <feComponentTransfer><feFuncA type="linear" slope="1.2" /></feComponentTransfer>
        </filter>
      </defs>

      {/* 🌸 Borde festón (pétalos) — gira junto con la rueda */}
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '200px 200px' }}>
        {Array.from({ length: petalCount }).map((_, i) => {
          const p = petalPos(i, petalCount, radius + 6, cx, cy);
          const color = STITCH_COLORS[i % STITCH_COLORS.length];
          return (
            <circle
              key={`petal-${i}`}
              cx={p.x}
              cy={p.y}
              r={7}
              fill={color.base}
              stroke="#FFF7EC"
              strokeWidth={2}
            />
          );
        })}
      </g>

      {/* Grupo rotatorio */}
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '200px 200px' }}>
        {segments.map((_seg, i) => (
          <path
            key={`gajo-${i}`}
            d={gajoPath(i, numSegments, radius, cx, cy)}
            fill={`url(#stitchGrad${i % STITCH_COLORS.length})`}
            stroke="#FFF7EC"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ))}

        {segments.map((_seg, i) => {
          const p = dotPos(i, numSegments, radius, cx, cy);
          return (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill="#FFE8A3"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
          );
        })}

        {segments.map((_seg, i) => {
          const p = bubblePos(i, numSegments, radius, cx, cy);
          return (
            <g key={`bubble-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={22}
                fill="rgba(255,255,255,0.42)"
                stroke="#FFF7EC"
                strokeWidth={2.5}
                filter="url(#bubbleGlow)"
              />
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                fill="#ffffff"
                fontFamily="'Sora', 'Poppins', sans-serif"
                fontSize={22}
                fontWeight={800}
                style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.85)) drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
              >
                ?
              </text>
            </g>
          );
        })}
      </g>

      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#FFF7EC" strokeWidth={6} />

      <circle cx={cx} cy={cy} r={30} fill="#FFF7EC"
        style={{ filter: 'drop-shadow(0 8px 20px rgba(120,20,60,0.25))' }} />
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#D6234A"
        fontFamily="'Plus Jakarta Sans', 'Poppins', sans-serif"
        fontSize={30}
        fontWeight={800}
        style={{ letterSpacing: '-0.03em' }}
      >
        K
      </text>
    </svg>
  );

  return (
    <>
      {(isSpinning || modalOpen) && (
        <Box
          sx={{
            position: 'fixed', inset: 0, zIndex: 1200,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(90, 10, 40, 0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: `${fadeIn} 0.45s ease`,
          }}
        >
          <Box sx={{
            position: 'relative',
            width: 'min(70vh, 90vw)',
            aspectRatio: '1/1',
            animation: `${zoomIn} 0.5s ease-out`,
          }}>
            <Box sx={{
              position: 'absolute', top: -20, left: '50%',
              transform: 'translateX(-50%)', zIndex: 12,
              width: 0, height: 0,
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderTop: '38px solid #FF6B00',
              filter: 'drop-shadow(0 4px 8px rgba(255,107,0,0.5))',
            }} />
            {wheelSVG(600)}
          </Box>
        </Box>
      )}

      <Box sx={{
        background: 'transparent',
        padding: 0,
        textAlign: 'center',
        maxWidth: 480,
        width: '100%',
        margin: '0 auto',
      }}>
        {/* 🎏 Banderines de papel picado */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2px',
          mb: 1,
          px: 2,
        }}>
          {buntingFlags.map((c, i) => (
            <Box
              key={i}
              sx={{
                width: 0,
                height: 0,
                borderLeft: '13px solid transparent',
                borderRight: '13px solid transparent',
                borderTop: `20px solid ${c.base}`,
                transformOrigin: 'top center',
                animation: `${sway} ${2.5 + (i % 3) * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
              }}
            />
          ))}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{
            fontSize: { xs: '1.6rem', sm: '2rem' },
            fontWeight: 800,
            color: '#3B0A24',
            fontFamily: "'Sora', 'Poppins', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}>
            ¡Gira y llévate{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #D6234A 0%, #FF6B00 50%, #FFB703 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>tu premio!</Box>
          </Typography>
          <Typography sx={{ mt: 1, fontSize: '0.85rem', color: '#7A4A5C', maxWidth: 380, mx: 'auto' }}>
            Cada compra es una oportunidad. Gira la ruleta y descubre qué te ganaste hoy
          </Typography>
        </Box>

        {/* 🎈 Contenedor de la ruleta flotante */}
        <Box sx={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
          maxWidth: 440,
          margin: '0 auto',
          // 👇 Dejamos espacio extra abajo para que se vea la sombra
          pb: 4,
        }}>
          {/* 🌑 Sombra en el suelo que reacciona a la flotación */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              width: '60%',
              height: '18px',
              background: 'radial-gradient(ellipse at center, rgba(120,20,60,0.45) 0%, rgba(120,20,60,0) 70%)',
              transform: 'translateX(-50%)',
              animation: !isSpinning ? `${shadowPulse} 4s ease-in-out infinite` : 'none',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* 🎈 Ruleta flotando */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              animation: !isSpinning ? `${floating} 4s ease-in-out infinite` : 'none',
              zIndex: 1,
            }}
          >
            {/* Puntero arriba (flota junto con la ruleta) */}
            <Box sx={{
              position: 'absolute', top: -8, left: '50%',
              transform: 'translateX(-50%)', zIndex: 10,
              width: 0, height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '28px solid #FF6B00',
              filter: 'drop-shadow(0 3px 6px rgba(255,107,0,0.45))',
            }} />
            {wheelSVG(440)}
          </Box>
        </Box>

        <Button
          variant="contained"
          disabled={isSpinning || !facturaValida}
          onClick={handleSpin}
          sx={{
            mt: 3,
            py: '14px',
            px: '32px',
            fontSize: '0.95rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #FF6B00, #D6234A)',
            borderRadius: '16px',
            boxShadow: '0 10px 24px -4px rgba(214,35,74,0.45), 0 0 12px rgba(255,107,0,0.3)',
            width: '100%',
            maxWidth: 340,
            fontFamily: "'Sora', 'Poppins', sans-serif",
            '&:hover:not(:disabled)': {
              background: 'linear-gradient(135deg, #D6234A, #B3123A)',
              boxShadow: '0 14px 28px -2px rgba(214,35,74,0.65), 0 0 20px rgba(255,183,3,0.5)',
              filter: 'brightness(1.05)',
            },
            '&:disabled': {
              background: '#E8C9D1',
              color: '#ffffff',
              cursor: 'not-allowed',
              boxShadow: 'none',
            },
          }}
        >
          {isSpinning ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={22} sx={{ color: '#fff' }} />
              GIRANDO...
            </Box>
          ) : (
            '▶  GIRAR RULETA'
          )}
        </Button>
      </Box>

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