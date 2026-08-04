import React from 'react';
import { Box, Typography, Button, Chip, IconButton, CircularProgress } from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  CalendarMonth as CalendarMonthIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface ModalDetalleTiendaHeaderProps {
  modoSeleccion: boolean;
  diasSeleccionadosSet: Set<string>;
  handleCancelarSeleccion: () => void;
  handleAbrirConfirmMasivo: () => void;
  fechaDisplay: string;
  esDiaCerrado: boolean;
  puedeGestionarDiasCerrados: boolean;
  handleActivarModoSeleccion: () => void;
  handleToggleDiaCerradoClick: () => void;
  guardandoDiaCerrado: boolean;
  fechaSeleccionada: string;
  handleClearFilters: () => void;
}

export const ModalDetalleTiendaHeader: React.FC<ModalDetalleTiendaHeaderProps> = React.memo(({
  modoSeleccion,
  diasSeleccionadosSet,
  handleCancelarSeleccion,
  handleAbrirConfirmMasivo,
  fechaDisplay,
  esDiaCerrado,
  puedeGestionarDiasCerrados,
  handleActivarModoSeleccion,
  handleToggleDiaCerradoClick,
  guardandoDiaCerrado,
  fechaSeleccionada,
  handleClearFilters,
}) => {
  return (
    <>
      {modoSeleccion && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: '#004680', color: '#fff', borderRadius: 3, px: 3, py: 1.5, mb: 2,
          boxShadow: '0 4px 16px rgba(0,70,128,0.25)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DateRangeIcon sx={{ fontSize: 22 }} />
            <Typography fontWeight={700} fontSize="0.95rem">
              {diasSeleccionadosSet.size === 0
                ? 'Selecciona días del calendario'
                : `${diasSeleccionadosSet.size} día(s) seleccionado(s)`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleCancelarSeleccion}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<BlockIcon />}
              onClick={handleAbrirConfirmMasivo}
              disabled={diasSeleccionadosSet.size === 0}
              sx={{ bgcolor: '#fff', color: '#004680', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#e3f2fd' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.5)' } }}
            >
              Marcar como Tienda Cerrada
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" fontWeight={700} color="#0a1929">
            Registros del {fechaDisplay}
          </Typography>
          {esDiaCerrado && (
            <Chip
              label="Tienda Cerrada"
              size="small"
              sx={{ bgcolor: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {puedeGestionarDiasCerrados && !modoSeleccion && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DateRangeIcon />}
                onClick={handleActivarModoSeleccion}
                sx={{
                  borderColor: '#004680',
                  color: '#004680',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#003366', bgcolor: 'rgba(0, 70, 128, 0.05)' },
                }}
              >
                Marcar Días de Cierre
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={esDiaCerrado ? <CheckCircleIcon /> : <BlockIcon />}
                onClick={handleToggleDiaCerradoClick}
                disabled={guardandoDiaCerrado}
                sx={{
                  borderColor: '#004680',
                  color: '#004680',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#003366', bgcolor: 'rgba(0, 70, 128, 0.05)' },
                }}
              >
                {guardandoDiaCerrado ? <CircularProgress size={16} sx={{ color: '#004680' }} /> : (esDiaCerrado ? "Restablecer Día Laboral" : "Marcar Tienda Cerrada")}
              </Button>
            </>
          )}

          <Chip
            size="medium"
            icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
            label={`${dayjs(fechaSeleccionada).format('DD/MM/YYYY')}`}
            sx={{
              bgcolor: '#004680',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              px: 1,
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
          <IconButton
            size="small"
            onClick={handleClearFilters}
            sx={{
              color: '#004680',
              bgcolor: '#e3f2fd',
              '&:hover': { bgcolor: '#bbdefb' },
              p: 0.5,
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </>
  );
});
