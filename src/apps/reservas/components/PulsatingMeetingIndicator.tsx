/**
 * Pulsating Meeting Indicator Component
 * Shows a pulsating circle when a meeting is currently in progress
 */
import React from "react";
import { Box } from "@mui/material";

interface PulsatingMeetingIndicatorProps {
  meetingDate: string;
  startTime: string;
  endTime: string;
  size?: number;
  color?: "success" | "error" | "warning";
}

const PulsatingMeetingIndicator: React.FC<PulsatingMeetingIndicatorProps> = ({
  meetingDate,
  startTime,
  endTime,
  size = 8,
  color = "success",
}) => {
  const isMeetingInProgress = (): boolean => {
    const now = new Date();
    const today = formatDateToYYYYMMDD(now);

    // Check if meeting is today
    if (meetingDate !== today) return false;

    // Parse times
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();

    // Check if current time is within meeting range
    const currentMinutes = nowHours * 60 + nowMinutes;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getColorValue = () => {
    switch (color) {
      case "success":
        return "#22c55e";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  if (!isMeetingInProgress()) return null;

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulsating effect */}
      <Box
        sx={{
          position: "absolute",
          width: size * 3,
          height: size * 3,
          borderRadius: "50%",
          backgroundColor: getColorValue(),
          opacity: 0.3,
          animation: "pulse 1.5s ease-in-out infinite",
          "@keyframes pulse": {
            "0%": {
              transform: "scale(1)",
              opacity: 0.4,
            },
            "50%": {
              transform: "scale(1.5)",
              opacity: 0.2,
            },
            "100%": {
              transform: "scale(1)",
              opacity: 0.4,
            },
          },
        }}
      />
      {/* Main circle */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: getColorValue(),
          zIndex: 1,
          boxShadow: `0 0 ${size / 2}px ${getColorValue()}`,
        }}
      />
    </Box>
  );
};

export default PulsatingMeetingIndicator;
