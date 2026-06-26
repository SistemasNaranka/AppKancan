import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Avatar, Chip, CircularProgress, Divider,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BadgeIcon from '@mui/icons-material/Badge';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  getEmployeeTimeRecords, getEmployeeNovedades, getEmployeeEventReports,
} from '../../api/directus/read';
import { EmpleadoAdmin } from '../../interfaces/horarios.interface';
import { getIconForTipo, getChipColor } from '../../utils/novedadVisual';

const AZUL = '#004680';
const AVATAR_COLORS = ['#0284c7', '#7c3aed', '#16a34a', '#ea580c', '#db2777', '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#059669', '#2563eb', '#9333ea'];
const colorAvatar = (t: string) => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = t.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const hhmm = (t: string | null | undefined) => (t ? String(t).slice(0, 5) : '—');

interface Props {
  open: boolean;
  empleado: EmpleadoAdmin | null;
  tiendaNombre: string;
  onClose: () => void;
  onEditar: () => void;
}

interface JornadaDia {
  fecha: string;
  entrada: string | null;
  salida: string | null;
  horas: string;
}

const calcularHoras = (recs: any[]): string => {
  const buscar = (tipo: string) => recs.find((r) => r.log_type === tipo)?.record_time ?? null;
  const ini = buscar('Comenzar Jornada');
  const fin = buscar('Terminar Jornada');
  if (!ini || !fin) return '—';
  const base = '2000-01-01';
  let min = dayjs(`${base} ${fin}`).diff(dayjs(`${base} ${ini}`), 'minute');
  const ia = buscar('Iniciar Almuerzo');
  const fa = buscar('Finalizar Almuerzo');
  if (ia && fa) min -= dayjs(`${base} ${fa}`).diff(dayjs(`${base} ${ia}`), 'minute');
  return min > 0 ? `${(min / 60).toFixed(1)} h` : '—';
};

