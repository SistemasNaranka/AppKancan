import React, { useState } from 'react';
import { Box, Container, ToggleButton, ToggleButtonGroup, FormControl, Select, MenuItem } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import NotificationHeader from '../components/NotificationHeader';
import NotificationTable from '../components/NotificationTable';
import NotificationDetailModal from '../components/NotificationDetailModal';
import { INotification } from '../interfaces/notification.interface';

export default function HistorialNotificaciones() {
  const [registros] = useState<INotification[]>([
    { id: '#KM-00148', titulo: 'Presupuesto de Mayo', mensaje: 'Se informa que el presupuesto para la región norte ha sido autorizado...', tipo_notificacion: 'EN COLA', progreso: 40, fecha: '21/05/2026', hora: '10:16:55 a.m.' },
    { id: '#KM-00147', titulo: 'Actualización de Ruta', mensaje: 'Cambio de protocolo en la descarga de contenedores por problemas climáticos...', tipo_notificacion: 'ENTREGADO', progreso: 100, fecha: '21/05/2026', hora: '09:42:12 a.m.' },
    { id: '#KM-00146', titulo: 'Alerta de Latencia', mensaje: 'Se detectó una demora crítica en el nodo 4-G de la red principal de telecomunicaciones...', tipo_notificacion: 'ERROR', progreso: 10, fecha: '20/05/2026', hora: '23:15:00 p.m.' },
    { id: '#KM-00145', titulo: 'Aviso de Mantenimiento', mensaje: 'Programación de mantenimiento preventivo para los servidores de base de datos...', tipo_notificacion: 'ADVERTENCIA', progreso: 25, fecha: '15/05/2026', hora: '18:30:10 p.m.' }
  ]);

  
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [rangoFecha, setRangoFecha] = useState('todos');
  const [selectedNotif, setSelectedNotif] = useState<INotification | null>(null);

  const dataFiltrada = registros.filter(r => {
    const cumpleEstado = filtroEstado === 'TODOS' || r.tipo_notificacion === filtroEstado;
    let cumpleFecha = true;
    if (rangoFecha !== 'todos') {
      const [dia, mes, anio] = r.fecha.split('/');
      const fechaRegistro = new Date(Number(anio), Number(mes) - 1, Number(dia));
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaRegistro.setHours(0, 0, 0, 0);
      const diferenciaTiempo = hoy.getTime() - fechaRegistro.getTime();
      const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
      if (rangoFecha === 'hoy') cumpleFecha = diferenciaDias === 0;
      else if (rangoFecha === 'ayer') cumpleFecha = diferenciaDias === 1;
      else if (rangoFecha === '7') cumpleFecha = diferenciaDias <= 7;
      else if (rangoFecha === '30') cumpleFecha = diferenciaDias <= 30;
    }
    return cumpleEstado && cumpleFecha;
  });

  return (
    <Box sx={{ minHeight: '100vh', py: 5 }}>
      <Container maxWidth="xl">
        <NotificationHeader total={dataFiltrada.length} />
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fff', p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', mb: 4 }}>

          <ToggleButtonGroup
            value={filtroEstado}
            exclusive
            onChange={(_, val) => val && setFiltroEstado(val)}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': { 
                textTransform: 'none', fontWeight: 700, px: 2.5, borderRadius: '10px', mx: 0.5, border: 'none', color: '#64748b',
                '&.Mui-selected': { bgcolor: '#004a99', color: '#fff', borderRadius: '10px', '&:hover': { bgcolor: '#003366' } }
              }
            }}
          >
            <ToggleButton value="TODOS">Todos</ToggleButton>
            <ToggleButton value="ENTREGADO">Éxito</ToggleButton>
            <ToggleButton value="ADVERTENCIA">Advertencia</ToggleButton>
            <ToggleButton value="ERROR">Error</ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ ml: 'auto', minWidth: 175 }}>
            <Select
              value={rangoFecha}
              onChange={(e) => setRangoFecha(e.target.value)}
              displayEmpty
              startAdornment={<CalendarTodayIcon sx={{ color: '#ffffff', fontSize: '1.1rem', ml: 0.5, mr: 1 }} />}
              sx={{
                borderRadius: '10px', bgcolor: '#004a99', color: '#ffffff', fontWeight: 600, fontSize: '0.88rem', height: '36px',
                '& .MuiSelect-icon': { color: '#ffffff' }, '&:hover': { bgcolor: '#003366' },
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0, pl: 1 },
                '& fieldset': { border: 'none' }
              }}
              MenuProps={{ PaperProps: { sx: { bgcolor: '#ffffff', borderRadius: '8px', mt: 0.5 } } }}
            >
              <MenuItem value="todos">Mostrar Todo</MenuItem>
              <MenuItem value="hoy">Hoy</MenuItem>
              <MenuItem value="ayer">Ayer</MenuItem>
              <MenuItem value="7">Últimos 7 días</MenuItem>
              <MenuItem value="30">Últimos 30 días</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <NotificationTable registros={dataFiltrada} onSelect={setSelectedNotif} />

        <NotificationDetailModal 
          open={!!selectedNotif} 
          notificacion={selectedNotif} 
          onClose={() => setSelectedNotif(null)} 
        />
      </Container>
    </Box>
  );
}


