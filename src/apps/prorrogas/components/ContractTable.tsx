import React, { useState, useEffect } from 'react';
import ReportsModal from './ReportsModal';
import Avatar from '@mui/material/Avatar';
import Pagination from '@mui/material/Pagination';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { useContracts } from '../hooks/useContracts';
import { formatDate } from '../lib/utils';
import { getCargoLabel } from '../config/cargos';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const initials = (name: string | undefined | null) => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const avatarColor = (id: number | string) => {
  const colors = ["#004680", "#0070c0", "#1a7a4a", "#7b3f00", "#37474f"];
  const idx = String(id).charCodeAt(String(id).length - 1) % colors.length;
  return colors[idx];
};

const safeFormatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return formatDate(dateStr);
};

const getDaysLabel = (daysLeft: number): { text: string; color: string } => {
  if (!isFinite(daysLeft) || isNaN(daysLeft)) return { text: '—', color: 'text.disabled' };
  if (daysLeft < 0) return { text: `Hace ${Math.abs(daysLeft)} días`, color: '#6b7280' };
  if (daysLeft === 0) return { text: 'Vence hoy', color: '#dc2626' };
  return { text: `En ${daysLeft} días`, color: daysLeft <= 7 ? '#dc2626' : daysLeft <= 30 ? '#d97706' : '#6b7280' };
};

// Status chip para la nueva tabla
const StatusBadge: React.FC<{ daysLeft: number; contractStatus: string }> = ({ daysLeft, contractStatus }) => {
  if (contractStatus === 'vencido' || daysLeft < 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#9ca3af' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', fontSize: '0.75rem' }}>Vencido</Typography>
      </Box>
    );
  }
  if (daysLeft <= 7) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#dc2626' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#dc2626', fontSize: '0.75rem' }}>Crítico</Typography>
      </Box>
    );
  }
  if (daysLeft <= 30) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#d97706' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#d97706', fontSize: '0.75rem' }}>Por vencer</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16a34a' }} />
      <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a', fontSize: '0.75rem' }}>Activo</Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  onNewProrroga: () => void;
  onNewContract: () => void;
}

