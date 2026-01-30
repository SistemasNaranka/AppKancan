// src/apps/reservas/components/MisReservasCards.tsx

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Business as AreaIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import { COLORES_ESTADO, COLORES_TEXTO_ESTADO, puedeModificarse } from "../types/reservas.types";

interface MisReservasCardsProps {
  reservas: Reserva[];
  usuarioActualId?: string;
  onEditar?: (reserva: Reserva) => void;
  onCancelar?: (reserva: Reserva) => void;
  loading?: boolean;
}

const MisReservasCards: React.FC<MisReservasCardsProps> = ({
  reservas,
  usuarioActualId,
  onEditar,
  onCancelar,
  loading = false,
}) => {
  // Separar reservas por estado calculado
  const getEstado = (r: Reserva) => (r.estadoCalculado || r.estado)?.toLowerCase() || "";
  
  const reservasEnCurso = reservas.filter((r) => getEstado(r) === "en curso");
  const reservasVigentes = reservas.filter((r) => getEstado(r) === "vigente");
  const reservasFinalizadas = reservas.filter((r) => 
    getEstado(r) === "finalizado" || getEstado(r) === "finalizada"
  );
  const reservasCanceladas = reservas.filter((r) => 
    getEstado(r) === "cancelado" || getEstado(r) === "cancelada"
  );

  const puedeModificar = (reserva: Reserva): boolean => {
    if (!usuarioActualId) return false;
    if (!reserva.usuario_id) return false;
    if (reserva.usuario_id.id !== usuarioActualId) return false;
    
    const estadoActual = reserva.estadoCalculado || reserva.estado;
    if (!puedeModificarse(estadoActual)) return false;

    const ahora = new Date();
    const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
    return fechaReserva > ahora;
  };

  const formatearFecha = (fecha: string): string => {
    try {
      return format(new Date(fecha + "T12:00:00"), "EEE, d MMM yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  const truncarTexto = (texto: string, limite: number) => {
    if (!texto) return "";
    return texto.length > limite ? texto.slice(0, limite) + "..." : texto;
  };

  const formatearHora = (hora: string): string => {
    return hora.substring(0, 5);
  };

  const estilosCard = {
    "en curso": {
      borderColor: "#93C5FD",
      hoverShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
      chipBg: COLORES_ESTADO["En curso"],
      chipTextColor: COLORES_TEXTO_ESTADO["En curso"],
    },
    vigente: {
      borderColor: "#B9F8CF",
      hoverShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
      chipBg: COLORES_ESTADO["Vigente"],
      chipTextColor: COLORES_TEXTO_ESTADO["Vigente"],
    },
    finalizado: {
      borderColor: "#e0e0e0",
      hoverShadow: "0 4px 12px rgba(0,0,0,0.08)",
      chipBg: COLORES_ESTADO["Finalizado"],
      chipTextColor: COLORES_TEXTO_ESTADO["Finalizado"],
    },
    cancelado: {
      borderColor: "#FECACA",
      hoverShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
      chipBg: COLORES_ESTADO["Cancelado"],
      chipTextColor: COLORES_TEXTO_ESTADO["Cancelado"],
    },
  };

  const getEstiloCard = (estado: string) => {
    const estadoLower = estado?.toLowerCase() || "";
    if (estadoLower === "en curso") return estilosCard["en curso"];
    if (estadoLower === "vigente") return estilosCard.vigente;
    if (estadoLower === "finalizado" || estadoLower === "finalizada") return estilosCard.finalizado;
    if (estadoLower === "cancelado" || estadoLower === "cancelada") return estilosCard.cancelado;
    return estilosCard.finalizado;
  };

  const ReservaCard: React.FC<{ reserva: Reserva }> = ({ reserva }) => {
    const canModify = puedeModificar(reserva);
    const estadoMostrar = (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
    const estilo = getEstiloCard(estadoMostrar);

    return (
      <Card
        sx={{
          border: "1px solid",
          borderColor: estilo.borderColor,
          borderRadius: 2,
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: estilo.hoverShadow,
          },
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header con Estado y Acciones */}
          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              mb: 1.5,
              gap: 1,
            }}
          >
            <Chip
              label={estadoMostrar}
              size="small"
              sx={{
                backgroundColor: estilo.chipBg,
                color: estilo.chipTextColor,
                fontWeight: "600",
                fontSize: "0.7rem",
                height: 24,
                flexShrink: 0,
              }}
            />
            {canModify && (
              <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                {onEditar && (
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => onEditar(reserva)}
                      sx={{
                        color: "#1976d2",
                        padding: "4px",
                        "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.08)" }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {onCancelar && (
                  <Tooltip title="Cancelar">
                    <IconButton
                      size="small"
                      onClick={() => onCancelar(reserva)}
                      sx={{
                        color: "#ef4444",
                        padding: "4px",
                        "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.08)" }
                      }}
                    >
                      <CancelIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>

          {/* Nombre de la Sala */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1a2a3a",
              mb: 1.5,
              fontSize: "1.1rem",
            }}
          >
            {reserva.nombre_sala}
          </Typography>

          {/* Fecha */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <CalendarIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              {formatearFecha(reserva.fecha)}
            </Typography>
          </Box>

          {/* Hora */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <TimeIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ color: "#475569" }}>
              {formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_final)}
            </Typography>
          </Box>

          {/* Área */}
          {reserva.usuario_id?.rol_usuario?.area && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <AreaIcon sx={{ fontSize: 18, color: "#64748b" }} />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                {reserva.usuario_id.rol_usuario.area}
              </Typography>
            </Box>
          )}

          {/* Observaciones */}
          {reserva.observaciones && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1 }}>
              <DescriptionIcon sx={{ fontSize: 18, color: "#64748b", mt: 0.25 }} />
              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {truncarTexto(reserva.observaciones, 40)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const SeccionReservas: React.FC<{
    titulo: string;
    cantidad: number;
    reservas: Reserva[];
    colorIndicador: string;
  }> = ({ titulo, cantidad, reservas: seccionReservas, colorIndicador }) => {
    if (seccionReservas.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: colorIndicador,
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
            {titulo} ({cantidad})
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {seccionReservas.map((reserva) => (
            <Grid key={reserva.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ReservaCard reserva={reserva} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Cargando reservas...
        </Typography>
      </Box>
    );
  }

  if (reservas.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No tienes reservas registradas
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* En curso - Primero y destacado */}
      <SeccionReservas
        titulo="En curso"
        cantidad={reservasEnCurso.length}
        reservas={reservasEnCurso}
        colorIndicador="#3B82F6"
      />

      {/* Vigentes */}
      <SeccionReservas
        titulo="Vigentes"
        cantidad={reservasVigentes.length}
        reservas={reservasVigentes}
        colorIndicador="#22c55e"
      />

      {/* Finalizadas */}
      <SeccionReservas
        titulo="Finalizadas"
        cantidad={reservasFinalizadas.length}
        reservas={reservasFinalizadas}
        colorIndicador="#9e9e9e"
      />

      {/* Canceladas */}
      <SeccionReservas
        titulo="Canceladas"
        cantidad={reservasCanceladas.length}
        reservas={reservasCanceladas}
        colorIndicador="#ef4444"
      />
    </Box>
  );
};

export default MisReservasCards;