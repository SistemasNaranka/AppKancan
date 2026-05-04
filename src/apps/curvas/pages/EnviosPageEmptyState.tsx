import { Container, Paper, Typography, Button } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DashboardIcon from '@mui/icons-material/Dashboard';
import type { Dayjs } from "dayjs";

interface EnviosPageEmptyStateProps {
  filtroFecha: Dayjs | null;
  onNavigateDashboard: () => void;
}

export const EnviosPageEmptyState = ({ filtroFecha, onNavigateDashboard }: EnviosPageEmptyStateProps) => {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          bgcolor: "#f8fafc",
          border: "2px dashed #cbd5e1",
        }}
      >
        <LocalShippingIcon sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
        <Typography variant="h5" fontWeight={900} color="#475569" gutterBottom>
          Sin lotes para enviar
          {filtroFecha ? ` del día ${filtroFecha.format("DD MMM YYYY")}` : ""}
        </Typography>
        <Typography variant="body1" color="#64748b" sx={{ mb: 4 }}>
          Puede que tengas envíos correspondientes a otras fechas. Usa el
          selector que se encuentra en la parte superior para revisar los
          datos de otros días.
        </Typography>
        <Button
          variant="contained"
          startIcon={<DashboardIcon />}
          onClick={onNavigateDashboard}
          sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 800 }}
        >
          IR AL DASHBOARD
        </Button>
      </Paper>
    </Container>
  );
};