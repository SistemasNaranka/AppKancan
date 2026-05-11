import { Proyecto } from "../types";
import { calculateProjectMetrics } from "../lib/calculos";

export interface MetricasTotales {
    totalAhorroMensual: number;
    totalAhorroAnual: number;
}

export const obtenerMetricasTotales = (proyectosFiltrados: Proyecto[]): MetricasTotales => {
    return proyectosFiltrados.reduce<MetricasTotales>(
        (acc, proyecto) => {
            const metricas = calculateProjectMetrics(proyecto.procesos ?? []);
            return {
                totalAhorroMensual: acc.totalAhorroMensual + metricas.ahorro_total_mensual,
                totalAhorroAnual: acc.totalAhorroAnual + metricas.ahorro_total_anual,
            };
        },
        { totalAhorroMensual: 0, totalAhorroAnual: 0 }
    );
};