const ResumenSidebar: React.FC<SidebarProps> = ({ onNewProrroga, onNewContract }) => {
  const { allEnriched, counts } = useContracts();

  const activos  = allEnriched.filter((c) => c.contractStatus === 'vigente').length;
  const porVencer = allEnriched.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 30).length;
  const criticos  = allEnriched.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7).length;
  const vencidos  = allEnriched.filter((c) => c.contractStatus === 'vencido').length;
  const total = counts.total || 1;

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const distItems = [
    { label: 'Activos',     value: activos,   pct: Math.round((activos / total) * 100),   color: '#16a34a' },
    { label: 'Por vencer',  value: porVencer, pct: Math.round((porVencer / total) * 100), color: '#d97706' },
    { label: 'Críticos',    value: criticos,  pct: Math.round((criticos / total) * 100),  color: '#dc2626' },
    { label: 'Vencidos',    value: vencidos,  pct: Math.round((vencidos / total) * 100),  color: '#9ca3af' },
  ];

  const quickActions = [
    { icon: <AssignmentOutlinedIcon sx={{ fontSize: 18, color: '#004680' }} />, label: 'Nuevo Contrato',     sub: 'Crear contrato nuevo',       bg: '#e8f0fa', onClick: onNewContract },
    { icon: <AccessTimeOutlinedIcon sx={{ fontSize: 18, color: '#d97706' }} />, label: 'Solicitar Prórroga', sub: 'Extender un contrato',       bg: '#fef3c7', onClick: onNewProrroga },
    { icon: <PersonAddOutlinedIcon  sx={{ fontSize: 18, color: '#16a34a' }} />, label: 'Agregar Empleado',   sub: 'Registrar nuevo empleado',   bg: '#dcfce7' },
    { icon: <BarChartOutlinedIcon   sx={{ fontSize: 18, color: '#7c3aed' }} />, label: 'Ver Reportes',       sub: 'Análisis y estadísticas',    bg: '#ede9fe', onClick: () => setIsReportsModalOpen(true) },
  ];

  return (
    <Stack spacing={2} sx={{ width: 270, flexShrink: 0 }}>
      {/* Accesos Rápidos */}
      <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={1.5}>
            Accesos Rápidos
          </Typography>
          <Stack spacing={0.5}>
            {quickActions.map((action) => (
              <Box
                key={action.label}
                onClick={action.onClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: action.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} fontSize="0.8rem" noWrap>{action.label}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{action.sub}</Typography>
                </Box>
                <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </Box>
            ))}
          </Stack>
        </Box>
        <Box sx={{ pb: 1.5 }} />
      </Card>

      {/* Distribución de Estados */}
      <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2}>
            Distribución de Estados
          </Typography>
          <Stack spacing={1.5}>
            {distItems.map((item) => (
              <Box key={item.label}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{item.label}</Typography>
                  <Typography variant="caption" fontWeight={700} color="text.primary">
                    {item.value} <Typography component="span" variant="caption" color="text.disabled">({item.pct}%)</Typography>
                  </Typography>
                </Stack>
                <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${item.pct}%`,
                      bgcolor: item.color,
                      borderRadius: 10,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">Total contratos</Typography>
            <Typography variant="subtitle2" fontWeight={800}>{counts.total}</Typography>
          </Stack>
        </Box>
      </Card>
      {/* ── Modal de Reportes ── */}
      <ReportsModal open={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} />
    </Stack>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ContractTable
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onOpenForm: (contractId: number) => void;
  onNewContractClick?: () => void;
  onRequestProrrogaClick?: () => void;
}

const ContractTable: React.FC<Props> = ({ onOpenForm, onNewContractClick, onRequestProrrogaClick }) => {
  const { filteredContratos, allEnriched, filters, setFilter, select, loading, error } = useContracts();
  const [page, setPage] = useState(1);

  const isResumen = filters.tab === 'resumen';
  const hasSearch = filters.search.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const itemsPerPage = 6;

  // En Resumen: si hay búsqueda activa, usar filteredContratos para que el buscador funcione
  // Si no hay búsqueda, mostrar todos ordenados por recientes
  const sourceRows = isResumen
    ? (hasSearch ? filteredContratos : [...allEnriched])
    : filteredContratos;

  const totalPages = Math.ceil(sourceRows.length / itemsPerPage);
  const rows = sourceRows.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const tableTitle = isResumen
    ? (hasSearch ? `Resultados de búsqueda` : 'Contratos Recientes')
    : `Solicitudes — ${filters.tab.charAt(0).toUpperCase() + filters.tab.slice(1).replace('_', ' ')}`;

  const tableSubtitle = isResumen
    ? (hasSearch
        ? `${sourceRows.length} resultados para "${filters.search.trim()}" (Total: ${allEnriched.length})`
        : `Mostrando recientes`)
    : `${filteredContratos.length} registros (Pág. ${page} de ${totalPages || 1})`;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={40} sx={{ color: '#004680' }} />
          <Typography variant="body2" color="text.secondary">Cargando contratos...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>Error al cargar contratos</Typography>
          <Typography variant="caption">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      {/* ── Tabla principal ── */}
      <Card sx={{ flex: 1, borderRadius: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 0 }}>
        {/* Toolbar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.8,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              {tableTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tableSubtitle}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {isResumen && (
              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.78rem', color: 'primary.main', fontWeight: 600, whiteSpace: 'nowrap' }}
                onClick={() => setFilter({ tab: 'todos' as any })}
              >
                Ver todos →
              </Button>
            )}
          </Stack>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
                <TableCell>Contrato</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right" sx={{ pr: 2 }}></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary', fontSize: '0.85rem' }}>
                    No se encontraron contratos con los filtros actuales o en esta página.
                  </TableCell>
                </TableRow>
              )}

              {rows.map((c) => {
                const { text: daysText, color: daysColor } = getDaysLabel(c.daysLeft);
                const fechaVence = c.lastProrroga?.fecha_final ?? c.fecha_final;
                const venceDate = safeFormatDate(fechaVence?.toString() ?? null);
                const isUrgent = isFinite(c.daysLeft) && c.daysLeft >= 0 && c.daysLeft <= 30;

                return (
                  <TableRow
                    key={c.id}
                    onClick={() => select(c.id)}
                    sx={{
                      cursor: 'pointer',
                      borderLeft: isUrgent ? `3px solid ${c.daysLeft <= 7 ? '#dc2626' : '#d97706'}` : '3px solid transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      '& .MuiTableCell-root': { py: 1.4 },
                    }}
                  >
                    {/* Contrato */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                       <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(c.id), borderRadius: 1.5 }}>
                          <PersonIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.9)' }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary" fontSize="0.82rem">
                            {c.nombre ?? `#${c.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {getCargoLabel(c.cargo)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Empresa / Área */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        {c.area ?? '—'}
                      </Typography>
                    </TableCell>

                    {/* Vencimiento */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={isUrgent || c.daysLeft < 0 ? 700 : 500}
                        fontSize="0.82rem"
                        sx={{ color: (isUrgent || c.daysLeft < 0) ? daysColor : 'text.primary' }}
                      >
                      {venceDate}
                      </Typography>
                      <Typography variant="caption" sx={{ color: daysColor, fontWeight: isUrgent ? 700 : 400 }}>
                        {daysText}
                      </Typography>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <StatusBadge daysLeft={c.daysLeft} contractStatus={c.contractStatus} />
                    </TableCell>

                    {/* Acciones */}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ pr: 1.5 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={() => select(c.id)}
                          sx={{ fontSize: '0.71rem', px: 1, py: 0.4, color: 'text.secondary', minWidth: 0 }}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={() => onOpenForm(c.id)}
                          sx={{ fontSize: '0.71rem', px: 1.2, py: 0.4, minWidth: 0, backgroundColor: "#004680", boxShadow: "none",
                            '&:hover': {
                              boxShadow: "none",
                              backgroundColor: "#005aa3",
                             },
                           }}
                        >
                          Prórroga
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && !error && totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, value) => setPage(value)} 
              color="primary" 
            />
          </Box>
        )}
      </Card>

      {/* ── Sidebar (solo en resumen) ── */}
      {isResumen && <ResumenSidebar onNewProrroga={() => onRequestProrrogaClick?.()} onNewContract={() => onNewContractClick?.()} />}
    </Box>
  );
};

export default ContractTable;