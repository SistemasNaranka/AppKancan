import { Card, Typography, Button, Box, IconButton, Stack, Chip, Tooltip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import { EmpleadoAsistencia } from '../interfaces/horarios.interface';

interface EmployeeCardProps {
  empleado: EmpleadoAsistencia;
  onRegistrarEvento: (idEmpleado: string, tipoEvento: string) => void;
}

export default function EmployeeCard({ empleado, onRegistrarEvento }: EmployeeCardProps) {
  const { id, nombre, estadoActual, registros } = empleado;

  const botones = [
    { etiqueta: 'Comenzar Jornada', activo: estadoActual === 'entrada_pendiente', hora: registros.inicioJornada },
    { etiqueta: 'Iniciar Almuerzo', activo: estadoActual === 'jornada_iniciada', hora: registros.inicioAlmuerzo },
    { etiqueta: 'Finalizar Almuerzo', activo: estadoActual === 'en_almuerzo', hora: registros.finAlmuerzo },
    { etiqueta: 'Terminar Jornada', activo: estadoActual === 'regreso_almuerzo', hora: registros.finJornada },
  ];

  const novedadActiva = estadoActual === 'entrada_pendiente';
  const pausaActiva = estadoActual === 'jornada_iniciada' || estadoActual === 'regreso_almuerzo';

  return (
    <Card
      sx={{
        width: 380,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: estadoActual !== 'jornada_finalizada' ? '0 8px 24px rgba(0,0,0,0.1)' : 'none',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease',
        bgcolor: '#ffffff',
      }}
    >
      {/* Cabecera azul corporativa */}
      <Box
        sx={{
          bgcolor: '#00407a',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>
          {nombre}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={novedadActiva ? 'Reportar novedad' : 'No disponible'}>
            <span>
              <IconButton
                size="small"
                disabled={!novedadActiva}
                sx={{ color: novedadActiva ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}
              >
                <ReportProblemIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={pausaActiva ? 'Reportar pausa' : 'No disponible'}>
            <span>
              <IconButton
                size="small"
                disabled={!pausaActiva}
                sx={{ color: pausaActiva ? '#fff' : 'rgba(255,255,255,0.4)' }}
              >
                <FreeBreakfastIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Chip
            label={estadoActual.replace(/_/g, ' ').toUpperCase()}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', fontSize: '0.65rem', height: 24 }}
          />
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          {botones.map((btn, idx) => {
            const yaHecho = !!btn.hora;
            const bloqueado = !btn.activo && !yaHecho;

            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  fullWidth
                  variant={btn.activo ? 'contained' : yaHecho ? 'outlined' : 'text'}
                  disabled={bloqueado || estadoActual === 'jornada_finalizada'}
                  onClick={() => onRegistrarEvento(id, btn.etiqueta)}
                  startIcon={yaHecho ? <CheckCircleOutlineIcon color="success" /> : null}
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: btn.activo ? '#005b9f' : yaHecho ? 'transparent' : 'transparent',
                    color: btn.activo ? '#fff' : yaHecho ? '#2e7d32' : '#9e9e9e',
                    borderColor: yaHecho ? '#4caf50' : 'transparent',
                    '&:hover': {
                      bgcolor: btn.activo ? '#00407a' : yaHecho ? '#f0fdf4' : 'transparent',
                      transform: btn.activo ? 'translateY(-1px)' : 'none',
                    },
                  }}
                >
                  <span>{btn.etiqueta}</span>
                  {btn.hora && <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{btn.hora}</span>}
                </Button>

                <Tooltip title={yaHecho || btn.activo ? 'Agregar observación' : 'No disponible'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={!yaHecho && !btn.activo}
                      sx={{
                        border: '1px solid',
                        borderColor: yaHecho ? '#4caf50' : btn.activo ? '#005b9f' : '#e0e0e0',
                        borderRadius: 1.5,
                        color: yaHecho ? '#2e7d32' : btn.activo ? '#005b9f' : '#cbd5e1',
                      }}
                    >
                      <AssignmentIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })}
        </Stack>

        {estadoActual === 'jornada_finalizada' && (
          <Box sx={{ mt: 2, textAlign: 'center', bgcolor: '#e8f5e9', py: 1, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              ✅ Jornada completada
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}