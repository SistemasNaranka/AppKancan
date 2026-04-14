import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { Grid } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { useContractContext } from '../contexts/ContractContext';
import { daysUntil, formatDate, getProrrogaProgress, formatTipoContrato, getProrrogaDuration, computeEndDate } from '../lib/utils';
import { Prorroga } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fix: Directus devuelve el ID numérico de util_cargo cuando los fields no
 * están expandidos. Mostrar 'Sin información' en ese caso.
 * SOLUCIÓN DEFINITIVA: en api.ts, agregar 'cargo.nombre' a los fields de
 * getContratos() y mapear { ...c, cargo: c.cargo?.nombre ?? c.cargo }
 */
const getCargoName = (cargo: unknown): string => {
  if (!cargo) return 'Sin cargo';
  if (typeof cargo === 'object' && cargo !== null && 'nombre' in cargo) {
    return (cargo as { nombre: string }).nombre;
  }
  if (typeof cargo === 'string' && isNaN(Number(cargo)) && cargo.trim() !== '') {
    return cargo;
  }
  return 'Sin información';
};

const initials = (name: string | undefined | null) => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const avatarBg = (id: number | string) => {
  const colors = ['#004680', '#0070c0', '#1a7a4a', '#7b3f00', '#37474f'];
  const idx = String(id).charCodeAt(String(id).length - 1) % colors.length;
  return colors[idx];
};

const prorrogaLabel = (num: number): string => {
  if (num === 0) return 'CONTRATO ORIGINAL';
  const ordinals = ['', 'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA'];
  return num < ordinals.length ? `${ordinals[num]} PRÓRROGA` : `PRÓRROGA ${num}`;
};

const prorrogaCircleColor = (num: number, isActive: boolean, isCompleted: boolean) => {
  if (isActive) return { bg: '#004680', text: '#fff' };
  if (isCompleted) return { bg: '#e8f5e9', text: '#1a7a4a' };
  return { bg: '#f1f5f9', text: '#94a3b8' };
};

/**
 * Obtiene la fecha final efectiva de una prórroga.
 * Si fecha_final existe en BD la usa; si no, la calcula a partir de
 * fecha_ingreso + duración - 1 día usando date-fns.
 */
