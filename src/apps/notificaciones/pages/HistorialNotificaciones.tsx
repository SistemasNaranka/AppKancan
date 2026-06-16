// ─────────────────────────────────────────────────────────
//  pages/HistorialNotificaciones.tsx
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Container, ToggleButton, ToggleButtonGroup,
  FormControl, Select, MenuItem, Button, Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import NotificationHeader      from '../components/NotificationHeader';
import NotificationTable       from '../components/NotificationTable';
import NotificationDetailModal from '../components/NotificationDetailModal';
import { NotificationsTourProvider } from '../components/NotificationsTourContext';
import NotificationsTour           from '../components/NotificationsTour';

import { INotification, EstadoVisibilidad } from '../interfaces/notification.interface';
import { servicioNotificaciones } from '../services/notification.service';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

function HistorialContent() {
  const [registros,     setRegistros]     = useState<INotification[]>([]);
  const [cargando,      setCargando]      = useState(false);
  const [filtroEstado,  setFiltroEstado]  = useState('TODOS');
  const [rangoFecha,    setRangoFecha]    = useState('hoy');
  const [selectedNotif, setSelectedNotif] = useState<INotification | null>(null);

  // ── Cambios pendientes (id → nuevoStatus) hasta que el usuario confirme ──
  const [pendingChanges, setPendingChanges] = useState<Record<string, EstadoVisibilidad>>({});
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const hayPendientes = Object.keys(pendingChanges).length > 0;
  const { showSnackbar } = useGlobalSnackbar();

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

  // Auto-refresh cada 30 s — pausado mientras haya cambios pendientes
  // para no perder lo que el usuario marcó antes de confirmar.
  useEffect(() => {
    if (hayPendientes) return;
    const id = setInterval(cargarDatos, 30_000);
    return () => clearInterval(id);
  }, [cargarDatos, hayPendientes]);

  // ── Toggle pendiente (no llega al backend hasta confirmar) ──
  const handleTogglePendiente = (id: string, nuevoStatus: EstadoVisibilidad) => {
    setPendingChanges((prev) => {
      const next = { ...prev };
      const original = registros.find((r) => r.id === id)?.status;
      // Si el usuario "revierte" al valor original, se quita de pendientes
      if (original === nuevoStatus) {
        delete next[id];
      } else {
        next[id] = nuevoStatus;
      }
      return next;
    });
  };

  const handleConfirmar = async () => {
    setGuardandoCambios(true);
    try {
      const entries = Object.entries(pendingChanges);
      await Promise.all(
        entries.map(([id, status]) =>
          servicioNotificaciones.toggleVisibilidadNotificacion(id, status)
        )
      );
      setPendingChanges({});
      await cargarDatos();
      showSnackbar(`Se actualizaron ${entries.length} notificación(es).`, 'success');
    } catch (err: any) {
      console.error("Error al confirmar cambios:", err);
      showSnackbar(err?.message || 'Error al guardar los cambios.', 'error');
    } finally {
      setGuardandoCambios(false);
    }
  };

  const handleCancelar = () => {
    setPendingChanges({});
  };

  // ── Filtrado ────────────────────────────────────────────
  const dataFiltrada = useMemo(() => {
    return registros.filter((r) => {
      // El status efectivo es el pendiente si existe, si no el real.
      const statusEfectivo: EstadoVisibilidad = pendingChanges[r.id] ?? r.status;

      // Filtro de visibilidad/tipo
      let cumpleEstado = true;
      if (filtroEstado === 'OCULTAS') {
        cumpleEstado = statusEfectivo === 'inactivo';
      } else if (filtroEstado === 'TODOS') {
        cumpleEstado = statusEfectivo === 'activo';
      } else {
        cumpleEstado = r.tipo_notificacion === filtroEstado && statusEfectivo === 'activo';
      }

      // Filtro fecha
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
  }, [registros, filtroEstado, rangoFecha, pendingChanges]);

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
            onChange={(_, val) => {
              if (!val) return;
              setFiltroEstado(val);
              // Al entrar en "Ocultas" mostramos todas las históricas por
              // defecto; el usuario puede volver a filtrar por fecha si quiere.
              if (val === 'OCULTAS') setRangoFecha('todos');
            }}
            size="small"
          >
            {([
              { value: 'TODOS',       label: 'Todos',       color: '#004a99' },
              { value: 'ENTREGADO',   label: 'Éxito',       color: '#16a34a' },
              { value: 'ADVERTENCIA', label: 'Advertencia', color: '#d97706' },
              { value: 'ERROR',       label: 'Error',       color: '#dc2626' },
              { value: 'OCULTAS',     label: 'Ocultas',     color: '#475569' },
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
                {value === 'OCULTAS' && (
                  <VisibilityOffIcon sx={{ fontSize: 16, mr: 0.6, verticalAlign: 'middle' }} />
                )}
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControl id="notif-rango-fecha" size="small" sx={{ ml: 'auto' }}>
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
                cursor: 'pointer',
                '& .MuiSelect-icon': { color: '#ffffff' },
                '&:hover': { bgcolor: '#003366' },
                '& .MuiSelect-select': {
                  display: 'flex', alignItems: 'center',
                  py: 0, pl: 1, pr: '32px !important',
                  cursor: 'pointer',
                  minWidth: 'unset',
                },
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

        {/* ── Barra de cambios pendientes ── */}
        {hayPendientes && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 2, mb: 2, p: 1.8, px: 2.5,
            bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px',
          }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#9a3412', fontFamily: 'Inter' }}>
              Tienes <b>{Object.keys(pendingChanges).length}</b> cambio(s) sin guardar.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloseIcon />}
                onClick={handleCancelar}
                disabled={guardandoCambios}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: '#fdba74', color: '#9a3412', '&:hover': { borderColor: '#fb923c', bgcolor: '#ffedd5' } }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckIcon />}
                onClick={handleConfirmar}
                disabled={guardandoCambios}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: '#ea580c', boxShadow: 'none', '&:hover': { bgcolor: '#c2410c', boxShadow: 'none' } }}
              >
                {guardandoCambios ? 'Guardando...' : 'Confirmar cambios'}
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Tabla ── */}
        <NotificationTable
          registros={dataFiltrada}
          cargando={cargando}
          onSelect={setSelectedNotif}
          onTogglePendiente={handleTogglePendiente}
          pendingChanges={pendingChanges}
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
