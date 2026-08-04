import React from 'react';
import {
  Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, Avatar, Tooltip, IconButton, Select, MenuItem, Alert, Paper
} from '@mui/material';
import {
  History as HistoryIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

interface ReporteSemanalTablaProps {
  reporteSemanalModo: 'tienda' | 'empleado';
  semanasDelMes: any[];
  empleadosPaginadosFinales: any[];
  tiendasMap: Map<number, string>;
  getAvatarColor: (name: string) => string;
  calcularMinutosSemanales: (empId: number, start: string, end: string, records: any[]) => number;
  formatMinutes: (minutes: number) => string;
  recordsMensuales: any[];
  handleOpenHistorial: (emp: any) => void;
  empleadosFiltradosSemanales: any[];
  registrosPorPagina: number;
  setRegistrosPorPagina: (n: number) => void;
  pageSemanal: number;
  setPageSemanal: React.Dispatch<React.SetStateAction<number>>;
  totalPagesCalculados: number;
  selectedEmpleadoId: number | null;
  storesTrabajadas: any[];
  recordsSelectedEmp: any[];
}

export const ReporteSemanalTabla: React.FC<ReporteSemanalTablaProps> = React.memo(({
  reporteSemanalModo,
  semanasDelMes,
  empleadosPaginadosFinales,
  tiendasMap,
  getAvatarColor,
  calcularMinutosSemanales,
  formatMinutes,
  recordsMensuales,
  handleOpenHistorial,
  empleadosFiltradosSemanales,
  registrosPorPagina,
  setRegistrosPorPagina,
  pageSemanal,
  setPageSemanal,
  totalPagesCalculados,
  selectedEmpleadoId,
  storesTrabajadas,
  recordsSelectedEmp,
}) => {
  if (reporteSemanalModo === 'tienda') {
    return (
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
    );
  }

  return (
    <>
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
  );
});
