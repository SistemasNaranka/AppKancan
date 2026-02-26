import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useProyectos,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import { formatTiempo, calcularMetricasProyecto } from "../lib/calculos";

/**
 * Página principal del módulo de Gestión de Proyectos
 */
export default function Home() {
  const navigate = useNavigate();
  const { proyectos, loading, error, recargar } = useProyectos();
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  // Filtrar proyectos
  const proyectosFiltrados =
    filtroEstado === "todos"
      ? proyectos
      : proyectos.filter((p) => p.estado === filtroEstado);

  // Calcular métricas totales
  const metricasTotales = proyectosFiltrados.reduce(
    (acc, proyecto) => {
      const metricas = calcularMetricasProyecto(proyecto.procesos || []);
      return {
        totalAhorroMensual:
          acc.totalAhorroMensual + metricas.ahorro_total_mensual,
        totalAhorroAnual: acc.totalAhorroAnual + metricas.ahorro_total_anual,
      };
    },
    { totalAhorroMensual: 0, totalAhorroAnual: 0 },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={recargar}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Proyectos - Área de Sistemas
          </h1>
          <p className="text-gray-600 mt-1">
            Registro y seguimiento de proyectos desarrollados por el área de
            sistemas
          </p>
        </div>
        <button
          onClick={() => navigate("/gestion_proyectos/nuevo")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Proyectos</p>
          <p className="text-2xl font-bold text-gray-900">
            {proyectosFiltrados.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En Planning</p>
          <p className="text-2xl font-bold text-yellow-600">
            {proyectosFiltrados.filter((p) => p.estado === "en_proceso").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En Progreso</p>
          <p className="text-2xl font-bold text-blue-600">
            {proyectosFiltrados.filter((p) => p.estado === "en_proceso").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ahorro Mensual</p>
          <p className="text-2xl font-bold text-green-600">
            {formatTiempo(metricasTotales.totalAhorroMensual)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="en_proceso">En Proceso</option>
          <option value="entregado">Entregado</option>
          <option value="completado">Completado</option>
        </select>

        <button
          onClick={recargar}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Actualizar
        </button>
      </div>

      {/* Lista de Proyectos */}
      {proyectosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No hay proyectos registrados</p>
          <p className="text-gray-400 mt-2">
            Los proyectos que crees aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proyectosFiltrados.map((proyecto) => {
            const metricas = calcularMetricasProyecto(proyecto.procesos || []);
            return (
              <div
                key={proyecto.id}
                onClick={() => navigate(`/gestion_proyectos/${proyecto.id}`)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {proyecto.nombre}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                          proyecto.estado,
                        )}`}
                      >
                        {getEstadoLabel(proyecto.estado)}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Área Beneficiada</p>
                        <p className="font-medium text-gray-900">
                          {proyecto.area_beneficiada}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Encargados</p>
                        <p className="font-medium text-gray-900">
                          {proyecto.encargados
                            ?.map((e) => e.nombre)
                            .join(", ") || "Sin asignar"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fechas</p>
                        <p className="font-medium text-gray-900">
                          {proyecto.fecha_inicio} - {proyecto.fecha_entrega}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Procesos</p>
                        <p className="font-medium text-gray-900">
                          {metricas.total_procesos} paso(s)
                        </p>
                      </div>
                    </div>

                    {metricas.ahorro_total_mensual > 0 && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          ⏱️ Ahorro:{" "}
                          <span className="font-semibold">
                            {formatTiempo(metricas.ahorro_total_mensual)}/mes
                          </span>{" "}
                          ({formatTiempo(metricas.ahorro_total_anual)}/año)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
