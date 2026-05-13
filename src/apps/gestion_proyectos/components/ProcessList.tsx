// src/apps/gestion_proyectos/components/ProcessList.tsx
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
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';

interface ProcessForm {
  id: string;
  name: string;
  time_before: number;
  time_after: number;
  frequency_type: string;
  frequency_quantity: number;
  weekdays: number;
}

interface ProcessListProps {
  processes: ProcessForm[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  daysPerWeek?: string;
  onDaysPerWeekChange?: (value: string) => void;
  frequencyType?: string;
  onFrequencyTypeChange?: (value: string) => void;
  frequencyQuantity?: string;
  onFrequencyQuantityChange?: (value: string) => void;
}

export function ProcessList({
  processes,
  onAdd,
  onDelete,
  onUpdate,
  daysPerWeek,
  onDaysPerWeekChange,
  frequencyType,
  onFrequencyTypeChange,
  frequencyQuantity,
  onFrequencyQuantityChange,
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
          onClick={onAdd}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none", backgroundColor: "#38993D" } }}
        >
          Agregar
        </Button>
      </Box>

      {/* ── Frequency controls ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Frecuencia</InputLabel>
          <Select
            value={frequencyType || "diaria"}
            label="Frecuencia"
            onChange={(e) => onFrequencyTypeChange?.(e.target.value)}
          >
            <MenuItem value="diaria">Diaria</MenuItem>
            <MenuItem value="semanal">Semanal</MenuItem>
            <MenuItem value="mensual">Mensual</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Veces"
          type="number"
          value={frequencyQuantity || "1"}
          onChange={(e) => onFrequencyQuantityChange?.(e.target.value)}
          fullWidth
          size="small"
          helperText="Veces que se repite"
          inputProps={{ min: 1 }}
        />

        {frequencyType === "diaria" && (
          <TextField
            label="Días por semana"
            type="number"
            value={daysPerWeek || "5"}
            onChange={(e) => onDaysPerWeekChange?.(e.target.value)}
            fullWidth
            size="small"
            helperText="Días que se realiza"
            inputProps={{ min: 1, max: 7 }}
          />
        )}
      </Box>

      {/* ── Process list ── */}
      <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
        {processes.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
            <Typography variant="body2">No hay procesos agregados.</Typography>
            <Typography variant="caption">Haz clic en "Agregar" para comenzar.</Typography>
          </Box>
        ) : (
          processes.map((process, index) => (
            <ProcessCard
              key={process.id}
              process={process}
              index={index}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}

// ─── Process card ───────────────────────────────────────────────────────
function ProcessCard({
  process,
  index,
  onDelete,
  onUpdate,
}: {
  process: ProcessForm;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
}) {
  // Local state for shared time unit
  const [unit, setUnit] = useState<"seg" | "min" | "hora">("seg");

  // Conversions
  const secondsToUnit = (seconds: number): number => {
    if (seconds === 0) return 0;
    switch (unit) {
      case "min":
        return seconds / 60;
      case "hora":
        return seconds / 3600;
      default:
        return seconds;
    }
  };

  const unitToSeconds = (value: number): number => {
    switch (unit) {
      case "min":
        return value * 60;
      case "hora":
        return value * 3600;
      default:
        return value;
    }
  };

  // Format value to show in input
  const formatValue = (seconds: number): string => {
    if (seconds === 0) return "";
    const converted = secondsToUnit(seconds);
    return Number.isInteger(converted) ? converted.toString() : converted.toFixed(2);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        mb: 1.5,
        p: 1.5,
        bgcolor: "#f1f3f4",
        borderRadius: 2,
        border: "1px solid #dcdcdc",
      }}
    >
      {/* Number, name and actions in a single row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Number */}
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

        {/* Step name */}
        <TextField
          size="small"
          value={process.name}
          onChange={(e) => onUpdate(process.id, "name", e.target.value)}
          placeholder="Nombre del paso"
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{ input: { sx: { bgcolor: "white", borderRadius: 1 } } }}
        />

        {/* Unit */}
        <Select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "seg" | "min" | "hora")}
          size="small"
          sx={{ width: 70, fontSize: "0.75rem", flexShrink: 0 }}
        >
          <MenuItem value="seg">seg</MenuItem>
          <MenuItem value="min">min</MenuItem>
          <MenuItem value="hora">hrs</MenuItem>
        </Select>

        {/* Before */}
        <TextField
          label="Antes"
          size="small"
          type="number"
          value={formatValue(process.time_before)}
          onChange={(e) => {
            const numericValue = e.target.value === "" ? 0 : Number(e.target.value);
            const valueInSeconds = unitToSeconds(numericValue);
            onUpdate(process.id, "time_before", Math.round(valueInSeconds));
          }}
          placeholder="0"
          sx={{ width: 90, flexShrink: 0 }}
          slotProps={{
            input: {
              sx: { bgcolor: "white", borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                    {unit === "hora" ? "hrs" : unit}
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* After */}
        <TextField
          label="Después"
          size="small"
          type="number"
          value={formatValue(process.time_after)}
          onChange={(e) => {
            const numericValue = e.target.value === "" ? 0 : Number(e.target.value);
            const valueInSeconds = unitToSeconds(numericValue);
            onUpdate(process.id, "time_after", Math.round(valueInSeconds));
          }}
          placeholder="0"
          sx={{ width: 110, flexShrink: 0 }}
          slotProps={{
            input: {
              sx: { bgcolor: "white", borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                    {unit === "hora" ? "hrs" : unit}
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Delete button */}
        <IconButton
          size="small"
          onClick={() => onDelete(process.id)}
          sx={{ color: "#ff3838", flexShrink: 0, ml: 0.5 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
       </Box>
     </Box>
   );
 }
