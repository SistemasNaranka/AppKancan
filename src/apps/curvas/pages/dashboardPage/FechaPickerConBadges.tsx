// DatePicker del header con badges de colores por día (pendiente / enviado).

import React from "react";
import { Badge } from "@mui/material";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { PickersActionBar } from "@mui/x-date-pickers/PickersActionBar";
import dayjs from "dayjs";
import { BRAND, getTodayStr } from "./dashboard.constants";

interface FechaPickerConBadgesProps {
  filtroFecha: string;
  setFiltroFecha: (s: string) => void;
  resumenFechas: Record<string, "pendiente" | "enviado">;
}

export const FechaPickerConBadges: React.FC<FechaPickerConBadgesProps> = ({
  filtroFecha,
  setFiltroFecha,
  resumenFechas,
}) => {
  return (
    <DatePicker
      value={dayjs(filtroFecha)}
      onChange={(v: any) => {
        if (v && v.format)
          setFiltroFecha(v.format("YYYY-MM-DD") || getTodayStr());
      }}
      maxDate={dayjs()}
      localeText={{ todayButtonLabel: "Hoy" }}
      slots={{
        day: (props: PickersDayProps) => {
          const dateStr = dayjs(props.day).format("YYYY-MM-DD");
          const hasData = !!resumenFechas[dateStr];
          const isEnviado = resumenFechas[dateStr] === "enviado";

          return (
            <Badge
              key={props.day.toString()}
              overlap="circular"
              badgeContent={
                hasData ? (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: isEnviado ? "#10b981" : "#f59e0b",
                      border: "1px solid white",
                    }}
                  />
                ) : undefined
              }
              sx={{
                "& .MuiBadge-badge": { right: 8, top: 8 },
              }}
            >
              <PickersDay {...props} />
            </Badge>
          );
        },
        actionBar: (props) => (
          <PickersActionBar
            {...props}
            actions={["today"]}
            sx={{
              "& .MuiButton-root": {
                fontSize: "0.8rem",
                py: 0.5,
                px: 2,
                minHeight: 32,
              },
              p: 0.5,
              gap: 0.5,
            }}
          />
        ),
      }}
      slotProps={{
        textField: {
          size: "small",
          sx: {
            width: { xs: 150, sm: 180 },
            "& .MuiInputBase-root": {
              height: 40,
              bgcolor: "transparent !important",
              "& fieldset": { border: "none" },
              "& .MuiInputBase-input": {
                fontSize: "0.85rem",
                fontWeight: 800,
                color: BRAND.text,
                pl: 2,
              },
              "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                color: BRAND.primary,
                fontSize: 18,
              },
            },
          },
        },
      }}
    />
  );
};
