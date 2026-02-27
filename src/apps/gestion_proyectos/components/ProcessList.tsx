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
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
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

/**
 * Componente: Lista de Procesos
 */
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
  const calcularAhorroTotal = () => {
    return procesos.reduce((acc, p) => {
      const ahorro =
        (p.tiempo_antes - p.tiempo_despues) * p.frecuencia_cantidad;
      return acc + ahorro;
    }, 0);
  };

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
        >
          Agregar
        </Button>
      </Box>

      {/* Frecuencia y Días por semana */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
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
          placeholder="1"
          helperText="Veces que se repite"
        />

        {onDiasPorSemanaChange && frecuenciaTipo === "diaria" && (
          <TextField
            label="Días por semana"
            type="number"
            value={diasPorSemana || ""}
            onChange={(e) => onDiasPorSemanaChange(e.target.value)}
            fullWidth
            size="small"
            placeholder="5"
            helperText="Días que se realiza"
          />
        )}
      </Box>

      {procesos.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Chip
            icon={<SpeedIcon />}
            label={`Ahorro: ${calcularAhorroTotal()} seg`}
            size="small"
            sx={{
              bgcolor: "#38993D",
              color: "white",
              fontSize: 14,
              "& .MuiChip-icon": { color: "white" },
            }}
          />
        </Box>
      )}

      <Box sx={{ maxHeight: 400, overflowY: "auto", pr: 1 }}>
        {procesos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body2">No hay procesos</Typography>
            <Typography variant="caption">Click en "Agregar"</Typography>
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

/**
 * Tarjeta de Proceso - Nombre más pequeño, tiempos más grandes
 */
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
    <Paper
      elevation={1}
      sx={{ p: 1, mb: 1, borderRadius: 1, bgcolor: "grey.50" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Número */}
        <Chip
          label={`#${index + 1}`}
          size="small"
          color="primary"
          sx={{ minWidth: 32 }}
        />

        {/* Nombre del paso - más pequeño pero más alto (2 filas) */}
        <TextField
          size="small"
          value={proceso.nombre}
          onChange={(e) => onActualizar(proceso.id, "nombre", e.target.value)}
          placeholder="Nombre del paso"
          multiline
          rows={2}
          sx={{ flexGrow: 1, minWidth: 80 }}
        />

        {/* Tiempo antes - acepta 0 y vacío */}
        <TextField
          label="Antes"
          size="small"
          value={proceso.tiempo_antes === 0 ? "" : proceso.tiempo_antes}
          onChange={(e) => {
            const val = e.target.value;
            onActualizar(
              proceso.id,
              "tiempo_antes",
              val === "" ? 0 : Number(val),
            );
          }}
          placeholder="0"
          sx={{ width: 100 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    seg
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Tiempo después - acepta 0 y vacío */}
        <TextField
          label="Después"
          size="small"
          value={proceso.tiempo_despues === 0 ? "" : proceso.tiempo_despues}
          onChange={(e) => {
            const val = e.target.value;
            onActualizar(
              proceso.id,
              "tiempo_despues",
              val === "" ? 0 : Number(val),
            );
          }}
          placeholder="0"
          sx={{ width: 120 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    seg
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Botón eliminar */}
        <IconButton
          size="small"
          color="error"
          onClick={() => onEliminar(proceso.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Ahorro */}
      {proceso.tiempo_antes > 0 && proceso.tiempo_despues >= 0 && (
        <Typography variant="caption" color="success.main" sx={{ ml: 5 }}>
          Ahorro: {ahorro} seg/ejecución
        </Typography>
      )}
      {proceso.tiempo_antes === 0 && proceso.tiempo_despues > 0 && (
        <Typography variant="caption" color="warning.main" sx={{ ml: 5 }}>
          Nuevo proceso: {proceso.tiempo_despues} seg/ejecución
        </Typography>
      )}
    </Paper>
  );
}
