import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
 ArcElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { MesResumen } from '../types';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

interface ChartsProps {
  mesResumen: MesResumen | null;
}

export const Charts: React.FC<ChartsProps> = ({ mesResumen }) => {
  if (!mesResumen) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-80 animate-pulse"></div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-80 animate-pulse"></div>
      </div>
    );
  }

  // Datos para gráfico de top 10 vendedores con mayores comisiones
  const allEmpleados = mesResumen.tiendas.flatMap(tienda =>
    tienda.empleados.map(empleado => ({
      ...empleado,
      tiendaNombre: tienda.tienda
    }))
  );
  
  const topVendedores = allEmpleados
    .filter(e => e.rol.toLowerCase() === 'asesor') // Filtrar solo asesores
    .sort((a, b) => b.comision_monto - a.comision_monto) // Ordenar por comisión descendente
    .slice(0, 10); // Tomar los primeros 10

  const vendedoresLabels = topVendedores.map(e => `${e.tiendaNombre} - ${e.nombre}`);
  const vendedoresData = topVendedores.map(e => e.comision_monto);

  const vendedoresChartData = {
    labels: vendedoresLabels,
    datasets: [
      {
        label: 'Comisiones ($)',
        data: vendedoresData,
        backgroundColor: '#3b82f6',
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  // Datos para gráfico de distribución de comisiones
  const commissionDistributionData = {
    labels: ['Gerentes', 'Asesores', 'Cajeros'],
    datasets: [
      {
        data: [
          mesResumen.comisiones_por_rol.gerente,
          mesResumen.comisiones_por_rol.asesor,
          mesResumen.comisiones_por_rol.cajero,
        ],
        backgroundColor: ['#a855f7', '#3b82f6', '#f59e0b'],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const value = context.parsed.x || 0;
            if (value >= 1000000) {
              return `Ventas: $${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `Ventas: $${(value / 1000).toFixed(1)}K`;
            } else {
              return `Ventas: $${value.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numValue >= 100000) {
              return '$' + (numValue / 1000000).toFixed(1) + 'M';
            } else if (numValue >= 1000) {
              return '$' + Math.round(numValue / 1000) + 'K';
            } else {
              return '$' + Math.round(numValue).toLocaleString();
            }
          },
        },
      },
      y: {
        // No se necesita configuración adicional para el eje Y
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const value = context.parsed || 0;
            if (value >= 1000000) {
              return `Comisión: $${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `Comisión: $${(value / 1000).toFixed(1)}K`;
            } else {
              return `Comisión: $${value.toLocaleString()}`;
            }
          }
        }
      }
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Top 10 Vendedores */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Top 10 Vendedores por Comisiones</h3>
        <div className="h-80">
          <Bar
           data={vendedoresChartData}
           options={{
             ...barChartOptions,
             indexAxis: 'y', // Orientación horizontal (barras horizontales)
             plugins: {
               ...barChartOptions.plugins,
               tooltip: {
                 callbacks: {
                   label: function(context) {
                     const value = context.parsed.x || 0;
                     if (value >= 1000000) {
                       return `Comisión: $${Math.round(value / 1000000)}M`;
                     } else if (value >= 1000) {
                       return `Comisión: $${Math.round(value / 1000)}K`;
                     } else {
                       return `Comisión: $${Math.round(value).toLocaleString()}`;
                     }
                   }
                 }
               }
             },
             scales: {
               x: { // El eje X ahora es el eje de valores
                 beginAtZero: true,
                 ticks: {
                   callback: function(value: string | number) {
                     const numValue = typeof value === 'string' ? parseFloat(value) : value;
                     if (numValue >= 1000000) {
                       return '$' + Math.round(numValue / 1000000) + 'M';
                     } else if (numValue >= 1000) {
                       return '$' + Math.round(numValue / 1000) + 'K';
                     } else {
                       return '$' + Math.round(numValue).toLocaleString();
                     }
                   },
                 },
               },
               y: { // El eje Y ahora es el eje de categorías
                 // No se necesita configuración adicional para el eje Y
               },
             },
           }}
         />
        </div>
      </div>

      {/* Gráfico de Distribución de Comisiones */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Distribución de Comisiones por Rol</h3>
        <div className="h-80">
          <Doughnut
            data={commissionDistributionData}
            options={doughnutChartOptions}
          />
        </div>
      </div>
    </div>
  );
};
