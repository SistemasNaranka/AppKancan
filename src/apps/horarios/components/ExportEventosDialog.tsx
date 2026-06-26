import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { getStores, getStoreIdUsuarioActual, fetchEventReportsExport } from '../api/directus/read';
import { exportarEventosExcel } from '../utils/exportarEventos';
import { Tienda } from '../interfaces/horarios.interface';
import DateRangeFilter from './DateRangeFilter';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';
import { useHorariosPolicies } from '../hooks/useHorariosPolicies';

const AZUL = '#004680';

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: number | null;
}

export default function ExportEventosDialog({ open, onClose, storeId }: Props) {
  const { showSnackbar } = useGlobalSnackbar();
  const { esAdmin } = useHorariosPolicies();
  const [exportando, setExportando] = useState(false);
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(null);
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (open) { setRangoInicio(null); setRangoFin(null); }
  }, [open]);

  const { data: tiendas = [] } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
    enabled: open,
  });

  const { data: storeUsuario = null } = useQuery<number | null>({
    queryKey: ['horariosStoreId'],
    queryFn: getStoreIdUsuarioActual,
    staleTime: 30 * 60 * 1000,
    enabled: open && storeId == null,
  });

  const tiendaEfectiva = storeId != null ? storeId : storeUsuario;

  const handleExportar = async () => {
    if (tiendaEfectiva == null) {
      showSnackbar('No se pudo determinar la tienda para exportar', 'error');
      return;
    }
    setExportando(true);
    try {
      let fIni = rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined;
      let fFin = rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined;
      if (!fIni && !fFin) {
        const hoy = dayjs().format('YYYY-MM-DD');
        fIni = hoy;
        fFin = hoy;
      }
      const reports = await fetchEventReportsExport(fIni, fFin, [tiendaEfectiva], esAdmin());
      const res = await exportarEventosExcel({ reports, stores: tiendas });
      if (res.ok) {
        showSnackbar('Exportación generada con éxito', 'success');
        onClose();
      } else {
        showSnackbar(res.mensaje || 'No hay datos para exportar', 'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Error al exportar los eventos', 'error');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Dialog open={open} onClose={exportando ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FileDownloadIcon />
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Exportar eventos</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
            Reportes de pausas y eventos de la tienda
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
              RANGO DE FECHAS
            </Typography>
            <DateRangeFilter
              fechaInicio={rangoInicio}
              fechaFin={rangoFin}
              onChange={(inicio, fin) => { setRangoInicio(inicio); setRangoFin(fin); }}
            />

            {(() => {
              const conRango = !!(rangoInicio || rangoFin);
              const c = conRango
                ? { bg: '#eaf2fb', border: '#cfe2f7', icon: '#004680', text: '#0f2c4a' }
                : { bg: '#fff8e1', border: '#ffe49c', icon: '#c08a00', text: '#7a5b00' };
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, mt: 1.25, borderRadius: 2, bgcolor: c.bg, border: `1px solid ${c.border}` }}>
                  {conRango
                    ? <CalendarMonthIcon sx={{ fontSize: 20, color: c.icon, flexShrink: 0 }} />
                    : <InfoOutlinedIcon sx={{ fontSize: 20, color: c.icon, flexShrink: 0 }} />}
                  <Typography sx={{ fontSize: '0.82rem', color: c.text, lineHeight: 1.4 }}>
                    {conRango ? (
                      <>
                        Se exportará del{' '}
                        <Box component="span" sx={{ fontWeight: 700 }}>{rangoInicio ? rangoInicio.format('DD-MM-YYYY') : '…'}</Box>
                        {' '}al{' '}
                        <Box component="span" sx={{ fontWeight: 700 }}>{rangoFin ? rangoFin.format('DD-MM-YYYY') : '…'}</Box>.
                      </>
                    ) : (
                      <>
                        No seleccionaste un rango de fechas: se exportará{' '}
                        <Box component="span" sx={{ fontWeight: 700 }}>solo el día de hoy ({dayjs().format('DD-MM-YYYY')})</Box>.
                      </>
                    )}
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={exportando} sx={{ borderRadius: 2, fontWeight: 600, color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>
          Cancelar
        </Button>
        <Button
          onClick={handleExportar}
          variant="contained"
          disableElevation
          disabled={exportando}
          startIcon={exportando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <FileDownloadIcon />}
          sx={{ bgcolor: AZUL, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#003a6b' } }}
        >
          {exportando ? 'Exportando…' : 'Exportar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
