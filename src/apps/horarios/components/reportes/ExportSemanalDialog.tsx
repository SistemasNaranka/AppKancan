import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, Checkbox, FormControlLabel, CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { getStores, getEmpleadosBulk, getTimeRecordsBulkRange } from '../../api/directus/read';
import { exportarSemanalExcel } from '../../utils/exportarSemanal';
import { Tienda } from '../../interfaces/horarios.interface';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';
import DateRangeFilter from './DateRangeFilter';

interface Props {
  open: boolean;
  onClose: () => void;
  tiendaDefault?: number | null;
  fechaInicioDefault?: Dayjs | null;
  fechaFinDefault?: Dayjs | null;
}

export default function ExportSemanalDialog({
  open,
  onClose,
  fechaInicioDefault,
  fechaFinDefault
}: Props) {
  const { showSnackbar } = useGlobalSnackbar();
  const [tiendasSel, setTiendasSel] = useState<Tienda[]>([]);
  const [todas, setTodas] = useState(true);
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(fechaInicioDefault || dayjs().startOf('month'));
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(fechaFinDefault || dayjs());
  const [exportando, setExportando] = useState(false);

  const { data: tiendas = [], isLoading: loadingTiendas } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
    enabled: open,
  });

  // Solo al abrir el diálogo inicializamos las tiendas y fechas
  useEffect(() => {
    if (open) {
      if (fechaInicioDefault) setRangoInicio(fechaInicioDefault);
      if (fechaFinDefault) setRangoFin(fechaFinDefault);

      if (tiendas.length > 0) {
        setTodas(true);
        setTiendasSel(tiendas);
      }
    }
  }, [open, tiendas]);

  const handleToggleTodas = (checked: boolean) => {
    setTodas(checked);
    if (checked) {
      setTiendasSel(tiendas);
    } else {
      setTiendasSel([]);
    }
  };

  const handleExport = async () => {
    if (!rangoInicio || !rangoFin) {
      showSnackbar('Por favor, selecciona una fecha de inicio y de fin', 'warning');
      return;
    }

    if (rangoFin.isBefore(rangoInicio, 'day')) {
      showSnackbar('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
      return;
    }

    const tiendasAExportar = todas || tiendasSel.length === 0 ? tiendas : tiendasSel;
    if (tiendasAExportar.length === 0) {
      showSnackbar('Por favor, selecciona al menos una tienda para exportar', 'warning');
      return;
    }

    const storeIdsToFetch = tiendasAExportar.map(t => Number(t.id));
    const tiendaNombre = todas || tiendasSel.length === tiendas.length
      ? 'Consolidado General - Todas las Tiendas'
      : tiendasAExportar.length === 1
        ? tiendasAExportar[0].name
        : `${tiendasAExportar.length} Tiendas Seleccionadas`;

    setExportando(true);
    try {
      const startStr = rangoInicio.format('YYYY-MM-DD');
      const endStr = rangoFin.format('YYYY-MM-DD');

      const [empleados, records] = await Promise.all([
        getEmpleadosBulk(storeIdsToFetch),
        getTimeRecordsBulkRange(storeIdsToFetch, startStr, endStr),
      ]);

      if (empleados.length === 0) {
        showSnackbar('No hay empleados registrados para el período y tiendas seleccionadas', 'info');
      }

      await exportarSemanalExcel({
        tiendaNombre,
        fechaInicio: rangoInicio,
        fechaFin: rangoFin,
        empleados,
        records,
        tiendas,
      });

      showSnackbar('Reporte semanal exportado exitosamente', 'success');
      onClose();
    } catch (err: any) {
      console.error('Error al exportar reporte semanal:', err);
      showSnackbar(err?.message || 'Error al generar la exportación en Excel', 'error');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Dialog open={open} onClose={exportando ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ bgcolor: '#004680', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
        <DateRangeIcon sx={{ fontSize: 26 }} />
        <Typography variant="h6" fontWeight={700}>
          Exportar Horas Semanales / Quincena
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          Selecciona una o varias tiendas y el rango de fechas (ej. quincena del 11 al 25) para generar la exportación en Excel.
        </Typography>

        {/* Selección Múltiple de Tiendas */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
            TIENDAS A EXPORTAR:
          </Typography>
          <Autocomplete
            multiple
            limitTags={3}
            size="small"
            options={tiendas}
            loading={loadingTiendas}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
            value={tiendasSel}
            onChange={(_, newValue) => {
              setTiendasSel(newValue);
              setTodas(newValue.length === tiendas.length);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Selecciona una o varias tiendas..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#004680', ml: 0.5, mr: 0.5 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f1f7fe' } }}
              />
            )}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={todas}
                onChange={(e) => handleToggleTodas(e.target.checked)}
                sx={{ color: '#004680', '&.Mui-checked': { color: '#004680' } }}
              />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                Todas las tiendas
              </Typography>
            }
            sx={{ mt: 0.5 }}
          />
        </Box>

        {/* Rango de Fechas (ej: 11/07/2026 - 25/07/2026) */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
            PERÍODO A EXPORTAR:
          </Typography>
          <DateRangeFilter
            fechaInicio={rangoInicio}
            fechaFin={rangoFin}
            onChange={(inicio, fin) => {
              setRangoInicio(inicio);
              setRangoFin(fin);
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={exportando} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={exportando}
          startIcon={exportando ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FileDownloadIcon />}
          sx={{
            bgcolor: '#004680',
            '&:hover': { bgcolor: '#003366' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
          }}
        >
          {exportando ? 'Generando Excel...' : 'Descargar Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
