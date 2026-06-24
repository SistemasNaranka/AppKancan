import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, Checkbox, FormControlLabel, CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { getStores, fetchNewnessReportsExport } from '../api/directus/read';
import { exportarNovedadesExcel } from '../utils/exportarNovedades';
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

export default function ExportNovedadesDialog({ open, onClose, fechaInicio, fechaFin, tiendaDefault }: Props) {
  const { showSnackbar } = useGlobalSnackbar();
  const [tiendasSel, setTiendasSel] = useState<Tienda[]>([]);
  const [todas, setTodas] = useState(false);
  const [todasNovedades, setTodasNovedades] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [rangoInicio, setRangoInicio] = useState<Dayjs | null>(null);
  const [rangoFin, setRangoFin] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (open) {
      setRangoInicio(fechaInicio ? dayjs(fechaInicio) : null);
      setRangoFin(fechaFin ? dayjs(fechaFin) : null);
      setTodas(false);
      setTodasNovedades(false);
    }
  }, [open, fechaInicio, fechaFin]);

  const { data: tiendas = [], isLoading: loadingTiendas } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
    enabled: open,
  });

  useEffect(() => {
    if (open && tiendaDefault != null && tiendas.length > 0) {
      const t = tiendas.find((x) => x.id === tiendaDefault);
      setTiendasSel(t ? [t] : []);
    }
  }, [open, tiendas, tiendaDefault]);

  const puedeExportar = (todasNovedades || todas || tiendasSel.length > 0) && !exportando;

  const ejecutarExport = async (fIni?: string, fFin?: string, storeIds?: number[]) => {
    setExportando(true);
    try {
      const reports = await fetchNewnessReportsExport(fIni, fFin, storeIds);
      const res = await exportarNovedadesExcel({ reports, stores: tiendas });
      if (res.ok) {
        showSnackbar('Exportación generada con éxito', 'success');
        onClose();
      } else {
        showSnackbar(res.mensaje || 'No hay datos para exportar', 'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Error al exportar las novedades', 'error');
    } finally {
      setExportando(false);
    }
  };

  const handleExportar = async () => {
    // Check "todas las novedades" → sin filtro de tiendas ni fechas.
    if (todasNovedades) {
      await ejecutarExport(undefined, undefined, undefined);
      return;
    }
    const storeIds = todas ? undefined : tiendasSel.map((t) => t.id);
    let fIni = rangoInicio ? rangoInicio.format('YYYY-MM-DD') : undefined;
    let fFin = rangoFin ? rangoFin.format('YYYY-MM-DD') : undefined;
    if (!fIni && !fFin) {
      const hoy = dayjs().format('YYYY-MM-DD');
      fIni = hoy;
      fFin = hoy;
    }
    await ejecutarExport(fIni, fFin, storeIds);
  };

  return (
    <Dialog open={open} onClose={exportando ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle component="div" sx={{ bgcolor: AZUL, color: '#fff', py: 2, px: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FileDownloadIcon />
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>Exportar novedades</Typography>
          <Typography component="span" variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
            Selecciona tiendas y rango de fechas
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
              disabled={todas || todasNovedades}
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
              control={<Checkbox checked={todas} disabled={todasNovedades} onChange={(e) => setTodas(e.target.checked)} sx={{ color: AZUL, '&.Mui-checked': { color: AZUL } }} />}
              label={<Typography sx={{ fontSize: '0.85rem', fontWeight: "bold" }}>Todas las tiendas</Typography>}
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Box sx={{ opacity: todasNovedades ? 0.5 : 1, pointerEvents: todasNovedades ? 'none' : 'auto' }}>
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1.5,
                    mt: 1.25,
                    borderRadius: 2,
                    bgcolor: c.bg,
                    border: `1px solid ${c.border}`,
                  }}
                >
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

          <FormControlLabel
            control={<Checkbox checked={todasNovedades} onChange={(e) => setTodasNovedades(e.target.checked)} sx={{ color: AZUL, '&.Mui-checked': { color: AZUL } }} />}
            label={
              <Box>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Descargar todas las novedades</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Ignora las tiendas y el rango de fechas: exporta todas las novedades registradas.
                </Typography>
              </Box>
            }
          />
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
