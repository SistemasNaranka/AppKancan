// src/apps/reservas/components/TablaReservas.tsx

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
import { Edit as EditIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, EstadoReserva } from "../types/reservas.types";
import {
  COLORES_ESTADO,
  COLORES_TEXTO_ESTADO,
  puedeModificarse,
} from "../types/reservas.types";

interface TablaReservasProps {
  reservas: Reserva[];
  usuarioActualId?: string;
  onEditar?: (reserva: Reserva) => void;
  onCancelar?: (reserva: Reserva) => void;
  loading?: boolean;
}

const TablaReservas: React.FC<TablaReservasProps> = ({
  reservas,
  usuarioActualId,
  onEditar,
  onCancelar,
  loading = false,
}) => {
  // Filtrar solo reservas vigentes y en curso (no mostrar finalizadas ni canceladas)
  const reservasFiltradas = reservas.filter((reserva) => {
    const estado =
      (reserva.estadoCalculado || reserva.estado)?.toLowerCase() || "";
    return estado === "vigente" || estado === "en curso";
  });

  const puedeModificar = (reserva: Reserva): boolean => {
    if (!usuarioActualId) return false;
    if (!reserva.usuario_id) return false;
    if (reserva.usuario_id.id !== usuarioActualId) return false;

    // Usar estado calculado para determinar si puede modificarse
    const estadoActual = reserva.estadoCalculado || reserva.estado;
    if (!puedeModificarse(estadoActual)) return false;

    const ahora = new Date();
    const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);

    return fechaReserva > ahora;
  };

  const formatearFecha = (fecha: string): string => {
    try {
      // Agregar T12:00:00 para evitar problemas de zona horaria
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

  const getNombreUsuario = (reserva: Reserva): string => {
    if (!reserva.usuario_id) {
      return "Usuario no disponible";
    }
    return `${reserva.usuario_id.first_name} ${reserva.usuario_id.last_name}`;
  };

  const getAreaReserva = (reserva: Reserva): string => {
    if (!reserva.area) {
      // Si no hay área en la reserva, intentar obtenerla del usuario (fallback)
      return reserva.usuario_id?.rol_usuario?.area || "-";
    }
    return reserva.area;
  };

  // Obtener el estado a mostrar (calculado o guardado)
  const getEstadoMostrar = (reserva: Reserva): EstadoReserva => {
    return (reserva.estadoCalculado || reserva.estado) as EstadoReserva;
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
            {/* <TableCell sx={{ fontWeight: "bold", color: "#1a2a3ae0" }}>
              USUARIO
            </TableCell> */}
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
                    {reserva.nombre_sala}
                  </Typography>
                  {reserva.observaciones && (
                    <Typography variant="caption" color="text.secondary">
                      {reserva.observaciones}
                    </Typography>
                  )}
                </TableCell>

                {/* Área */}
                <TableCell>
                  <Typography variant="body2">
                    {getAreaReserva(reserva)}
                  </Typography>
                </TableCell>

                {/* Fecha */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearFecha(reserva.fecha)}
                  </Typography>
                </TableCell>

                {/* Hora Inicio */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearHora(reserva.hora_inicio)}
                  </Typography>
                </TableCell>

                {/* Hora Fin */}
                <TableCell>
                  <Typography variant="body2">
                    {formatearHora(reserva.hora_final)}
                  </Typography>
                </TableCell>

                {/* Usuario
                <TableCell>
                  <Typography variant="body2">
                    {getNombreUsuario(reserva)}
                  </Typography>
                </TableCell> */}

                {/* Estado */}
                <TableCell>
                  <Chip
                    label={estadoMostrar}
                    size="small"
                    sx={{
                      backgroundColor:
                        COLORES_ESTADO[estadoMostrar] || "#F3F4F6",
                      color: COLORES_TEXTO_ESTADO[estadoMostrar] || "#374151",
                      fontWeight: "600",
                    }}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell sx={{ textAlign: "center" }}>
                  {puedeModificarReserva ? (
                    <Box
                      sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                    >
                      {onEditar && (
                        <Tooltip title="Editar reserva">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEditar(reserva)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onCancelar && (
                        <Tooltip title="Cancelar reserva">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onCancelar(reserva)}
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
