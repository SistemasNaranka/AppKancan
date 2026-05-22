import React from "react";
import { Tooltip, Box } from "@mui/material";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import type { FestivoMap } from "../hooks/useFestivos";

interface FestivoDayProps extends PickersDayProps {
  festivos?: FestivoMap;
}

export const FestivoDay = (props: FestivoDayProps) => {
  const { festivos = {}, day, outsideCurrentMonth, ...other } = props;
  const fechaStr = dayjs(day).format("YYYY-MM-DD");
  const nombre = festivos[fechaStr];
  const esFestivo = Boolean(nombre) && !outsideCurrentMonth;

  const dayEl = (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={[
          esFestivo && {
            backgroundColor: "#fef2f2",
            "&:hover": { backgroundColor: "#fee2e2" },
          },
          ...(Array.isArray(other.sx) ? other.sx : other.sx ? [other.sx] : []),
        ]}
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
    <Tooltip title={nombre!} arrow placement="top">
      {dayEl}
    </Tooltip>
  ) : (
    dayEl
  );
};
