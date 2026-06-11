import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, LinearProgress, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { INotification, EstadoVisibilidad } from '../interfaces/notification.interface';

interface TableProps {
  registros: INotification[];
  cargando?: boolean;
  onSelect: (n: INotification | null) => void;
  /** Marca/desmarca un cambio pendiente para la notificación (no llega al backend). */
  onTogglePendiente?: (id: string, nuevoStatus: EstadoVisibilidad) => void;
  /** Mapa id → nuevoStatus de cambios aún no confirmados. */
  pendingChanges?: Record<string, EstadoVisibilidad>;
  onRefrescar?: () => Promise<void> | void;
}

export default function NotificationTable({
  registros,
  cargando = false,
  onSelect,
  onTogglePendiente,
  pendingChanges = {},
}: TableProps) {
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  const totalPaginas = Math.ceil(registros.length / porPagina) || 1;
  const dataVisible = registros.slice((pagina - 1) * porPagina, pagina * porPagina);

  const getBadgeConfig = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case 'ENTREGADO': return { bg: '#e2f4f2', color: '#16a34a' };
      case 'ERROR': return { bg: '#f9e2e4', color: '#dc2626' };
      case 'ADVERTENCIA': return { bg: '#fff6e2', color: '#ca8a04' };
      case 'EN COLA':
      default: return { bg: '#e2ebf4', color: '#1e40af' };
    }
  };

  const handleToggle = (e: React.MouseEvent, item: INotification) => {
    e.stopPropagation();
    if (!onTogglePendiente) return;
    const statusActual: EstadoVisibilidad = pendingChanges[item.id] ?? item.status;
    const nuevoStatus: EstadoVisibilidad = statusActual === 'activo' ? 'inactivo' : 'activo';
    onTogglePendiente(item.id, nuevoStatus);
  };

  const gridLayout = '2fr 3fr 1.5fr 1.5fr 0.8fr';

  return (
    <Box id="notif-tabla" sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.02)',
          position: 'relative'
        }}
      >
        {cargando && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': { bgcolor: '#004a99' }
            }}
          />
        )}
        {/* ENCABEZADO DE LA TABLA */}
        <Box sx={{ display: 'grid', gridTemplateColumns: gridLayout, gap: 3, px: 3, py: 1.5, bgcolor: '#eff6ff' }}>
          <Typography variant="caption" sx={{ color: '#424754', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', fontFamily: 'Inter' }}>ASUNTO</Typography>
          <Typography variant="caption" sx={{ color: '#424754', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', fontFamily: 'Inter', textAlign: 'center' }}>MENSAJE</Typography>
          <Typography variant="caption" sx={{ color: '#424754', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', fontFamily: 'Inter' }}>ESTADO</Typography>
          <Typography variant="caption" sx={{ color: '#424754', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', fontFamily: 'Inter' }}>FECHA Y HORA</Typography>
          <Typography variant="caption" sx={{ color: '#424754', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textAlign: 'center', fontFamily: 'Inter' }}>ACCIONES</Typography>
        </Box>

        {/* FILAS */}
        {dataVisible.length === 0 ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontWeight: 600 }}>
              {cargando ? 'Cargando notificaciones...' : 'No se encontraron notificaciones'}
            </Typography>
          </Box>
        ) : (
          dataVisible.map((item) => {
            const badge = getBadgeConfig(item.tipo_notificacion);
            const statusEfectivo: EstadoVisibilidad = pendingChanges[item.id] ?? item.status;
            const inactiva = statusEfectivo === 'inactivo';
            const pendiente = pendingChanges[item.id] !== undefined;
            return (
              <Box
                key={item.id}
                onClick={() => onSelect(item)}
                sx={{
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  opacity: inactiva ? 0.55 : 1,
                  bgcolor: pendiente ? '#fff7ed' : 'transparent',
                  '&:hover': { bgcolor: pendiente ? '#ffedd5' : '#f8fafc' },
                  transition: 'background-color 0.2s, opacity 0.2s'
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: gridLayout, alignItems: 'center', gap: 3, p: 2.5, px: 3 }}>

                  {/* Asunto */}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#191b23', fontSize: '0.92rem', fontFamily: 'Inter', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.titulo}
                    </Typography>
                  </Box>

                  {/* Mensaje — multilínea centrado con límite de 4 líneas */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#424754',
                      fontSize: '0.88rem',
                      fontFamily: 'Inter',
                      minWidth: 0,
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.mensaje}
                  </Typography>

                  {/* Estado Badge */}
                  <Box sx={{ display: 'flex' }}>
                    <Box sx={{ bgcolor: badge.bg, color: badge.color, px: 2.2, py: 0.5, borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textAlign: 'center', minWidth: '90px', letterSpacing: '0.3px', fontFamily: 'Inter' }}>
                      {item.tipo_notificacion}
                    </Box>
                  </Box>

                  {/* Fecha y Hora */}
                  <Box>
                    <Typography sx={{ color: '#191b23', fontWeight: 800, fontSize: '0.88rem', fontFamily: 'Inter' }}>
                      {item.fecha}
                    </Typography>
                    <Typography sx={{ color: '#424754', fontWeight: 600, fontSize: '0.75rem', mt: 0.2, fontFamily: 'Inter' }}>
                      {item.hora}
                    </Typography>
                  </Box>

                  {/* Acciones — botón único de ojo (marca cambio pendiente) */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip
                      title={
                        pendiente
                          ? 'Click para revertir cambio'
                          : inactiva
                            ? 'Marcar para mostrar'
                            : 'Marcar para ocultar'
                      }
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleToggle(e, item)}
                        sx={{
                          color: pendiente ? '#ea580c' : inactiva ? '#94a3b8' : '#004a99',
                          '&:hover': { bgcolor: pendiente ? '#ffedd5' : inactiva ? '#f1f5f9' : '#eff6ff' },
                        }}
                      >
                        {inactiva ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}

        {/* PIE DE TABLA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, px: 3, bgcolor: '#f8fafc' }}>
          <Typography sx={{ color: '#424754', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Inter' }}>
            Mostrando <b style={{ color: '#004a99' }}>{dataVisible.length}</b> de <b style={{ color: '#004a99' }}>{registros.length}</b> registros
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
            <Box onClick={() => setPagina(prev => Math.max(prev - 1, 1))} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}>‹</Box>
            {[...Array(totalPaginas)].map((_, i) => (
              <Box key={i} onClick={() => setPagina(i + 1)} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', bgcolor: pagina === i + 1 ? '#004a99' : '#ffffff', color: pagina === i + 1 ? '#ffffff' : '#004a99', border: pagina === i + 1 ? '1px solid #004a99' : '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: pagina === i + 1 ? '#004a99' : '#f1f5f9' } }}>{i + 1}</Box>
            ))}
            <Box onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas))} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}>›</Box>
          </Box>
        </Box>

      </Paper>
    </Box>
  );
}
