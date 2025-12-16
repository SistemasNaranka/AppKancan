import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Store,
  AccountBalance,
  People,
  PointOfSale,
  TrendingUp,
} from "@mui/icons-material";
import { MesResumen } from "../../types";
import { NoDataChartMessage } from "./NoDataChartMessage";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CommissionByStoreChartProps {
  mesResumen: MesResumen | null;
}

const roleConfig = {
  gerente: {
    label: "Gerentes",
    color: "#4CAF50",
    icon: <AccountBalance />,
    bgColor: "rgba(76, 175, 80, 0.1)",
  },
  asesor: {
    label: "Asesores",
    color: "#2196F3",
    icon: <People />,
    bgColor: "rgba(33, 150, 243, 0.1)",
  },
  cajero: {
    label: "Cajeros",
    color: "#FF9800",
    icon: <PointOfSale />,
    bgColor: "rgba(255, 152, 0, 0.1)",
  },
};

export const CommissionByStoreChart: React.FC<CommissionByStoreChartProps> = ({
  mesResumen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [viewMode, setViewMode] = useState<"grouped" | "stacked">("grouped");

  if (!mesResumen) {
    return (
      <Card sx={{ height: 450 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cargando comisiones por tienda...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Verificar si hay datos disponibles
  const hasData =
    mesResumen.tiendas &&
    mesResumen.tiendas.length > 0 &&
    mesResumen.tiendas.some(
      (tienda) => tienda.empleados && tienda.empleados.length > 0
    );

  if (!hasData) {
    return (
      <Card sx={{ height: 450 }}>
        <CardContent sx={{ height: "100%" }}>
          <NoDataChartMessage
            title="No hay datos de comisiones por tienda"
            message="No se encontraron datos de comisiones por tienda para hacer cálculos"
            icon="bar"
            height={350}
          />
        </CardContent>
      </Card>
    );
  }

  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: "grouped" | "stacked"
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const tiendas = mesResumen.tiendas.map((tienda) => tienda.tienda);

  // Calcular comisiones por rol y tienda
  const comisionesPorRol = {
    gerente: mesResumen.tiendas.map((tienda) =>
      tienda.empleados
        .filter((emp) => emp.rol.toLowerCase() === "gerente")
        .reduce((sum, emp) => sum + emp.comision_monto, 0)
    ),
    asesor: mesResumen.tiendas.map((tienda) =>
      tienda.empleados
        .filter((emp) => emp.rol.toLowerCase() === "asesor")
        .reduce((sum, emp) => sum + emp.comision_monto, 0)
    ),
    cajero: mesResumen.tiendas.map((tienda) =>
      tienda.empleados
        .filter((emp) => emp.rol.toLowerCase() === "cajero")
        .reduce((sum, emp) => sum + emp.comision_monto, 0)
    ),
  };

  const chartData = {
    labels: tiendas,
    datasets: Object.entries(roleConfig).map(([role, config]) => ({
      label: config.label,
      data: comisionesPorRol[role as keyof typeof comisionesPorRol],
      backgroundColor: config.color,
      borderColor: config.color,
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y || 0;
            if (value >= 1000000) {
              return `${context.dataset.label}: $${Math.round(
                value / 1000000
              )}M`; // Sin decimales
            } else if (value >= 1000) {
              return `${context.dataset.label}: $${Math.round(value / 1000)}K`; // Sin decimales
            } else {
              return `${context.dataset.label}: $${Math.round(
                value
              ).toLocaleString()}`; // Sin decimales
            }
          },
        },
      },
    },
    scales: {
      x: {
        stacked: viewMode === "stacked",
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: isMobile ? 0 : 45,
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        stacked: viewMode === "stacked",
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
          callback: function (value: string | number) {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            if (numValue >= 1000000) {
              return "$" + Math.round(numValue / 1000000) + "M"; // Sin decimales
            } else if (numValue >= 1000) {
              return "$" + Math.round(numValue / 1000) + "K"; // Sin decimales
            } else {
              return "$" + Math.round(numValue).toLocaleString(); // Sin decimales
            }
          },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  // Calcular estadísticas por tienda
  const getStoreStats = () => {
    const storeStats = mesResumen.tiendas.map((tienda, index) => {
      const totalComision =
        comisionesPorRol.gerente[index] +
        comisionesPorRol.asesor[index] +
        comisionesPorRol.cajero[index];

      const topRole = Object.entries(comisionesPorRol).reduce(
        (max, [role, values]) => {
          const value = values[index];
          return value > max.value ? { role, value } : max;
        },
        { role: "", value: 0 }
      );

      return {
        tienda: tienda.tienda,
        total: totalComision,
        topRole:
          roleConfig[topRole.role as keyof typeof roleConfig]?.label ||
          topRole.role,
        topValue: topRole.value,
      };
    });

    // Ordenar por total de comisión descendente y tomar las 8 principales
    return storeStats.sort((a, b) => b.total - a.total).slice(0, 8);
  };

  const storeStats = getStoreStats();

  return (
    <Card
      sx={{
        minHeight: isMobile ? 500 : 600,
        height: "auto",
        maxHeight: "90vh",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,242,245,0.95) 100%)",
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: isMobile ? 2 : 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: isMobile ? 2 : 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 0,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Store
              sx={{
                color: theme.palette.primary.main,
                fontSize: isMobile ? 24 : 32,
              }}
            />
            <Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                component="h3"
                fontWeight="bold"
                color="primary"
                textAlign={isMobile ? "center" : "left"}
              >
                Comisiones por Tienda y Rol
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign={isMobile ? "center" : "left"}
              >
                Comparativo de rendimiento
              </Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 2,
                fontSize: isMobile ? "0.7rem" : "0.8rem",
                py: isMobile ? 0.5 : 1,
                px: isMobile ? 1 : 1.5,
              },
            }}
          >
            <ToggleButton value="grouped">Agrupado</ToggleButton>
            <ToggleButton value="stacked">Apilado</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Gráfico */}
        <Box
          sx={{
            flexShrink: 0,
            mb: isMobile ? 2 : 3,
            height: isMobile ? 200 : 250,
          }}
        >
          <Bar data={chartData} options={chartOptions} />
        </Box>

        {/* Resumen por tienda */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: 200,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 2, flexShrink: 0 }}
          >
            Top 8 Tiendas por Comisión
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {storeStats.map((store, index) => (
              <Box
                key={store.tienda}
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 8px)",
                    md: "1 1 calc(33.333% - 11px)",
                    lg: "1 1 calc(25% - 12px)",
                  },
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  backgroundColor: "background.paper",
                  "&:hover": {
                    boxShadow: 2,
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    <Store sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {store.tienda}
                  </Typography>
                </Box>

                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight="bold"
                  gutterBottom
                >
                  ${Math.round(store.total).toLocaleString()}{" "}
                  {/* Sin decimales */}
                </Typography>

                <Chip
                  label={`Mejor: ${store.topRole}`}
                  size="small"
                  icon={<TrendingUp />}
                  sx={{
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    color: "#4CAF50",
                    fontWeight: "bold",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