const getEffectiveEndDate = (prorroga: Prorroga): string => {
  if (prorroga.fecha_final) {
    return prorroga.fecha_final instanceof Date
      ? prorroga.fecha_final.toISOString().split('T')[0]
      : String(prorroga.fecha_final).split('T')[0];
  }
  const duracion = prorroga.duracion ?? getProrrogaDuration(prorroga.numero ?? 0);
  return computeEndDate(prorroga.fecha_ingreso, duracion) ?? '';
};

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Entry
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineEntryProps {
  prorroga: Prorroga;
  isLast: boolean;
  isActive: boolean;
  displayIndex: number;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ prorroga, isLast, isActive, displayIndex }) => {
  const isCompleted = !isActive;
  const numero = prorroga.numero ?? displayIndex;
  const duracion = prorroga.duracion ?? getProrrogaDuration(numero);
  
  // DEBUG: Ver qué datos llegan
  console.log('🔍 TimelineEntry - Prorroga data:', {
    id: prorroga.id,
    numero: prorroga.numero,
    fecha_ingreso: prorroga.fecha_ingreso,
    fecha_final: prorroga.fecha_final,
    duracion: prorroga.duracion,
    tipo_fecha_ingreso: typeof prorroga.fecha_ingreso,
    tipo_fecha_final: typeof prorroga.fecha_final,
  });
  
  const effectiveEndDate = getEffectiveEndDate(prorroga);
  const daysLeft = isActive ? daysUntil(effectiveEndDate) : null;
  const isCritical = daysLeft !== null && isFinite(daysLeft) && daysLeft <= 7;
  const circle = prorrogaCircleColor(numero, isActive, isCompleted);
  const progress = isActive ? getProrrogaProgress(prorroga) : null;

  return (
    <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
      {/* Timeline track */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: circle.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isActive ? '2px solid #004680' : '2px solid transparent',
            zIndex: 1,
          }}
        >
          {numero === 0 ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: circle.text }} />
          ) : (
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: circle.text }}>
              P{numero}
            </Typography>
          )}
        </Box>
        {!isLast && (
          <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', minHeight: 24, my: 0.5 }} />
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          mb: isLast ? 0 : 2.5,
          p: 2,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isActive ? (isCritical ? '#fca5a5' : '#bfdbfe') : '#f1f5f9',
          bgcolor: isActive ? (isCritical ? '#fff5f5' : '#f8fbff') : '#fafafa',
        }}
      >
        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.8}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>
              {prorrogaLabel(numero)}
            </Typography>
            {isActive && (
              <Chip
                label={isCritical ? '⚠ Activa · Crítica' : '● Activa'}
                size="small"
                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: isCritical ? '#fee2e2' : '#dcfce7', color: isCritical ? '#dc2626' : '#16a34a' }}
              />
            )}
          </Stack>
          {isCompleted && (
            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, fontSize: '0.7rem' }}>
              Completado
            </Typography>
          )}
          {isActive && daysLeft !== null && isFinite(daysLeft) && (
            <Typography variant="caption" sx={{ color: isCritical ? '#dc2626' : '#d97706', fontWeight: 700, fontSize: '0.7rem' }}>
              {daysLeft <= 0 ? 'Vencido' : `Vence en ${daysLeft} días`}
            </Typography>
          )}
        </Stack>

        {/* Title */}
        <Typography variant="body2" fontWeight={700} color="text.primary" mb={0.8}>
          {numero === 0
            ? 'Contrato base firmado'
            : `Extensión aprobada — ${duracion} meses`}
        </Typography>
        {prorroga.descripcion && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
            {prorroga.descripcion}
          </Typography>
        )}

        {/* Dates */}
        <Stack direction="row" spacing={2}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              Inicio: <strong>{formatDate(prorroga.fecha_ingreso)}</strong>
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12, color: isActive && isCritical ? '#dc2626' : 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: isActive && isCritical ? '#dc2626' : 'text.secondary' }}>
              Fin: <strong>{formatDate(effectiveEndDate)}</strong>
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              Duración: <strong>{duracion} meses</strong>
            </Typography>
          </Stack>
        </Stack>

        {/* Progress bar for active */}
        {isActive && progress !== null && (
          <Box mt={1.5}>
            <Stack direction="row" justifyContent="space-between" mb={0.4}>
              <Typography variant="caption" color="text.secondary">Progreso del período</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: isCritical ? '#dc2626' : 'primary.main' }}>
                {progress}% completado
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: isCritical ? '#fee2e2' : '#e0eeff',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isCritical ? '#dc2626' : '#004680',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ContractDetail
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onOpenForm: () => void;
  /** Abre el formulario de edición con los datos del contrato actual */
  onEditContract: () => void;
}

