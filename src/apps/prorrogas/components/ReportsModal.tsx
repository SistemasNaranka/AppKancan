import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useContracts } from '../hooks/useContracts';

interface ReportsModalProps {
  open: boolean;
  onClose: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ open, onClose }) => {
  const { allEnriched } = useContracts();

  // ── Cálculos Estadísticos ──
  const stats = useMemo(() => {
    let activos = 0;
    let criticos = 0;
    let vencidos = 0;
    let pendientes = 0;

    const areaCount: Record<string, number> = {};
    const empresaCount: Record<string, number> = {};
    const proximosAVencer: typeof allEnriched = [];

    allEnriched.forEach((c) => {
      // KPIs
      if (c.contractStatus === 'vigente' || c.contractStatus === 'proximo') activos++;
      if (c.daysLeft >= 0 && c.daysLeft <= 7) criticos++;
      if (c.contractStatus === 'vencido') vencidos++;
      if (c.request_status === 'pendiente' || c.request_status === 'en_revision') pendientes++;

      // Agrupación por Área
      const area = c.area || 'Sin Área Asignada';
      areaCount[area] = (areaCount[area] || 0) + 1;

      // Agrupación por Empresa
      const empresa = c.empresa || 'Sin Empresa';
      empresaCount[empresa] = (empresaCount[empresa] || 0) + 1;

      // Próximos a vencer (que no estén vencidos)
      if (c.daysLeft >= 0 && c.daysLeft <= 60 && c.contractStatus !== 'vencido') {
        proximosAVencer.push(c);
      }
    });

    // Ordenar Top 5 Áreas
    const topAreas = Object.entries(areaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Ordenar Top 5 Empresas
    const topEmpresas = Object.entries(empresaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Ordenar Próximos a vencer de menor a mayor tiempo restante
    proximosAVencer.sort((a, b) => a.daysLeft - b.daysLeft);
    const topProximos = proximosAVencer.slice(0, 5);

    return {
      activos,
      criticos,
      vencidos,
      pendientes,
      total: allEnriched.length,
      topAreas,
      topEmpresas,
      topProximos,
    };
  }, [allEnriched]);

  // ── Helper para tarjetas KPI ──
  const KPICard = ({ title, value, icon, color, bg }: any) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 14px rgba(0,0,0,0.03)', border: '1px solid #e8edf5', height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: bg, color: color, width: 50, height: 50, borderRadius: 2.5 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: '#f4f7fc' } }}>
      <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, bgcolor: '#fff', borderBottom: '1px solid #e8edf5' }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="primary.main">
            Reportes y Estadísticas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visión general de contratos y recursos humanos
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ bgcolor: '#f0f4f8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* KPIs Principales */}


        <Grid container spacing={3}>
          {/* Distribuciones (Área y Empresa) */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3, p: 3, border: '1px solid #e8edf5', boxShadow: 'none' }}>
                <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                  <BusinessCenterIcon color="primary" /> Distribución por Área
                </Typography>
                <Stack spacing={2.5}>
                  {stats.topAreas.map(([area, count], idx) => {
                    const percentage = Math.round((count / stats.total) * 100);
                    return (
                      <Box key={idx}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>{area}</Typography>
                          <Typography variant="body2" fontWeight={700} color="text.secondary">{count} emp ({percentage}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f4f8', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#004680' } }} />
                      </Box>
                    );
                  })}
                </Stack>
              </Card>

            </Stack>
          </Grid>

          {/* Alertas: Próximos a vencer */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3, p: 0, border: '1px solid #e8edf5', boxShadow: 'none', height: '100%' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #e8edf5', bgcolor: '#fefbf5' }}>
                <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1} color="#b45309">
                  <AccessTimeIcon /> Atención Prioritaria
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Contratos que requieren renovación pronto.
                </Typography>
              </Box>
              <Stack divider={<Divider />} sx={{ p: 0 }}>
                {stats.topProximos.length > 0 ? stats.topProximos.map((emp) => (
                  <Box key={emp.id} sx={{ p: 2.5, '&:hover': { bgcolor: '#fafafa' }, transition: 'background 0.2s' }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      {emp.nombre} {emp.apellido || ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {emp.cargo || 'Sin Cargo'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" sx={{ px: 1, py: 0.3, bgcolor: '#fef3c7', color: '#d97706', borderRadius: 1, fontWeight: 700 }}>
                        {emp.daysLeft} días
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Vence: {emp.fecha_final ? new Date(emp.fecha_final).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                )) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No hay contratos próximos a vencer.</Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ReportsModal;
