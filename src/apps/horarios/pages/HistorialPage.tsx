import { useState } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { Select, MenuItem } from '@mui/material';
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
      <div className="tour-hist-tabla bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
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
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
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