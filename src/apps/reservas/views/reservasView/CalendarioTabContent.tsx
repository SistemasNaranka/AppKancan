import React from "react";
import { Box, Typography } from "@mui/material";
import VistaSemanal from "../../components/VistaSemanal";
import VistaCalendario from "../../components/VistaCalendario";
import type { Reservation } from "../../types/reservas.types";

interface CalendarTabContentProps {
  reservationsForCalendar: Reservation[];
  calendarView: "semanal" | "mes";
  setCalendarView: (v: "semanal" | "mes") => void;
  initialRoom?: string;
  currentUserId?: number | string;
  isFullTourRunning: boolean;
  tourPhase: string;
  userCreatedReservation: Reservation | null | undefined;
  onOpenNewReservation: (
    fecha?: string,
    sala?: string,
    hora?: string,
  ) => void;
  onEditReservation: (reserva: Reservation) => void;
  onCancelReservation: (reserva: Reservation) => void;
}

export const CalendarioTabContent: React.FC<CalendarTabContentProps> = ({
  reservationsForCalendar,
  calendarView,
  setCalendarView,
  initialRoom,
  currentUserId,
  isFullTourRunning,
  tourPhase,
  userCreatedReservation,
  onOpenNewReservation,
  onEditReservation,
  onCancelReservation,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 180px)",
        minHeight: 400,
      }}
    >
      {isFullTourRunning &&
        tourPhase === "CALENDARIO" &&
        userCreatedReservation && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: "#D1FAE5",
              borderRadius: 2,
              border: "1px solid #10B981",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#065F46",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Mostrando solo tu reserva de ejemplo: "
              {userCreatedReservation.meeting_title}" en{" "}
              {userCreatedReservation.room_name}
            </Typography>
          </Box>
        )}

      {calendarView === "semanal" ? (
        <VistaSemanal
          reservations={reservationsForCalendar}
          onNewReservation={onOpenNewReservation}
          onEditReservation={onEditReservation}
          onCancelReservation={onCancelReservation}
          currentUserId={currentUserId?.toString()}
          calendarView={calendarView}
          onViewChange={setCalendarView}
          initialRoom={initialRoom || userCreatedReservation?.room_name}
        />
      ) : (
        <VistaCalendario
          onNewReservation={onOpenNewReservation}
          onEditReservation={onEditReservation}
          onCancelReservation={onCancelReservation}
          currentUserId={currentUserId?.toString()}
          calendarView={calendarView}
          onViewChange={setCalendarView}
          initialRoom={initialRoom || userCreatedReservation?.room_name}
        />
      )}
    </Box>
  );
};
