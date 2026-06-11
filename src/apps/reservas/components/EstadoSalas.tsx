import React, { useState, useEffect, useMemo } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { format, differenceInSeconds, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Reservation } from "../types/reservas.types";
import { AVAILABLE_ROOMS } from "../types/reservas.types";

interface RoomStatusProps {
  reservations: Reservation[];
  onViewSchedule: (room: string) => void;
  onReserveNow: (room: string) => void;
}

interface RoomStatus {
  room: string;
  isOccupied: boolean;
  currentMeeting: Reservation | null;
  nextReservation: Reservation | null;
  upcomingReservations: Reservation[];
  isFutureReservation: boolean;
}

const ROOM_INFO: Record<string, { type: string }> = {
  "Sala Principal": { type: "" },
  "Sala Secundaria": { type: "" },
};

const RoomStatusDisplay: React.FC<RoomStatusProps> = ({
  reservations,
  onViewSchedule,
  onReserveNow,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const roomStatuses = useMemo((): RoomStatus[] => {
    const today = format(currentTime, "yyyy-MM-dd");
    const currentTimeStr = format(currentTime, "HH:mm");

    return AVAILABLE_ROOMS.map((room) => {
      const reservationsForRoom = reservations.filter(
        (r) =>
          r.room_name === room &&
          ((r.calculatedStatus || r.status)?.toLowerCase() === "vigente" ||
            (r.calculatedStatus || r.status)?.toLowerCase() === "en curso"),
      );

      const reservationsToday = reservationsForRoom.filter((r) => r.date === today);

      const hasReservationsToday = reservationsToday.some(
        (r) =>
          r.start_time > currentTimeStr ||
          (r.start_time <= currentTimeStr && r.end_time > currentTimeStr),
      );

      const currentMeeting = reservationsToday.find((r) => {
        return r.start_time <= currentTimeStr && r.end_time > currentTimeStr;
      });

      let upcomingReservations: Reservation[] = [];
      let isFutureReservation = false;

      if (hasReservationsToday) {
        upcomingReservations = reservationsToday
          .filter((r) => r.start_time > currentTimeStr)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        isFutureReservation = false;
      } else {
        const futureReservations = reservationsForRoom
          .filter(
            (r) =>
              r.date > today || (r.date === today && r.start_time > currentTimeStr),
          )
          .sort((a, b) => {
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            return a.start_time.localeCompare(b.start_time);
          });

        if (futureReservations.length > 0) {
          upcomingReservations = [futureReservations[0]];
          isFutureReservation = true;
        }
      }

      return {
        room,
        isOccupied: !!currentMeeting,
        currentMeeting: currentMeeting || null,
        nextReservation:
          upcomingReservations.length > 0 ? upcomingReservations[0] : null,
        upcomingReservations,
        isFutureReservation,
      };
    });
  }, [reservations, currentTime]);

  const calculateRemainingTime = (endTime: string): string => {
    const today = format(currentTime, "yyyy-MM-dd");
    const finishDate = new Date(`${today}T${endTime}`);
    const diffSeconds = differenceInSeconds(finishDate, currentTime);

    if (diffSeconds <= 0) return "00:00:00";

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    const hDisplay = hours > 0 ? `${hours}:` : "0:";
    const mDisplay = minutes.toString().padStart(2, "0");
    const sDisplay = seconds.toString().padStart(2, "0");

    return `${hDisplay}${mDisplay}:${sDisplay}`;
  };

  const formatTime = (time: string): string => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  const getReservationDateLabel = (
    reservation: Reservation | null,
    isFuture: boolean,
  ): string => {
    if (!reservation) return "";

    if (isFuture) {
      const reservationDate = parseISO(reservation.date);
      return format(reservationDate, "EEEE d 'de' MMMM", { locale: es });
    }

    return "Siguiente reservación";
  };

  const getDaysRemainingLabel = (reservation: Reservation | null): string | null => {
    if (!reservation) return null;
    try {
      const reservationDate = parseISO(reservation.date);
      reservationDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff < 0) return null;
      if (diff === 0) return "Hoy";
      if (diff === 1) return "Mañana";
      return `Faltan ${diff} días`;
    } catch {
      return null;
    }
  };

  return (
    <Box className="tour-estado-salas" sx={{ mb: 4 }}>
      {/* Cards de salas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 8,
        }}
      >
        {roomStatuses.map((status) => {
          const roomInfo = ROOM_INFO[status.room] || {
            type: "",
            capacity: 10,
          };

          if (status.isOccupied && status.currentMeeting) {
            return (
              <Paper
                key={status.room}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.01)",
                  },
                }}
              >
                <Box
                  sx={{
                    background: "#0F9568",
                    color: "white",
                    p: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {status.room}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {roomInfo.type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#4ade80",
                          boxShadow: "0 0 8px rgba(74, 222, 128, 0.8)",
                          animation: "pulse 1.5s ease-in-out infinite",
                          "@keyframes pulse": {
                            "0%": { transform: "scale(1)", opacity: 1 },
                            "50%": { transform: "scale(1.4)", opacity: 0.7 },
                            "100%": { transform: "scale(1)", opacity: 1 },
                          },
                        }}
                      />
                      <Chip
                        label="OCUPADA"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Contenido */}
                <Box sx={{ p: 2.5 }}>
                  {/* Organizador */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <PersonOutlineOutlinedIcon
                      sx={{ color: "#0F9568", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        ORGANIZADOR ACTUAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {status.currentMeeting.user_id
                          ? `${status.currentMeeting.user_id.first_name} ${status.currentMeeting.user_id.last_name}`
                          : "Usuario"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <DescriptionOutlinedIcon
                      sx={{ color: "#0F9568", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#0F9568",
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        REUNIÓN ACTUAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {status.currentMeeting.meeting_title || "Sin título"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 2,
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block" }}
                      >
                        TERMINA EN
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#0F9568",
                          fontFamily: "monospace",
                        }}
                      >
                        {calculateRemainingTime(
                          status.currentMeeting.end_time,
                        )}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => onViewSchedule(status.room)}
                      sx={{
                        textTransform: "none",
                        borderColor: "#e0e0e0",
                        color: "#374151",
                        borderRadius: 2,
                        "&:hover": {
                          borderColor: "#0F9568",
                          color: "#0F9568",
                        },
                      }}
                    >
                      Ver Cronograma
                    </Button>
                  </Box>
                </Box>
              </Paper>
            );
          } else {
            return (
              <Paper
                key={status.room}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.01)",
                  },
                }}
              >
                <Box
                  sx={{
                    background: "#004680",
                    color: "white",
                    p: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {status.room}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {roomInfo.type}
                      </Typography>
                    </Box>
                    <Chip
                      label="DISPONIBLE"
                      size="small"
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ p: 2.5 }}>
                  {/* Estado actual */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <CheckCircleOutlineOutlinedIcon
                      sx={{ color: "#004680", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        ESTADO ACTUAL
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#6f7073" }}
                      >
                        Disponible para reservar
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <AccessTimeOutlinedIcon
                      sx={{ color: "#004680", fontSize: 20, mt: 0.25 }}
                    />
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#004680",
                            fontWeight: 600,
                          }}
                        >
                          {status.nextReservation
                            ? status.isFutureReservation
                              ? `PRÓXIMA RESERVACIÓN · ${getReservationDateLabel(status.nextReservation, status.isFutureReservation)}`
                              : "PRÓXIMA RESERVACIÓN"
                            : "SIN RESERVACIONES"}
                        </Typography>
                        {status.nextReservation && (() => {
                          const label = getDaysRemainingLabel(status.nextReservation);
                          if (!label) return null;
                          const isHoy = label === "Hoy";
                          const isManana = label === "Mañana";
                          const bg = isHoy ? "#16a34a" : isManana ? "#d97706" : "#e8f0f9";
                          const fg = isHoy || isManana ? "#fff" : "#004680";
                          return (
                            <Box
                              sx={{
                                px: 0.9,
                                py: 0.15,
                                borderRadius: 10,
                                bgcolor: bg,
                                color: fg,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                letterSpacing: "0.02em",
                                lineHeight: 1.5,
                                textTransform: "uppercase",
                              }}
                            >
                              {label}
                            </Box>
                          );
                        })()}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#6f7073" }}
                      >
                        {status.nextReservation
                          ? `${formatTime(status.nextReservation.start_time)} - ${status.nextReservation.meeting_title || "Sin título"}`
                          : status.isFutureReservation
                            ? "Sin reservaciones programadas para hoy"
                            : "Sin reservaciones programadas"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 2,
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block" }}
                      >
                        DISPONIBILIDAD
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "#004680",
                        }}
                      >
                        Ahora
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => onReserveNow(status.room)}
                      sx={{
                        textTransform: "none",
                        fontWeight: "bold",
                        backgroundColor: "#004680",
                        borderRadius: 2,
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#005AA3",
                          boxShadow: "none",
                        },
                      }}
                    >
                      Reservar Ahora
                    </Button>
                  </Box>
                </Box>
              </Paper>
            );
          }
        })}
      </Box>
    </Box>
  );
};

export default RoomStatusDisplay;
