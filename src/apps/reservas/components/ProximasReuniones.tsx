// src/apps/reservas/components/ProximasReuniones.tsx

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Link,
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { format } from "date-fns";
import type { Reserva } from "../types/reservas.types";

interface ProximasReunionesProps {
  reservas: Reserva[];
  onVerCalendarioCompleto: () => void;
  maxReservas?: number;
}

// Colores para chips de sala
const COLORES_SALA: Record<string, { bg: string; color: string }> = {
  "Sala A": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Sala B": { bg: "#E0F2FE", color: "#0369A1" },
};

// Colores para avatares
const COLORES_AVATAR = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const ProximasReuniones: React.FC<ProximasReunionesProps> = ({
  reservas,
  onVerCalendarioCompleto,
  maxReservas = 5,
}) => {
  const hoy = format(new Date(), "yyyy-MM-dd");
  const horaActual = format(new Date(), "HH:mm");

  // Filtrar y ordenar reservas de hoy
  const { reservasHoy, reservasPendientes } = useMemo(() => {
    // Filtrar solo reservas de hoy
    const todasHoy = reservas
      .filter((r) => r.fecha === hoy)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    // Contar solo las pendientes (vigentes y en curso, no canceladas ni finalizadas)
    const pendientes = todasHoy.filter((r) => {
      const estado = (r.estadoCalculado || r.estado)?.toLowerCase();
      return (estado === "vigente" || estado === "en curso") && r.hora_final > horaActual;
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

  // Obtener iniciales del usuario
  const getIniciales = (usuario: Reserva["usuario_id"]): string => {
    if (!usuario) return "??";
    return `${usuario.first_name?.charAt(0) || ""}${usuario.last_name?.charAt(0) || ""}`.toUpperCase();
  };

  // Obtener color del avatar basado en el nombre
  const getColorAvatar = (nombre: string): string => {
    const index = nombre.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLORES_AVATAR[index % COLORES_AVATAR.length];
  };

  // Obtener estado de la reserva para mostrar
  const getEstadoDisplay = (reserva: Reserva): { texto: string; color: string } => {
    const estado = (reserva.estadoCalculado || reserva.estado)?.toLowerCase();
    
    switch (estado) {
      case "en curso":
        return { texto: "En Curso", color: "#3B82F6" };
      case "vigente":
        return { texto: "Confirmado", color: "#10B981" };
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
    const estado = (reserva.estadoCalculado || reserva.estado)?.toLowerCase();
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
            color: "#3B82F6",
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
          gridTemplateColumns: "160px 100px 1fr 200px 120px",
          gap: 2,
          px: 2.5,
          py: 1.5,
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
          Hora
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
          Sala
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
          Asunto
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
          Organizador
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>
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
          const colorSala = COLORES_SALA[reserva.nombre_sala] || { bg: "#F3F4F6", color: "#374151" };

          return (
            <Box
              key={reserva.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "160px 100px 1fr 200px 120px",
                gap: 2,
                px: 2.5,
                py: 2,
                borderBottom: index < reservasHoy.length - 1 ? "1px solid #f0f0f0" : "none",
                opacity: cancelada ? 0.6 : 1,
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
                  color: "#1a2a3a",
                  textDecoration: cancelada ? "line-through" : "none",
                }}
              >
                {formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_final)}
              </Typography>

              {/* Sala */}
              <Chip
                label={reserva.nombre_sala}
                size="small"
                sx={{
                  backgroundColor: colorSala.bg,
                  color: colorSala.color,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />

              {/* Asunto */}
              <Typography
                variant="body2"
                sx={{
                  color: cancelada ? "#9ca3af" : "#3B82F6",
                  fontWeight: 500,
                  textDecoration: cancelada ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {reserva.observaciones || "Sin título"}
              </Typography>

              {/* Organizador */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: reserva.usuario_id
                      ? getColorAvatar(reserva.usuario_id.first_name || "")
                      : "#9ca3af",
                  }}
                >
                  {getIniciales(reserva.usuario_id)}
                </Avatar>
                <Box sx={{ overflow: "hidden" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#1a2a3a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {reserva.usuario_id
                      ? `${reserva.usuario_id.first_name} ${reserva.usuario_id.last_name}`
                      : "Sin asignar"}
                  </Typography>
                  {reserva.usuario_id?.rol_usuario?.area && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#9ca3af", display: "block" }}
                    >
                      {reserva.usuario_id.rol_usuario.area}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Estado */}
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
        {/* <Typography variant="body2" sx={{ color: "#6b7280" }}>
          El horario comercial termina a las 4:30 PM hoy. Quedan{" "}
          <Typography component="span" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
            {reservasPendientes} reservas pendientes
          </Typography>
          .
        </Typography> */}
      </Box>
    </Paper>
  );
};

export default ProximasReuniones;