export default function DialogPerfilEmpleado({ open, empleado, tiendaNombre, onClose, onEditar }: Props) {
  const empId = empleado?.id ?? 0;
  const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');
  const hoy = dayjs().format('YYYY-MM-DD');
  const habilitado = open && empId > 0;

  const { data: timeRecords = [], isLoading: loadingTR } = useQuery<any[]>({
    queryKey: ['perfilTimeRecords', empId, inicioMes, hoy],
    queryFn: () => getEmployeeTimeRecords(empId, inicioMes, hoy),
    enabled: habilitado,
    staleTime: 60 * 1000,
  });
  const { data: novedades = [], isLoading: loadingNov } = useQuery<any[]>({
    queryKey: ['perfilNovedades', empId],
    queryFn: () => getEmployeeNovedades(empId, 5),
    enabled: habilitado,
    staleTime: 60 * 1000,
  });
  const { data: eventos = [], isLoading: loadingEv } = useQuery<any[]>({
    queryKey: ['perfilEventos', empId, inicioMes, hoy],
    queryFn: () => getEmployeeEventReports(empId, inicioMes, hoy),
    enabled: habilitado,
    staleTime: 60 * 1000,
  });

  const cargando = loadingTR || loadingNov || loadingEv;

  const jornadas: JornadaDia[] = (() => {
    const grupos: Record<string, any[]> = {};
    timeRecords.forEach((r) => { (grupos[r.record_date] ||= []).push(r); });
    return Object.entries(grupos)
      .map(([fecha, recs]) => ({
        fecha,
        entrada: recs.find((r) => r.log_type === 'Comenzar Jornada')?.record_time ?? null,
        salida: recs.find((r) => r.log_type === 'Terminar Jornada')?.record_time ?? null,
        horas: calcularHoras(recs),
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  })();

  const nombre = empleado
    ? [empleado.first_name, empleado.middle_name, empleado.last_name, empleado.second_last_name].filter((p) => p && p.trim()).join(' ')
    : 'Empleado';
  const inactivo = (empleado?.status || '').toLowerCase() !== 'activo';

  const kpi = (icon: React.ReactNode, label: string, valor: number | string, color: string, bg: string) => (
    <Box sx={{ flex: 1, minWidth: 110, bgcolor: bg, border: `1px solid ${color}22`, borderRadius: 2.5, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color, color: '#fff' }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.3px' }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{valor}</Typography>
    </Box>
  );

  const seccion = (titulo: string, vacio: string, children: React.ReactNode, hayDatos: boolean) => (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>{titulo}</Typography>
      {hayDatos ? children : <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>{vacio}</Typography>}
    </Box>
  );

  const fila = (izq: React.ReactNode, der: React.ReactNode) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.85, borderBottom: '1px solid #f1f5f9', gap: 1 }}>
      {izq}{der}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: colorAvatar(nombre), width: 46, height: 46, fontWeight: 700 }}>{nombre.charAt(0).toUpperCase()}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.05rem', display: 'block', textTransform: 'capitalize', lineHeight: 1.2 }} noWrap>{nombre}</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.85, display: 'block' }}>{empleado?.position_name || 'Sin cargo'}</Typography>
        </Box>
        <Chip label={(empleado?.status || '—').toUpperCase()} size="small" sx={{ height: 22, fontWeight: 700, fontSize: '0.65rem', bgcolor: inactivo ? '#fee2e2' : '#dcfce7', color: inactivo ? '#dc2626' : '#16a34a' }} />
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={30} sx={{ color: AZUL }} /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            {/* Datos que NO están en la tarjeta */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {fila(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eaf2fb', color: AZUL }}><BadgeIcon sx={{ fontSize: 17 }} /></Box>
                  <Typography sx={{ fontSize: '0.82rem' }}>Documento</Typography>
                </Box>,
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f2c4a' }}>{[empleado?.document_type, empleado?.document_number].filter(Boolean).join(' ') || '—'}</Typography>
              )}
              {fila(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eaf2fb', color: AZUL }}><StorefrontIcon sx={{ fontSize: 17 }} /></Box>
                  <Typography sx={{ fontSize: '0.82rem' }}>Tienda</Typography>
                </Box>,
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f2c4a' }}>{tiendaNombre || '—'}</Typography>
              )}
            </Box>

            {/* KPIs del mes */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {kpi(<EventNoteIcon sx={{ fontSize: 16 }} />, 'JORNADAS (MES)', jornadas.filter((j) => j.entrada).length, '#004680', '#eaf2fb')}
              {kpi(<PauseCircleOutlineIcon sx={{ fontSize: 16 }} />, 'PAUSAS (MES)', eventos.length, '#b45309', '#fef3c7')}
              {kpi(<AssignmentIcon sx={{ fontSize: 16 }} />, 'NOVEDADES', novedades.length, '#7c3aed', '#ede9fe')}
            </Box>

            <Divider />

            {/* Últimas jornadas */}
            {seccion('ÚLTIMAS JORNADAS', 'Sin jornadas este mes.', (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {jornadas.slice(0, 5).map((j) => (
                  <Box key={j.fecha} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid #f1f5f9', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <EventNoteIcon sx={{ fontSize: 18, color: AZUL, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.82rem', color: '#0f2c4a', fontWeight: 600 }}>{dayjs(j.fecha).format('DD MMM')}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>{hhmm(j.entrada)} → {hhmm(j.salida)}</Typography>
                    <Chip label={j.horas} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#eaf2fb', color: AZUL }} />
                  </Box>
                ))}
              </Box>
            ), jornadas.length > 0)}

            {/* Últimas novedades */}
            {seccion('ÚLTIMAS NOVEDADES', 'Sin novedades registradas.', (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {novedades.map((n) => {
                  const tipo = n.newness_id?.name || 'Novedad';
                  const c = getChipColor(tipo);
                  return (
                    <Box key={n.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid #f1f5f9', gap: 1 }}>
                      <Chip
                        icon={getIconForTipo(tipo)}
                        label={tipo}
                        size="small"
                        sx={{ height: 24, fontWeight: 700, fontSize: '0.72rem', bgcolor: c.bg, color: c.text, '& .MuiChip-icon': { ml: 0.5 } }}
                      />
                      <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0 }}>{n.report_date ? dayjs(n.report_date).format('DD MMM YYYY') : '—'}</Typography>
                    </Box>
                  );
                })}
              </Box>
            ), novedades.length > 0)}

            {/* Últimas pausas */}
            {seccion('ÚLTIMAS PAUSAS', 'Sin pausas este mes.', (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {eventos.slice(0, 5).map((e) => (
                  <Box key={e.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid #f1f5f9', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <PauseCircleOutlineIcon sx={{ fontSize: 18, color: '#b45309', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.82rem', color: '#0f2c4a', fontWeight: 600 }} noWrap>{e.event_type}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0 }}>
                      {e.date ? dayjs(e.date).format('DD MMM') : '—'} · {hhmm(e.hour)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ), eventos.length > 0)}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>Cerrar</Button>
        <Button onClick={onEditar} variant="contained" disableElevation startIcon={<EditOutlinedIcon />} sx={{ bgcolor: AZUL, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#003a6b' } }}>Editar</Button>
      </DialogActions>
    </Dialog>
  );
}
