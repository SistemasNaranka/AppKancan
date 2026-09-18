import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Chip,
  Autocomplete,
  InputAdornment,
  Badge,
  Popover,
  IconButton,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Casino as RuletaIcon, LocalOffer as PremiosIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getStores } from '../api/directus/read';
import { useAuth } from '../../../auth/hooks/useAuth';
import Ruleta from '../components/Ruleta';
import AdministrarPremios from '../components/AdministrarPremios';
import { ISegment, Tienda } from '../interfaces/ruleta.interface';
import { aplicarColorPorGrupo, migrarSegment, intercalarSegments, GRUPO_POR_PREMIO } from '../utils/rangos';

const STORAGE_KEY = 'ruleta_premios';

// ============================================================
// 🎯 TIENDAS AUTORIZADAS
// ============================================================
const TIENDAS_AUTORIZADAS = [
  'CALI CARRERA8',
  'CALI CENTRO',
  'CALI SALOMIA',
  'CALIMA',
  'CENCO CALI',
  'CHIPICHAPE',
  'COSMOCENTRO',
  'MALL PLAZA',
  'MANIZALES CENTRO',
  'PALMETTO',
  'UNICENTRO1 CALI',
  'UNICENTRO2 CALI',
  'UNICO CALI',
  'VICTORIA PLAZA',
];

const esTiendaAutorizada = (nombre: string): boolean => {
  const n = (nombre || '').trim().toUpperCase();
  return TIENDAS_AUTORIZADAS.includes(n);
};

const getPremiosFromStorage = (): ISegment[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((raw) => migrarSegment(raw));
      }
    } catch {}
  }

  return Object.entries(GRUPO_POR_PREMIO).map(([label, grupo]) =>
    aplicarColorPorGrupo(label, grupo)
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 1.5 }}>{children}</Box>}
    </div>
  );
}

type EstadoStock = 'OK' | 'ULTIMA_UNIDAD' | 'RANGO_AGOTADO' | 'TIENDA_VACIA';

interface FacturaValida {
  cliente: string;
  puedeGirar: boolean;
  estadoStock: EstadoStock;
  mensajeStock: string;
}

interface RangoStock {
  tier: string;
  nombre: string;
  restante: number;
  estado: 'OK' | 'ULTIMO' | 'AGOTADO';
}

