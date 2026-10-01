import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useQuery } from '@tanstack/react-query';
import { getPrizesWithInventory } from '../api/directus/write';

const AZUL = '#004680';
const VERDE = '#10B981';
const AMBAR = '#F59E0B';
const ROJO = '#DC2626';

// Mapa de códigos a nombres legibles (edítalo según tus tiendas)
const NOMBRE_TIENDA: Record<string, string> = {
  '7': 'CHIPICHAPE',
  '17': 'CALI CARRERA8',
  '20': 'CALI CENTRO',
  '22': 'CALI SALOMIA',
  '23': 'CALIMA',
  '31': 'CENCO CALI',
  '32': 'COSMOCENTRO',
  '35': 'MALL PLAZA',
  '37': 'MANIZALES CENTRO',
  '6': 'PALMETTO',
  '9': 'UNICENTRO1 CALI',
  '15': 'UNICENTRO2 CALI',
  '18': 'UNICO CALI',
  '40': 'VICTORIA PLAZA',
};

const getNombre = (code: string) => NOMBRE_TIENDA[code] || `Tienda ${code}`;

const getColor = (p: number) => (p >= 80 ? ROJO : p >= 50 ? AMBAR : VERDE);
const getEstado = (p: number) => {
  if (p >= 100) return { label: 'AGOTADO', color: ROJO };
  if (p >= 80) return { label: 'CRÍTICO', color: ROJO };
  if (p >= 50) return { label: 'MEDIO', color: AMBAR };
  return { label: 'OK', color: VERDE };
};

const DashboardAnaliticas: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ruletaPrizesInventory'],
    queryFn: getPrizesWithInventory,
    refetchInterval: 60 * 1000, // cada minuto
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: AZUL }} />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
        <ErrorOutlineIcon sx={{ fontSize: 40, color: ROJO, mb: 1 }} />
        <Typography sx={{ fontWeight: 700, color: ROJO, mb: 1 }}>No se pudo cargar la información</Typography>
        <Chip label="Reintentar" onClick={() => refetch()} sx={{ cursor: 'pointer', bgcolor: AZUL, color: '#fff', fontWeight: 700 }} />
      </Paper>
    );
  }

  const { prizes, inventory } = data;

  // 🔨 Agrupar por tienda
  const tiendasMap = new Map<string, { cupo: number; entregados: number }>();
  for (const inv of inventory) {
    const code = String(inv.store_code);
    if (!tiendasMap.has(code)) tiendasMap.set(code, { cupo: 0, entregados: 0 });
    const t = tiendasMap.get(code)!;
    t.cupo += inv.total_assigned;
  }

  // 🔨 Contar entregados por tienda desde las jugadas
  // (usamos readItems de plays — se cachea con la misma key que ya está en uso)
  // Como no tenemos plays aquí todavía, hacemos una segunda query rápida:
  const { data: playsData } = useQuery({
    queryKey: ['ruletaPlaysCount'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_DIRECTUS_URL || ''}/items/sal_roulette_plays?fields=store_code&limit=-1`
      );
      return res.json();
    },
    refetchInterval: 60 * 1000,
  });

  if (playsData?.data) {
    for (const play of playsData.data) {
      const code = String(play.store_code);
      if (tiendasMap.has(code)) tiendasMap.get(code)!.entregados++;
    }
  }

  // 🔨 Construir lista final
  const tiendas = Array.from(tiendasMap.entries())
    .map(([code, t]) => ({
      code,
      nombre: getNombre(code),
      cupo: t.cupo,
      entregados: t.entregados,
      restante: t.cupo - t.entregados,
      porcentaje: t.cupo > 0 ? (t.entregados / t.cupo) * 100 : 0,
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje); // más críticos primero

  const totalCupo = tiendas.reduce((s, t) => s + t.cupo, 0);
  const totalEntregado = tiendas.reduce((s, t) => s + t.entregados, 0);
  const criticas = tiendas.filter((t) => t.porcentaje >= 80);

  const formatear = (n: number) => new Intl.NumberFormat('es-CO').format(n);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ENCABEZADO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1E293B" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Panel de Control
          </Typography>
          <Typography variant="body2" color="#94A3B8">
            Estado de premios por tienda · Se actualiza cada minuto
          </Typography>
        </Box>
        <Tooltip title="Refrescar">
          <IconButton onClick={() => refetch()} sx={{ bgcolor: '#F1F5F9' }}>
            <RefreshIcon sx={{
              fontSize: 20,
              color: AZUL,
              animation: isFetching ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
            }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* RESUMEN TOTAL */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {[
          { label: 'Cupo total', valor: formatear(totalCupo), color: AZUL },
          { label: 'Entregados', valor: formatear(totalEntregado), color: VERDE },
          { label: 'Disponibles', valor: formatear(totalCupo - totalEntregado), color: AMBAR },
          { label: 'Tiendas en alerta', valor: String(criticas.length), color: criticas.length ? ROJO : VERDE },
        ].map((k) => (
          <Paper
            key={k.label}
            elevation={0}
            sx={{
              flex: '1 1 160px',
              p: 2,
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              bgcolor: '#fff',
              borderLeft: `4px solid ${k.color}`,
            }}
          >
            <Typography sx={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {k.label}
            </Typography>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', fontFamily: "'Poppins', sans-serif", mt: 0.5 }}>
              {k.valor}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ALERTA DE CRÍTICOS */}
      {criticas.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: '#FEF2F2',
            border: `1.5px solid ${ROJO}40`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <WarningAmberIcon sx={{ color: ROJO, fontSize: 22 }} />
          <Typography sx={{ fontWeight: 800, color: ROJO, fontSize: '0.85rem' }}>
            Tiendas con stock crítico:
          </Typography>
          {criticas.map((t) => (
            <Chip
              key={t.code}
              label={`${t.nombre} · ${t.porcentaje.toFixed(0)}%`}
              size="small"
              sx={{ bgcolor: '#fff', color: ROJO, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${ROJO}40` }}
            />
          ))}
        </Paper>
      )}

      {/* LISTA POR TIENDA */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {tiendas.map((t) => {
          const estado = getEstado(t.porcentaje);
          const color = getColor(t.porcentaje);
          return (
            <Paper
              key={t.code}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {/* Nombre + código */}
              <Box sx={{ minWidth: 180, flex: '0 0 180px' }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>
                  {t.nombre}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: '#94A3B8' }}>
                  Código: {t.code}
                </Typography>
              </Box>

              {/* Estado */}
              <Chip
                label={estado.label}
                size="small"
                sx={{
                  bgcolor: `${estado.color}15`,
                  color: estado.color,
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 22,
                  border: `1px solid ${estado.color}40`,
                  minWidth: 80,
                }}
              />

              {/* Números */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>CUPO</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>{t.cupo}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>ENTREG.</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: AZUL }}>{t.entregados}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>QUEDAN</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color }}>
                    {t.restante}
                  </Typography>
                </Box>
              </Box>

              {/* Barra */}
              <Box sx={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(t.porcentaje, 100)}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#E2E8F0',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                  }}
                />
                <Typography sx={{ fontSize: 12, fontWeight: 800, color, minWidth: 38, textAlign: 'right' }}>
                  {t.porcentaje.toFixed(0)}%
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default DashboardAnaliticas;