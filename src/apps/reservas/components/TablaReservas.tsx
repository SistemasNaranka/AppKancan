import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reservation, ReservationStatus } from "../types/reservas.types";
import {
  STATUS_COLORS,
  STATUS_TEXT_COLORS,
  canBeModified,
} from "../types/reservas.types";

interface TablaReservasProps {
  reservations: Reservation[];
  currentUserId?: string;
  onEdit?: (reserva: Reservation) => void;
  onCancel?: (reserva: Reservation) => void;
  loading?: boolean;
}

const TablaReservas: React.FC<TablaReservasProps> = ({
  reservations,
  currentUserId,
  onEdit,
  onCancel,
  loading = false,
}) => {
  const reservasFiltradas = reservations.filter((reserva) => {
    const estado =
      (reserva.calculatedStatus || reserva.status)?.toLowerCase() || "";
    return estado === "vigente" || estado === "en curso";
  });

  const puedeModificar = (reserva: Reservation): boolean => {
    if (!currentUserId) return false;
    if (!reserva.user_id) return false;
    if (reserva.user_id.id !== currentUserId) return false;

    const estadoActual = reserva.calculatedStatus || reserva.status;
    if (!canBeModified(estadoActual)) return false;

    const ahora = new Date();
    const fechaReserva = new Date(`${reserva.date}T${reserva.start_time}`);

    return fechaReserva > ahora;
  };

  const formatearFecha = (fecha: string): string => {
    try {
      return format(new Date(fecha + "T12:00:00"), "d MMM yyyy", {
        locale: es,
      });
    } catch {
      return fecha;
    }
  };

  const formatearHora = (hora: string): string => {
    return hora.substring(0, 5);
  };



  const getEstadoMostrar = (reserva: Reservation): ReservationStatus => {
    return (reserva.calculatedStatus || reserva.status) as ReservationStatus;
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

  if (reservasFiltradas.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No hay reservas vigentes o en curso
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e0e0e0" }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              SALA
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              ÁREA
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              FECHA
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              HORA INICIO
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              HORA FIN
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              ESTADO
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                color: "#1a2a3ae0",
                textAlign: "center",
              }}
            >
              ACCIONES
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservasFiltradas.map((reserva) => {
            const puedeModificarReserva = puedeModificar(reserva);
            const estadoMostrar = getEstadoMostrar(reserva);

            return (
              <TableRow
                key={reserva.id}
                sx={{
                  "&:hover": { backgroundColor: "#fafafa" },
                }}
              >
                {/* Sala */}
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: "600" }}>
                    {reserva.room_name}
                  </Typography>
                  {reserva.observations && (
                    <Typography variant="caption" color="text.secondary">
                      {reserva.observations}
                    </Typography>
                  )}
                </TableCell>

                {/* Área */}
                <TableCell>
                </TableCell>

                {/* Fecha */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearFecha(reserva.date)}
                  </Typography>
                </TableCell>

                {/* Hora Inicio */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearHora(reserva.start_time)}
                  </Typography>
                </TableCell>

                {/* Hora Fin */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearHora(reserva.end_time)}
                  </Typography>
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Indicador pulsante para reunión en curso */}
                    {estadoMostrar === "En curso" && (
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
                    <Chip
                      label={estadoMostrar}
                      size="small"
                      sx={{
                        backgroundColor:
                          STATUS_COLORS[estadoMostrar] || "#F3F4F6",
                        color: STATUS_TEXT_COLORS[estadoMostrar] || "#374151",
                        fontWeight: "600",
                      }}
                    />
                  </Box>
                </TableCell>

                {/* Acciones */}
                <TableCell sx={{ textAlign: "center" }}>
                  {puedeModificarReserva ? (
                    <Box
                      sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                    >
                      {onEdit && (
                        <Tooltip title="Editar reserva">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit(reserva)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onCancel && (
                        <Tooltip title="Cancelar reserva">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onCancel(reserva)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaReservas;
