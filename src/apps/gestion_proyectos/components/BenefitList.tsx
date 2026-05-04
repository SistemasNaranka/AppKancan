import {
  TextField,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';

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

export function BenefitList({
  beneficios,
  onAgregar,
  onEliminar,
  onActualizar,
}: BenefitListProps) {
  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StarIcon sx={{ color: "#005aa3" }} />
          <Typography variant="h6" fontWeight="bold" color="#333">
            Beneficios
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAgregar}
          sx={{
            backgroundColor: "#004680",
            boxShadow: "none",
            "&:hover": { bgcolor: "#005AA3", boxShadow: "none" },
          }}
        >
          Agregar Beneficio
        </Button>
      </Box>

      {/* ── Lista ── */}
      {beneficios.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
          <Typography variant="body2">No hay beneficios agregados.</Typography>
          <Typography variant="caption">Haz clic en "Agregar Beneficio" para comenzar.</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 500, overflowY: "auto", pr: 0.5 }}>
          {beneficios.map((beneficio, index) => (
            <Box
              key={beneficio.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
                p: 1.5,
                bgcolor: "#f1f3f4",
                borderRadius: 2,
                border: "1px solid #dcdcdc",
              }}
            >
              {/* Número */}
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: "#005aa3",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.78rem",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>

              {/* Campo de texto */}
              <TextField
                value={beneficio.descripcion}
                onChange={(e) => onActualizar(beneficio.id, e.target.value)}
                placeholder={`Beneficio ${index + 1}`}
                fullWidth
                size="small"
                slotProps={{ input: { sx: { bgcolor: "white", borderRadius: 1 } } }}
              />

              {/* Eliminar */}
              <IconButton
                size="small"
                onClick={() => onEliminar(beneficio.id)}
                sx={{ color: "#ff3838", flexShrink: 0 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Footer total ── */}
      {beneficios.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "#005aa3", borderRadius: 1 }}>
          <Typography variant="body2" color="white">
            <strong>Total:</strong> {beneficios.length} beneficio(s) registrado(s)
          </Typography>
        </Box>
      )}
    </Paper>
  );
}