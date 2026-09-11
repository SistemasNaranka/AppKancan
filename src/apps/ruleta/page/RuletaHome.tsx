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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Casino as RuletaIcon, LocalOffer as PremiosIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getStores } from '../api/directus/read';
import Ruleta from '../components/Ruleta';
import AdministrarPremios from '../components/AdministrarPremios';
import { ISegment, Tienda } from '../interfaces/ruleta.interface';
import { aplicarColorPorGrupo, migrarSegment, intercalarSegments, filtrarSegmentsPorMonto, GRUPO_POR_PREMIO } from '../utils/rangos';

const STORAGE_KEY = 'ruleta_premios';

const getPremiosFromStorage = (): ISegment[] => {
  const contadorPorGrupo: Record<string, number> = {};
  const siguienteIndice = (grupo: string) => {
    const idx = contadorPorGrupo[grupo] || 0;
    contadorPorGrupo[grupo] = idx + 1;
    return idx;
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((raw) => migrarSegment(raw, siguienteIndice(raw?.grupo || 'G3')));
      }
    } catch {}
  }

  return Object.entries(GRUPO_POR_PREMIO).map(([label, grupo]) =>
    aplicarColorPorGrupo(label, grupo, siguienteIndice(grupo))
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

interface FacturaValida {
  cliente: string;
  total: number;
}

const RuletaHome: React.FC = () => {
  const [numFactura, setNumFactura] = useState('');
  const [cargando, setCargando] = useState(false);
  const [factura, setFactura] = useState<FacturaValida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [premios, setPremios] = useState<ISegment[]>(() => getPremiosFromStorage());
  const [storeFilter, setStoreFilter] = useState<number | null>(null);

  // ============================================================
  // 🏪 OBTENER TIENDAS DESDE DIRECTUS (core_stores)
  // ============================================================
  const { data: tiendasCompletas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
  });

  // ============================================================
  // 🏪 FILTRO: Cali (excepto Cenco) + Manizales + Victoria Plaza
  // ============================================================
  const tiendasFiltradas = useMemo(() => {
    return tiendasCompletas.filter((tienda) => {
      const nombre = tienda.name?.toLowerCase() || '';
      const esCali = nombre.includes('cali') && !nombre.includes('cenco');
      const esManizales = nombre.includes('manizales');
      const esVictoria = nombre.includes('victoria') || nombre.includes('vitoria');
      return esCali || esManizales || esVictoria;
    });
  }, [tiendasCompletas]);

  // ============================================================
  // VALOR SELECCIONADO EN EL AUTOCOMPLETE
  // ============================================================
  const selectedStore = useMemo(() => {
    if (storeFilter === null) return { id: null, name: 'Todas las tiendas' };
    const found = tiendasFiltradas.find((t) => t.id === storeFilter);
    return found ? found : { id: null, name: 'Todas las tiendas' };
  }, [storeFilter, tiendasFiltradas]);

  // ============================================================
  // EFECTOS Y HANDLERS
  // ============================================================
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
      setFactura({ cliente: data.cliente, total: data.total });
    } catch (e: any) {
      setError(e.message || 'Error al validar');
    } finally {
      setCargando(false);
    }
  };

  const formatoPesos = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            bgcolor: '#ffffff',
            mb: 2,
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '9px',
                  background: '#E3F2FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CardGiftcardIcon sx={{ fontSize: 19, color: '#1976D2' }} />
              </Box>
              <Box sx={{ lineHeight: 1.25 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    color: '#1E293B',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {titulo}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{subtitulo}</Typography>
              </Box>
            </Box>

            {/* ===== SELECTOR DE TIENDAS (GLOBAL) ===== */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {tiendasFiltradas.length > 0 && (
                <Autocomplete
                  size="small"
                  options={[{ id: null, name: 'Todas las tiendas' }, ...tiendasFiltradas]}
                  getOptionLabel={(o) => o.name}
                  value={selectedStore}
                  onChange={(_, v) => setStoreFilter(v ? v.id : null)}
                  sx={{ width: { xs: '100%', sm: 250 } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Seleccionar tienda"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <StorefrontIcon sx={{ fontSize: 18, color: '#004680' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
                    />
                  )}
                />
              )}

              {tabValue === 0 && (
                <Chip
                  label={`Total Premios: ${premios.length}`}
                  sx={{
                    bgcolor: '#E3F2FD',
                    color: '#004680',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #BBDEFB',
                    height: 32,
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.5, sm: 0.8 } }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-flexContainer': { gap: { xs: 0.3, sm: 0.8 } },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.85rem' },
                  minHeight: { xs: 32, sm: 40 },
                  borderRadius: '8px',
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.3, sm: 0.6 },
                  color: '#64748b',
                  '& .MuiTab-iconWrapper': { mr: 0.5, fontSize: { xs: 16, sm: 20 } },
                  '&:hover': { backgroundColor: '#EEF2F6', color: '#004680' },
                  '&.Mui-selected': { color: '#ffffff', backgroundColor: '#004680' },
                  '&.Mui-selected:hover': { backgroundColor: '#003366' },
                },
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              <Tab value={0} icon={<RuletaIcon />} iconPosition="start" label="RULETA" />
              <Tab value={1} icon={<PremiosIcon />} iconPosition="start" label="PREMIOS" />
            </Tabs>
          </Box>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'stretch' }}>
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
              {/* Glow ambiental sutil arriba-derecha */}
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
                {/* Badge Boutique Pass */}
                <Box>
                  
                  <Typography sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    fontWeight: 700,
                    color: '#0F172A',
                    fontFamily: "'Sora', 'Poppins', sans-serif",
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    mb: 1.5,
                  }}>
                    Validar factura
                  </Typography>
                  <Typography sx={{
                    fontSize: '0.875rem',
                    color: '#64748B',
                    lineHeight: 1.6,
                  }}>
                    El cliente debe haber facturado para participar. Ingresa el número de comprobante para habilitar el giro.
                  </Typography>
                </Box>

                {/* Input + botón */}
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
                          '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '2px' },
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={validar}
                      disabled={cargando}
                      sx={{
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.45)',
                        minWidth: 110,
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '12px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
                          boxShadow: '0 6px 20px -2px rgba(37, 99, 235, 0.55)',
                        },
                      }}
                    >
                      {cargando ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Validar'}
                    </Button>
                  </Box>
                </Box>

                {factura && (
                  <Box sx={{
                    background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
                    border: '1px solid #A7F3D0',
                    borderRadius: '14px',
                    p: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#047857', fontSize: 12, fontWeight: 700, mb: 1.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                      ¡Factura validada con éxito! La ruleta está desbloqueada y lista para girar.
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 0.5 }}>
                      <span style={{ color: '#64748B' }}>Cliente</span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{factura.cliente}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748B' }}>Monto facturado</span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{formatoPesos(factura.total)}</span>
                    </Box>
                  </Box>
                )}

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

              {/* Footer con separador */}
              <Box sx={{
                mt: 3,
                pt: 2,
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.7rem',
                color: '#94A3B8',
                position: 'relative',
                zIndex: 1,
              }}>
                
              </Box>
            </Box>

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
              {/* ✅ CORREGIDO: props con una sola llave y comas */}
              <Ruleta
                documentos={numFactura.trim()}
                segments={intercalarSegments(premios)}
                facturaValida={!!factura}
                storeId={storeFilter}
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdministrarPremios onPremiosChange={handlePremiosChange} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default RuletaHome;