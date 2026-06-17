import { Tooltip, Box } from "@mui/material";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import type { HolidayMap } from "../hooks/useHolidays";

interface FestivoDayProps extends PickersDayProps {
  holidays?: HolidayMap;
}

export const FestivoDay = (props: FestivoDayProps) => {
  const { holidays = {}, day, outsideCurrentMonth, ...other } = props;
  const dateStr = dayjs(day).format("YYYY-MM-DD");
  const name = holidays[dateStr];
  const isHoliday = Boolean(name) && !outsideCurrentMonth;

  const dayEl = (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={[
          isHoliday && {
            backgroundColor: "#fef2f2",
            "&:hover": { backgroundColor: "#fee2e2" },
          },
          ...(Array.isArray(other.sx) ? other.sx : other.sx ? [other.sx] : []),
        ]}
      />
      {isHoliday && (
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

  return isHoliday ? (
    <Tooltip title={name!} arrow placement="top">
      {dayEl}
    </Tooltip>
  ) : (
    dayEl
  );
};
