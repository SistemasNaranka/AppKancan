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
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { TrendingUp, PieChart } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

interface ChartsProps {
  mesResumen: MesResumen | null;
}

export const Charts: React.FC<ChartsProps> = ({ mesResumen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  if (!mesResumen) {
    return (
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: 3 
        }}
      >
        <Card sx={{ height: 320 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={240} />
          </CardContent>
        </Card>
        <Card sx={{ height: 320 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={240} />
          </CardContent>
        </Card>
      </Box>
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
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.background.paper,
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
        backgroundColor: [
          theme.palette.secondary.main,
          theme.palette.primary.main,
          theme.palette.warning.main,
        ],
        borderColor: theme.palette.background.paper,
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
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const value = context.parsed.x || 0;
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
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
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
        grid: {
          color: theme.palette.divider,
        },
      },
      y: {
        ticks: {
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
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
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: 3 
      }}
    >
      {/* Gráfico de Top 10 Vendedores */}
      <Card sx={{ height: 320 }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUp color="primary" />
            <Typography variant="h6" component="h3" fontWeight="bold">
              Top 10 Vendedores por Comisiones
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 240 }}>
            <Bar
              data={vendedoresChartData}
              options={{
                ...barChartOptions,
                indexAxis: 'y' as const, // Orientación horizontal (barras horizontales)
                plugins: {
                  ...barChartOptions.plugins,
                  tooltip: {
                    ...barChartOptions.plugins?.tooltip,
                    callbacks: {
                      ...barChartOptions.plugins?.tooltip?.callbacks,
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
                      color: theme.palette.text.secondary,
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
                    grid: {
                      color: theme.palette.divider,
                    },
                  },
                  y: { // El eje Y ahora es el eje de categorías
                    ticks: {
                      color: theme.palette.text.secondary,
                    },
                    grid: {
                      color: theme.palette.divider,
                    },
                  },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Gráfico de Distribución de Comisiones */}
      <Card sx={{ height: 320 }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PieChart color="primary" />
            <Typography variant="h6" component="h3" fontWeight="bold">
              Distribución de Comisiones por Rol
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 240 }}>
            <Doughnut
              data={commissionDistributionData}
              options={doughnutChartOptions}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