const RuletaHome: React.FC = () => {
  const auth = useAuth() as any;
  const ultra_code = auth?.ultra_code ?? auth?.user?.ultra_code ?? auth?.me?.ultra_code;
  const [numFactura, setNumFactura] = useState('');
  const [cargando, setCargando] = useState(false);
  const [factura, setFactura] = useState<FacturaValida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [premios, setPremios] = useState<ISegment[]>(() => getPremiosFromStorage());
  const [storeFilter, setStoreFilter] = useState<number | null>(null);
  const [stockRangos, setStockRangos] = useState<RangoStock[]>([]);
  const [hayCriticos, setHayCriticos] = useState(false);
  const [campanaAnchor, setCampanaAnchor] = useState<null | HTMLElement>(null);
  // 🔔 Modal de advertencia grande para "última unidad"
  const [modalUltimaUnidadOpen, setModalUltimaUnidadOpen] = useState(false);

  // ============================================================
  // 🏪 TIENDAS DESDE DIRECTUS
  // ============================================================
  const { data: tiendasCompletas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
  });

  const cargarStock = async () => {
    if (!ultra_code) return;
    try {
      const res = await fetch(`/api/ruleta/estado-stock/${encodeURIComponent(String(ultra_code))}`);
      if (!res.ok) return;
      const data = await res.json();
      setStockRangos(data.rangos ?? []);
      setHayCriticos(data.hayCriticos ?? false);
    } catch {
      // silencioso: la campanita no debe romper la pantalla
    }
  };

  useEffect(() => {
    cargarStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultra_code]);

  const tiendasFiltradas = useMemo(() => {
    return tiendasCompletas.filter((tienda) => esTiendaAutorizada(tienda.name));
  }, [tiendasCompletas]);

  const selectedStore = useMemo(() => {
    if (storeFilter === null) return { id: null, name: 'Todas las tiendas' };
    const found = tiendasFiltradas.find((t) => t.id === storeFilter);
    return found ? found : { id: null, name: 'Todas las tiendas' };
  }, [storeFilter, tiendasFiltradas]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPremios(getPremiosFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const validar = async () => {
    if (!numFactura.trim()) return;
    setCargando(true);
    setError(null);
    setFactura(null);
    try {
      const res = await fetch('/api/ruleta/validar-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentos: numFactura.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo validar la factura');
      }
      const data = await res.json();
      const facturaData: FacturaValida = {
        cliente: data.cliente || 'Cliente no identificado',
        puedeGirar: data.puedeGirar ?? true,
        estadoStock: data.estadoStock ?? 'OK',
        mensajeStock: data.message ?? '',
      };
      setFactura(facturaData);

      // 🔔 Si es última unidad, abrimos el modal grande automáticamente
      if (facturaData.puedeGirar && facturaData.estadoStock === 'ULTIMA_UNIDAD') {
        setModalUltimaUnidadOpen(true);
      }
    } catch (e: any) {
      setError(e.message || 'Error al validar');
    } finally {
      setCargando(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePremiosChange = (nuevosPremios: ISegment[]) => {
    setPremios(nuevosPremios);
  };

  const titulo = tabValue === 0 ? 'Ruleta de Premios' : 'Administrar Premios';
  const subtitulo = tabValue === 0 ? 'Punto de venta' : 'Cambio de premios';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'transparent',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
        {/* ============================================================ */}
        {/* HEADER MEJORADO                                              */}
        {/* ============================================================ */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            bgcolor: '#ffffff',
            mb: 2.5,
            boxShadow: '0 4px 20px -8px rgba(0, 70, 128, 0.12)',
          }}
        >
          {/* HEADER SUPERIOR */}
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            {/* TÍTULO + ÍCONO */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px -4px rgba(0, 70, 128, 0.4)',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '15px',
                    border: '2px solid rgba(0, 70, 128, 0.1)',
                  },
                }}
              >
                <CardGiftcardIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box sx={{ lineHeight: 1.2 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1.05rem', sm: '1.25rem' },
                    fontWeight: 800,
                    color: '#0F2C4A',
                    fontFamily: "'Poppins', sans-serif",
                    letterSpacing: '-0.01em',
                  }}
                >
                  {titulo}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: '#64748B',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    mt: 0.25,
                  }}
                >
                  {subtitulo}
                </Typography>
              </Box>
            </Box>

            {/* SELECTOR + CHIP */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              {tiendasFiltradas.length > 0 && (
                <Autocomplete
                  size="small"
                  options={[{ id: null, name: 'Todas las tiendas' }, ...tiendasFiltradas]}
                  getOptionLabel={(o) => o.name}
                  value={selectedStore}
                  onChange={(_, v) => setStoreFilter(v ? v.id : null)}
                  sx={{ width: { xs: '100%', sm: 240 } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Seleccionar tienda"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <StorefrontIcon sx={{ fontSize: 17, color: '#004680' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          bgcolor: '#fff',
                          fontSize: '0.85rem',
                          '& fieldset': { borderColor: '#CBD5E1' },
                          '&:hover fieldset': { borderColor: '#004680' },
                          '&.Mui-focused fieldset': {
                            borderColor: '#004680',
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  )}
                />
              )}

              {tabValue === 0 && (
                <Chip
                  label={`${premios.length} premios`}
                  sx={{
                    background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    borderRadius: '10px',
                    height: 36,
                    px: 0.5,
                    boxShadow: '0 4px 12px -4px rgba(0, 70, 128, 0.4)',
                    '& .MuiChip-label': { px: 1.5 },
                  }}
                />
              )}

              {tabValue === 0 && (
                <IconButton
                  onClick={(e) => setCampanaAnchor(e.currentTarget)}
                  sx={{ bgcolor: hayCriticos ? '#FEF2F2' : '#F1F5F9', '&:hover': { bgcolor: hayCriticos ? '#FEE2E2' : '#E2E8F0' } }}
                >
                  <Badge color="error" variant="dot" invisible={!hayCriticos}>
                    {hayCriticos
                      ? <NotificationsActiveIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                      : <NotificationsIcon sx={{ fontSize: 20, color: '#64748B' }} />}
                  </Badge>
                </IconButton>
              )}

              <Popover
                open={Boolean(campanaAnchor)}
                anchorEl={campanaAnchor}
                onClose={() => setCampanaAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ p: 2, width: 260 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1E293B', mb: 1 }}>
                    Estado de premios
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  {stockRangos.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>Sin datos de stock.</Typography>
                  ) : (
                    stockRangos.map((r) => (
                      <Box key={r.tier} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
                        <Typography sx={{ fontSize: 13, color: '#334155' }}>{r.nombre}</Typography>
                        <Typography sx={{
                          fontSize: 12, fontWeight: 700,
                          color: r.estado === 'AGOTADO' ? '#DC2626' : r.estado === 'ULTIMO' ? '#B45309' : '#047857',
                        }}>
                          {r.estado === 'AGOTADO' ? 'Agotado' : r.estado === 'ULTIMO' ? 'Último premio' : `${r.restante} disponibles`}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Popover>
            </Box>
          </Box>

          {/* TABS TIPO PASTILLA */}
          <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-flexContainer': {
                  gap: 0.75,
                  bgcolor: '#F1F5F9',
                  borderRadius: '12px',
                  p: 0.5,
                  display: 'inline-flex',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 34, sm: 38 },
                  borderRadius: '9px',
                  px: { xs: 2, sm: 2.5 },
                  py: 0.5,
                  color: '#64748B',
                  transition: 'all 0.25s ease',
                  '& .MuiTab-iconWrapper': {
                    mr: 0.75,
                    fontSize: { xs: 16, sm: 18 },
                  },
                  '&:hover': {
                    color: '#004680',
                    bgcolor: 'rgba(255,255,255,0.6)',
                  },
                  '&.Mui-selected': {
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                    boxShadow: '0 4px 12px -3px rgba(0, 70, 128, 0.5)',
                  },
                  '&.Mui-selected:hover': {
                    background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                  },
                },
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              <Tab value={0} icon={<RuletaIcon />} iconPosition="start" label="RULETA" />
              <Tab value={1} icon={<PremiosIcon />} iconPosition="start" label="PREMIOS" />
            </Tabs>
          </Box>
        </Paper>

        {/* ============================================================ */}
        {/* TAB RULETA                                                   */}
        {/* ============================================================ */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* ===== PANEL VALIDAR ===== */}
            <Box
              sx={{
                flex: '0 0 440px',
                minWidth: 380,
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: '24px',
                p: { xs: 3, sm: 4.5 },
                boxShadow: '0 20px 40px -15px rgba(27, 49, 78, 0.08), 0 8px 20px -6px rgba(27, 49, 78, 0.04), inset 0 0 1px 1px rgba(255,255,255,0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{
                position: 'absolute',
                top: -64, right: -64,
                width: 144, height: 144,
                bgcolor: 'rgba(219, 234, 254, 0.5)',
                borderRadius: '50%',
                filter: 'blur(32px)',
                pointerEvents: 'none',
              }} />

              <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 20px -6px rgba(0, 70, 128, 0.5)',
                      flexShrink: 0,
                    }}
                  >
                    <ReceiptLongIcon sx={{ fontSize: 28, color: '#ffffff' }} />
                  </Box>
                  <Typography sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    fontWeight: 700,
                    color: '#0F172A',
                    fontFamily: "'Sora', 'Poppins', sans-serif",
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                  }}>
                    Validar factura
                  </Typography>
                </Box>

                <Typography sx={{
                  fontSize: '0.875rem',
                  color: '#64748B',
                  lineHeight: 1.6,
                }}>
                  El cliente debe haber facturado para participar. Ingresa el número de comprobante para habilitar el giro.
                </Typography>

                <Box>
                  <Typography sx={{
                    fontSize: '0.7rem',
                    color: '#64748B',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    mb: 1,
                  }}>
                    N° de factura
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.25 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={numFactura}
                      onChange={(e) => setNumFactura(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && validar()}
                      placeholder="KE030000004249"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: '#F8FAFC',
                          fontFamily: "'Space Grotesk', monospace",
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#93C5FD' },
                          '&.Mui-focused fieldset': { borderColor: '#004680', borderWidth: '2px' },
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={validar}
                      disabled={cargando}
                      sx={{
                        background: 'linear-gradient(135deg, #004680, #0a5aa0)',
                        boxShadow: '0 4px 14px -2px rgba(0, 70, 128, 0.45)',
                        minWidth: 110,
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '12px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #003366, #004680)',
                          boxShadow: '0 6px 20px -2px rgba(0, 70, 128, 0.55)',
                        },
                      }}
                    >
                      {cargando ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Validar'}
                    </Button>
                  </Box>
                </Box>

                {factura && (() => {
                  const esUltima = factura.puedeGirar && factura.estadoStock === 'ULTIMA_UNIDAD';
                  const verde = factura.puedeGirar;

                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* 🔔 BANNER GRANDE DE ÚLTIMA UNIDAD */}
                      {esUltima && (
                        <Box
                          sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                            border: '2px solid #F59E0B',
                            borderRadius: '16px',
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.75,
                            boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.55), 0 4px 12px -4px rgba(245, 158, 11, 0.3)',
                            animation: 'pulseWarn 2s ease-in-out infinite',
                            '@keyframes pulseWarn': {
                              '0%, 100%': { boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.55), 0 4px 12px -4px rgba(245, 158, 11, 0.3)' },
                              '50%': { boxShadow: '0 14px 40px -10px rgba(245, 158, 11, 0.75), 0 6px 16px -4px rgba(245, 158, 11, 0.5)' },
                            },
                          }}
                        >
                          {/* Ícono grande */}
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: '14px',
                              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 6px 16px -4px rgba(217, 119, 6, 0.6)',
                            }}
                          >
                            <WarningAmberIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                          </Box>

                          {/* Texto grande */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: { xs: '1rem', sm: '1.15rem' },
                                fontWeight: 900,
                                color: '#92400E',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.2,
                                mb: 0.75,
                                textTransform: 'uppercase',
                              }}
                            >
                              ¡Último premio disponible!
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                color: '#78350F',
                                fontWeight: 600,
                                lineHeight: 1.5,
                              }}
                            >
                              {factura.mensajeStock ||
                                'Solo queda un último premio en el rango de esta compra. Después de este giro se agota.'}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Panel de estado normal */}
                      <Box sx={{
                        background: verde
                          ? 'linear-gradient(135deg, #ECFDF5, #F0FDF4)'
                          : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                        border: verde ? '1px solid #A7F3D0' : '1px solid #FECACA',
                        borderRadius: '14px',
                        p: 2,
                      }}>
                        <Box sx={{
                          display: 'flex', alignItems: 'center', gap: 1,
                          color: verde ? '#047857' : '#B91C1C',
                          fontSize: 12, fontWeight: 700, mb: 1.5,
                        }}>
                          {verde
                            ? <CheckCircleIcon sx={{ fontSize: 16 }} />
                            : <ErrorOutlineIcon sx={{ fontSize: 16 }} />}
                          <span style={{ flex: 1 }}>
                            {verde
                              ? '¡Factura validada con éxito! La ruleta está desbloqueada y lista para girar.'
                              : factura.mensajeStock}
                          </span>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748B' }}>Cliente</span>
                          <span style={{ color: '#0F172A', fontWeight: 600 }}>{factura.cliente}</span>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}

                {error && (
                  <Box sx={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '14px',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#B91C1C',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    <ErrorOutlineIcon sx={{ fontSize: 16 }} /> {error}
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  mt: 3,
                  pt: 2,
                  borderTop: '1px dashed #E2E8F0',
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <LightbulbOutlinedIcon sx={{ fontSize: 18, color: '#004680', flexShrink: 0, mt: '2px' }} />
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: '#64748B',
                    fontWeight: 500,
                    lineHeight: 1.55,
                  }}
                >
                  El número está en tu factura de compra (ej:{' '}
                  <strong style={{ color: '#004680' }}>KE030000004249</strong>). Solo aplica una
                  factura por giro.
                </Typography>
              </Box>
            </Box>

            {/* ===== PANEL RULETA ===== */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 420,
                maxWidth: 760,
                minHeight: 500,
                background: '#fff',
                border: '0.5px solid #E2E8F0',
                borderRadius: '12px',
                p: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <Ruleta
                documentos={numFactura.trim()}
                segments={intercalarSegments(premios)}
                facturaValida={!!factura && factura.puedeGirar}
                storeId={storeFilter}
                onPremioGanado={() => cargarStock()}
              />
            </Box>
          </Box>
        </TabPanel>

        {/* ============================================================ */}
        {/* TAB PREMIOS                                                  */}
        {/* ============================================================ */}
        <TabPanel value={tabValue} index={1}>
          <AdministrarPremios onPremiosChange={handlePremiosChange} />
        </TabPanel>
      </Box>

      {/* ============================================================ */}
      {/* 🔔 MODAL GRANDE DE ÚLTIMA UNIDAD                              */}
      {/* Se abre automáticamente al validar cuando queda 1 premio      */}
      {/* ============================================================ */}
      <Dialog
        open={modalUltimaUnidadOpen}
        onClose={() => setModalUltimaUnidadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            border: '2px solid #F59E0B',
            boxShadow: '0 24px 60px -12px rgba(245, 158, 11, 0.5)',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            px: 3,
            pt: 3.5,
            pb: 2.5,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Ícono grande circular */}
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 12px 28px -6px rgba(217, 119, 6, 0.7)',
              border: '4px solid #fff',
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 48, color: '#ffffff' }} />
          </Box>

          <Typography
            sx={{
              fontSize: { xs: '1.35rem', sm: '1.6rem' },
              fontWeight: 900,
              color: '#92400E',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              textTransform: 'uppercase',
            }}
          >
            ¡Último premio disponible!
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3.5, py: 3, bgcolor: '#fff' }}>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: '#334155',
              fontWeight: 500,
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            {factura?.mensajeStock ||
              'Solo queda un último premio en el rango de esta compra. Después de este giro se agota.'}
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: '12px',
              bgcolor: '#FEF3C7',
              border: '1px dashed #F59E0B',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: '#78350F', fontWeight: 600 }}>
              Cliente
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: '#92400E', fontWeight: 800 }}>
              {factura?.cliente || 'Cliente no identificado'}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3, pt: 0, bgcolor: '#fff' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setModalUltimaUnidadOpen(false)}
            sx={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '12px',
              py: 1.25,
              fontSize: '0.95rem',
              boxShadow: '0 8px 20px -4px rgba(217, 119, 6, 0.6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                boxShadow: '0 10px 26px -4px rgba(217, 119, 6, 0.75)',
              },
            }}
          >
            Entendido, continuar al giro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuletaHome;