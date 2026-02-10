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
  Tab,
  Tabs,
} from "@mui/material";
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  Business as AreaIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import {
  COLORES_ESTADO,
  COLORES_TEXTO_ESTADO,
  puedeModificarse,
  capitalize,
} from "../types/reservas.types";
import { useTourContext } from "./TourContext";

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
  const [tabValue, setTabValue] = React.useState(0);

  // Obtener datos del tour context
  const { isFullTourRunning, tourPhase, userCreatedReservation, mockReservasAdicionales } =
    useTourContext();

  // Determinar si usar mock data
  const isTourActive = isFullTourRunning && tourPhase === "MIS_RESERVAS";

  // Combinar la reserva del usuario con las mock adicionales
  const tourReservas: Reserva[] = React.useMemo(() => {
    if (!isTourActive) return [];

    const reservas: Reserva[] = [];

    // Agregar la reserva que el usuario creó durante el tour
    if (userCreatedReservation) {
      reservas.push(userCreatedReservation);
    }

    // Agregar las reservas mock adicionales (finalizada y cancelada)
    reservas.push(...mockReservasAdicionales);

    return reservas;
  }, [isTourActive, userCreatedReservation, mockReservasAdicionales]);

  // Usar mock data durante el tour, sino usar las reservas reales
  const reservasToShow = isTourActive ? tourReservas : reservas;

  // Separar reservas por estado calculado
  const getEstado = (r: Reserva) =>
    (r.estadoCalculado || r.estado)?.toLowerCase() || "";

  const reservasEnCurso = reservasToShow.filter((r) => getEstado(r) === "en curso");
  const reservasVigentes = reservasToShow.filter((r) => getEstado(r) === "vigente");
  const reservasFinalizadas = reservasToShow.filter(
    (r) => getEstado(r) === "finalizado" || getEstado(r) === "finalizada"
  );
  const reservasCanceladas = reservasToShow.filter(
    (r) => getEstado(r) === "cancelado" || getEstado(r) === "cancelada"
  );

  const puedeModificar = (reserva: Reserva): boolean => {
    // Durante el tour, no permitir modificaciones
    if (isTourActive) return false;

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
      return format(new Date(fecha + "T12:00:00"), "EEE, d MMM yyyy", {
        locale: es,
      });
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
    if (estadoLower === "finalizado" || estadoLower === "finalizada")
      return estilosCard.finalizado;
    if (estadoLower === "cancelado" || estadoLower === "cancelada")
      return estilosCard.cancelado;
    return estilosCard.finalizado;
  };

  const ReservaCard: React.FC<{ reserva: Reserva; isFirst?: boolean }> = ({
    reserva,
    isFirst = false,
  }) => {
    const canModify = puedeModificar(reserva);
    const estadoMostrar = (reserva.estadoCalculado ||
      reserva.estado) as EstadoReserva;
    const estilo = getEstiloCard(estadoMostrar);

    // Verificar si es la reserva creada por el usuario en el tour
    const isUserCreated = isTourActive && reserva.id === 99901;

    return (
      <Card
        className={isFirst ? "tour-reserva-card" : undefined}
        sx={{
          border: isUserCreated ? "2px solid" : "1px solid",
          borderColor: isUserCreated ? "#004680" : estilo.borderColor,
          borderRadius: 2,
          boxShadow: isUserCreated
            ? "0 4px 12px rgba(0, 70, 128, 0.2)"
            : "none",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: estilo.hoverShadow,
          },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Badge para la reserva del usuario */}
        {isUserCreated && (
          <Box
            sx={{
              position: "absolute",
              top: -10,
              left: 16,
              backgroundColor: "#004680",
              color: "white",
              px: 1.5,
              py: 0.25,
              borderRadius: 1,
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            ✨ Tu reserva
          </Box>
        )}

        <CardContent
          sx={{ p: 2, "&:last-child": { pb: 2 }, flex: 1, pt: isUserCreated ? 3 : 2 }}
        >
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
            {/* Indicador pulsante para reunión en curso */}
            {estadoMostrar === "En curso" && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                  boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  flexShrink: 0,
                  "@keyframes pulse": {
                    "0%": { transform: "scale(1)", opacity: 1 },
                    "50%": { transform: "scale(1.4)", opacity: 0.7 },
                    "100%": { transform: "scale(1)", opacity: 1 },
                  },
                }}
              />
            )}
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
                        color: "#004680",
                        padding: "4px",
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                        },
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
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.08)",
                        },
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
              {formatearHora(reserva.hora_inicio)} -{" "}
              {formatearHora(reserva.hora_final)}
            </Typography>
          </Box>

          {/* Área */}
          {reserva.area && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}
            >
              <AreaIcon sx={{ fontSize: 18, color: "#64748b" }} />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                {capitalize(reserva.area)}
              </Typography>
            </Box>
          )}

          {/* Observaciones */}
          {reserva.observaciones && (
            <Box
              sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1 }}
            >
              <NotesIcon sx={{ fontSize: 18, color: "#64748b", mt: 0.25 }} />
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
    isFirstSection?: boolean;
  }> = ({
    titulo,
    cantidad,
    reservas: seccionReservas,
    colorIndicador,
    isFirstSection = false,
  }) => {
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
          {seccionReservas.map((reserva, index) => (
            <Grid key={reserva.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ReservaCard reserva={reserva} isFirst={isFirstSection && index === 0} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (loading && !isTourActive) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Cargando reservas...
        </Typography>
      </Box>
    );
  }

  if (reservasToShow.length === 0 && !isTourActive) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No tienes reservas registradas
        </Typography>
      </Box>
    );
  }

  // Determinar cuál es la primera sección con reservas para el tour
  const hasEnCurso = reservasEnCurso.length > 0;
  const hasVigentes = reservasVigentes.length > 0;

  return (
    <Box>
      {/* Banner durante el tour */}
      {isTourActive && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            backgroundColor: "#EFF6FF",
            borderRadius: 2,
            border: "1px solid #BFDBFE",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#1E40AF", fontWeight: 500, textAlign: "center" }}
          >
            🎯 Aquí puedes ver y gestionar todas tus reservas
          </Typography>
        </Box>
      )}

      {/* En curso - Siempre visible */}
      <SeccionReservas
        titulo="En curso"
        cantidad={reservasEnCurso.length}
        reservas={reservasEnCurso}
        colorIndicador="#0F9568"
        isFirstSection={hasEnCurso}
      />

      {/* Tabs para otras reservas */}
      <Box className="tour-mis-reservas-tabs" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
            },
            "& .Mui-selected": {
              color: "#004680",
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Vigentes</Typography>
                <Chip
                  label={reservasVigentes.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    backgroundColor: "#004680",
                    color: "white",
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Finalizadas</Typography>
                <Chip
                  label={reservasFinalizadas.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    backgroundColor: "#9e9e9e",
                    color: "white",
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography>Canceladas</Typography>
                <Chip
                  label={reservasCanceladas.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Contenido según la pestaña */}
      {tabValue === 0 && (
        <SeccionReservas
          titulo="Vigentes"
          cantidad={reservasVigentes.length}
          reservas={reservasVigentes}
          colorIndicador="#004680"
          isFirstSection={!hasEnCurso && hasVigentes}
        />
      )}
      {tabValue === 1 && (
        <SeccionReservas
          titulo="Finalizadas"
          cantidad={reservasFinalizadas.length}
          reservas={reservasFinalizadas}
          colorIndicador="#9e9e9e"
        />
      )}
      {tabValue === 2 && (
        <SeccionReservas
          titulo="Canceladas"
          cantidad={reservasCanceladas.length}
          reservas={reservasCanceladas}
          colorIndicador="#ef4444"
        />
      )}
    </Box>
  );
};

export default MisReservasCards;