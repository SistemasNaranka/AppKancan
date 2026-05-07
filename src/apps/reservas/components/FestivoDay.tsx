import React from "react";
import { Tooltip, Box } from "@mui/material";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { format } from "date-fns";
import type { FestivoMap } from "../hooks/useFestivos";

interface FestivoDayProps extends PickersDayProps<Date> {
  festivos?: FestivoMap;
}

export const FestivoDay: React.FC<FestivoDayProps> = (props) => {
  const { festivos = {}, day, outsideCurrentMonth, ...other } = props;
  const fechaStr = format(day, "yyyy-MM-dd");
  const nombre = festivos[fechaStr];
  const esFestivo = Boolean(nombre) && !outsideCurrentMonth;

  const dayEl = (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          ...(esFestivo && {
            backgroundColor: "#fef2f2",
            "&:hover": { backgroundColor: "#fee2e2" },
          }),
          ...(other.sx as any),
        }}
      />
      {esFestivo && (
        <Box
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "#dc2626",
            pointerEvents: "none",
          }}
        />
      )}
    </Box>
  );

  return esFestivo ? (
    <Tooltip title={nombre} arrow placement="top">
      {dayEl}
    </Tooltip>
  ) : (
    dayEl
  );
};
