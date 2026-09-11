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
const smoothFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3.5px); }
`;

// Paleta latina vibrante — colores saturados, sin apagar en el borde
const STITCH_COLORS = [
  { base: '#FF3D5A', dark: '#FF3D5A' }, // rojo coral encendido
  { base: '#FFB300', dark: '#FF8F00' }, // amarillo mango
  { base: '#00C48F', dark: '#009E73' }, // verde tropical
  { base: '#00BEE0', dark: '#0097B2' }, // turquesa Caribe
  { base: '#FF4FBB', dark: '#E11D74' }, // fucsia
  { base: '#4C5FF7', dark: '#3B4CC4' }, // azul índigo eléctrico
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

// Helper: calcula puntos de un gajo en el círculo unitario
const gajoPath = (index: number, total: number, radius: number, cx: number, cy: number): string => {
  const anglePerSeg = (2 * Math.PI) / total;
  const startAngle = index * anglePerSeg - Math.PI / 2; // -90° para empezar arriba
  const endAngle = startAngle + anglePerSeg;
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
};

// Helper: posición de la burbuja "?" en cada gajo (radio 0.62 del gajo)
const bubblePos = (index: number, total: number, radius: number, cx: number, cy: number) => {
  const anglePerSeg = (2 * Math.PI) / total;
  const midAngle = index * anglePerSeg + anglePerSeg / 2 - Math.PI / 2;
  return {
    x: cx + radius * 0.62 * Math.cos(midAngle),
    y: cy + radius * 0.62 * Math.sin(midAngle),
  };
};

// Helper: posición del punto perimetral (radio 0.94)
const dotPos = (index: number, total: number, radius: number, cx: number, cy: number) => {
  const anglePerSeg = (2 * Math.PI) / total;
  const angle = index * anglePerSeg - Math.PI / 2;
  return {
    x: cx + radius * 0.94 * Math.cos(angle),
    y: cy + radius * 0.94 * Math.sin(angle),
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

  const wheelSVG = (size: number = 400) => (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0 14px 18px rgba(0, 32, 70, 0.16))',
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

      {/* Grupo rotatorio con los gajos y las burbujas */}
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '200px 200px' }}>
        {segments.map((_seg, i) => (
          <path
            key={`gajo-${i}`}
            d={gajoPath(i, numSegments, radius, cx, cy)}
            fill={`url(#stitchGrad${i % STITCH_COLORS.length})`}
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ))}

        {/* Puntos blancos decorativos */}
        {segments.map((_seg, i) => {
          const p = dotPos(i, numSegments, radius, cx, cy);
          return (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill="#ffffff"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
          );
        })}

        {/* Burbujas con "?" flotando */}
        {segments.map((_seg, i) => {
          const p = bubblePos(i, numSegments, radius, cx, cy);
          const delay = (i % 5) * -0.7;
          return (
            <g key={`bubble-${i}`}
               style={{
                 animation: `${smoothFloat} 3.5s ease-in-out infinite`,
                 animationDelay: `${delay}s`,
                 transformBox: 'fill-box',
                 transformOrigin: 'center',
               }}>
              <circle
                cx={p.x}
                cy={p.y}
                r={22}
                fill="rgba(255,255,255,0.42)"
                stroke="#ffffff"
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

      {/* Aro exterior blanco (fijo, no rota) */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#ffffff" strokeWidth={6} />

      {/* Medallón "K" en el centro (fijo) */}
      <circle cx={cx} cy={cy} r={30} fill="#ffffff"
        style={{ filter: 'drop-shadow(0 8px 20px rgba(15,30,56,0.18))' }} />
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#004B93"
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
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
            {/* Puntero grande arriba */}
            <Box sx={{
              position: 'absolute', top: -20, left: '50%',
              transform: 'translateX(-50%)', zIndex: 12,
              width: 0, height: 0,
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderTop: '38px solid #2563EB',
              filter: 'drop-shadow(0 4px 8px rgba(37,99,235,0.5))',
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
        <Box sx={{ mb: 3 }}>
          <Typography sx={{
            fontSize: { xs: '1.6rem', sm: '2rem' },
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: "'Sora', 'Poppins', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}>
            ¡Gira y llévate{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #0056d6 0%, #2563EB 50%, #00B4D8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>tu premio!</Box>
          </Typography>
          <Typography sx={{ mt: 1, fontSize: '0.85rem', color: '#64748B', maxWidth: 380, mx: 'auto' }}>
            Cada compra es una oportunidad. Gira la ruleta y descubre qué te ganaste hoy en tu boutique.
          </Typography>
        </Box>

        {/* Contenedor de la ruleta con puntero */}
        <Box sx={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
          maxWidth: 440,
          aspectRatio: '1/1',
          margin: '0 auto',
        }}>
          {/* Puntero arriba */}
          <Box sx={{
            position: 'absolute', top: -8, left: '50%',
            transform: 'translateX(-50%)', zIndex: 10,
            width: 0, height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '28px solid #2563EB',
            filter: 'drop-shadow(0 3px 6px rgba(37,99,235,0.45))',
          }} />
          {wheelSVG(440)}
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
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            borderRadius: '16px',
            boxShadow: '0 10px 24px -4px rgba(37,99,235,0.45), 0 0 12px rgba(37,99,235,0.3)',
            width: '100%',
            maxWidth: 340,
            fontFamily: "'Sora', 'Poppins', sans-serif",
            '&:hover:not(:disabled)': {
              background: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
              boxShadow: '0 14px 28px -2px rgba(37,99,235,0.65), 0 0 20px rgba(56,189,248,0.5)',
              filter: 'brightness(1.05)',
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