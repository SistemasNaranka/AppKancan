import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  PieChart,
  AccountBalance,
  People,
  PointOfSale,
  AdminPanelSettings,
  LocalShipping,
  Business,
} from "@mui/icons-material";
import { MesResumen } from "../../types";
import { NoDataChartMessage } from "./NoDataChartMessage";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CommissionDistributionChartProps {
  mesResumen: MesResumen | null;
  // ✅ NUEVO: Para detectar si es una sola tienda
  esUnaSolaTienda?: boolean;
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
  coadministrador: {
    label: "Coadministradores",
    color: "#9C27B0",
    icon: <AdminPanelSettings />,
    bgColor: "rgba(156, 39, 176, 0.1)",
  },
  logistico: {
    label: "Logísticos",
    color: "#607D8B",
    icon: <LocalShipping />,
    bgColor: "rgba(96, 125, 139, 0.1)",
  },
  cajero: {
    label: "Cajeros",
    color: "#FF9800",
    icon: <PointOfSale />,
    bgColor: "rgba(255, 152, 0, 0.1)",
  },
  gerente_online: {
    label: "Gerentes Online",
    color: "#00BCD4",
    icon: <Business />,
    bgColor: "rgba(0, 188, 212, 0.1)",
  },
};

export const CommissionDistributionChart: React.FC<
  CommissionDistributionChartProps
> = ({ mesResumen, esUnaSolaTienda = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  if (!mesResumen) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cargando distribución de comisiones...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // ✅ MEJORADO: Solo mostrar roles que realmente tienen comisiones > 0
  const comisionesPorRolFiltradas = Object.entries(
    mesResumen.comisiones_por_rol,
  ).filter(([_, amount]) => amount > 0); // Volver al filtro original

  // Si no hay datos de comisiones en absoluto, mostrar mensaje de no datos
  if (Object.keys(mesResumen.comisiones_por_rol || {}).length === 0) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ height: "100%" }}>
          <NoDataChartMessage
            title="No hay datos de distribución"
            message="No se encontraron datos de comisiones para mostrar la distribución por roles"
            icon="pie"
            height={320}
          />
        </CardContent>
      </Card>
    );
  }

  const totalComisiones = comisionesPorRolFiltradas.reduce(
    (sum, [_, val]) => sum + val,
    0,
  );

  // Si el total es 0, mostrar todos los roles con 0% pero manteniendo la estructura

  // ✅ MEJORADO: Datos del gráfico filtrados y mejor formateados
  const chartData = {
    labels: comisionesPorRolFiltradas.map(([role]) => {
      const config = roleConfig[role as keyof typeof roleConfig];
      return config?.label || role;
    }),
    datasets: [
      {
        data: comisionesPorRolFiltradas.map(([_, amount]) => amount),
        backgroundColor: comisionesPorRolFiltradas.map(([role]) => {
          const config = roleConfig[role as keyof typeof roleConfig];
          return config?.color || theme.palette.primary.main;
        }),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          pointStyle: "circle",
          padding: isMobile ? 8 : 16,
          font: {
            size: esUnaSolaTienda ? 11 : 12, // ✅ MEJORADO: Texto más pequeño para una sola tienda
            weight: "bold" as const,
          },
          // ✅ MEJORADO: Evitar cortes de texto
          boxWidth: 15,
          boxHeight: 15,
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
            const value = context.parsed || 0;
            let percentage;
            if (totalComisiones === 0) {
              percentage = 0; // Todos los roles tienen 0% cuando no hay comisiones
            } else {
              percentage = ((value / totalComisiones) * 100).toFixed(1);
            }
            if (value >= 1000000) {
              return `${Math.round(value)} (${percentage}%)`;
            } else if (value >= 1000) {
              return `${Math.round(value)} (${percentage}%)`;
            } else {
              return `${Math.round(value).toLocaleString()} (${percentage}%)`;
            }
          },
        },
      },
    },
    cutout: esUnaSolaTienda ? "65%" : "60%", // ✅ MEJORADO: Más espacio para una sola tienda
  };

  return (
    <Card
      sx={{
        height: isMobile ? 400 : 450,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.9) 100%)",
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: isMobile ? 2 : 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 1 : 2,
            mb: isMobile ? 2 : 3,
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}
        >
          <PieChart
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
            >
              Distribución de Comisiones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: ${Math.round(totalComisiones).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: isMobile ? "block" : "flex",
            flex: 1,
            gap: isMobile ? 0 : 3,
          }}
        >
          {/* Gráfico */}
          <Box
            sx={{
              width: isMobile ? "100%" : "60%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: isMobile ? 3 : 0,
              gap: 0.5,
            }}
          >
            {/* Total en la parte superior del gráfico */}
            <Box
              sx={{
                textAlign: "center",
                mb: 1,
              }}
            >
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? "0.7rem" : "0.8rem",
                  mb: 0.5,
                }}
              >
                Total de Comisiones
              </Typography>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight="bold"
                color="primary"
                sx={{
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  lineHeight: 1.2,
                }}
              >
                ${Math.round(totalComisiones).toLocaleString()}
              </Typography>
            </Box>

            {/* Gráfico donut */}
            <Box
              sx={{
                width: isMobile ? 160 : 200,
                height: isMobile ? 240 : 300,
                position: "relative",
              }}
            >
              <Doughnut data={chartData} options={chartOptions} />
            </Box>
          </Box>

          {/* Detalles por rol */}
          <Box
            sx={{
              width: isMobile ? "100%" : esUnaSolaTienda ? "45%" : "40%", // ✅ MEJORADO: Más espacio para una sola tienda
              maxHeight: isMobile ? 140 : "auto", // ✅ MEJORADO: Más espacio para una sola tienda
              overflowY: isMobile ? "auto" : "visible",
            }}
          >
            <Typography
              variant={isMobile ? "subtitle2" : "subtitle1"}
              fontWeight="bold"
              gutterBottom
            >
              Desglose por Rol
              {esUnaSolaTienda && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1, fontWeight: "normal" }}
                ></Typography>
              )}
            </Typography>

            {/* ✅ MEJORADO: Usar datos filtrados y mejor layout */}
            {comisionesPorRolFiltradas.map(([role, amount]) => {
              const config = roleConfig[role as keyof typeof roleConfig];
              const percentageStr =
                totalComisiones === 0
                  ? "0"
                  : ((amount / totalComisiones) * 100).toFixed(1);
              const percentageNum = parseFloat(percentageStr);

              return (
                <Box key={role} sx={{ mb: isMobile ? 1.5 : 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    {config?.icon}
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      sx={{
                        // ✅ MEJORADO: Evitar cortes de texto
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: esUnaSolaTienda ? 120 : 150, // ✅ MEJORADO: Ancho adaptativo
                      }}
                    >
                      {config?.label || role}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="text.secondary"
                      sx={{
                        // ✅ MEJORADO: Formato de moneda adaptativo
                        fontSize: esUnaSolaTienda ? "0.7rem" : "0.75rem",
                      }}
                    >
                      ${Math.round(amount).toLocaleString()}
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      fontWeight="bold"
                      color={config?.color}
                      sx={{
                        fontSize: esUnaSolaTienda ? "0.7rem" : "0.75rem",
                      }}
                    >
                      {percentageStr}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={totalComisiones === 0 ? 0 : percentageNum}
                    sx={{
                      height: esUnaSolaTienda ? 3 : 4, // ✅ MEJORADO: Barra más delgada para una sola tienda
                      borderRadius: 2,
                      backgroundColor: theme.palette.grey[200],
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          config?.color || theme.palette.primary.main,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
