import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import { useContracts } from '../hooks/useContracts';
import { formatDate } from '../lib/utils';
import { getCargoLabel } from '../config/cargos';
const avatarColors = ['#004680', '#0284c7', '#4338ca', '#059669', '#d97706', '#dc2626'];
const avatarColor = (id: number) => avatarColors[id % avatarColors.length];

interface Props {
  onEditContract?: (emp: any) => void;
}

const EmployeeGrid: React.FC<Props> = ({ onEditContract }) => {
  const { allEnriched, select, filters } = useContracts();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'vigente' | 'proximo' | 'vencido'>('todos');
  const [cargoFilter, setCargoFilter] = useState<string>('todos');
  const itemsPerPage = 12;

  // Obtener cargos únicos y ordenados alfabéticamente
  const uniqueCargos = Array.from(
    new Set(allEnriched.map((c) => getCargoLabel(c.cargo)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredEmployees = allEnriched.filter(c => {
    const statusMatch = statusFilter === 'todos' || c.contractStatus === statusFilter;
    const cargoMatch = cargoFilter === 'todos' || getCargoLabel(c.cargo) === cargoFilter;

    // Búsqueda global del TopBar
    const q = filters.search.toLowerCase().trim();
    const searchMatch = !q || (
      c.nombre.toLowerCase().includes(q) ||
      (c.apellido?.toLowerCase() ?? '').includes(q) ||
      String(getCargoLabel(c.cargo)).toLowerCase().includes(q) ||
      (c.area?.toLowerCase() ?? '').includes(q) ||
      (c.documento?.toLowerCase() ?? '').includes(q) ||
      (c.empresa?.toLowerCase() ?? '').includes(q) ||
      (c.numero_contrato?.toLowerCase() ?? '').includes(q)
    );

    return statusMatch && cargoMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const rows = filteredEmployees.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Reset de paginación cuando cambia la búsqueda global
  useEffect(() => {
    setPage(1);
  }, [filters.search]);

  const handleCardClick = (id: number) => {
    select(id);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Directorio de Empleados
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={cargoFilter}
              onChange={(e) => {
                setCargoFilter(e.target.value);
                setPage(1);
              }}
              displayEmpty
              sx={{ bgcolor: 'background.paper', fontSize: '0.875rem' }}
            >
              <MenuItem value="todos">Todos los Cargos</MenuItem>
              {uniqueCargos.map((cargo) => (
                <MenuItem key={cargo} value={cargo}>{cargo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              sx={{ bgcolor: 'background.paper', fontSize: '0.875rem' }}
            >
              <MenuItem value="todos">Todos los Empleados</MenuItem>
              <MenuItem value="vigente">Vigentes</MenuItem>
              <MenuItem value="proximo">Por Vencer</MenuItem>
              <MenuItem value="vencido">Vencidos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No hay empleados que coincidan con este filtro.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {rows.map((emp) => {
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={emp.id}>
                <Card
                  onClick={() => handleCardClick(emp.id)}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={2} sx={{ position: 'relative' }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: avatarColor(emp.id) }}>
                      <PersonIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
                    </Avatar>
                    <Box sx={{ overflow: 'hidden', pr: 8 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap title={`${emp.nombre} ${emp.apellido || ''}`.trim()}>
                        {`${emp.nombre} ${emp.apellido || ''}`.trim()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {getCargoLabel(emp.cargo)}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {onEditContract && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditContract(emp);
                          }}
                          sx={{ bgcolor: 'rgba(0,0,0,0.04)', width: 24, height: 24, '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
                        >
                          <EditOutlinedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                      <Chip 
                        label={emp.contractStatus === 'vencido' ? 'Vencido' : emp.contractStatus === 'proximo' ? 'Por Vencer' : 'Vigente'} 
                        size="small" 
                        sx={{ 
                          bgcolor: emp.contractStatus === 'vencido' ? '#fef2f2' : emp.contractStatus === 'proximo' ? '#fff7ed' : '#f0fdf4',
                          color: emp.contractStatus === 'vencido' ? '#dc2626' : emp.contractStatus === 'proximo' ? '#d97706' : '#16a34a',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20
                        }}
                      />
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1.2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Contrato activo</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#004680' }}>
                        {emp.numero_contrato || `CTR-${emp.id}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Prórroga vigente</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#004680' }}>
                        {emp.prorrogas && emp.prorrogas.length > 0
                          ? `#${Math.max(...emp.prorrogas.map(p => p.numero ?? 0))}`
                          : '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Vence</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {emp.fecha_final ? formatDate(emp.fecha_final) : '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Inicio de contrato</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {emp.fecha_ingreso ? formatDate(emp.fecha_ingreso) : '—'}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Banner inferior de estado */}
                  <Box sx={{
                    mt: 2,
                    p: 1.2,
                    borderRadius: 1.5,
                    textAlign: 'center',
                    bgcolor: emp.contractStatus === 'vencido' ? '#fef2f2'
                           : emp.daysLeft <= 30 ? '#fffbeb'
                           : '#f0fdf4',
                  }}>
                    <Typography variant="caption" fontWeight={700} sx={{
                      color: emp.contractStatus === 'vencido' ? '#dc2626'
                           : emp.daysLeft <= 30 ? '#d97706'
                           : '#16a34a',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}>
                      {emp.contractStatus === 'vencido'
                        ? `Vencido hace ${Math.abs(emp.daysLeft)} días`
                        : `Vigente — ${emp.daysLeft} días restantes`}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
export default EmployeeGrid;
