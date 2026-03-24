import React from "react";
import { Box, Card, CardContent, Typography, Grid, Chip } from "@mui/material";
import {
  HourglassEmpty as PendienteIcon,
  RateReview as RevisionIcon,
  CheckCircle as AprobadaIcon,
  Cancel as RechazadaIcon,
  TaskAlt as CompletadaIcon,
  Block as CanceladaIcon,
  Inventory as TotalIcon,
} from "@mui/icons-material";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, isLoading }) => (
  <Card
    sx={{
      height: "100%",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: 4,
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {isLoading ? (
            <Box
              sx={{
                width: 40,
                height: 28,
                bgcolor: "grey.200",
                borderRadius: 1,
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.6 },
                },
              }}
            />
          ) : (
            <Typography variant="h4" fontWeight="bold" sx={{ color }}>
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 2,
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32, color } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface GarantiaStatsCardsProps {
  stats?: {
    total: number;
    pendientes: number;
    enRevision: number;
    aprobadas: number;
    rechazadas: number;
    completadas: number;
    canceladas: number;
  };
  isLoading: boolean;
}

export const GarantiaStatsCards: React.FC<GarantiaStatsCardsProps> = ({ stats, isLoading }) => {
  const defaultStats = {
    total: 0,
    pendientes: 0,
    enRevision: 0,
    aprobadas: 0,
    rechazadas: 0,
    completadas: 0,
    canceladas: 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="Total"
          value={displayStats.total}
          icon={<TotalIcon />}
          color="#6366F1"
          isLoading={isLoading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="Pendientes"
          value={displayStats.pendientes}
          icon={<PendienteIcon />}
          color="#F7B036"
          isLoading={isLoading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="En Revisión"
          value={displayStats.enRevision}
          icon={<RevisionIcon />}
          color="#3B82F6"
          isLoading={isLoading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="Aprobadas"
          value={displayStats.aprobadas}
          icon={<AprobadaIcon />}
          color="#10B981"
          isLoading={isLoading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="Rechazadas"
          value={displayStats.rechazadas}
          icon={<RechazadaIcon />}
          color="#EF4444"
          isLoading={isLoading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <StatCard
          title="Completadas"
          value={displayStats.completadas}
          icon={<CompletadaIcon />}
          color="#8B5CF6"
          isLoading={isLoading}
        />
      </Grid>
    </Grid>
  );
};

// Componente de chip de estado para usar en tablas
export const EstadoChip: React.FC<{ estado: string }> = ({ estado }) => {
  const getChipProps = () => {
    if (estado === "pendiente") {
      return { bgcolor: "#FEF3C7", color: "#92400E", label: "Pendiente" };
    }
    if (estado === "en_revision") {
      return { bgcolor: "#DBEAFE", color: "#1E40AF", label: "En Revisión" };
    }
    if (estado === "aprobada") {
      return { bgcolor: "#D1FAE5", color: "#065F46", label: "Aprobada" };
    }
    if (estado === "rechazada") {
      return { bgcolor: "#FEE2E2", color: "#991B1B", label: "Rechazada" };
    }
    if (estado === "completada") {
      return { bgcolor: "#EDE9FE", color: "#5B21B6", label: "Completada" };
    }
    if (estado === "cancelada") {
      return { bgcolor: "#F3F4F6", color: "#374151", label: "Cancelada" };
    }
    return { bgcolor: "#F3F4F6", color: "#374151", label: estado };
  };

  const props = getChipProps();

  return (
    <Chip
      label={props.label}
      size="small"
      sx={{
        bgcolor: props.bgcolor,
        color: props.color,
        fontWeight: 600,
        fontSize: "0.75rem",
      }}
    />
  );
};
