// src/apps/gestion_proyectos/components/BenefitList.tsx
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

interface Benefit {
  id: string;
  description: string;
}

interface BenefitListProps {
  benefits: Benefit[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, description: string) => void;
}

export function BenefitList({
  benefits,
  onAdd,
  onDelete,
  onUpdate,
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
          onClick={onAdd}
          sx={{
            backgroundColor: "#004680",
            boxShadow: "none",
            "&:hover": { bgcolor: "#005AA3", boxShadow: "none" },
          }}
        >
          Agregar Beneficio
        </Button>
      </Box>

      {/* ── List ── */}
      {benefits.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
          <Typography variant="body2">No hay beneficios agregados.</Typography>
          <Typography variant="caption">Haz clic en "Agregar Beneficio" para comenzar.</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 500, overflowY: "auto", pr: 0.5 }}>
          {benefits.map((benefit, index) => (
            <Box
              key={benefit.id}
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
              {/* Number */}
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

              {/* Text field */}
              <TextField
                value={benefit.description}
                onChange={(e) => onUpdate(benefit.id, e.target.value)}
                placeholder={`Beneficio ${index + 1}`}
                fullWidth
                size="small"
                slotProps={{ input: { sx: { bgcolor: "white", borderRadius: 1 } } }}
              />

              {/* Delete */}
              <IconButton
                size="small"
                onClick={() => onDelete(benefit.id)}
                sx={{ color: "#ff3838", flexShrink: 0 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Total footer ── */}
      {benefits.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "#005aa3", borderRadius: 1 }}>
          <Typography variant="body2" color="white">
            <strong>Total:</strong> {benefits.length} beneficio(s) registrado(s)
          </Typography>
        </Box>
      )}
    </Paper>
  );
}