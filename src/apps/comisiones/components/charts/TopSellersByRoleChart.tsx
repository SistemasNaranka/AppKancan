import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  useTheme,
  useMediaQuery,
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
  TrendingUp,
  SupervisorAccount,
  PointOfSale,
  Store,
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

interface TopSellersByRoleChartProps {
  mesResumen: MesResumen | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const roleConfig = {
  asesor: {
    label: "Asesores",
    color: "#2196F3",
    icon: <SupervisorAccount />,
    bgColor: "rgba(33, 150, 243, 0.1)",
  },
  gerente: {
    label: "Gerentes",
    color: "#4CAF50",
    icon: <Store />,
    bgColor: "rgba(76, 175, 80, 0.1)",
  },
  cajero: {
    label: "Cajeros",
    color: "#FF9800",
    icon: <PointOfSale />,
    bgColor: "rgba(255, 152, 0, 0.1)",
  },
};

export const TopSellersByRoleChart: React.FC<TopSellersByRoleChartProps> = ({
  mesResumen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedRole, setSelectedRole] = useState(0);

  if (!mesResumen) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cargando Top 5 por Rol...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Verificar si hay datos de empleados
  const hasEmployeeData =
    mesResumen.tiendas &&
    mesResumen.tiendas.some(
      (tienda) => tienda.empleados && tienda.empleados.length > 0
    );

  if (!hasEmployeeData) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ height: "100%" }}>
          <NoDataChartMessage
            title="No hay datos de empleados"
            message="No se encontraron datos de empleados para mostrar el top 5 por rol"
            icon="trend"
            height={320}
          />
        </CardContent>
      </Card>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedRole(newValue);
  };

  const getTop5ByRole = (role: string) => {
    const allEmpleados = mesResumen.tiendas.flatMap((tienda) =>
      tienda.empleados
        .filter((empleado) => empleado.rol.toLowerCase() === role)
        .map((empleado) => ({
          ...empleado,
          tiendaNombre: tienda.tienda,
        }))
    );

    return allEmpleados
      .sort((a, b) => b.comision_monto - a.comision_monto)
      .slice(0, 5);
  };

  const roles = Object.keys(roleConfig);
  const currentRole = roles[selectedRole];
  const topSellers = getTop5ByRole(currentRole);

  // Calcular el total para el chip
  const roleTotal =
    mesResumen.comisiones_por_rol[
      currentRole as keyof typeof mesResumen.comisiones_por_rol
    ] || 0;

  const chartData = {
    labels: topSellers.map(
      (seller) => `${seller.tiendaNombre} - ${seller.nombre}`
    ),
    datasets: [
      {
        label: `Top 5 ${
          roleConfig[currentRole as keyof typeof roleConfig].label
        }`,
        data: topSellers.map((seller) => seller.comision_monto),
        backgroundColor:
          roleConfig[currentRole as keyof typeof roleConfig].color,
        borderColor: roleConfig[currentRole as keyof typeof roleConfig].color,
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y || 0;
            if (value >= 1000000) {
              return `Comisión: $${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `Comisión: $${(value / 1000).toFixed(1)}K`;
            } else {
              return `Comisión: $${value.toLocaleString()}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
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
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
          callback: function (value: string | number) {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            if (numValue >= 1000000) {
              return "$" + (numValue / 1000000).toFixed(1) + "M";
            } else if (numValue >= 1000) {
              return "$" + Math.round(numValue / 1000) + "K";
            } else {
              return "$" + Math.round(numValue).toLocaleString();
            }
          },
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  return (
    <Card
      sx={{
        height: isMobile ? 400 : 450,
        background: `linear-gradient(135deg, ${
          roleConfig[currentRole as keyof typeof roleConfig].bgColor
        } 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <TrendingUp
            sx={{
              color: roleConfig[currentRole as keyof typeof roleConfig].color,
              fontSize: 28,
            }}
          />
          <Typography
            variant="h5"
            component="h3"
            fontWeight="bold"
            sx={{
              color: roleConfig[currentRole as keyof typeof roleConfig].color,
            }}
          >
            Top 5 por Rol
          </Typography>
          <Chip
            label={`Total: $${roleTotal.toLocaleString()}`}
            size="small"
            sx={{
              backgroundColor:
                roleConfig[currentRole as keyof typeof roleConfig].color,
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>

        <Tabs
          value={selectedRole}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "0.9rem",
            },
            "& .Mui-selected": {
              color:
                roleConfig[currentRole as keyof typeof roleConfig].color +
                " !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor:
                roleConfig[currentRole as keyof typeof roleConfig].color,
            },
          }}
        >
          {roles.map((role, index) => (
            <Tab
              key={role}
              icon={roleConfig[role as keyof typeof roleConfig].icon}
              iconPosition="start"
              label={roleConfig[role as keyof typeof roleConfig].label}
              id={`role-tab-${index}`}
              aria-controls={`role-tabpanel-${index}`}
              sx={{
                minHeight: 60,
                py: 1,
              }}
            />
          ))}
        </Tabs>

        <TabPanel value={selectedRole} index={selectedRole}>
          <Box sx={{ height: 280 }}>
            {topSellers.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <NoDataChartMessage
                title={`No hay datos para ${
                  roleConfig[currentRole as keyof typeof roleConfig].label
                }`}
                message="No se encontraron empleados con este rol para mostrar el ranking"
                icon="warning"
                height={200}
              />
            )}
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
};
