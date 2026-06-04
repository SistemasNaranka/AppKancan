import { Card, CardContent, Typography, Button, Box, Chip, IconButton, Tooltip } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import { useState } from 'react';
import { createRegister, updateObservation } from '../api/directus';
import { EVENTS, EventType } from '../utils/constants';
import dayjs from 'dayjs';

// Tipos
interface Empleado {
  id: string | number;
  nombre: string;
  tienda: string;
}

interface Registro {
  id: string | number;
  empleado: { id: string | number; nombre: string };
  evento: string;
  fecha: string;
  hora: string;
  observaciones?: string;
}

interface RegCardProps {
  employee: Empleado;
  registersToday: Registro[];
  onRefresh: () => void;
}

type StateKey = 'initial' | 'working' | 'lunch' | 'back' | 'finished';

const getState = (registers: Registro[]): StateKey => {
  const has = (e: string) => registers.some(r => r.evento === e);
  if (!has(EVENTS.START)) return 'initial';
  if (!has(EVENTS.START_LUNCH)) return 'working';
  if (!has(EVENTS.END_LUNCH)) return 'lunch';
  if (!has(EVENTS.END_WORK)) return 'back';
  return 'finished';
};

const stateConfig: Record<StateKey, { next: EventType | null; label: string; color: 'default' | 'success' | 'warning' | 'info' | 'secondary' }> = {
  initial: { next: EVENTS.START, label: 'Sin iniciar', color: 'default' },
  working: { next: EVENTS.START_LUNCH, label: 'En jornada', color: 'success' },
  lunch: { next: EVENTS.END_LUNCH, label: 'En almuerzo', color: 'warning' },
  back: { next: EVENTS.END_WORK, label: 'Regresado', color: 'info' },
  finished: { next: null, label: 'Finalizado', color: 'secondary' },
};

const RegCard = ({ employee, registersToday, onRefresh }: RegCardProps) => {
  const [loading, setLoading] = useState(false);
  const [obsLoading, setObsLoading] = useState(false);
  const currentState = getState(registersToday);
  const config = stateConfig[currentState];
  const existingRegister = registersToday.find(r => r.evento === config.next);

  const handleRegister = async () => {
    if (!config.next) return;
    setLoading(true);
    try {
      await createRegister({
        empleado: employee.id,
        evento: config.next,
        tienda: employee.tienda,
        fecha: dayjs().format('YYYY-MM-DD'),
        hora: dayjs().format('HH:mm:ss'),
      });
      alert(`✅ ${config.next} registrado correctamente`);
      onRefresh();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddObservation = async () => {
    if (!existingRegister) return;
    const obs = prompt('Agregar observación (opcional):');
    if (obs && obs.trim()) {
      setObsLoading(true);
      try {
        await updateObservation(existingRegister.id, obs.trim());
        alert('📝 Observación guardada');
        onRefresh();
      } catch (err: any) {
        alert(`❌ Error: ${err.message}`);
      } finally {
        setObsLoading(false);
      }
    }
  };

  const showObservationButton = existingRegister && !existingRegister.observaciones && config.next;

  return (
    <Card sx={{ width: 340, borderRadius: 3, boxShadow: 3, transition: '0.2s', '&:hover': { boxShadow: 6 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{employee.nombre}</Typography>
          <Chip label={config.label} color={config.color} size="small" />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="contained"
            color="primary"
            disabled={!config.next || loading}
            onClick={handleRegister}
            fullWidth
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            {config.next || 'Completado'}
          </Button>
          {showObservationButton && (
            <Tooltip title="Agregar observación">
              <IconButton onClick={handleAddObservation} disabled={obsLoading}>
                <NotesIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {existingRegister?.observaciones && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            📝 {existingRegister.observaciones}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RegCard;