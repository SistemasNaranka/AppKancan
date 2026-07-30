import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, Checkbox, FormControlLabel, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DateRangeIcon from '@mui/icons-material/DateRange';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { getStores, getEmpleadosBulk, getTimeRecordsBulkRange } from '../../api/directus/read';
import { exportarSemanalExcel } from '../../utils/exportarSemanal';
import { Tienda } from '../../interfaces/horarios.interface';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';
import DateRangeFilter from './DateRangeFilter';
import { DIAS_DE_LA_SEMANA } from '../../pages/reporte/ReporteUtils';

interface ExportSemanalDialogProps {
  open: boolean;
  onClose: () => void;
  fechaInicioDefault?: Dayjs | null;
  fechaFinDefault?: Dayjs | null;
  tiendasPermitidas?: Tienda[];
  diaInicioSemana?: number;
  diaFinSemana?: number;
}

export default function ExportSemanalDialog({
  open,
  onClose,
  fechaInicioDefault,
  fechaFinDefault,
  tiendasPermitidas,
  diaInicioSemana = 1,
  diaFinSemana = 0,
}: ExportSemanalDialogProps) {
  const { showSnackbar } = useGlobalSnackbar();
  const [tiendasSel, setTiendasSel] = useState<Tienda[]>([]);
  const [todas, setTodas] = useState(true);
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(fechaInicioDefault || dayjs().subtract(6, 'day'));
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(fechaFinDefault || dayjs());
  const [diaInicio, setDiaInicio] = useState<number>(diaInicioSemana);
  const [diaFin, setDiaFin] = useState<number>(diaFinSemana);
  const [exportando, setExportando] = useState(false);

  const { data: todasLasTiendas = [], isLoading: loadingTiendas } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
    enabled: open && (!tiendasPermitidas || tiendasPermitidas.length === 0),
  });

  const tiendas = (tiendasPermitidas && tiendasPermitidas.length > 0)
    ? tiendasPermitidas
    : todasLasTiendas;

  // Solo al abrir el diálogo inicializamos las tiendas y fechas
  useEffect(() => {
    if (open) {
      if (fechaInicioDefault) setRangoInicio(fechaInicioDefault);
      if (fechaFinDefault) setRangoFin(fechaFinDefault);
      setDiaInicio(diaInicioSemana);
      setDiaFin(diaFinSemana);

      if (tiendas.length > 0) {
        setTodas(true);
        setTiendasSel(tiendas);
      }
    }
  }, [open, tiendas, fechaInicioDefault, fechaFinDefault, diaInicioSemana, diaFinSemana]);

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
        diaInicioSemana: diaInicio,
        diaFinSemana: diaFin,
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
            options={tiendas}
            getOptionLabel={(option) => option.name}
            value={todas ? tiendas : tiendasSel}
            disabled={todas}
            onChange={(_, newValue) => setTiendasSel(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={todas ? "Todas las tiendas seleccionadas" : "Buscar y seleccionar tiendas..."}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <StorefrontIcon sx={{ color: '#004680', mr: 1, ml: 0.5 }} />
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

        {/* Estructura de Semana */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
            ESTRUCTURA DE SEMANA:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="export-dia-inicio-label">Inicio Semana</InputLabel>
              <Select
                labelId="export-dia-inicio-label"
                value={diaInicio}
                label="Inicio Semana"
                onChange={(e) => setDiaInicio(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {DIAS_DE_LA_SEMANA.map((d) => (
                  <MenuItem key={`exp-ini-${d.value}`} value={d.value}>{d.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="export-dia-fin-label">Fin Semana</InputLabel>
              <Select
                labelId="export-dia-fin-label"
                value={diaFin}
                label="Fin Semana"
                onChange={(e) => setDiaFin(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {DIAS_DE_LA_SEMANA.map((d) => (
                  <MenuItem key={`exp-fin-${d.value}`} value={d.value}>{d.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {(() => {
            const nombreIni = DIAS_DE_LA_SEMANA.find(d => d.value === diaInicio)?.label || 'Lunes';
            const endDayVal = (diaInicio + 6) % 7;
            const nombreFinAuto = DIAS_DE_LA_SEMANA.find(d => d.value === endDayVal)?.label || 'Domingo';
            const nombreFin = DIAS_DE_LA_SEMANA.find(d => d.value === diaFin)?.label || 'Domingo';
            const totalDias = diaInicio === diaFin
              ? 7
              : (diaFin - diaInicio + (diaFin < diaInicio ? 7 : 0) + 1);
            const textoRango = diaInicio === diaFin
              ? `${nombreIni} a ${nombreFinAuto} (7 días completos)`
              : `${nombreIni} a ${nombreFin} (${totalDias} días por columna)`;
            return (
              <Chip
                icon={<InfoOutlinedIcon sx={{ fontSize: '1rem !important', color: '#0284c7 !important' }} />}
                label={`Estructura: ${textoRango}`}
                size="small"
                sx={{
                  bgcolor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 600,
                  borderRadius: 2,
                  height: 32,
                  mt: 1.5,
                  fontSize: '0.78rem',
                  border: '1px solid #bae6fd'
                }}
              />
            );
          })()}
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
