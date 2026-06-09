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
import { Select, MenuItem, Typography } from '@mui/material';
import { right } from '@popperjs/core';

export default function HistorialPage() {
  const [searchNombre, setSearchNombre] = useState('');
const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
const { data = [], isLoading, isError } = useHistorial(
  fechaInicio ? fechaInicio.format('YYYY-MM-DD') : undefined,
  fechaFin ? fechaFin.format('YYYY-MM-DD') : undefined
);
  const registrosHoy = data.filter(row => row.fecha === dayjs().format('YYYY-MM-DD')).length;

  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const datosFiltrados = data.filter((row) => {
    const cumpleNombre = normalizar(row.empleado).includes(normalizar(searchNombre));
    const cumpleFechaInicio = fechaInicio ? row.fecha >= fechaInicio.format('YYYY-MM-DD') : true;
    const cumpleFechaFin = fechaFin ? row.fecha <= fechaFin.format('YYYY-MM-DD') : true;
    return cumpleNombre && cumpleFechaInicio && cumpleFechaFin;
  });

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
    if (!inicio_turno || !fin_turno) return '—';

    const fecha = '2000-01-01';
    const inicio = dayjs(`${fecha} ${inicio_turno}`);
    const fin = dayjs(`${fecha} ${fin_turno}`);

    let minutos = fin.diff(inicio, 'minute');

    if (inicio_almuerzo && fin_almuerzo) {
      const iniAlmuerzo = dayjs(`${fecha} ${inicio_almuerzo}`);
      const finAlmuerzo = dayjs(`${fecha} ${fin_almuerzo}`);
      minutos -= finAlmuerzo.diff(iniAlmuerzo, 'minute');
    }

    if (minutos < 60) return `${minutos} min`;
    return `${(minutos / 60).toFixed(1)} hrs`;
  };

  const formatearHora = (hora: string | null): string => {
    if (!hora) return "-";
    return hora.slice(0, 5);
  };

  return (
    <div className="space-y-6 px-4">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#00407a', letterSpacing: '-0.02em', marginLeft:'11px'}}>
            Historial de Asistencia
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#5a6e85', mt: 0.5,  marginLeft:'11px' }}>
            Consulta y verifica los registros históricos de la jornada laboral
          </Typography>
        </div>
        <div className="flex gap-3">
  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
    <div className="p-2 bg-blue-50 rounded-full">
      <EventAvailableIcon sx={{ fontSize: 20, color: '#00407a' }} />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registros Hoy</p>
      <p className="text-lg font-bold text-[#00407a] leading-tight">{registrosHoy}</p>
    </div>
  </div>
</div>
      </section>
      
      {/* Filtros */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wider">Rango de Fechas</label>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">Desde</span>
                <DatePicker
                  value={fechaInicio}
                  onChange={(value) => { setFechaInicio(value ? dayjs(value) : null); setPaginaActual(1); }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      placeholder: 'Desde',
                      sx: { backgroundColor: '#e8f0fe', borderRadius: 2, flex: 2 }
                    }
                  }}
                />
                <div className="flex flex-col items-center gap-0.5">
                  {fechaInicio && fechaFin && (
                    <button
                    onClick={() => { setFechaInicio(null); setFechaFin(null); setPaginaActual(1); }}
                    className="text-xs text-[#00407a] hover:text-blue-500 transition-colors"
                    title="Limpiar fechas"
                  >
                    ↻
                  </button>
                )}
                <span className="text-xs text-gray-500">Hasta</span>
          </div>
                <DatePicker
                  value={fechaFin}
                  onChange={(value) => { setFechaFin(value ? dayjs(value) : null); setPaginaActual(1); }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      placeholder: 'Hasta',
                      sx: { backgroundColor: '#e8f0fe', borderRadius: 2, flex: 1 }
                    }
                  }}
                />
                
              </div>
            </LocalizationProvider>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wider">Nombre del Empleado</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchNombre}
                onChange={(e) => { setSearchNombre(e.target.value); setPaginaActual(1); }}
                className="w-full bg-[#e8f0fe] border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-primary"
              />
              <PersonSearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" sx={{ fontSize: 20 }} />
            </div>
          </div>
        </div>
      </section>

      {isLoading && <p className="text-center text-gray-500 py-4">Cargando registros...</p>}
      {isError && <p className="text-center text-red-500 py-4">Error al cargar los registros</p>}
      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#e8f0fe] border border-gray-300 rounded-t-xl">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                <th className="px-2 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inicio Turno</th>
                <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Almuerzo</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin Turno</th>
                <th className="px-3 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Horas</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {datosPaginados.map((row, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-200">
                  <td className="px-7 py-4 font-body-md text-gray-700 whitespace-nowrap">{row.fecha}</td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">{row.empleado}</td>
                  <td className="px-4 py-4 font-body-md text-gray-700 whitespace-nowrap">{formatearHora(row.inicio_turno)}</td>
                  <td className="px-4 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    {row.inicio_almuerzo && row.fin_almuerzo
                      ? `${formatearHora(row.inicio_almuerzo)} / ${formatearHora(row.fin_almuerzo)}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">{formatearHora(row.fin_turno)}</td>
                  <td className="px-6 py-4 font-body-md text-gray-700 whitespace-nowrap">
                    {calcularHoras(row.inicio_turno, row.fin_turno, row.inicio_almuerzo, row.fin_almuerzo)}
                  </td>
                  <td className="px-6 py-4 font-body-md text-gray-700 italic">
                    {row.observaciones ?? '—'}
                  </td>
                </tr>
              ))}
              {datosPaginados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No hay registros para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
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
              <MenuItem value={15}>15</MenuItem>
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
    </div>
  );
}