import React, { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar,
  LinearProgress, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import { useContracts } from '../hooks/useContracts';

// ── Design tokens ────────────────────────────────────────────────────────────
const CARD = {
  borderRadius: '14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.05)',
};

const S = {
  vigente: { label: 'Activo',      color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  proximo: { label: 'Por vencer',  color: '#c2410c', bg: '#fff7ed', dot: '#fb923c' },
  vencido: { label: 'Vencido',      color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
} as const;

const AVATAR_COLORS = ['#0369a1','#7c3aed','#0f766e','#b45309','#be185d','#1d4ed8'];
const getInitials = (n: string) => n.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();
const avatarBg   = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];

const StatusDot: React.FC<{ status: keyof typeof S }> = ({ status }) => {
  const cfg = S[status] ?? S.vigente;
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
      <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:cfg.dot, flexShrink:0 }} />
      <Typography sx={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.label}</Typography>
    </Box>
  );
};

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onChangeTab?: (tab: string) => void;
  onNewContract?: () => void;
  onNewProrroga?: (contractId: number) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
const DashboardView: React.FC<Props> = ({ onChangeTab, onNewContract, onNewProrroga }) => {
  const { allEnriched, counts } = useContracts();

  const vigentes = allEnriched.filter(c => c.contractStatus === 'vigente').length;
  const proximos  = allEnriched.filter(c => c.contractStatus === 'proximo').length;
  const vencidos  = allEnriched.filter(c => c.contractStatus === 'vencido').length;
  const recent    = useMemo(() => allEnriched.slice(0, 10), [allEnriched]);
  const total     = counts.total || 1;

  const kpis = [
    { label:'Contratos Activos', value:vigentes, badge:'+' + vigentes + ' activos',  badgeColor:'#15803d', badgeBg:'#f0fdf4', Icon:CheckCircleOutlineIcon,      iconColor:'#15803d' },
    { label:'Por Vencer',        value:proximos, badge:'Próx. 30 días',              badgeColor:'#c2410c', badgeBg:'#fff7ed', Icon:AccessTimeIcon,               iconColor:'#c2410c' },
    { label:'Críticos',          value:vencidos, badge:'Próx. 7 días',               badgeColor:'#b91c1c', badgeBg:'#fef2f2', Icon:ReportProblemOutlinedIcon,    iconColor:'#b91c1c' },
    { label:'Vencidos',          value:counts.total - vigentes - proximos - vencidos < 0 ? 0 : counts.total - vigentes - proximos,
                                         badge:'Requieren acción',                    badgeColor:'#6b21a8', badgeBg:'#faf5ff', Icon:CancelOutlinedIcon,           iconColor:'#6b21a8' },
  ];

  const distribution = [
    { label:'Activos',    count:vigentes, color:'#22c55e', pct: Math.round((vigentes/total)*100) },
    { label:'Por vencer', count:proximos, color:'#fb923c', pct: Math.round((proximos/total)*100) },
    { label:'Vencidos',   count:vencidos, color:'#ef4444', pct: Math.round((vencidos/total)*100) },
  ];

  const quickActions = [
    { label:'Nuevo Contrato',     sub:'Crear contrato nuevo',      Icon:AddCircleOutlineIcon, color:'#004680', action:onNewContract },
    { label:'Solicitar Prórroga', sub:'Extender un contrato',      Icon:EventAvailableIcon,   color:'#0284c7', action:()=>onChangeTab?.('contratos') },
    { label:'Ver Empleados',      sub:'Gestionar empleados',        Icon:PersonAddAltIcon,     color:'#7c3aed', action:()=>onChangeTab?.('empleados') },
    { label:'Ver Reportes',       sub:'Análisis y estadísticas',    Icon:BarChartIcon,         color:'#0f766e', action:()=>{} },
  ];

  return (
    <Box sx={{ p:{ xs:2, md:3 }, bgcolor:'#f8fafc', minHeight:'100%' }}>
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb:3 }}>
        {kpis.map(kpi => (
          <Grid size={{ xs:12, sm:6, md:3 }} key={kpi.label}>
            <Card sx={{ ...CARD, height:'100%', overflow:'hidden' }}>
              <CardContent sx={{ p:2.5, position:'relative' }}>
                <Box sx={{ position:'absolute', bottom:-12, right:-12, opacity:0.06, pointerEvents:'none' }}>
                  <kpi.Icon sx={{ fontSize:110, color:kpi.iconColor }} />
                </Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:1.5 }}>
                  <Box sx={{ width:40, height:40, borderRadius:'10px', bgcolor:kpi.badgeBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <kpi.Icon sx={{ fontSize:20, color:kpi.iconColor }} />
                  </Box>
                  <Chip label={kpi.badge} size="small" sx={{ fontSize:10, fontWeight:700, height:20, bgcolor:kpi.badgeBg, color:kpi.badgeColor }} />
                </Box>
                <Typography sx={{ fontSize:'2.4rem', fontWeight:900, lineHeight:1, color:'#0f172a', mb:0.5 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="body2" sx={{ color:'#64748b', fontWeight:500 }}>
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main content row */}
      <Grid container spacing={2.5}>
        {/* Recent Contracts table */}
        <Grid size={{ xs:12, md:8 }}>
          <Card sx={CARD}>
            <CardContent sx={{ p:0 }}>
              <Box sx={{ px:3, pt:2.5, pb:2, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <Box>
                  <Typography sx={{ fontWeight:700, color:'#0f172a', fontSize:'1rem' }}>Contratos Recientes</Typography>
                  <Typography variant="caption" sx={{ color:'#94a3b8' }}>Últimos {recent.length} contratos actualizados</Typography>
                </Box>
                <Button size="small" endIcon={<ChevronRightIcon />} onClick={() => onChangeTab?.('contratos')}
                  sx={{ color:'#004680', fontWeight:600, textTransform:'none', fontSize:13 }}>
                  Ver todos
                </Button>
              </Box>
              <Divider />
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th':{ bgcolor:'#f8fafc', color:'#64748b', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #f1f5f9', py:1.5 } }}>
                    <TableCell sx={{ pl:3 }}>Contrato</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ pr:3 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py:5, color:'#94a3b8' }}>
                        No hay contratos registrados aún
                      </TableCell>
                    </TableRow>
                  ) : recent.map(c => {
                    const st = c.contractStatus as keyof typeof S;
                    const cfg = S[st] ?? S.vigente;
                    return (
                      <TableRow key={c.id} sx={{
                        '&:hover':{ bgcolor:'#f8fafc' },
                        '& td':{ borderBottom:'1px solid #f1f5f9', py:1.25 },
                        borderLeft: st==='vencido' ? '3px solid #ef4444' : st==='proximo' ? '3px solid #fb923c' : '3px solid transparent',
                      }}>
                        <TableCell sx={{ pl:3 }}>
                          <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>CTR-{String(c.id).padStart(6,'0')}</Typography>
                          <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{c.empleado_area}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                            <Avatar sx={{ width:30, height:30, bgcolor:avatarBg(c.nombre) }}>
                              <PersonIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{c.nombre}</Typography>
                              <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{c.cargo}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize:13, fontWeight:600, color: st==='vencido'?'#b91c1c': st==='proximo'?'#c2410c':'#0f172a' }}>
                            {c.lastProrroga ? new Date(c.lastProrroga.fecha_final).toLocaleDateString() : '—'}
                          </Typography>
                          <Typography sx={{ fontSize:11, color:'#94a3b8' }}>
                            {c.daysLeft >= 0 ? `En ${c.daysLeft} días` : `Venció hace ${Math.abs(c.daysLeft)} días`}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusDot status={st} /></TableCell>
                        <TableCell sx={{ pr:3 }}>
                          <IconButton size="small" sx={{ color:'#94a3b8' }} onClick={() => onNewProrroga?.(c.id)}>
                            <ChevronRightIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs:12, md:4 }}>
          {/* Quick Actions */}
          <Card sx={{ ...CARD, mb:2.5 }}>
            <CardContent sx={{ p:0 }}>
              <Box sx={{ px:2.5, pt:2.5, pb:1.5 }}>
                <Typography sx={{ fontWeight:700, color:'#0f172a', fontSize:'1rem' }}>Accesos Rápidos</Typography>
              </Box>
              <Divider />
              <List disablePadding>
                {quickActions.map((a, i) => (
                  <React.Fragment key={a.label}>
                    <ListItemButton onClick={a.action ?? undefined} sx={{ px:2.5, py:1.5, '&:hover':{ bgcolor:'#f8fafc' } }}>
                      <ListItemIcon sx={{ minWidth:40 }}>
                        <Box sx={{ width:32, height:32, borderRadius:'8px', bgcolor:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <a.Icon sx={{ fontSize:17, color:a.color }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={a.label} secondary={a.sub}
                        primaryTypographyProps={{ fontSize:13, fontWeight:600, color:'#0f172a' }}
                        secondaryTypographyProps={{ fontSize:11, color:'#94a3b8' }}
                      />
                      <ChevronRightIcon sx={{ fontSize:16, color:'#cbd5e1' }} />
                    </ListItemButton>
                    {i < quickActions.length-1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card sx={CARD}>
            <CardContent sx={{ p:2.5 }}>
              <Typography sx={{ fontWeight:700, color:'#0f172a', fontSize:'1rem', mb:2 }}>Distribución de Estados</Typography>
              {distribution.map(item => (
                <Box key={item.label} sx={{ mb:2 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.75 }}>
                    <Typography sx={{ fontSize:13, fontWeight:500, color:'#475569' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{item.count} ({item.pct}%)</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={item.pct} sx={{
                    height:6, borderRadius:3, bgcolor:'#f1f5f9',
                    '& .MuiLinearProgress-bar':{ bgcolor:item.color, borderRadius:3 },
                  }} />
                </Box>
              ))}
              <Divider sx={{ my:1.5 }} />
              <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                <Typography sx={{ fontSize:13, color:'#64748b' }}>Total</Typography>
                <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{counts.total}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardView;
