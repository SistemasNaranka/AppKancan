// src/apps/reservas/components/ProximasReuniones.tsx

import React, { useMemo } from "react";
import { Box, Paper, Typography, Chip, Link, Tooltip } from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PeopleIcon from '@mui/icons-material/People';
import { format } from "date-fns";
import type { Reserva } from "../types/reservas.types";
import { capitalize } from "../types/reservas.types";

interface ProximasReunionesProps {
  reservas: Reserva[];
  onVerCalendarioCompleto: () => void;
  maxReservas?: number;
}

// Colores para chips de sala
const COLORES_SALA: Record<string, { bg: string; color: string }> = {
  "Sala Principal": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Sala Secundaria": { bg: "#E0F2FE", color: "#0369A1" },
};

const ProximasReuniones: React.FC<ProximasReunionesProps> = ({
  reservas,
  onVerCalendarioCompleto,
  maxReservas = 10,
}) => {
  const hoy = format(new Date(), "yyyy-MM-dd");
  const horaActual = format(new Date(), "HH:mm");

  // Filtrar y ordenar reservas de hoy
  const { reservasHoy, reservasPendientes } = useMemo(() => {
    // Filtrar solo reservas de hoy
    const todasHoy = reservas
      .filter((r) => r.date === hoy)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Contar solo las pendientes (vigentes y en curso, no canceladas ni finalizadas)
    const pendientes = todasHoy.filter((r) => {
      const estado = (r.estadoCalculado || r.status)?.toLowerCase();
      return (
        (estado === "vigente" || estado === "en curso") &&
        r.end_time > horaActual
      );
    }).length;

    return {
      reservasHoy: todasHoy.slice(0, maxReservas),
      reservasPendientes: pendientes,
    };
  }, [reservas, hoy, horaActual, maxReservas]);

  // Formatear hora para mostrar (12h)
  const formatearHora = (hora: string): string => {
    const [h, m] = hora.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  // Obtener estado de la reserva para mostrar
  const getEstadoDisplay = (
    reserva: Reserva,
  ): { texto: string; color: string } => {
    const estado = (reserva.estadoCalculado || reserva.status)?.toLowerCase();

    switch (estado) {
      case "en curso":
        return { texto: "En Curso", color: "#10B981" };
      case "vigente":
        return { texto: "Vigente", color: "#004680" };
      case "cancelado":
      case "cancelada":
        return { texto: "Cancelado", color: "#EF4444" };
      case "finalizado":
      case "finalizada":
        return { texto: "Finalizado", color: "#6B7280" };
      default:
        return { texto: estado || "Desconocido", color: "#6B7280" };
    }
  };

  // Verificar si una reserva está cancelada
  const estaCancelada = (reserva: Reserva): boolean => {
    const estado = (reserva.estadoCalculado || reserva.status)?.toLowerCase();
    return estado === "cancelado" || estado === "cancelada";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e0e0e0",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2.5,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
          Próximas Reuniones (Hoy)
        </Typography>
        <Link
          component="button"
          onClick={onVerCalendarioCompleto}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#004680",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "0.875rem",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Calendario Completo
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Link>
      </Box>

      {/* Tabla header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "140px 130px 1fr 160px 140px 110px",
          gap: 2,
          px: 2.5,
          py: 1.5,
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}
        >
          Hora
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}
        >
          Sala
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}
        >
          Asunto
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}
        >
          Área
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}
        >
          Participantes
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          Estado
        </Typography>
      </Box>

      {/* Lista de reservas */}
      {reservasHoy.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No hay reuniones programadas para hoy
          </Typography>
        </Box>
      ) : (
        reservasHoy.map((reserva, index) => {
          const cancelada = estaCancelada(reserva);
          const estadoInfo = getEstadoDisplay(reserva);
          const esFinalizada = ["finalizado", "finalizada"].includes(
            (reserva.estadoCalculado || reserva.status)?.toLowerCase() || ""
          );
          const colorSala = COLORES_SALA[reserva.room_name] || {
            bg: "#F3F4F6",
            color: "#374151",
          };

          return (
            <Box
              key={reserva.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "140px 130px 1fr 160px 140px 110px",
                gap: 2,
                px: 2.5,
                py: 2,
                borderBottom:
                  index < reservasHoy.length - 1 ? "1px solid #f0f0f0" : "none",
                opacity: cancelada || esFinalizada ? 0.7 : 1,
                "&:hover": {
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              {/* Hora */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: cancelada ? "#ef4444" : esFinalizada ? "#b0b6bf" : "#1a2a3a",
                  textDecoration: cancelada || esFinalizada ? "line-through" : "none",
                }}
              >
                {formatearHora(reserva.start_time)} -{" "}
                {formatearHora(reserva.end_time)}
              </Typography>

              {/* Sala */}
              <Chip
                label={reserva.room_name}
                size="small"
                sx={{
                  backgroundColor: colorSala.bg,
                  color: colorSala.color,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />

              {/* Asunto - Solo TÍTULO */}
              <Typography
                variant="body2"
                sx={{
                  color: cancelada ? "#ef4444" : esFinalizada ? "#b0b6bf" : "#004680",
                  fontWeight: 500,
                  textDecoration: cancelada || esFinalizada ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {reserva.meeting_title || "Sin título"}
              </Typography>

              {/* Área */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: cancelada ? "#ef4444" : esFinalizada ? "#b0b6bf" : "#1a2a3a",
                  textDecoration: cancelada || esFinalizada ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {capitalize(reserva.departament || "") || "-"}
              </Typography>

              {/* Participantes — count + tooltip con SOLO nombres */}
              {(() => {
                const participantes = Array.isArray(reserva.participants)
                  ? reserva.participants
                  : [];
                const total = participantes.length;
                const nombres = participantes
                  .map((p: any) => p?.nombre)
                  .filter(Boolean);
                const tooltipContent =
                  nombres.length > 0 ? (
                    <Box sx={{ p: 0.5 }}>
                      {nombres.map((n: string, i: number) => (
                        <Typography
                          key={i}
                          variant="caption"
                          sx={{ display: "block", fontSize: "0.75rem" }}
                        >
                          {n}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    "Sin participantes"
                  );
                return (
                  <Tooltip title={tooltipContent} arrow placement="top">
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.6,
                        cursor: total > 0 ? "default" : "default",
                        color: cancelada ? "#ef4444" : esFinalizada ? "#b0b6bf" : "#475569",
                        width: "fit-content",
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {total} {total === 1 ? "participante" : "participantes"}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })()}

              {/* Estado */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                {/* Indicador pulsante para reunión en curso */}
                {estadoInfo.texto === "En Curso" && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#4ade80",
                      boxShadow: "0 0 6px rgba(74, 222, 128, 0.6)",
                      animation: "pulse 1.5s ease-in-out infinite",
                      flexShrink: 0,
                      "@keyframes pulse": {
                        "0%": { transform: "scale(1)", opacity: 1 },
                        "50%": { transform: "scale(1.3)", opacity: 0.7 },
                        "100%": { transform: "scale(1)", opacity: 1 },
                      },
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: estadoInfo.color,
                    textAlign: "right",
                  }}
                >
                  {estadoInfo.texto}
                </Typography>
              </Box>
            </Box>
          );
        })
      )}

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e0e0e0",
          textAlign: "center",
        }}
      >
        {/* Espacio para futura información */}
      </Box>
    </Paper>
  );
};

export default ProximasReuniones;