const ContractDetail: React.FC<Props> = ({ onOpenForm, onEditContract }) => {
  const { selectedContrato } = useContractContext();

  if (!selectedContrato) return null;

  const c = selectedContrato;
  const prorrogas = [...(c.prorrogas ?? [])]
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx);
  const hasProrrogas = prorrogas.length > 0;
  const lastProrroga = hasProrrogas ? prorrogas[prorrogas.length - 1] : null;
  const firstProrroga = hasProrrogas ? prorrogas[0] : null;
  const lastEffectiveEnd = lastProrroga ? getEffectiveEndDate(lastProrroga) : null;
  const daysLeft = lastEffectiveEnd ? daysUntil(lastEffectiveEnd) : Infinity;
  const isCritical = isFinite(daysLeft) && daysLeft <= 7;
  const isVencido = isFinite(daysLeft) && daysLeft < 0;

  // ✅ duracion_meses con fallback por regla de negocio si el campo no viene de la BD
  const getDur = (p: typeof prorrogas[0]) =>
    p.duracion ?? getProrrogaDuration(p.numero ?? 0);

  const totalMeses = prorrogas.reduce((acc, p) => acc + getDur(p), 0);
  const maxMeses = Math.max(...prorrogas.map((p) => getDur(p)), 1);

  // Progress bar para tiempo restante del contrato
  const timeProgress = (() => {
    if (!lastProrroga || !isFinite(daysLeft)) return 100;
    const start = new Date(lastProrroga.fecha_ingreso).getTime();
    const end   = new Date(lastEffectiveEnd!).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 0;
    const elapsed = Date.now() - start;
    const total   = end - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  })();

  const cargoName = getCargoName(c.cargo);

  return (
    <Box>
      {/* Body — dos columnas desde el inicio */}
      <Grid container spacing={2.5} alignItems="flex-start">

        {/* ── Columna izquierda (md:8) ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>

            {/* Tarjeta empleado */}
            <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2}>
                  {/* Left: avatar + info */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ width: 56, height: 56, bgcolor: avatarBg(c.id), borderRadius: 2.5 }}>
                      <PersonIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={800} mb={0.3}>{c.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary" mb={0.5}>
                        {cargoName} · { c.empleado_area || ''}
                      </Typography>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        {c.empleado_area && (
                          <Typography variant="caption" color="text.disabled">
                            📁 {c.empleado_area}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Right: action buttons */}
                  <Stack direction="row" spacing={1.5} flexShrink={0}>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadOutlinedIcon />}
                      sx={{ borderColor: 'divider', color: '#fff', fontSize: '0.8rem', backgroundColor: '#004680', boxShadow: 'none', '&:hover': { bgcolor: '#005aa3', boxShadow: 'none' } }}
                    >
                      Expediente PDF
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddOutlinedIcon />}
                      onClick={onOpenForm}
                      sx={{ fontSize: '0.8rem', backgroundColor: '#004680', boxShadow: 'none', '&:hover': { bgcolor: '#005aa3', boxShadow: 'none' } }}
                    >
                      Extender Contrato
                    </Button>
                  </Stack>
                </Stack>

                {/* Contract metadata bar */}
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} divider={<Divider orientation="vertical" flexItem />}>
                  <Box>
                    <Typography variant="overline" display="block" color="text.disabled" sx={{ fontSize: '0.63rem', mb: 0.3 }}>Nº Contrato</Typography>
                    <Typography variant="body2" fontWeight={700}>{c.numero_contrato ?? `#${c.id}`}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" display="block" color="text.disabled" sx={{ fontSize: '0.63rem', mb: 0.3 }}>Tipo</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatTipoContrato(c.tipo_contrato)}</Typography>
                  </Box>
                   <Box>
                    <Typography variant="overline" display="block" color="text.disabled" sx={{ fontSize: '0.63rem', mb: 0.3 }}>Prórroga Actual</Typography>
                    {lastProrroga ? (
                      <Chip
                        label={lastProrroga.numero === 0 ? 'Contrato original' : `Prórroga #${lastProrroga.numero}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#e8f0fa', color: 'primary.main' }}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={700}>—</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="overline" display="block" color="text.disabled" sx={{ fontSize: '0.63rem', mb: 0.3 }}>Duración Total</Typography>
                    <Typography variant="body2" fontWeight={700}>{totalMeses > 0 ? `${totalMeses} meses` : '—'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* ── Timeline ── */}
            <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box>
                  <Typography variant="h6" fontWeight={800} mb={0.3}>Historial de Prórrogas</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Línea de tiempo del contrato desde su inicio
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddOutlinedIcon />}
                  onClick={onOpenForm}
                  sx={{ fontSize: '0.78rem', backgroundColor: '#004680', boxShadow: 'none', '&:hover': { bgcolor: '#005aa3', boxShadow: 'none' } }}
                >
                  Agregar Prórroga
                </Button>
              </Stack>

              {prorrogas.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No hay prórrogas registradas.</Typography>
                </Box>
              ) : (
                prorrogas.map((p, idx) => (
                  <TimelineEntry
                    key={p.id}
                    prorroga={p}
                    displayIndex={idx}
                    isLast={idx === prorrogas.length - 1}
                    isActive={idx === prorrogas.length - 1 && !isVencido}
                  />
                ))
              )}
            </CardContent>
          </Card>

          </Stack>
        </Grid>

        {/* ── Right panel ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            {/* Resumen del Contrato */}
            <Box sx={{ background: '#004680', borderRadius: 3, p: 2.5, color: '#fff' }}>
              <Typography variant="overline" sx={{ color: '#7fb8e8', display: 'block', mb: 2, fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                Resumen del Contrato
              </Typography>

              <Stack spacing={1.3}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Fecha de inicio original</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
                    {firstProrroga ? formatDate(firstProrroga.fecha_ingreso) : formatDate(c.fecha_final)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Fecha de vencimiento actual</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isCritical ? '#fca5a5' : isVencido ? '#9ca3af' : '#fff' }}>
                    {lastEffectiveEnd ? formatDate(lastEffectiveEnd) : formatDate(c.fecha_final)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Duración total acumulada</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
                    {totalMeses > 0 ? `${totalMeses} meses` : '—'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Total de prórrogas</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
                    {prorrogas.length} {prorrogas.length === 1 ? 'prórroga' : 'prórrogas'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Prórroga actual</Typography>
                  {lastProrroga ? (
                    <Chip
                      label={lastProrroga.numero === 0 ? 'Contrato original' : `Prórroga #${lastProrroga.numero}`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ color: '#fff' }}>—</Typography>
                  )}
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Área</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
                    {c.empleado_area || '—'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Estado</Typography>
                  <Chip
                    label={isVencido ? 'Vencido' : isCritical ? '● Crítico' : '● Vigente'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      bgcolor: isVencido ? 'rgba(156,163,175,0.2)' : isCritical ? '#dc2626' : 'rgba(22,163,74,0.25)',
                      color: isVencido ? '#9ca3af' : '#fff',
                    }}
                  />
                </Stack>

                {/* Tiempo restante */}
                {isFinite(daysLeft) && (
                  <>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mt: 0.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#a0c8e8' }}>Tiempo restante</Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: isCritical ? '#fca5a5' : '#fff' }}>
                        {daysLeft <= 0 ? 'Vencido' : `${daysLeft} días`}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={timeProgress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isCritical ? '#dc2626' : '#7fb8e8',
                          borderRadius: 3,
                        },
                      }}
                    />
                  </>
                )}
              </Stack>
            </Box>

            {/* Acciones Rápidas */}
            <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Acciones Rápidas</Typography>
                <Stack spacing={0.5}>
                  {/* Solicitar Prórroga — destacado */}
                  <Box
                    onClick={onOpenForm}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: '#004680',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#005aa3' },
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ fontSize: 17, color: '#7fb8e8' }} />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={700} fontSize="0.8rem" sx={{ color: '#fff' }}>Solicitar Prórroga</Typography>
                      <Typography variant="caption" sx={{ color: '#7fb8e8' }}>Extender contrato actual</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 16, color: '#7fb8e8' }} />
                  </Box>

                  {[
                    { icon: <EditOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />, label: 'Editar Contrato', sub: 'Modificar datos del contrato', onClick: onEditContract },
                    { icon: <FileDownloadOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />, label: 'Descargar PDF', sub: 'Exportar contrato completo' },
                  ].map((action) => (
                    <Box
                      key={action.label}
                      onClick={action.onClick ? () => action.onClick?.() : undefined}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        cursor: action.onClick ? 'pointer' : 'default',
                        '&:hover': action.onClick ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      {action.icon}
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{action.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{action.sub}</Typography>
                      </Box>
                      <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </Box>
                  ))}

                  <Divider sx={{ my: 0.5 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#fff5f5' },
                    }}
                  >
                    <BlockOutlinedIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                    <Typography variant="body2" fontWeight={600} fontSize="0.8rem" sx={{ color: '#dc2626' }}>Cerrar Contrato</Typography>
                    <Box flex={1} />
                    <ChevronRightIcon sx={{ fontSize: 16, color: '#fca5a5' }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Duración por Periodo */}
            {prorrogas.length > 0 && (
              <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>Duración por Periodo</Typography>
                  <Stack spacing={1.5}>
                    {prorrogas.map((p, idx) => {
                      const isActivePeriod = idx === prorrogas.length - 1 && !isVencido;
                      const barColors = ['#94a3b8', '#60a5fa', '#34d399', '#a78bfa', '#f59e0b'];
                      const barColor = isActivePeriod ? '#004680' : barColors[idx % barColors.length];
                      const dur = getDur(p);
                      const pct = Math.round((dur / maxMeses) * 100);
                      const pNum = p.numero ?? idx;
                      return (
                        <Box key={p.id}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: isActivePeriod ? '#004680' : '#e8f0fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: isActivePeriod ? '#fff' : 'primary.main' }}>
                                {pNum}
                              </Typography>
                            </Box>
                            <Box flex={1} minWidth={0}>
                              <Stack direction="row" justifyContent="space-between" mb={0.4}>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {pNum === 0 ? 'Original' : `Prórroga #${pNum}`}{isActivePeriod ? ' (Activa)' : ''}
                                </Typography>
                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                  {dur} meses
                                </Typography>
                              </Stack>
                              <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: barColor, borderRadius: 3 }} />
                              </Box>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Total acumulado</Typography>
                    <Typography variant="subtitle2" fontWeight={800}>{totalMeses} meses</Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractDetail;