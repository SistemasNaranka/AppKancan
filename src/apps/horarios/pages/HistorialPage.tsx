import { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { Select, MenuItem } from '@mui/material';
import { ObservationModal } from '../components/ObservationModal';
import { Eye } from 'lucide-react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { HistorialRow } from '../interfaces/horarios.interface';

export default function HistorialPage() {
  const [searchNombre, setSearchNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);

  const { data = [], isLoading, isError } = useHistorial(
    fechaInicio ? fechaInicio.format('YYYY-MM-DD') : undefined,
    fechaFin ? fechaFin.format('YYYY-MM-DD') : undefined
  );

  const registrosHoy = data.filter(row => row.fecha === dayjs().format('YYYY-MM-DD')).length;

  // Quita tildes y diacríticos para que la búsqueda no dependa de acentos
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

  // registrosPorPagina === 0 equivale a "Todos"
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

    // Fecha ficticia fija: solo importa la diferencia de horas, no el día
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
    <div className="space-y-6 px-0">

      {/* Filtros */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1.5 flex-[3]">
            <label style={{ fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280' }}>Rango de Fechas</label>
             <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <div className="flex gap-2 items-center">
                <DatePicker
  label="Desde"
  value={fechaInicio}
  onChange={(value) => { setFechaInicio(value ? dayjs(value) : null); setPaginaActual(1); }}
  format="DD/MM/YYYY"
  slotProps={{
    textField: {
      size: 'small',
      sx: {
        backgroundColor: '#e8f0fe',
        borderRadius: 2,
        flex: 2,
        minWidth: 170,
        '& .MuiInputLabel-root': {
          color: '#9ca3af',
        },
      }
    }
  }}
/>
                <div className="flex flex-col items-center gap-0.5">
                  {fechaInicio && fechaFin && (
                    <button
                      onClick={() => { setFechaInicio(null); setFechaFin(null); setPaginaActual(1); }}
                      className="text-[#00407a] hover:text-blue-500 transition-colors"
                      title="Limpiar fechas"
                    >
                      <RefreshIcon sx={{ fontSize: 16 }} />
                    </button>
                  )}
                </div>
                <DatePicker
  label="Hasta"
  value={fechaFin}
  onChange={(value) => { setFechaFin(value ? dayjs(value) : null); setPaginaActual(1); }}
  format="DD/MM/YYYY"
  slotProps={{
    textField: {
      size: 'small',
      sx: {
        backgroundColor: '#e8f0fe',
        borderRadius: 2,
        flex: 1,
        '& .MuiInputLabel-root': {
          color: '#9ca3af',
        },
      }
    }
  }}
/>
              </div>
            </LocalizationProvider>
          </div>
          <div className="space-y-1.5 flex-[2]">
  <label style={{ fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6b7280' }}>Nombre del Empleado</label>
  <div className="relative">
    <input
  type="text"
  placeholder="Buscar por nombre..."
  value={searchNombre}
  onChange={(e) => { setSearchNombre(e.target.value); setPaginaActual(1); }}
  className="w-full bg-[#e8f0fe] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
/>
    <PersonSearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" sx={{ fontSize: 20 }} />
  </div>
</div>
        </div>
      </section>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e8f0fe] border border-gray-300 rounded-t-xl">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inicio Turno</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inicio Almuerzo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin Almuerzo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin Turno</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Horas</th>
                <th className="px-3 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {datosPaginados.map((row, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-200">
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">{row.fecha}</td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">{row.empleado}</td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {formatearHora(row.inicio_turno)}
                      {tieneObservacion(row, 'Comenzar Jornada') && (
                        <button
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          className="w-2 h-2 rounded-full bg-[#00407a] hover:scale-125 transition-transform cursor-pointer"
                          title="Ver observaciones"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {formatearHora(row.inicio_almuerzo)}
                      {tieneObservacion(row, 'Iniciar Almuerzo') && (
                        <button
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          className="w-2 h-2 rounded-full bg-[#00407a] hover:scale-125 transition-transform cursor-pointer"
                          title="Ver observaciones"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {formatearHora(row.fin_almuerzo)}
                      {tieneObservacion(row, 'Finalizar Almuerzo') && (
                        <button
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          className="w-2 h-2 rounded-full bg-[#00407a] hover:scale-125 transition-transform cursor-pointer"
                          title="Ver observaciones"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {formatearHora(row.fin_turno)}
                      {tieneObservacion(row, 'Terminar Jornada') && (
                        <button
                          onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                          className="w-2 h-2 rounded-full bg-[#00407a] hover:scale-125 transition-transform cursor-pointer"
                          title="Ver observaciones"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    {calcularHoras(row.inicio_turno, row.fin_turno, row.inicio_almuerzo, row.fin_almuerzo)}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {row.observaciones_evento.length > 0 && (
                      <button
                        onClick={() => { setFilaSeleccionada(row); setModalOpen(true); }}
                        title="Ver observaciones"
                        className="inline-flex items-center justify-center rounded-full p-1 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Eye size={16} className="text-[#00407a]" strokeWidth={2} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(isLoading || isError || datosPaginados.length === 0) && (
  <tr>
    <td colSpan={8} className="px-6 py-12 text-center text-sm">
      {isLoading && <span className="text-gray-500">Cargando registros...</span>}
      {isError && <span className="text-red-500">Error al cargar los registros</span>}
      {!isLoading && !isError && <span className="text-gray-400">No hay registros para mostrar</span>}
    </td>
  </tr>
)}
            </tbody>
          </table>
        </div>

        {/* Paginación: arma los botones y mete "..." cuando hay más de 5 páginas */}
        <div className="px-4 py-4 flex items-center justify-between border-t border-gray-300">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Mostrando {datosPaginados.length} de {datosFiltrados.length} registros
            </p>
            <Select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              size="small"
              sx={{ backgroundColor: '#e8f0fe', borderRadius: 2, fontSize: '0.75rem', minWidth: 80 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={0}>Todos</MenuItem>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual((p) => p - 1)}
              disabled={paginaActual === 1}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
            >
              ‹
            </button>
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
                  <span key={`dots-${idx}`} className="text-gray-400 px-1">...</span>
                ) : (
                  <button
                    key={num}
                    onClick={() => setPaginaActual(num)}
                    className={`w-8 h-8 rounded text-xs font-semibold ${
                      paginaActual === num
                        ? 'bg-[#00407a] text-white'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    {num}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setPaginaActual((p) => p + 1)}
              disabled={paginaActual === totalPaginas}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>

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