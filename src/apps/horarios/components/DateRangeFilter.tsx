import { useState } from 'react';
import {
  Box, Popover, Button, Divider, Typography, Stack, InputAdornment, TextField,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';

interface DateRangeFilterProps {
  fechaInicio: Dayjs | null;
  fechaFin: Dayjs | null;
  onChange: (inicio: Dayjs | null, fin: Dayjs | null) => void;
}

const AZUL = '#004680';

const buildPresets = () => {
  const hoy = dayjs();
  return [
    { label: 'Hoy', inicio: hoy.startOf('day'), fin: hoy.startOf('day') },
    { label: 'Últimos 7 días', inicio: hoy.subtract(6, 'day'), fin: hoy },
    { label: 'Este mes', inicio: hoy.startOf('month'), fin: hoy },
    { label: 'Mes pasado', inicio: hoy.subtract(1, 'month').startOf('month'), fin: hoy.subtract(1, 'month').endOf('month') },
    { label: 'Últimos 30 días', inicio: hoy.subtract(29, 'day'), fin: hoy },
    { label: 'Este año', inicio: hoy.startOf('year'), fin: hoy },
    { label: 'Todo', inicio: null, fin: null },
  ];
};

export default function DateRangeFilter({ fechaInicio, fechaFin, onChange }: DateRangeFilterProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempInicio, setTempInicio] = useState<Dayjs | null>(fechaInicio);
  const [tempFin, setTempFin] = useState<Dayjs | null>(fechaFin);

  const open = Boolean(anchorEl);
  const presets = buildPresets();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setTempInicio(fechaInicio);
    setTempFin(fechaFin);
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const aplicarPreset = (inicio: Dayjs | null, fin: Dayjs | null) => {
    setTempInicio(inicio);
    setTempFin(fin);
  };

  const presetActivo = (inicio: Dayjs | null, fin: Dayjs | null) => {
    if (inicio === null || fin === null) {
      return tempInicio === null && tempFin === null;
    }
    return !!tempInicio && !!tempFin &&
      tempInicio.format('YYYY-MM-DD') === inicio.format('YYYY-MM-DD') &&
      tempFin.format('YYYY-MM-DD') === fin.format('YYYY-MM-DD');
  };

  const handlePickInicio = (value: Dayjs) => {
    setTempInicio(value);
    if (tempFin && value.isAfter(tempFin, 'day')) {
      setTempFin(null);
    }
  };

  const handlePickFin = (value: Dayjs) => {
    setTempFin(value);
    if (tempInicio && value.isBefore(tempInicio, 'day')) {
      setTempInicio(value);
      setTempFin(null);
    }
  };

  const handleAplicar = () => {
    onChange(tempInicio, tempFin);
    handleClose();
  };

  const handleLimpiar = () => {
    setTempInicio(null);
    setTempFin(null);
    onChange(null, null);
    handleClose();
  };

  const RangeDay = (props: PickersDayProps) => {
    const { day: rawDay, ...other } = props;
    const day = rawDay as Dayjs;
    const esExtremo =
      (!!tempInicio && day.isSame(tempInicio, 'day')) ||
      (!!tempFin && day.isSame(tempFin, 'day'));
    const enRango =
      !!tempInicio && !!tempFin &&
      day.isAfter(tempInicio, 'day') && day.isBefore(tempFin, 'day');

    return (
      <PickersDay
        {...other}
        day={rawDay}
        sx={{
          ...(enRango && { bgcolor: '#eaf2fb', borderRadius: 0 }),
          ...(esExtremo && {
            bgcolor: `${AZUL} !important`,
            color: '#fff !important',
            '&:hover': { bgcolor: '#003a6b !important' },
          }),
        }}
      />
    );
  };

  const etiquetaCampo = fechaInicio && fechaFin
    ? `${fechaInicio.format('DD/MM/YYYY')} – ${fechaFin.format('DD/MM/YYYY')}`
    : fechaInicio
    ? `Desde ${fechaInicio.format('DD/MM/YYYY')}`
    : 'Todo';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <TextField
        size="small"
        fullWidth
        placeholder="Selecciona un rango…"
        value={etiquetaCampo}
        onClick={handleOpen}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthIcon sx={{ fontSize: 18, color: AZUL }} />
            </InputAdornment>
          ),
        }}
        sx={{
          cursor: 'pointer',
          '& .MuiOutlinedInput-root': {
            bgcolor: '#e8f0fe',
            borderRadius: 2,
            cursor: 'pointer',
            '& fieldset': { borderColor: open ? AZUL : '#cbd5e1' },
            '&:hover fieldset': { borderColor: '#94a3b8' },
          },
          '& .MuiOutlinedInput-input': { cursor: 'pointer', fontSize: '0.85rem', color: '#334155' },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: 3, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden' } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Presets */}
          <Box sx={{ p: 1.5, minWidth: 170, bgcolor: '#f8fafc', borderRight: { sm: '1px solid #eef2f6' } }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', px: 1, mb: 0.5 }}>
              RANGOS RÁPIDOS
            </Typography>
            <Stack spacing={0.25}>
              {presets.map((p) => {
                const activo = presetActivo(p.inicio, p.fin);
                return (
                  <Button
                    key={p.label}
                    onClick={() => aplicarPreset(p.inicio, p.fin)}
                    size="small"
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: activo ? 700 : 500,
                      fontSize: '0.8rem',
                      borderRadius: 1.5,
                      px: 1.25,
                      color: activo ? AZUL : '#475569',
                      bgcolor: activo ? '#eaf2fb' : 'transparent',
                      '&:hover': { bgcolor: '#eaf2fb' },
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>

          {/* Calendarios */}
          <Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <DateCalendar
                value={tempInicio}
                onChange={(v) => v && handlePickInicio(v as Dayjs)}
                slots={{ day: RangeDay }}
                sx={{ width: 280 }}
              />
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <DateCalendar
                value={tempFin}
                referenceDate={dayjs().add(1, 'month')}
                onChange={(v) => v && handlePickFin(v as Dayjs)}
                slots={{ day: RangeDay }}
                sx={{ width: 280 }}
              />
            </Box>

            <Divider />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, gap: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                {tempInicio && tempFin
                  ? `${tempInicio.format('DD/MM/YYYY')} – ${tempFin.format('DD/MM/YYYY')}`
                  : tempInicio
                  ? `${tempInicio.format('DD/MM/YYYY')} – …`
                  : 'Todo'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={handleLimpiar} size="small" sx={{ textTransform: 'none', color: '#94a3b8', '&:hover': { color: '#dc2626', bgcolor: '#fef2f2' } }}>
                  Limpiar
                </Button>
                <Button
                  onClick={handleAplicar}
                  size="small"
                  variant="contained"
                  disableElevation
                  disabled={!!tempInicio && !tempFin}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, bgcolor: AZUL, boxShadow: 'none', '&:hover': { bgcolor: '#003a6b', boxShadow: 'none' } }}
                >
                  Aplicar
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Popover>
    </LocalizationProvider>
  );
}
