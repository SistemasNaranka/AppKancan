import React from 'react';
import {
  Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Box, Avatar, Typography, Tooltip, Chip, IconButton, Alert
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';

interface AreaManagerStoreTableProps {
  empleadosFiltrados: any[];
  empleados: any[];
  semanas: any[];
  records: any[];
  holidayMap: Record<string, string>;
  selectedYear: number;
  selectedMonth: number;
  LIMITE_HORAS_SEMANALES: number;
  calcularMinutosSemanales: (empId: number, start: string, end: string, records: any[]) => number;
  contarDomingosEmp: (empId: number, records: any[]) => number;
  obtenerFestivosTrabajadosEmp: (empId: number, records: any[], holidayMap: Record<string, string>, year: number, month: number) => any[];
  totalDomingosMes: number;
  totalFestivosMes: number;
  getAvatarColor: (name: string) => string;
  formatMinutes: (min: number) => string;
  DomingosChip: React.ComponentType<any>;
  FestivosChip: React.ComponentType<any>;
  setFestivosModalData: (data: any) => void;
  tourRun: boolean;
  tourStepIndex: number;
  setTourStepIndex: (idx: number) => void;
  setEmpleadoSeleccionado: (emp: any) => void;
  setHistorialOpen: (open: boolean) => void;
}

export const AreaManagerStoreTable: React.FC<AreaManagerStoreTableProps> = React.memo(({
  empleadosFiltrados,
  empleados,
  semanas,
  records,
  holidayMap,
  selectedYear,
  selectedMonth,
  LIMITE_HORAS_SEMANALES,
  calcularMinutosSemanales,
  contarDomingosEmp,
  obtenerFestivosTrabajadosEmp,
  totalDomingosMes,
  totalFestivosMes,
  getAvatarColor,
  formatMinutes,
  DomingosChip,
  FestivosChip,
  setFestivosModalData,
  tourRun,
  tourStepIndex,
  setTourStepIndex,
  setEmpleadoSeleccionado,
  setHistorialOpen,
}) => {
  if (empleadosFiltrados.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 3 }}>
        {(empleados as any[]).length === 0
          ? 'No hay empleados registrados en esta tienda para el período seleccionado.'
          : 'No se encontraron empleados con ese nombre.'}
      </Alert>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflowX: 'auto' }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow
            sx={{
              '& th': {
                bgcolor: '#F8FAFC', fontWeight: 700, fontSize: '0.72rem',
                color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em',
                py: 1.5, whiteSpace: 'nowrap',
              },
            }}
          >
            <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
            {semanas.map((s, i) => (
              <TableCell key={i} align="center" className={i === 0 ? 'tour-ch-semanas' : undefined} sx={{ minWidth: 80 }}>
                Sem. {i + 1}
                <br />
                <Typography
                  component="span"
                  sx={{ fontSize: '0.64rem', fontWeight: 500, color: '#94A3B8' }}
                >
                  {s.label}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center" className="tour-ch-total-mes" sx={{ minWidth: 80 }}>Total Mes</TableCell>
            <TableCell align="center" className="tour-ch-domingos" sx={{ minWidth: 90 }}>Domingos</TableCell>
            <TableCell align="center" className="tour-ch-festivos" sx={{ minWidth: 90 }}>Festivos</TableCell>
            <TableCell align="center" sx={{ minWidth: 60 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {empleadosFiltrados.map((emp: any, idx: number) => {
            const minutosSemanales = semanas.map(s =>
              calcularMinutosSemanales(emp.id, s.start, s.end, records),
            );
            const totalMinMes = minutosSemanales.reduce((a, b) => a + b, 0);
            const domingos = contarDomingosEmp(emp.id, records);
            const festivosTrabajados = obtenerFestivosTrabajadosEmp(
              emp.id,
              records,
              holidayMap,
              selectedYear,
              selectedMonth
            );
            const festivosCount = festivosTrabajados.length;

            const iniciales = (emp.nombre || 'XX')
              .split(' ')
              .slice(0, 2)
              .map((p: string) => p[0] || '')
              .join('')
              .toUpperCase();

            return (
              <TableRow
                key={emp.id}
                sx={{
                  '&:hover': { bgcolor: '#F8FAFC' },
                  '& td': { py: 1.25, borderColor: '#F1F5F9' },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar
                      sx={{
                        width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700,
                        bgcolor: getAvatarColor(emp.nombre || ''),
                        flexShrink: 0,
                      }}
                    >
                      {iniciales}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2, fontSize: '0.82rem' }}>
                        {emp.nombre}
                      </Typography>
                      {emp.cargo && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                          {emp.cargo}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                {minutosSemanales.map((min, i) => {
                  const horas = min / 60;
                  const esExtra = horas > LIMITE_HORAS_SEMANALES;
                  const horasExtra = Math.ceil(horas - LIMITE_HORAS_SEMANALES);

                  return (
                    <TableCell key={i} align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: esExtra ? 800 : 500,
                            fontSize: '0.82rem',
                            color: esExtra ? '#DC2626' : min === 0 ? '#CBD5E1' : '#1E293B',
                          }}
                        >
                          {formatMinutes(min)}
                        </Typography>
                        {esExtra && (
                          <Tooltip
                            title={`${horasExtra}h por encima del límite de ${LIMITE_HORAS_SEMANALES}h semanales`}
                            arrow
                          >
                            <Chip
                              icon={
                                <WarningAmberIcon
                                  sx={{ fontSize: '0.7rem !important', color: '#DC2626 !important' }}
                                />
                              }
                              label={`+${horasExtra}h extra`}
                              size="small"
                              sx={{
                                bgcolor: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                cursor: 'help',
                                '& .MuiChip-label': { px: 0.6 },
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}

                <TableCell align="center">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: totalMinMes === 0 ? '#CBD5E1' : '#004680',
                    }}
                  >
                    {formatMinutes(totalMinMes)}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <DomingosChip count={domingos} total={totalDomingosMes} />
                </TableCell>

                <TableCell align="center">
                  <FestivosChip
                    count={festivosCount}
                    total={totalFestivosMes}
                    onClick={() => {
                      setFestivosModalData({
                        open: true,
                        empleado: emp.nombre,
                        festivos: festivosTrabajados,
                      });
                    }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Tooltip title="Ver detalle de horas diarias" arrow>
                    <IconButton
                      size="small"
                      color="primary"
                      className={idx === 0 ? 'tour-ch-acciones' : undefined}
                      onClick={() => {
                        const mapFila = {
                          id: String(emp.id),
                          nombre: emp.nombre,
                          documento: emp.documento || '--',
                          cargo: emp.cargo || '',
                          inicioJornada: null,
                          inicioAlmuerzo: null,
                          finAlmuerzo: null,
                          finJornada: null,
                          estado: '',
                          tieneNovedad: false,
                          horasDia: '',
                          horasSemana: '',
                        };
                        if (tourRun && tourStepIndex === 6) {
                          setTourStepIndex(7);
                          return;
                        }
                        setEmpleadoSeleccionado(mapFila);
                        setHistorialOpen(true);
                      }}
                      sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
