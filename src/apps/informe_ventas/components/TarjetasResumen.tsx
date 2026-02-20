/**
 * Componente de tarjetas de resumen para el Informe de Ventas
 *
 * Muestra métricas en una sola fila horizontal compacta
 */

import { Box, Paper, Typography } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { ResumenVentas } from "../types";

interface TarjetasResumenProps {
  resumen: ResumenVentas | null;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        flex: "1 1 150px",
        minWidth: 140,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Box
        sx={{
          p: 0.75,
          borderRadius: 1,
          backgroundColor: `${color}15`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, color }} noWrap>
          {loading ? "..." : value}
        </Typography>
      </Box>
    </Paper>
  );
}

export function TarjetasResumen({ resumen, loading }: TarjetasResumenProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-CO").format(value);
  };

  if (!resumen && !loading) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        flexWrap: "wrap",
        mb: 2,
      }}
    >
      <StatCard
        title="Unidades"
        value={formatNumber(resumen?.total_unidades || 0)}
        icon={<InventoryIcon fontSize="small" />}
        color="#2563eb"
        loading={loading}
      />
      <StatCard
        title="Valor Total"
        value={formatCurrency(resumen?.total_valor || 0)}
        icon={<AttachMoneyIcon fontSize="small" />}
        color="#16a34a"
        loading={loading}
      />
      <StatCard
        title="Asesores"
        value={resumen?.total_asesores || 0}
        icon={<PeopleIcon fontSize="small" />}
        color="#9333ea"
        loading={loading}
      />
      <StatCard
        title="Tiendas"
        value={resumen?.total_tiendas || 0}
        icon={<StoreIcon fontSize="small" />}
        color="#ea580c"
        loading={loading}
      />
      <StatCard
        title="Prom. Unid."
        value={formatNumber(resumen?.promedio_unidades_asesor || 0)}
        icon={<BarChartIcon fontSize="small" />}
        color="#0891b2"
        loading={loading}
      />
      <StatCard
        title="Prom. Valor"
        value={formatCurrency(resumen?.promedio_valor_asesor || 0)}
        icon={<TrendingUpIcon fontSize="small" />}
        color="#dc2626"
        loading={loading}
      />
    </Box>
  );
}

export default TarjetasResumen;
