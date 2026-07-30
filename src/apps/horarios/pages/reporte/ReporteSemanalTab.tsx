import React, { useState } from 'react';
import {
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, IconButton, Alert, Autocomplete, TextField, Tooltip, Paper, Chip,
  ToggleButton, ToggleButtonGroup, Stack, Collapse
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TuneIcon from '@mui/icons-material/Tune';
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
  cargandoTodosEmpleados,
  cargandoRecordsGlobal,
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

      {reporteSemanalModo === 'tienda' ? (
        // MODO TIENDA
        <>
          <TableContainer sx={{ overflow: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tienda</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Cargo</TableCell>
                  {semanasDelMes.map((sem, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                      Semana {idx + 1}
                      <Typography variant="caption" display="block" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {sem.label}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#e6f4ea', color: '#137333' }}>
                    Total Mes
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleadosPaginadosFinales.map((emp: any, idx: number) => {
                  const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
                  const inicial = nombreEmpleado.charAt(0).toUpperCase();
                  const positionName = emp.cargo || 'Sin cargo';
                  const nombreTienda = tiendasMap.get(Number(emp.storeId)) || (emp.storeId ? `Tienda #${emp.storeId}` : 'Sin tienda');

                  let totalMinutesMonth = 0;

                  return (
                    <TableRow
                      key={emp.id || idx}
                      hover
                      sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                    >
                      <TableCell sx={{ py: 1.5, fontWeight: 600, color: '#004680' }}>
                        {nombreTienda}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                            {inicial}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                            {emp.documento && (
                              <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {emp.documento}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>
                        {positionName}
                      </TableCell>
                        {semanasDelMes.map((sem, sIdx) => {
                          const minSemana = calcularMinutosSemanales(emp.id, sem.start, sem.end, recordsMensuales);
                          totalMinutesMonth += minSemana;
                          return (
                            <TableCell key={sIdx} align="center" sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: minSemana > 0 ? 600 : 400, color: minSemana > 0 ? '#1e293b' : '#94a3b8' }}>
                                {formatMinutes(minSemana)}
                              </Typography>
                            </TableCell>
                          );
                        })}
                        <TableCell align="center" sx={{ py: 1.5, bgcolor: '#f4fbf7', fontWeight: 700, color: '#137333' }}>
                          {formatMinutes(totalMinutesMonth)}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Tooltip title="Ver Marcaciones e Historial Diario">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenHistorial(emp)}
                              sx={{
                                color: '#004680',
                                bgcolor: '#eaf2fb',
                                '&:hover': { bgcolor: '#d0e2f7' }
                              }}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {empleadosFiltradosSemanales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5 + semanasDelMes.length} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                          No se encontraron empleados en el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginador Semanal */}
            {empleadosFiltradosSemanales.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="#64748b">
                    Mostrando {empleadosPaginadosFinales.length} de {empleadosFiltradosSemanales.length} empleados
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="#64748b">
                      Registros por página:
                    </Typography>
                    <Select
                      value={registrosPorPagina}
                      onChange={(e) => {
                        setRegistrosPorPagina(Number(e.target.value));
                        setPageSemanal(0);
                      }}
                      size="small"
                      sx={{
                        bgcolor: '#f1f7fe',
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        minWidth: 70,
                        height: 30,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' }
                      }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                    </Select>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton size="small" disabled={pageSemanal === 0} onClick={() => setPageSemanal((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  {(() => {
                    const paginas: (number | string)[] = [];
                    if (totalPagesCalculados <= 7) {
                      for (let i = 0; i < totalPagesCalculados; i++) paginas.push(i);
                    } else {
                      paginas.push(0);
                      if (pageSemanal > 2) paginas.push('dots-1');
                      const start = Math.max(1, pageSemanal - 1);
                      const end = Math.min(totalPagesCalculados - 2, pageSemanal + 1);
                      for (let i = start; i <= end; i++) paginas.push(i);
                      if (pageSemanal < totalPagesCalculados - 3) paginas.push('dots-2');
                      paginas.push(totalPagesCalculados - 1);
                    }
                    return paginas.map((item, idx) =>
                      typeof item === 'string' ? (
                        <Typography key={`${item}-${idx}`} variant="caption" sx={{ color: '#94a3b8', px: 0.5 }}>...</Typography>
                      ) : (
                        <Box
                          key={item}
                          onClick={() => setPageSemanal(item)}
                          sx={{
                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                            bgcolor: pageSemanal === item ? '#004680' : '#fff', color: pageSemanal === item ? '#fff' : '#5e6f8d',
                            border: pageSemanal === item ? 'none' : '1px solid #dfe4ec', fontWeight: pageSemanal === item ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                            '&:hover': { bgcolor: pageSemanal === item ? '#004680' : '#f1f5f9' }
                          }}
                        >
                          {item + 1}
                        </Box>
                      )
                    );
                  })()}
                  <IconButton size="small" disabled={pageSemanal === totalPagesCalculados - 1} onClick={() => setPageSemanal((p) => Math.min(p + 1, totalPagesCalculados - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
      ) : (
        // MODO EMPLEADO
        <>

          {/* Resultado Modo Empleado */}
          {!selectedEmpleadoId ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Alert severity="info" sx={{ width: '100%', borderRadius: 2 }}>
                Por favor, selecciona un empleado en el filtro para consultar su reporte detallado por tienda.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {storesTrabajadas.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="#94a3b8">
                    El empleado no registra horas trabajadas en el mes seleccionado.
                  </Typography>
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                  }}
                >
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ color: '#1e293b', fontWeight: 700, py: 1.5 }}>
                            Tienda
                          </TableCell>
                          {semanasDelMes.map((sem, idx) => (
                            <TableCell key={idx} align="center" sx={{ color: '#1e293b', fontWeight: 700, py: 1.5 }}>
                              Semana {idx + 1}
                              <Typography variant="caption" display="block" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                                {sem.label}
                              </Typography>
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{ color: '#137333', fontWeight: 700, py: 1.5, bgcolor: '#e6f4ea' }}>
                            Total Tienda
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {/* Filas por cada tienda donde laboró el empleado */}
                        {storesTrabajadas.map((st, idx) => {
                          const recordsTienda = recordsSelectedEmp.filter(
                            (r) => Number(r.store_id?.id || r.store_id) === st.id
                          );
                          let totalMinutesStore = 0;
                          const isEven = idx % 2 === 0;

                          return (
                            <TableRow key={st.id} sx={{ bgcolor: isEven ? '#ffffff' : '#f8fafc' }}>
                              <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.75 }}>
                                {st.name}
                              </TableCell>
                              {semanasDelMes.map((sem, sIdx) => {
                                const minSemana = calcularMinutosSemanales(
                                  selectedEmpleadoId,
                                  sem.start,
                                  sem.end,
                                  recordsTienda
                                );
                                totalMinutesStore += minSemana;
                                return (
                                  <TableCell key={sIdx} align="center" sx={{ py: 1.75 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: minSemana > 0 ? 600 : 400,
                                        color: minSemana > 0 ? '#0f172a' : '#94a3b8',
                                      }}
                                    >
                                      {formatMinutes(minSemana)}
                                    </Typography>
                                  </TableCell>
                                );
                              })}
                              <TableCell
                                align="center"
                                sx={{ py: 1.75, bgcolor: isEven ? '#f4fbf7' : '#eaf7f0', fontWeight: 700, color: '#137333' }}
                              >
                                {formatMinutes(totalMinutesStore)}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Fila Final Unificada de TOTAL EMPLEADO (Solo si laboró en más de 1 tienda) */}
                        {storesTrabajadas.length > 1 && (() => {
                          let grandTotalAllStores = 0;
                          return (
                            <TableRow sx={{ bgcolor: '#eef6ff', borderTop: '2px solid #004680' }}>
                              <TableCell sx={{ fontWeight: 800, color: '#004680', py: 2 }}>
                                TOTAL EMPLEADO
                              </TableCell>

                              {semanasDelMes.map((sem, sIdx) => {
                                const minSemanaEmp = calcularMinutosSemanales(
                                  selectedEmpleadoId,
                                  sem.start,
                                  sem.end,
                                  recordsSelectedEmp
                                );
                                grandTotalAllStores += minSemanaEmp;
                                return (
                                  <TableCell key={sIdx} align="center" sx={{ py: 2 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: minSemanaEmp > 0 ? 800 : 400,
                                        color: minSemanaEmp > 0 ? '#004680' : '#94a3b8',
                                      }}
                                    >
                                      {formatMinutes(minSemanaEmp)}
                                    </Typography>
                                  </TableCell>
                                );
                              })}

                              <TableCell
                                align="center"
                                sx={{
                                  py: 2,
                                  bgcolor: '#d4edda',
                                  fontWeight: 900,
                                  fontSize: '0.95rem',
                                  color: '#155724',
                                }}
                              >
                                {formatMinutes(grandTotalAllStores)}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
