import React, { useMemo } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { SelectChangeEvent } from "@mui/material";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface PromotionFormFieldsProps {
  tipoId: number | null;
  tiposPromocion: any[];
  nombre: string;
  duracion: "temporal" | "fija";
  fechaInicio: Dayjs | null;
  fechaFinal: Dayjs | null;
  horaInicio: Dayjs | null;
  horaFinal: Dayjs | null;
  descuento: number;
  onTipoChange: (value: number) => void;
  onNombreChange: (value: string) => void;
  onDuracionChange: (isTemporal: boolean) => void;
  onFechaInicioChange: (value: Dayjs | null) => void;
  onFechaFinalChange: (value: Dayjs | null) => void;
  onHoraInicioChange: (value: Dayjs | null) => void;
  onHoraFinalChange: (value: Dayjs | null) => void;
  onDescuentoChange: (value: number) => void;
}

export const PromotionFormFields: React.FC<PromotionFormFieldsProps> = ({
  tipoId,
  tiposPromocion,
  nombre,
  duracion,
  fechaInicio,
  fechaFinal,
  horaInicio,
  horaFinal,
  descuento,
  onTipoChange,
  onNombreChange,
  onDuracionChange,
  onFechaInicioChange,
  onFechaFinalChange,
  onHoraInicioChange,
  onHoraFinalChange,
  onDescuentoChange,
}) => {
  const availablePromotionTypes = useMemo(
    () => tiposPromocion.filter((tipo) => tipo.duracion === duracion),
    [tiposPromocion, duracion]
  );

  const tipoSeleccionado = tiposPromocion.find((t) => t.id === tipoId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Duración */}
      <FormControlLabel
        control={
          <Switch
            checked={duracion === "temporal"}
            onChange={(e) => onDuracionChange(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography fontWeight={500}>
            {duracion === "temporal" ? "Promoción Temporal" : "Promoción Fija"}
          </Typography>
        }
      />

      {/* Tipo */}
      <FormControl fullWidth>
        <InputLabel>Tipo de Promoción</InputLabel>
        <Select
          value={tipoId || ""}
          label="Tipo de Promoción"
          onChange={(e: SelectChangeEvent<number>) =>
            onTipoChange(Number(e.target.value))
          }
        >
          {availablePromotionTypes.length === 0 ? (
            <MenuItem disabled>
              No hay tipos disponibles para{" "}
              {duracion === "temporal"
                ? "promociones temporales"
                : "promociones fijas"}
            </MenuItem>
          ) : (
            availablePromotionTypes.map((tipo) => (
              <MenuItem key={tipo.id} value={tipo.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bgcolor: tipo.color || "#cccccc",
                    }}
                  />
                  {tipo.nombre}
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Nombre */}
      <TextField
        fullWidth
        label="Nombre de la Promoción"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        placeholder={`Ej: Promoción ${tipoSeleccionado?.nombre || ""} 2025`}
        required
      />

      {/* Fechas */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <DatePicker
          label="Fecha de Inicio"
          value={fechaInicio}
          onChange={onFechaInicioChange}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              helperText: "Fecha cuando inicia la promoción",
            },
          }}
          maxDate={fechaFinal ? fechaFinal.subtract(0, "day") : undefined}
        />
        <DatePicker
          label="Fecha Final"
          value={fechaFinal}
          onChange={onFechaFinalChange}
          disabled={duracion === "fija"}
          minDate={fechaInicio ? fechaInicio.add(0, "day") : dayjs()}
          slotProps={{
            textField: {
              fullWidth: true,
              required: duracion === "temporal",
              helperText:
                duracion === "fija"
                  ? "No aplica para promociones fijas"
                  : "Fecha cuando termina la promoción",
            },
          }}
        />
      </Box>

      {/* Horas */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <TimePicker
          label="Hora de Inicio"
          value={horaInicio}
          onChange={onHoraInicioChange}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              helperText: "Hora cuando inicia la promoción",
            },
          }}
        />
        <TimePicker
          label="Hora Final"
          value={horaFinal}
          onChange={onHoraFinalChange}
          disabled={duracion === "fija"}
          slotProps={{
            textField: {
              fullWidth: true,
              required: duracion === "temporal",
              helperText:
                duracion === "fija"
                  ? "No aplica para promociones fijas"
                  : "Hora cuando termina la promoción",
            },
          }}
        />
      </Box>

      {/* Descuento */}
      <TextField
        fullWidth
        label="Descuento (%)"
        type="number"
        value={descuento}
        onChange={(e) => onDescuentoChange(Number(e.target.value))}
        inputProps={{ min: 1, max: 100 }}
        required
        helperText="Porcentaje de descuento (1-100)"
      />
    </Box>
  );
};
