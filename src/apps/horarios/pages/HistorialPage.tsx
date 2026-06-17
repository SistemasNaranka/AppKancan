import { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { ObservationModal } from '../components/ObservationModal';
import DateRangeFilter from '../components/DateRangeFilter';
import { Eye } from 'lucide-react';
import { HistorialRow } from '../interfaces/horarios.interface';

export default function HistorialPage() {
  const [searchNombre, setSearchNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  const { data = [], isLoading, isError } = useHistorial(
    fechaInicio ? fechaInicio.format('YYYY-MM-DD') : undefined,
    fechaFin ? fechaFin.format('YYYY-MM-DD') : undefined
  );


  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const datosFiltrados = data.filter((row) => {
    const cumpleNombre = normalizar(row.empleado).includes(normalizar(searchNombre));
    const cumpleFechaInicio = fechaInicio ? row.fecha >= fechaInicio.format('YYYY-MM-DD') : true;
    const cumpleFechaFin = fechaFin ? row.fecha <= fechaFin.format('YYYY-MM-DD') : true;
    return cumpleNombre && cumpleFechaInicio && cumpleFechaFin;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState<HistorialRow | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

  const totalPaginas = registrosPorPagina === 0
    ? 1
    : Math.ceil(datosFiltrados.length / registrosPorPagina);

  const datosPaginados = registrosPorPagina === 0
    ? datosFiltrados
    : datosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
      );

  const calcularHoras = (
    inicio_turno: string | null,
    fin_turno: string | null,
    inicio_almuerzo: string | null,
    fin_almuerzo: string | null
  ): string => {
    if (!inicio_turno || !fin_turno) return '--';

    const fecha = '2000-01-01';
    const inicio = dayjs(`${fecha} ${inicio_turno}`);
    const fin = dayjs(`${fecha} ${fin_turno}`);

    let minutes = fin.diff(inicio, 'minute');

    if (inicio_almuerzo && fin_almuerzo) {
      const iniAlmuerzo = dayjs(`${fecha} ${inicio_almuerzo}`);
      const finAlmuerzo = dayjs(`${fecha} ${fin_almuerzo}`);
      minutes -= finAlmuerzo.diff(iniAlmuerzo, 'minutes');
    }
    return `${(minutes / 60).toFixed(2)} h`;
  };

  const formatearHora = (hora: string | null): string => {
    if (!hora) return "--";
    return hora.slice(0, 5);
  };

  const tieneObservacion = (row: HistorialRow, evento: string): boolean => {
    return row.observaciones_evento.some((obs) => obs.evento === evento);
  };

  return (
    <div className="space-y-4 px-0 -mt-2">

      {/* Filtros */}
      <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        {/* Encabezado de la sección de filtros */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg text-[#004680] bg-[#eaf2fb] border border-[#d6e6f7] shrink-0">
            <CalendarMonthIcon sx={{ fontSize: 18 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f2c4a] leading-tight">Filtros de búsqueda</h3>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="tour-hist-fechas space-y-1.5 flex-[2]">
            <DateRangeFilter
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              onChange={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); setPaginaActual(1); }}
            />
          </div>
          <div className="tour-hist-nombre space-y-1.5 flex-[1]">
  <div className="relative">
    <input
  type="text"
  placeholder="Buscar por nombre..."
  value={searchNombre}
  onChange={(e) => { setSearchNombre(e.target.value); setPaginaActual(1); }}
  className="w-full bg-[#e8f0fe] border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm transition-colors focus:outline-none focus:bg-white focus:border-[#004680] focus:ring-2 focus:ring-[#004680]/20"
/>
    <PersonSearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 20 }} />
  </div>
</div>
        </div>
      </section>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eef2f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', bgcolor: '#fff' }} className="tour-hist-tabla">
        <TableContainer sx={{ overflow: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f0f7ff' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Inicio Turno</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Inicio Almuerzo</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fin Almuerzo</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fin Turno</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Total Horas</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0', width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datosPaginados.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{
                    bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#eef4ff',
                    }
                  }}
                >
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                    {row.fecha}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                    {row.empleado}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                        {formatearHora(row.inicio_turno)}
                      </Typography>
                      {tieneObservacion(row, 'Comenzar Jornada') && (
                        <Box
                          component="button"
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#004680',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.25)' }
                          }}
                          title="Ver observaciones"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                        {formatearHora(row.inicio_almuerzo)}
                      </Typography>
                      {tieneObservacion(row, 'Iniciar Almuerzo') && (
                        <Box
                          component="button"
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#004680',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.25)' }
                          }}
                          title="Ver observaciones"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                        {formatearHora(row.fin_almuerzo)}
                      </Typography>
                      {tieneObservacion(row, 'Finalizar Almuerzo') && (
                        <Box
                          component="button"
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#004680',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.25)' }
                          }}
                          title="Ver observaciones"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                        {formatearHora(row.fin_turno)}
                      </Typography>
                      {tieneObservacion(row, 'Terminar Jornada') && (
                        <Box
                          component="button"
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#004680',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.25)' }
                          }}
                          title="Ver observaciones"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 600, color: '#004680', borderBottom: '1px solid #e2e8f0' }}>
                    {calcularHoras(row.inicio_turno, row.fin_turno, row.inicio_almuerzo, row.fin_almuerzo)}
                  </TableCell>
                  <TableCell sx={{ py: 1.5, textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    {row.observaciones_evento.length > 0 && (
                      <IconButton
                        onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                        title="Ver observaciones"
                        size="small"
                        sx={{
                          color: '#004680',
                          '&:hover': { bgcolor: '#eff6ff' }
                        }}
                      >
                        <Eye size={16} strokeWidth={2} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || datosPaginados.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                    {isLoading && <Typography variant="body2" sx={{ color: '#64748b' }}>Cargando registros...</Typography>}
                    {isError && <Typography variant="body2" sx={{ color: '#ef4444' }}>Error al cargar los registros</Typography>}
                    {!isLoading && !isError && <Typography variant="body2" sx={{ color: '#94a3b8' }}>No hay registros para mostrar</Typography>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Mostrando {datosPaginados.length} de {datosFiltrados.length} registros
            </Typography>
            <Select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              size="small"
              sx={{
                bgcolor: '#f1f7fe',
                borderRadius: 2,
                fontSize: '0.75rem',
                minWidth: 70,
                height: 30,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#cbd5e1'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#94a3b8'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#004680'
                }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              size="small"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => p - 1)}
              sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {(() => {
              const paginas: (number | string)[] = [];
              if (totalPaginas <= 5) {
                for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
              } else {
                paginas.push(1);
                if (paginaActual > 3) paginas.push('...');
                for (let i = Math.max(2, paginaActual - 1); i <= Math.min(totalPaginas - 1, paginaActual + 1); i++) {
                  paginas.push(i);
                }
                if (paginaActual < totalPaginas - 2) paginas.push('...');
                paginas.push(totalPaginas);
              }
              return paginas.map((num, idx) =>
                typeof num === 'string' ? (
                  <Typography key={`dots-${idx}`} variant="caption" sx={{ color: '#94a3b8', px: 0.5 }}>...</Typography>
                ) : (
                  <Box
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    sx={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      bgcolor: paginaActual === num ? '#004680' : '#fff',
                      color: paginaActual === num ? '#fff' : '#5e6f8d',
                      border: paginaActual === num ? 'none' : '1px solid #dfe4ec',
                      fontWeight: paginaActual === num ? 700 : 500,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: paginaActual === num ? '#004680' : '#f1f5f9' }
                    }}
                  >
                    {num}
                  </Box>
                )
              );
            })()}
            <IconButton
              size="small"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => p + 1)}
              sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <ObservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setFilaSeleccionada(null); }}
        empleado={filaSeleccionada?.empleado ?? ''}
        fecha={filaSeleccionada?.fecha ?? ''}
        observaciones={filaSeleccionada?.observaciones_evento ?? []}
      />
    </div>
  );
}