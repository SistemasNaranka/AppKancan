import React, { useState } from 'react';
import {
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, IconButton, Alert, Autocomplete, TextField, Tooltip, Paper
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import HistorialHorasModal from '@/apps/horarios/components/HistorialHorasModal';
import { getAvatarColor, calcularMinutosSemanales, formatMinutes } from './ReporteUtils';

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
  paginatedEmpleadosSemanal,
  empleadosFiltradosSemanales,
  recordsMensuales,
  pageSemanal,
  setPageSemanal,
  totalPagesSemanal,
  todosEmpleados,
  selectedEmpleadoId,
  setSelectedEmpleadoId,
  recordsSelectedEmp,
  cargandoTodosEmpleados,
  cargandoRecordsGlobal,
  storesTrabajadas,
  todasNovedades = [],
}: ReporteSemanalTabProps) {
  const [selectedEmpleadoModal, setSelectedEmpleadoModal] = useState<any | null>(null);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);

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

      {/* Control de Modo: Por Tienda / Por Empleado */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eef2f6', bgcolor: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Tipo de Reporte:</Typography>
        <Button
          data-tour="reporte-tour-modo-tienda"
          variant={reporteSemanalModo === 'tienda' ? 'contained' : 'outlined'}
          onClick={() => setReporteSemanalModo('tienda')}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: reporteSemanalModo === 'tienda' ? '#004680' : 'transparent',
            color: reporteSemanalModo === 'tienda' ? '#fff' : '#004680',
            borderColor: '#004680',
            '&:hover': {
              bgcolor: reporteSemanalModo === 'tienda' ? '#003366' : 'rgba(0, 70, 128, 0.04)',
              borderColor: '#004680'
            }
          }}
        >
          Ver por Tienda
        </Button>
        <Button
          data-tour="reporte-tour-modo-empleado"
          variant={reporteSemanalModo === 'empleado' ? 'contained' : 'outlined'}
          onClick={() => setReporteSemanalModo('empleado')}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: reporteSemanalModo === 'empleado' ? '#004680' : 'transparent',
            color: reporteSemanalModo === 'empleado' ? '#fff' : '#004680',
            borderColor: '#004680',
            '&:hover': {
              bgcolor: reporteSemanalModo === 'empleado' ? '#003366' : 'rgba(0, 70, 128, 0.04)',
              borderColor: '#004680'
            }
          }}
        >
          Ver por Empleado
        </Button>
      </Box>

      {reporteSemanalModo === 'tienda' ? (
        // MODO TIENDA
        !storeSel ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>
              Por favor, selecciona una tienda en el buscador superior para visualizar el reporte semanal de horas.
            </Alert>
          </Box>
        ) : (
          <>
            {/* Selector de Mes/Año */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Período Laboral:</Typography>
              <FormControl size="small" sx={{ width: 160 }}>
                <InputLabel id="select-mes-label">Mes</InputLabel>
                <Select
                  labelId="select-mes-label"
                  value={selectedMonth}
                  label="Mes"
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  sx={{ borderRadius: 2 }}
                >
                  {listadoMeses.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel id="select-anio-label">Año</InputLabel>
                <Select
                  labelId="select-anio-label"
                  value={selectedYear}
                  label="Año"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  sx={{ borderRadius: 2 }}
                >
                  {listadoAnios.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {cargandoRecords || cargandoEmpleados ? (
                <CircularProgress size={20} sx={{ color: '#004680', ml: 1 }} />
              ) : null}
            </Box>

            {/* Tabla de reporte semanal */}
            <TableContainer sx={{ overflow: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#f0f7ff' }}>
                  <TableRow>
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
                  {paginatedEmpleadosSemanal.map((emp: any, idx: number) => {
                    const nombreEmpleado = emp.nombre || `Empleado #${emp.id}`;
                    const inicial = nombreEmpleado.charAt(0).toUpperCase();
                    const positionName = emp.cargo || 'Sin cargo';

                    let totalMinutesMonth = 0;

                    return (
                      <TableRow
                        key={emp.id || idx}
                        hover
                        sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                      >
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
                      <TableCell colSpan={4 + semanasDelMes.length} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                          No se encontraron empleados para esta tienda
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
                <Typography variant="caption" color="#64748b">
                  Mostrando {paginatedEmpleadosSemanal.length} de {empleadosFiltradosSemanales.length} empleados
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton size="small" disabled={pageSemanal === 0} onClick={() => setPageSemanal((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  {[...Array(totalPagesSemanal)].map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setPageSemanal(i)}
                      sx={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                        bgcolor: pageSemanal === i ? '#004680' : '#fff', color: pageSemanal === i ? '#fff' : '#5e6f8d',
                        border: pageSemanal === i ? 'none' : '1px solid #dfe4ec', fontWeight: pageSemanal === i ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                        '&:hover': { bgcolor: pageSemanal === i ? '#004680' : '#f1f5f9' }
                      }}
                    >
                      {i + 1}
                    </Box>
                  ))}
                  <IconButton size="small" disabled={pageSemanal === totalPagesSemanal - 1} onClick={() => setPageSemanal((p) => Math.min(p + 1, totalPagesSemanal - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )
      ) : (
        // MODO EMPLEADO
        <>
          {/* Selector de Mes/Año + Buscador Empleado */}
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Filtros:</Typography>
            
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
                  label="Empleado" 
                  placeholder="Buscar por nombre o CC..."
                  sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                />
              )}
            />

            <FormControl size="small" sx={{ width: 160 }}>
              <InputLabel id="select-mes-emp-label">Mes</InputLabel>
              <Select
                labelId="select-mes-emp-label"
                value={selectedMonth}
                label="Mes"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {listadoMeses.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel id="select-anio-emp-label">Año</InputLabel>
              <Select
                labelId="select-anio-emp-label"
                value={selectedYear}
                label="Año"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {listadoAnios.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {cargandoTodosEmpleados || cargandoRecordsGlobal ? (
              <CircularProgress size={20} sx={{ color: '#004680', ml: 1 }} />
            ) : null}
          </Box>

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
