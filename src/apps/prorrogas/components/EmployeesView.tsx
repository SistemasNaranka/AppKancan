import React, { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Chip, Grid,
  TextField, InputAdornment, Button, IconButton, Stack,
  Tooltip, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { useContracts, EnrichedContrato } from '../hooks/useContracts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CARD_RADIUS = 14;

const STATUS_CFG = {
  vigente:  { label: 'Activo',      color: '#16a34a', bg: '#dcfce7', borderColor: '#86efac', dotColor: '#22c55e' },
  proximo:  { label: 'Por vencer',  color: ' #d97706', bg: '#fef3c7', borderColor: '#fcd34d', dotColor: '#f59e0b' },
  vencido:  { label: 'Crítico',     color: '#dc2626', bg: '#fee2e2', borderColor: '#fca5a5', dotColor: '#ef4444' },
} as const;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColors(status: keyof typeof STATUS_CFG) {
  const map = {
    vigente: { bg: '#dbeafe', color: '#1d4ed8' },
    proximo: { bg: '#fef3c7', color: '#92400e' },
    vencido: { bg: '#fee2e2', color: '#991b1b' },
  };
  return map[status];
}

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard: React.FC<{ contrato: EnrichedContrato }> = ({ contrato: c }) => {
  const st = c.contractStatus as keyof typeof STATUS_CFG;
  const cfg = STATUS_CFG[st];
  const av = avatarColors(st);
  const isUrgent = c.daysLeft >= 0 && c.daysLeft <= 30;

  return (
    <Card
      sx={{
        borderRadius: CARD_RADIUS,
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        border: '1.5px solid',
        borderColor: isUrgent ? cfg.borderColor : 'transparent',
        height: '100%',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Status stripe */}
      <Box sx={{ height: 4, bgcolor: cfg.dotColor }} />

      <CardContent sx={{ p: 2.5 }}>
        {/* Top row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Avatar
            sx={{
              width: 46, height: 46,
              bgcolor: av.bg, color: av.color,
              fontSize: '0.9rem', fontWeight: 800,
              border: '2px solid',
              borderColor: cfg.borderColor,
            }}
          >
            {initials(c.nombre)}
          </Avatar>
          <Chip
            label={cfg.label}
            size="small"
            sx={{
              bgcolor: cfg.bg, color: cfg.color,
              fontWeight: 700, fontSize: '0.7rem',
              height: 22, borderRadius: 1.5,
            }}
          />
        </Box>

        {/* Name & role */}
        <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.9rem', lineHeight: 1.3, mb: 0.2 }}>
          {c.nombre}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {c.cargo}
        </Typography>

        {/* Info rows */}
        <Stack spacing={0.6} sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">Contrato activo</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#2563eb' }}>
              ID-{c.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">Prórroga vigente</Typography>
            <Chip
              label={`#${c.lastProrroga?.numero ?? 0}`}
              size="small"
              sx={{
                height: 18, bgcolor: '#eff6ff', color: '#2563eb',
                fontWeight: 700, fontSize: '0.68rem', borderRadius: 1,
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">Vence</Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: st === 'vencido' ? '#dc2626' : st === 'proximo' ? '#d97706' : '#16a34a' }}
            >
              {c.lastProrroga && c.lastProrroga.fecha_final
                ? new Date(c.lastProrroga.fecha_final).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">Area</Typography>
            <Typography variant="caption" fontWeight={600} sx={{ maxWidth: 110, textAlign: 'right' }}>
              {c.empleado_area}
            </Typography>
          </Box>
        </Stack>

        {/* Alert footer */}
        {isUrgent && (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.7,
              bgcolor: cfg.bg, borderRadius: 2, p: '6px 10px',
              border: '1px solid', borderColor: cfg.borderColor,
            }}
          >
            {st === 'vencido'
              ? <ErrorOutlineIcon sx={{ fontSize: 14, color: cfg.color }} />
              : <WarningAmberIcon sx={{ fontSize: 14, color: cfg.color }} />
            }
            <Typography sx={{ fontSize: '0.73rem', fontWeight: 700, color: cfg.color }}>
              {c.daysLeft <= 0
                ? `Venció hace ${Math.abs(c.daysLeft)} días`
                : `Vence en ${c.daysLeft} días`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Stat Mini Card ───────────────────────────────────────────────────────────
const MiniStat: React.FC<{
  Icon: React.ElementType; iconColor: string; iconBg: string;
  value: number; label: string;
}> = ({ Icon, iconColor, iconBg, value, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon sx={{ fontSize: 16, color: iconColor }} />
    </Box>
    <Box>
      <Typography fontWeight={800} sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{label}</Typography>
    </Box>
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeesView: React.FC = () => {
  const { allEnriched } = useContracts();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'vigente' | 'proximo' | 'vencido'>('todos');
  const [sort, setSort] = useState('nombre');

  const stats = useMemo(() => ({
    total:   allEnriched.length,
    activos: allEnriched.filter((c) => c.contractStatus === 'vigente').length,
    riesgo:  allEnriched.filter((c) => c.contractStatus === 'proximo').length,
    critico: allEnriched.filter((c) => c.contractStatus === 'vencido').length,
  }), [allEnriched]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allEnriched
      .filter((c) => {
        if (statusFilter !== 'todos' && c.contractStatus !== statusFilter) return false;
        if (!q) return true;
        return (
          c.nombre.toLowerCase().includes(q) ||
          c.cargo.toLowerCase().includes(q) ||
          c.empleado_area.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sort === 'nombre') return a.nombre.localeCompare(b.nombre);
        if (sort === 'vencimiento') return a.daysLeft - b.daysLeft;
        return 0;
      });
  }, [allEnriched, search, statusFilter, sort]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Stats bar */}
      <Card sx={{ borderRadius: CARD_RADIUS, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', mb: 3 }}>
        <CardContent sx={{ py: 2, px: 3 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <MiniStat Icon={GroupOutlinedIcon}        iconColor="#2563eb" iconBg="#eff6ff" value={stats.total}   label="Total empleados" />
              <MiniStat Icon={CheckCircleOutlineIcon}   iconColor="#16a34a" iconBg="#dcfce7" value={stats.activos} label="Con contrato activo" />
              <MiniStat Icon={WarningAmberIcon}         iconColor="#d97706" iconBg="#fef3c7" value={stats.riesgo}  label="Prórroga por vencer" />
              <MiniStat Icon={ErrorOutlineIcon}         iconColor="#dc2626" iconBg="#fee2e2" value={stats.critico} label="Críticos" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Buscar empleado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: '0.82rem' },
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                }}
              />
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { borderRadius: 2, border: '1.5px solid', borderColor: 'divider', py: 0.5, px: 1 } }}
              >
                <ToggleButton value="grid"><ViewModuleIcon sx={{ fontSize: 16 }} /></ToggleButton>
                <ToggleButton value="list"><ViewListIcon sx={{ fontSize: 16 }} /></ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                sx={{
                  borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                  bgcolor: '#2563eb', boxShadow: 'none', px: 2,
                  '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' },
                }}
              >
                Nuevo Empleado
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filters row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['todos', 'vigente', 'proximo', 'vencido'] as const).map((s) => {
            const labels = { todos: 'Todos', vigente: 'Activos', proximo: 'Por vencer', vencido: 'Críticos' };
            return (
              <Chip
                key={s}
                label={labels[s]}
                size="small"
                onClick={() => setStatusFilter(s)}
                sx={{
                  height: 26, fontWeight: 600, fontSize: '0.75rem', borderRadius: 2, cursor: 'pointer',
                  ...(statusFilter === s
                    ? { bgcolor: '#2563eb', color: '#fff' }
                    : { bgcolor: 'transparent', color: 'text.secondary', border: '1.5px solid', borderColor: 'divider', '&:hover': { bgcolor: '#f1f5f9' } }),
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {filtered.length} empleados encontrados
          </Typography>
          <TextField
            select size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            label="Ordenar por"
            SelectProps={{ native: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontSize: '0.8rem' }, width: 160 }}
          >
            <option value="nombre">Nombre A-Z</option>
            <option value="vencimiento">Vencimiento</option>
          </TextField>
        </Box>
      </Box>

      {/* Grid */}
      <Grid container spacing={2}>
        {filtered.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron empleados con los filtros actuales.
              </Typography>
            </Box>
          </Grid>
        )}
        {filtered.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={c.id}>
            <EmployeeCard contrato={c} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EmployeesView;
