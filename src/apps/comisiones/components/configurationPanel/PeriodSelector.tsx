// Selector de mes y año compartido por todas las pestañas del panel de configuración.

import React from "react";
import { Grid, TextField, InputAdornment } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import { MESES } from "./configurationPanel.constants";

interface PeriodSelectorProps {
  month: string;
  year: string;
  onMonthChange: (m: string) => void;
  onYearChange: (y: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  month,
  year,
  onMonthChange,
  onYearChange,
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4, mt: 5 }}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Mes de Aplicación"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          slotProps={{
            select: { native: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth fontSize="small" />
                </InputAdornment>
              ),
              sx: { fontSize: "1rem" },
            },
          }}
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          label="Año"
          type="number"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          slotProps={{
            input: {
              sx: { fontSize: "1rem" },
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>
    </Grid>
  );
};
