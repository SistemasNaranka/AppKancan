// ─────────────────────────────────────────────────────────
//  pages/HistorialNotificaciones.tsx
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, ToggleButton, ToggleButtonGroup,
  FormControl, Select, MenuItem,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import NotificationHeader      from '../components/NotificationHeader';
import NotificationTable       from '../components/NotificationTable';
import NotificationDetailModal from '../components/NotificationDetailModal';
import { NotificationsTourProvider } from '../components/NotificationsTourContext';
import NotificationsTour           from '../components/NotificationsTour';

import { INotification } from '../interfaces/notification.interface';
import { servicioNotificaciones } from '../services/notification.service';

function HistorialContent() {
  const [registros,     setRegistros]     = useState<INotification[]>([]);
  const [cargando,      setCargando]      = useState(false);
  const [filtroEstado,  setFiltroEstado]  = useState('TODOS');
  const [rangoFecha,    setRangoFecha]    = useState('todos');
  const [selectedNotif, setSelectedNotif] = useState<INotification | null>(null);

  // ── Carga ──────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await servicioNotificaciones.obtenerRegistrosEntrega();
      setRegistros(datos);
    } catch (err) {
      console.error("Error al conectar con el servicio:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Auto-refresh cada 30 s
  useEffect(() => {
    const id = setInterval(cargarDatos, 30_000);
    return () => clearInterval(id);
  }, [cargarDatos]);

  // ── Eliminar ────────────────────────────────────────────
  const handleEliminar = async (id: string) => {
    try {
      await servicioNotificaciones.eliminarNotificacion(id);
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      if (selectedNotif?.id === id) setSelectedNotif(null);
    } catch (err) {
      console.error("Error al eliminar notificación:", err);
    }
  };

  // ── Filtrado ────────────────────────────────────────────
  const dataFiltrada = registros.filter((r) => {
    const cumpleEstado = filtroEstado === 'TODOS' || r.tipo_notificacion === filtroEstado;

    let cumpleFecha = true;
    if (rangoFecha !== 'todos' && r.fecha) {
      const partes = r.fecha.split('/');
      if (partes.length === 3) {
        const [dia, mes, anio] = partes.map(Number);
        const fechaReg = new Date(anio, mes - 1, dia);
        const hoy      = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaReg.setHours(0, 0, 0, 0);
        const dias = Math.floor((hoy.getTime() - fechaReg.getTime()) / 86_400_000);
        if      (rangoFecha === 'hoy')  cumpleFecha = dias === 0;
        else if (rangoFecha === 'ayer') cumpleFecha = dias === 1;
        else if (rangoFecha === '7')    cumpleFecha = dias <= 7;
        else if (rangoFecha === '30')   cumpleFecha = dias <= 30;
      }
    }
    return cumpleEstado && cumpleFecha;
  });

  return (
    <Box sx={{ minHeight: '100vh', py: 5 }}>
      {/* Tour Joyride — se activa via PeekButton o ?tour=start */}
      <NotificationsTour />

      <Container maxWidth="xl">

        <NotificationHeader total={dataFiltrada.length} />

        {/* ── Barra de filtros ── */}
        <Box sx={{
          display: 'flex', gap: 2, alignItems: 'center',
          bgcolor: '#fff', p: 2, borderRadius: '16px',
          border: '1px solid #e2e8f0', mb: 2,
        }}>
          <ToggleButtonGroup
            id="notif-filtros"
            value={filtroEstado}
            exclusive
            onChange={(_, val) => val && setFiltroEstado(val)}
            size="small"
          >
            {([
              { value: 'TODOS',       label: 'Todos',       color: '#004a99' },
              { value: 'ENTREGADO',   label: 'Éxito',       color: '#16a34a' },
              { value: 'ADVERTENCIA', label: 'Advertencia', color: '#d97706' },
              { value: 'ERROR',       label: 'Error',       color: '#dc2626' },
            ] as const).map(({ value, label, color }) => (
              <ToggleButton
                key={value}
                value={value}
                sx={{
                  textTransform: 'none', fontWeight: 700, px: 2.5,
                  borderRadius: '10px', mx: 0.5, border: 'none', color: '#64748b',
                  '&.Mui-selected': {
                    bgcolor: color, color: '#fff', borderRadius: '10px',
                    '&:hover': { bgcolor: color, filter: 'brightness(0.88)' },
                  },
                }}
              >
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControl id="notif-rango-fecha" size="small" sx={{ ml: 'auto', minWidth: 175 }}>
            <Select
              value={rangoFecha}
              onChange={(e) => setRangoFecha(e.target.value)}
              displayEmpty
              startAdornment={
                <CalendarTodayIcon sx={{ color: '#ffffff', fontSize: '1.1rem', ml: 0.5, mr: 1 }} />
              }
              sx={{
                borderRadius: '10px', bgcolor: '#004a99', color: '#ffffff',
                fontWeight: 600, fontSize: '0.88rem', height: '36px',
                '& .MuiSelect-icon': { color: '#ffffff' },
                '&:hover': { bgcolor: '#003366' },
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0, pl: 1 },
                '& fieldset': { border: 'none' },
              }}
            >
              <MenuItem value="todos">Mostrar Todo</MenuItem>
              <MenuItem value="hoy">Hoy</MenuItem>
              <MenuItem value="ayer">Ayer</MenuItem>
              <MenuItem value="7">Últimos 7 días</MenuItem>
              <MenuItem value="30">Últimos 30 días</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ── Tabla ── */}
        <NotificationTable
          registros={dataFiltrada}
          cargando={cargando}
          onSelect={setSelectedNotif}
          onEliminar={handleEliminar}
          onRefrescar={cargarDatos}
        />

        {/* ── Modal detalle ── */}
        <NotificationDetailModal
          open={!!selectedNotif}
          notificacion={selectedNotif}
          onClose={() => setSelectedNotif(null)}
        />

      </Container>
    </Box>
  );
}

export default function HistorialNotificaciones() {
  return (
    <NotificationsTourProvider>
      <HistorialContent />
    </NotificationsTourProvider>
  );
}
