import React, { useState } from 'react';
import {
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Autocomplete, TextField, Chip,
  ToggleButton, ToggleButtonGroup, Stack, Collapse
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { ReporteSemanalTabla } from './ReporteSemanalTabla';
import HistorialHorasModal from '@/apps/horarios/components/HistorialHorasModal';
import { getAvatarColor, calcularMinutosSemanales, formatMinutes, DIAS_DE_LA_SEMANA } from './ReporteUtils';

interface ReporteSemanalTabProps {
  reporteSemanalModo: 'tienda' | 'empleado';
  setReporteSemanalModo: (modo: 'tienda' | 'empleado') => void;
  storeSel: number | null;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  listadoMeses: { value: number; label: string }[];
  listadoAnios: number[];
  cargandoRecords: boolean;
  cargandoEmpleados: boolean;
  semanasDelMes: { start: string; end: string; label: string }[];
  paginatedEmpleadosSemanal: any[];
  empleadosFiltradosSemanales: any[];
  recordsMensuales: any[];
  pageSemanal: number;
  setPageSemanal: React.Dispatch<React.SetStateAction<number>>;
  totalPagesSemanal: number;
  // Modo Empleado
  todosEmpleados: any[];
  selectedEmpleadoId: number | null;
  setSelectedEmpleadoId: (id: number | null) => void;
  recordsSelectedEmp: any[];
  cargandoTodosEmpleados: boolean;
  cargandoRecordsGlobal: boolean;
  storesTrabajadas: { id: number; name: string }[];
  todasNovedades?: any[];
  // Configuración de Semana
  diaInicioSemana?: number;
  setDiaInicioSemana?: (dia: number) => void;
  diaFinSemana?: number;
  setDiaFinSemana?: (dia: number) => void;
  tiendas?: any[];
}

export default function ReporteSemanalTab({
  reporteSemanalModo,
  setReporteSemanalModo,
  storeSel,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  listadoMeses,
  listadoAnios,
  cargandoRecords,
  cargandoEmpleados,
  semanasDelMes,
  paginatedEmpleadosSemanal: _p,
  empleadosFiltradosSemanales,
  recordsMensuales,
  pageSemanal,
  setPageSemanal,
  totalPagesSemanal: _t,
  todosEmpleados,
  selectedEmpleadoId,
  setSelectedEmpleadoId,
  recordsSelectedEmp,
  cargandoTodosEmpleados: _cargandoTodosEmpleados,
  cargandoRecordsGlobal: _cargandoRecordsGlobal,
  storesTrabajadas,
  todasNovedades = [],
  diaInicioSemana = 1,
  setDiaInicioSemana,
  diaFinSemana = 0,
  setDiaFinSemana,
  tiendas = [],
}: ReporteSemanalTabProps) {
  const [selectedEmpleadoModal, setSelectedEmpleadoModal] = useState<any | null>(null);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [ordenamientoModo, setOrdenamientoModo] = useState<'tienda' | 'nombre'>('tienda');
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const tiendasMap = React.useMemo(() => {
    return new Map<number, string>((tiendas || []).map(t => [Number(t.id), t.name]));
  }, [tiendas]);

  const empleadosProcesadosOrdenados = React.useMemo(() => {
    const copia = [...empleadosFiltradosSemanales];
    return copia.sort((a, b) => {
      if (ordenamientoModo === 'tienda') {
        const tA = tiendasMap.get(Number(a.storeId)) || `Tienda #${a.storeId || 0}`;
        const tB = tiendasMap.get(Number(b.storeId)) || `Tienda #${b.storeId || 0}`;
        const compTienda = tA.localeCompare(tB, 'es', { sensitivity: 'base' });
        if (compTienda !== 0) return compTienda;
      }
      const nA = a.nombre || '';
      const nB = b.nombre || '';
      return nA.localeCompare(nB, 'es', { sensitivity: 'base' });
    });
  }, [empleadosFiltradosSemanales, ordenamientoModo, tiendasMap]);

  const totalPagesCalculados = Math.max(1, Math.ceil(empleadosProcesadosOrdenados.length / registrosPorPagina));

  const empleadosPaginadosFinales = React.useMemo(() => {
    const start = pageSemanal * registrosPorPagina;
    return empleadosProcesadosOrdenados.slice(start, start + registrosPorPagina);
  }, [empleadosProcesadosOrdenados, pageSemanal, registrosPorPagina]);

  const handleOpenHistorial = (emp: any) => {
    setSelectedEmpleadoModal({
      id: emp.id,
      nombre: emp.nombre || `Empleado #${emp.id}`,
      cargo: emp.cargo || 'Sin cargo',
      documento: emp.documento || '',
      registros: {
        inicioJornada: null,
        inicioAlmuerzo: null,
        finAlmuerzo: null,
        finJornada: null,
        observaciones: {},
      }
    });
    setModalHistorialOpen(true);
  };

  return (
    <Box>
      {/* Modal de Marcaciones e Historial Diario */}
      {modalHistorialOpen && selectedEmpleadoModal && (
        <HistorialHorasModal
          open={modalHistorialOpen}
          onClose={() => setModalHistorialOpen(false)}
          empleado={selectedEmpleadoModal}
          tiendaId={storeSel ? Number(storeSel) : 0}
          todasNovedades={todasNovedades}
        />
      )}

      {/* Toolbar Unificada de Filtros y Configuración */}
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Fila 1 Principal Minimalista */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {/* Modo de Visualización */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Tipo de Reporte:</Typography>
            <ToggleButtonGroup
              value={reporteSemanalModo}
              exclusive
              onChange={(_, newModo) => newModo && setReporteSemanalModo(newModo)}
              size="small"
              sx={{
                bgcolor: '#e2e8f0',
                p: '3px',
                borderRadius: 2.5,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#475569',
                  '&.Mui-selected': {
                    bgcolor: '#004680',
                    color: '#fff',
                    boxShadow: '0 2px 4px rgba(0,70,128,0.2)',
                    '&:hover': { bgcolor: '#003366' },
                  },
                },
              }}
            >
              <ToggleButton value="tienda" data-tour="reporte-tour-modo-tienda">
                Ver por Tienda
              </ToggleButton>
              <ToggleButton value="empleado" data-tour="reporte-tour-modo-empleado">
                Ver por Empleado
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Chip Informativo Resumido (visibilidad directa rápida) */}
            {!filtrosAbiertos && (() => {
              const nombreIni = DIAS_DE_LA_SEMANA.find(d => d.value === diaInicioSemana)?.label || 'Lunes';
              const endDayVal = (diaInicioSemana + 6) % 7;
              const nombreFinAuto = DIAS_DE_LA_SEMANA.find(d => d.value === endDayVal)?.label || 'Domingo';
              const nombreFin = DIAS_DE_LA_SEMANA.find(d => d.value === diaFinSemana)?.label || 'Domingo';
              const textoChip = diaInicioSemana === diaFinSemana ? `${nombreIni} a ${nombreFinAuto}` : `${nombreIni} a ${nombreFin}`;
              return (
                <Chip
                  icon={<InfoOutlinedIcon sx={{ fontSize: '0.9rem !important', color: '#0284c7 !important' }} />}
                  label={`Semana: ${textoChip}`}
                  size="small"
                  onClick={() => setFiltrosAbiertos(true)}
                  sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, borderRadius: 2, height: 32, fontSize: '0.78rem', cursor: 'pointer' }}
                />
              );
            })()}
          </Box>

          {/* Selector de Período y Botón de Opciones/Filtros */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Período Laboral:</Typography>
            <FormControl size="small" sx={{ width: 140 }}>
              <InputLabel id="select-mes-label">Mes</InputLabel>
              <Select
                labelId="select-mes-label"
                value={selectedMonth}
                label="Mes"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{ borderRadius: 2, bgcolor: '#fff' }}
              >
                {listadoMeses.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 110 }}>
              <InputLabel id="select-anio-label">Año</InputLabel>
              <Select
                labelId="select-anio-label"
                value={selectedYear}
                label="Año"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: 2, bgcolor: '#fff' }}
              >
                {listadoAnios.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant={filtrosAbiertos ? 'contained' : 'outlined'}
              startIcon={<TuneIcon />}
              onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                height: 38,
                px: 2,
                bgcolor: filtrosAbiertos ? '#004680' : '#fff',
                color: filtrosAbiertos ? '#fff' : '#004680',
                borderColor: '#004680',
                '&:hover': {
                  bgcolor: filtrosAbiertos ? '#003366' : 'rgba(0,70,128,0.04)',
                }
              }}
            >
              Filtros {filtrosAbiertos ? '▲' : '▼'}
            </Button>

            {cargandoRecords || cargandoEmpleados ? (
              <CircularProgress size={20} sx={{ color: '#004680', ml: 0.5 }} />
            ) : null}
          </Stack>
        </Box>

        {/* Panel Desplegable de Ajustes Avanzados */}
        <Collapse in={filtrosAbiertos}>
          <Box sx={{ pt: 1.5, mt: 1, borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {/* Estructura Semanal */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Estructura Semana:
              </Typography>
              {setDiaInicioSemana && (
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel id="select-dia-inicio-label">Inicio</InputLabel>
                  <Select
                    labelId="select-dia-inicio-label"
                    value={diaInicioSemana}
                    label="Inicio"
                    onChange={(e) => setDiaInicioSemana(Number(e.target.value))}
                    sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: '0.85rem' }}
                  >
                    {DIAS_DE_LA_SEMANA.map((d) => (
                      <MenuItem key={`ini-${d.value}`} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {setDiaFinSemana && (
                <FormControl size="small" sx={{ width: 130 }}>
                  <InputLabel id="select-dia-fin-label">Fin</InputLabel>
                  <Select
                    labelId="select-dia-fin-label"
                    value={diaFinSemana}
                    label="Fin"
                    onChange={(e) => setDiaFinSemana(Number(e.target.value))}
                    sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: '0.85rem' }}
                  >
                    {DIAS_DE_LA_SEMANA.map((d) => (
                      <MenuItem key={`fin-${d.value}`} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {diaInicioSemana !== undefined && diaFinSemana !== undefined && (() => {
                const nombreIni = DIAS_DE_LA_SEMANA.find(d => d.value === diaInicioSemana)?.label || 'Lunes';
                const endDayVal = (diaInicioSemana + 6) % 7;
                const nombreFinAuto = DIAS_DE_LA_SEMANA.find(d => d.value === endDayVal)?.label || 'Domingo';
                const nombreFin = DIAS_DE_LA_SEMANA.find(d => d.value === diaFinSemana)?.label || 'Domingo';
                const totalDias = diaInicioSemana === diaFinSemana
                  ? 7
                  : (diaFinSemana - diaInicioSemana + (diaFinSemana < diaInicioSemana ? 7 : 0) + 1);
                const textoRango = diaInicioSemana === diaFinSemana
                  ? `${nombreIni} a ${nombreFinAuto} (7 días)`
                  : `${nombreIni} a ${nombreFin} (${totalDias} días)`;
                return (
                  <Chip
                    icon={<InfoOutlinedIcon sx={{ fontSize: '0.95rem !important', color: '#0284c7 !important' }} />}
                    label={textoRango}
                    size="small"
                    sx={{
                      bgcolor: '#e0f2fe',
                      color: '#0369a1',
                      fontWeight: 600,
                      borderRadius: 2,
                      height: 32,
                      fontSize: '0.78rem',
                      border: '1px solid #bae6fd'
                    }}
                  />
                );
              })()}
            </Stack>

            {/* Ordenamiento */}
            {reporteSemanalModo === 'tienda' && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Ordenamiento:
                </Typography>
                <FormControl size="small" sx={{ width: 170 }}>
                  <Select
                    value={ordenamientoModo}
                    onChange={(e) => setOrdenamientoModo(e.target.value as 'tienda' | 'nombre')}
                    sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: '0.85rem' }}
                  >
                    <MenuItem value="tienda">Por Tienda</MenuItem>
                    <MenuItem value="nombre">Por Nombre (A-Z)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}

            {/* Autocomplete Empleado (Solo en Modo Empleado) */}
            {reporteSemanalModo === 'empleado' && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Empleado:
                </Typography>
                <Autocomplete
                  size="small"
                  options={todosEmpleados}
                  getOptionLabel={(option) => option.nombre}
                  filterOptions={(options, { inputValue }) => {
                    const cleanInput = inputValue.toLowerCase().trim();
                    return options.filter(option => 
                      option.nombre.toLowerCase().includes(cleanInput) || 
                      (option.documento || '').toLowerCase().includes(cleanInput) ||
                      String(option.id).includes(cleanInput)
                    );
                  }}
                  value={todosEmpleados.find(e => Number(e.id) === Number(selectedEmpleadoId)) || null}
                  onChange={(_, newValue) => {
                    setSelectedEmpleadoId(newValue ? Number(newValue.id) : null);
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      placeholder="Buscar por nombre o CC..."
                      sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }} 
                    />
                  )}
                />
              </Stack>
            )}
          </Box>
        </Collapse>
      </Box>

      <ReporteSemanalTabla
        reporteSemanalModo={reporteSemanalModo}
        semanasDelMes={semanasDelMes}
        empleadosPaginadosFinales={empleadosPaginadosFinales}
        tiendasMap={tiendasMap}
        getAvatarColor={getAvatarColor}
        calcularMinutosSemanales={calcularMinutosSemanales}
        formatMinutes={formatMinutes}
        recordsMensuales={recordsMensuales}
        handleOpenHistorial={handleOpenHistorial}
        empleadosFiltradosSemanales={empleadosFiltradosSemanales}
        registrosPorPagina={registrosPorPagina}
        setRegistrosPorPagina={setRegistrosPorPagina}
        pageSemanal={pageSemanal}
        setPageSemanal={setPageSemanal}
        totalPagesCalculados={totalPagesCalculados}
        selectedEmpleadoId={selectedEmpleadoId}
        storesTrabajadas={storesTrabajadas}
        recordsSelectedEmp={recordsSelectedEmp}
      />
    </Box>
  );
}
