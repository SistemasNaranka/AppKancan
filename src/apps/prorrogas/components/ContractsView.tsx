import React, { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, InputAdornment, Button, Select, MenuItem, Stack,
  Tooltip, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import { useContracts, EnrichedContrato } from '../hooks/useContracts';
import { useContractContext } from '../contexts/ContractContext';
import { ContratoForm } from './ContratoForm';
import { CreateContrato, Contrato, Prorroga } from '../types/types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CARD_RADIUS = 14;

const STATUS_CFG = {
  vigente:  { label: 'Activo',      color: '#16a34a', bg: '#dcfce7' },
  proximo:  { label: 'Por vencer',  color: '#d97706', bg: '#fef3c7' },
  vencido:  { label: 'Crítico',     color: '#dc2626', bg: '#fee2e2' },
} as const;

type FilterTab = 'todos' | 'vigente' | 'proximo' | 'vencido';
type SortKey = 'vencimiento' | 'nombre' | 'prorroga';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
const StatusChip: React.FC<{ status: keyof typeof STATUS_CFG }> = ({ status }) => {
  const cfg = STATUS_CFG[status];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: cfg.color }} />
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: cfg.color }}>
        {cfg.label}
      </Typography>
    </Box>
  );
};

// ─── Prorroga Chip ────────────────────────────────────────────────────────────
const ProrrogaChip: React.FC<{ numero: number }> = ({ numero }) => (
  <Chip
    label={numero === 0 ? 'Original' : `Prórroga #${numero}`}
    size="small"
    sx={{
      bgcolor: numero === 0 ? '#f1f5f9' : '#eff6ff',
      color: numero === 0 ? '#64748b' : '#2563eb',
      fontWeight: 700,
      fontSize: '0.72rem',
      height: 22,
      borderRadius: 1.5,
    }}
  />
);

