import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";

interface ProcesoForm {
  id: string;
  nombre: string;
  tiempo_antes: number;
  tiempo_despues: number;
  frecuencia_tipo: string;
  frecuencia_cantidad: number;
  dias_semana: number;
}

interface ProcessListProps {
  procesos: ProcesoForm[];
  onAgregar: () => void;
  onEliminar: (id: string) => void;
  onActualizar: (id: string, campo: string, valor: any) => void;
  diasPorSemana?: string;
  onDiasPorSemanaChange?: (value: string) => void;
  frecuenciaTipo?: string;
  onFrecuenciaTipoChange?: (value: string) => void;
  frecuenciaCantidad?: string;
  onFrecuenciaCantidadChange?: (value: string) => void;
}

export function ProcessList({
  procesos,
  onAgregar,
  onEliminar,
  onActualizar,
  diasPorSemana,
  onDiasPorSemanaChange,
  frecuenciaTipo,
  onFrecuenciaTipoChange,
  frecuenciaCantidad,
  onFrecuenciaCantidadChange,
}: ProcessListProps) {
  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TimerIcon sx={{ color: "success.main" }} />
          <Typography variant="h6" fontWeight="bold">
            Procesos
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAgregar}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none", backgroundColor: "#38993D" } }}
        >
          Agregar
        </Button>
      </Box>

      {/* ── Controles de frecuencia ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Frecuencia</InputLabel>
          <Select
            value={frecuenciaTipo || "diaria"}
            label="Frecuencia"
            onChange={(e) => onFrecuenciaTipoChange?.(e.target.value)}
          >
            <MenuItem value="diaria">Diaria</MenuItem>
            <MenuItem value="semanal">Semanal</MenuItem>
            <MenuItem value="mensual">Mensual</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Veces"
          type="number"
          value={frecuenciaCantidad || "1"}
          onChange={(e) => onFrecuenciaCantidadChange?.(e.target.value)}
          fullWidth
          size="small"
          helperText="Veces que se repite"
          inputProps={{ min: 1 }}
        />

        {frecuenciaTipo === "diaria" && (
          <TextField
            label="Días por semana"
            type="number"
            value={diasPorSemana || "5"}
            onChange={(e) => onDiasPorSemanaChange?.(e.target.value)}
            fullWidth
            size="small"
            helperText="Días que se realiza"
            inputProps={{ min: 1, max: 7 }}
          />
        )}
      </Box>

      {/* ── Lista de procesos ── */}
      <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
        {procesos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
            <Typography variant="body2">No hay procesos agregados.</Typography>
            <Typography variant="caption">Haz clic en "Agregar" para comenzar.</Typography>
          </Box>
        ) : (
          procesos.map((proceso, index) => (
            <ProcesoCard
              key={proceso.id}
              proceso={proceso}
              index={index}
              onEliminar={onEliminar}
              onActualizar={onActualizar}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}

// ─── Tarjeta de proceso ───────────────────────────────────────────────────────
function ProcesoCard({
  proceso,
  index,
  onEliminar,
  onActualizar,
}: {
  proceso: ProcesoForm;
  index: number;
  onEliminar: (id: string) => void;
  onActualizar: (id: string, campo: string, valor: any) => void;
}) {
  const ahorro = proceso.tiempo_antes - proceso.tiempo_despues;

  return (
    <Box
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
          bgcolor: "#004680",
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

      {/* Nombre del paso */}
        <TextField
          size="small"
          value={proceso.nombre}
          onChange={(e) => onActualizar(proceso.id, "nombre", e.target.value)}
          placeholder="Nombre del paso"
          sx={{ flexGrow: 1, minWidth: 80 }}
        slotProps={{ input: { sx: { bgcolor: "white", borderRadius: 1 } } }}
        />

      {/* Antes */}
        <TextField
          label="Antes"
          size="small"
        type="number"
          value={proceso.tiempo_antes === 0 ? "" : proceso.tiempo_antes}
        onChange={(e) =>
            onActualizar(
              proceso.id,
              "tiempo_antes",
            e.target.value === "" ? 0 : Number(e.target.value)
          )
        }
          placeholder="0"
        sx={{ width: 110 }}
          slotProps={{
            input: {
            sx: { bgcolor: "white", borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">seg</Typography>
                </InputAdornment>
              ),
            },
          }}
        />

      {/* Después */}
        <TextField
          label="Después"
          size="small"
        type="number"
          value={proceso.tiempo_despues === 0 ? "" : proceso.tiempo_despues}
        onChange={(e) =>
            onActualizar(
              proceso.id,
              "tiempo_despues",
            e.target.value === "" ? 0 : Number(e.target.value)
          )
        }
          placeholder="0"
          sx={{ width: 120 }}
          slotProps={{
            input: {
            sx: { bgcolor: "white", borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">seg</Typography>
                </InputAdornment>
              ),
            },
          }}
        />

      {/* Eliminar */}
        <IconButton
          size="small"
          onClick={() => onEliminar(proceso.id)}
        sx={{ color: "#ff3838", flexShrink: 0 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
  );
}