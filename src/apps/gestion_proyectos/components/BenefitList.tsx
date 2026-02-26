import {
  TextField,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from "@mui/icons-material";

interface Beneficio {
  id: string;
  descripcion: string;
}

interface BenefitListProps {
  beneficios: Beneficio[];
  onAgregar: () => void;
  onEliminar: (id: string) => void;
  onActualizar: (id: string, descripcion: string) => void;
}

/**
 * Componente: Lista de Beneficios para proyectos de nueva creación
 */
export function BenefitList({
  beneficios,
  onAgregar,
  onEliminar,
  onActualizar,
}: BenefitListProps) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StarIcon sx={{ color: "warning.main" }} />
          <Typography variant="h6" fontWeight="bold">
            Beneficios
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAgregar}
        >
          Agregar Beneficio
        </Button>
      </Box>

      {beneficios.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            No hay beneficios agregados. Haz clic en "Agregar Beneficio" para
            comenzar.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 500, overflowY: "auto", pr: 1 }}>
          {beneficios.map((beneficio, index) => (
            <Box
              key={beneficio.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                p: 1.5,
                bgcolor: "grey.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography
                sx={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {index + 1}
              </Typography>
              <TextField
                label={`Beneficio ${index + 1}`}
                value={beneficio.descripcion}
                onChange={(e) => onActualizar(beneficio.id, e.target.value)}
                fullWidth
                size="small"
                placeholder="Ej: Reducción de tiempo en proceso de..."
                multiline
                rows={2}
              />
              <IconButton
                color="error"
                size="small"
                onClick={() => onEliminar(beneficio.id)}
                sx={{ mt: 0.5 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {beneficios.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "info.light", borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Total:</strong> {beneficios.length} beneficio(s)
            registrado(s)
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
