import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, Checkbox, FormControlLabel, Divider, CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { getStores, fetchTimeRecordsExport, getReasonNamesForRecords } from '../api/directus/read';
import { exportarHistorialExcel } from '../utils/exportarHistorial';
import { Tienda } from '../interfaces/horarios.interface';
import DateRangeFilter from './DateRangeFilter';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

const AZUL = '#004680';

interface Props {
  open: boolean;
  onClose: () => void;
  fechaInicio?: string;
  fechaFin?: string;
  tiendaDefault?: number | null;
}

export default function ExportHistorialDialog({ open, onClose, fechaInicio, fechaFin, tiendaDefault }: Props) {
  const { showSnackbar } = useGlobalSnackbar();
  const [tiendasSel, setTiendasSel] = useState<Tienda[]>([]);
  const [todas, setTodas] = useState(false);
  const [detallada, setDetallada] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(null);
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (open) {
      setRangoInicio(fechaInicio ? dayjs(fechaInicio) : null);
      setRangoFin(fechaFin ? dayjs(fechaFin) : null);
      setTodas(false);
    }
  }, [open, fechaInicio, fechaFin]);

  const { data: tiendas = [], isLoading: loadingTiendas } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
    enabled: open,
  });

  // Preselecciona la tienda elegida por el admin en la vista de Registros.
  useEffect(() => {
    if (open && tiendaDefault != null && tiendas.length > 0) {
      const t = tiendas.find((x) => x.id === tiendaDefault);
      setTiendasSel(t ? [t] : []);
    }
  }, [open, tiendas, tiendaDefault]);

  const puedeExportar = (todas || tiendasSel.length > 0) && !exportando;

  const handleExportar = async () => {
    setExportando(true);
    try {
      const storeIds = todas ? undefined : tiendasSel.map((t) => t.id);
      let fIni = rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined;
      let fFin = rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined;
      // Sin rango seleccionado → por defecto solo el día de hoy.
      if (!fIni && !fFin) {
        const hoy = dayjs().format('YYYY-MM-DD');
        fIni = hoy;
        fFin = hoy;
      }
      const records = await fetchTimeRecordsExport(fIni, fFin, storeIds);

      const reasonsMap = detallada
        ? await getReasonNamesForRecords(records.map((r) => r.id))
        : new Map<number, string>();

      const res = await exportarHistorialExcel({ records, stores: tiendas, reasonsMap, detallada });
      if (res.ok) {
        showSnackbar('Exportación generada con éxito', 'success');
        onClose();
      } else {
        showSnackbar(res.mensaje || 'No hay datos para exportar', 'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Error al exportar el historial', 'error');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Dialog open={open} onClose={exportando ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FileDownloadIcon />
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Exportar historial</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
            Selecciona tiendas, rango de fechas y nivel de detalle
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
              TIENDAS A EXPORTAR
            </Typography>
            <Autocomplete
              multiple
              size="small"
              options={tiendas}
              loading={loadingTiendas}
              disabled={todas}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              value={tiendasSel}
              onChange={(_, v) => setTiendasSel(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={todas ? 'Todas las tiendas seleccionadas' : 'Selecciona una o varias tiendas…'}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <StorefrontIcon sx={{ fontSize: 18, color: AZUL, ml: 0.5, mr: 0.5 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: todas ? '#f1f5f9' : '#f1f7fe' } }}
                />
              )}
            />
            <FormControlLabel
              control={<Checkbox checked={todas} onChange={(e) => setTodas(e.target.checked)} sx={{ color: AZUL, '&.Mui-checked': { color: AZUL } }} />}
              label={<Typography sx={{ fontSize: '0.85rem', fontWeight: "bold" }}>Todas las tiendas</Typography>}
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280', mb: 1 }}>
              RANGO DE FECHAS
            </Typography>
            <DateRangeFilter
              fechaInicio={rangoInicio}
              fechaFin={rangoFin}
              onChange={(inicio, fin) => { setRangoInicio(inicio); setRangoFin(fin); }}
            />
          </Box>

          <Divider />

          <FormControlLabel
            control={<Checkbox checked={detallada} onChange={(e) => setDetallada(e.target.checked)} sx={{ color: AZUL, '&.Mui-checked': { color: AZUL } }} />}
            label={
              <Box>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Descarga detallada</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Incluye el motivo del cambio, la observación/nota y la hora inicial de cada evento editado.
                </Typography>
              </Box>
            }
          />

          <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {rangoInicio || rangoFin
              ? `Se exportará del ${rangoInicio ? rangoInicio.format('YYYY-MM-DD') : '…'} al ${rangoFin ? rangoFin.format('YYYY-MM-DD') : '…'}.`
              : `Sin rango seleccionado: se exportará solo el día de hoy (${dayjs().format('YYYY-MM-DD')}).`}
          </Typography>
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
          disabled={!puedeExportar}
          startIcon={exportando ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <FileDownloadIcon />}
          sx={{ bgcolor: AZUL, borderRadius: 2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#003a6b' } }}
        >
          {exportando ? 'Exportando…' : 'Exportar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
