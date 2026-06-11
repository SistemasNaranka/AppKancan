import React from "react";
import { Box, Typography } from "@mui/material";
import VistaSemanal from "../../components/VistaSemanal";
import VistaCalendario from "../../components/VistaCalendario";
import type { Reserva } from "../../types/reservas.types";

interface CalendarioTabContentProps {
  reservasParaCalendario: Reserva[];
  vistaCalendario: "semanal" | "mes";
  setVistaCalendario: (v: "semanal" | "mes") => void;
  salaInicial: string | undefined;
  usuarioActualId?: number | string;
  isFullTourRunning: boolean;
  tourPhase: string;
  userCreatedReservation: Reserva | null | undefined;
  onAbrirNuevaReserva: (
    fecha?: string,
    sala?: string,
    hora?: string,
  ) => void;
  onEditarReserva: (reserva: Reserva) => void;
  onCancelarReserva: (reserva: Reserva) => void;
}

export const CalendarioTabContent: React.FC<CalendarioTabContentProps> = ({
  reservasParaCalendario,
  vistaCalendario,
  setVistaCalendario,
  salaInicial,
  usuarioActualId,
  isFullTourRunning,
  tourPhase,
  userCreatedReservation,
  onAbrirNuevaReserva,
  onEditarReserva,
  onCancelarReserva,
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

      {vistaCalendario === "semanal" ? (
        <VistaSemanal
          reservas={reservasParaCalendario}
          onNuevaReserva={onAbrirNuevaReserva}
          onEditarReserva={onEditarReserva}
          onCancelarReserva={onCancelarReserva}
          usuarioActualId={usuarioActualId?.toString()}
          vistaCalendario={vistaCalendario}
          onCambiarVista={setVistaCalendario}
          salaInicial={salaInicial || userCreatedReservation?.room_name}
        />
      ) : (
        <VistaCalendario
          onNuevaReserva={onAbrirNuevaReserva}
          onEditarReserva={onEditarReserva}
          onCancelarReserva={onCancelarReserva}
          usuarioActualId={usuarioActualId?.toString()}
          vistaCalendario={vistaCalendario}
          onCambiarVista={setVistaCalendario}
          salaInicial={salaInicial || userCreatedReservation?.room_name}
        />
      )}
    </Box>
  );
};
