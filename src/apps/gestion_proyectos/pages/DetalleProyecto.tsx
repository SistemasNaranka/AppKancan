import { useParams, useNavigate } from "react-router-dom";
import {
  useProyectoById,
  getEstadoColor,
  getEstadoLabel,
} from "../hooks/useProyectos";
import { formatTiempo, getTextoFrecuencia } from "../lib/calculos";

/**
 * Página de detalle de un proyecto
 */
export default function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proyecto, metricas, loading, error } = useProyectoById(id || "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/gestion_proyectos")}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Volver a proyectos
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Proyecto no encontrado"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/gestion_proyectos")}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Volver a proyectos
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {proyecto.nombre}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(
                  proyecto.estado,
                )}`}
              >
                {getEstadoLabel(proyecto.estado)}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{proyecto.descripcion}</p>
          </div>

          <button
            onClick={() => navigate(`/gestion_proyectos/${id}/postlanzamiento`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📝 Post-Lanzamiento
          </button>
        </div>
      </div>

      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Información General
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Área Beneficiada</p>
            <p className="font-medium text-gray-900">
              {proyecto.area_beneficiada}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Encargados</p>
            <p className="font-medium text-gray-900">
              {proyecto.encargados?.map((e: any) => e.nombre).join(", ") ||
                "Sin asignar"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de Inicio</p>
            <p className="font-medium text-gray-900">{proyecto.fecha_inicio}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de Entrega</p>
            <p className="font-medium text-gray-900">
              {proyecto.fecha_entrega}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas de Tiempo */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          ⏱️ Impacto en Tiempos
        </h2>

        {/* Tarjetas de ahorro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700">Ahorro Mensual</p>
            <p className="text-2xl font-bold text-green-800">
              {formatTiempo(metricas.ahorro_total_mensual)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700">Ahorro Anual</p>
            <p className="text-2xl font-bold text-green-800">
              {formatTiempo(metricas.ahorro_total_anual)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700">Total Procesos</p>
            <p className="text-2xl font-bold text-blue-800">
              {metricas.total_procesos}
            </p>
          </div>
        </div>

        {/* Lista de Procesos */}
        {proyecto.procesos && proyecto.procesos.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Detalle de Procesos</h3>
            {proyecto.procesos.map((proceso, index) => {
              const mProceso = metricas.procesos[index] || {
                ahorro_por_ejecucion: 0,
                ahorro_mensual: 0,
                ahorro_anual: 0,
              };

              return (
                <div
                  key={proceso.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {index + 1}. {proceso.nombre}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Frecuencia:{" "}
                        {getTextoFrecuencia(
                          proceso.frecuencia_tipo as any,
                          proceso.frecuencia_cantidad,
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Ahorro por ejecución
                      </p>
                      <p className="font-medium text-green-600">
                        {proceso.tiempo_antes}s → {proceso.tiempo_despues}s
                        <span className="ml-2 text-green-700">
                          (-{proceso.tiempo_antes - proceso.tiempo_despues}s)
                        </span>
                      </p>
                    </div>
                  </div>

                  {mProceso.ahorro_mensual > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <span className="text-gray-600">
                        ⏱️ Ahorra {formatTiempo(mProceso.ahorro_mensual)}/mes (
                        {formatTiempo(mProceso.ahorro_anual)}/año)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No hay procesos registrados para este proyecto</p>
          </div>
        )}
      </div>

      {/* Beneficios */}
      {proyecto.beneficios && proyecto.beneficios.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ⭐ Beneficios del Proyecto
            </h2>
          </div>

          <div className="space-y-3">
            {proyecto.beneficios.slice(0, 3).map((beneficio) => (
              <div
                key={beneficio.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900">
                    {beneficio.descripcion}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