// ─── Sort Header Cell ─────────────────────────────────────────────────────────
const SortCell: React.FC<{
  label: string;
  field: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onClick: (f: SortKey) => void;
}> = ({ label, field, current, dir, onClick }) => (
  <TableCell
    onClick={() => onClick(field)}
    sx={{
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled',
      letterSpacing: '0.06em', py: 1.5,
      '&:hover': { color: 'text.primary' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
      {label}
      {current === field
        ? dir === 'asc'
          ? <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
          : <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
        : <KeyboardArrowDownIcon sx={{ fontSize: 14, opacity: 0.3 }} />
      }
    </Box>
  </TableCell>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ContractsView: React.FC = () => {
  const { allEnriched, counts } = useContracts();
  const { addContrato, updateContrato, deleteContrato } = useContractContext();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('vencimiento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contrato | null>(null);

  const handleCreateContrato = async (data: CreateContrato) => {
    await addContrato(data);
  };

  const handleUpdateContrato = async (data: CreateContrato) => {
    if (editingContract) {
      await updateContrato(editingContract.id, data);
      setEditingContract(null);
    }
  };

  const handleDeleteContrato = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este contrato?')) {
      await deleteContrato(id);
    }
  };

  const handleSort = (field: SortKey) => {
    if (field === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allEnriched
      .filter((c) => {
        if (tab !== 'todos' && c.contractStatus !== tab) return false;
        if (!q) return true;
        return (
          c.nombre.toLowerCase().includes(q) ||
          c.cargo.toLowerCase().includes(q) ||
          c.empleado_area.toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'vencimiento') cmp = a.daysLeft - b.daysLeft;
        if (sortKey === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
        if (sortKey === 'prorroga') cmp = (b.prorrogas?.length ?? 0) - (a.prorrogas?.length ?? 0);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [allEnriched, search, tab, sortKey, sortDir]);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'todos',   label: 'Todos',       count: counts.total },
    { key: 'vigente', label: 'Activo',       count: allEnriched.filter((c) => c.contractStatus === 'vigente').length },
    { key: 'proximo', label: 'Por vencer',   count: allEnriched.filter((c) => c.contractStatus === 'proximo').length },
    { key: 'vencido', label: 'Crítico',      count: allEnriched.filter((c) => c.contractStatus === 'vencido').length },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Card sx={{ borderRadius: CARD_RADIUS, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem' }}>
                Lista de Contratos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {counts.total} contratos en total
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => setIsModalOpen(true)}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                bgcolor: '#2563eb', boxShadow: 'none', px: 2,
                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' },
              }}
            >
              Nuevo Contrato
            </Button>
          </Box>

          {/* Search + Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por empleado, número de contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: 1, minWidth: 220,
                '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: '0.83rem' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, fontWeight: 600 }}>
                ESTADO:
              </Typography>
              {filterTabs.map((t) => (
                <Chip
                  key={t.key}
                  label={`${t.label}`}
                  size="small"
                  onClick={() => setTab(t.key)}
                  sx={{
                    cursor: 'pointer', height: 26, fontWeight: 600, fontSize: '0.75rem',
                    borderRadius: 2,
                    ...(tab === t.key
                      ? { bgcolor: '#ff0000', color: '#fff' }
                      : {
                          bgcolor: 'transparent',
                          color: 'text.secondary',
                          border: '1.5px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: '#f1f5f9' },
                        }),
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              <Tooltip title="Exportar">
                <IconButton size="small" sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Sub-header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando <strong>{filtered.length}</strong> de <strong>{counts.total}</strong> contratos
              {sortKey === 'vencimiento' && ' | Ordenado por fecha de vencimiento'}
            </Typography>
          </Box>

          <Divider sx={{ mb: 0 }} />

          {/* Table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' } }}>
                  <SortCell label="EMPLEADO"    field="nombre"      current={sortKey} dir={sortDir} onClick={handleSort} />
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.06em', py: 1.5 }}>
                    ÁREA
                  </TableCell>
                  <SortCell label="Nº PRÓRROGA" field="prorroga"    current={sortKey} dir={sortDir} onClick={handleSort} />
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.06em', py: 1.5 }}>
                    FECHA INICIO
                  </TableCell>
                  <SortCell label="FECHA FIN"   field="vencimiento" current={sortKey} dir={sortDir} onClick={handleSort} />
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.06em', py: 1.5 }}>
                    ESTADO
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.06em', py: 1.5 }}>
                    ACCIONES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron contratos con los filtros actuales.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c) => {
                  const st = c.contractStatus as keyof typeof STATUS_CFG;
                  return (
                    <TableRow
                      key={c.id}
                      sx={{
                        borderLeft: st === 'vencido' ? '3px solid #ef4444' : '3px solid transparent',
                        '&:hover': { bgcolor: '#f8fafc' },
                        cursor: 'pointer',
                      }}
                    >
                      {/* Empleado */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 34, height: 34,
                              bgcolor: st === 'vencido' ? '#fee2e2' : st === 'proximo' ? '#fef3c7' : '#eff6ff',
                              color: st === 'vencido' ? '#dc2626' : st === 'proximo' ? '#d97706' : '#2563eb',
                            }}
                          >
                            <PersonIcon sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.83rem', lineHeight: 1.3 }}>
                              {c.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {c.empleado_area}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Área */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                          {c.empleado_area || '—'}
                        </Typography>
                      </TableCell>

                      {/* Nº Prórroga */}
                      <TableCell>
                        <ProrrogaChip numero={c.lastProrroga?.numero ?? 0} />
                      </TableCell>

                      {/* Fecha Inicio */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                          {c.lastProrroga && c.lastProrroga.fecha_ingreso
                            ? new Date(c.lastProrroga.fecha_ingreso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </Typography>
                      </TableCell>

                      {/* Fecha Fin */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            fontSize: '0.82rem',
                            color: st === 'vencido' ? '#dc2626' : st === 'proximo' ? '#d97706' : '#1e293b',
                          }}
                        >
                          {c.lastProrroga && c.lastProrroga.fecha_final
                            ? new Date(c.lastProrroga.fecha_final).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: st === 'vencido' ? '#dc2626' : st === 'proximo' ? '#d97706' : 'text.secondary', fontWeight: 600 }}
                        >
                          {c.daysLeft >= 0 ? `En ${c.daysLeft} días` : `Venció hace ${Math.abs(c.daysLeft)} días`}
                        </Typography>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <StatusChip status={st} />
                      </TableCell>

                      {/* Acciones */}
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Solicitar prórroga">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Más opciones">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal para crear nuevo contrato */}
      <ContratoForm
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateContrato}
      />
      {/* Modal para editar contrato */}
      <ContratoForm
        open={!!editingContract}
        onClose={() => setEditingContract(null)}
        onSubmit={handleUpdateContrato}
        initialData={editingContract ?? undefined}
      />
    </Box>
  );
};

export default ContractsView;
