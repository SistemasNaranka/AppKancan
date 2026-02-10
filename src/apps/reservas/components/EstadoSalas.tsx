// src/apps/reservas/components/EstadoSalas.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import {
  PersonOutlineOutlined as PersonOutlineOutlinedIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  AccessTimeOutlined as AccessTimeOutlinedIcon,
  CheckCircleOutlineOutlined as CheckCircleOutlineOutlinedIcon,
  DataUsageOutlined as DataUsageOutlinedIcon,
} from "@mui/icons-material";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva } from "../types/reservas.types";
import { SALAS_DISPONIBLES, capitalize } from "../types/reservas.types";

interface EstadoSalasProps {
  reservas: Reserva[];
  onVerCronograma: (sala: string) => void;
  onReservarAhora: (sala: string) => void;
}

interface EstadoSala {
  sala: string;
  ocupada: boolean;
  reunionActual: Reserva | null;
  proximaReserva: Reserva | null;
  proximasReservas: Reserva[];
  esReservaFutura: boolean;
}

// Información adicional de las salas
const INFO_SALAS: Record<string, { tipo: string }> = {
  "Sala Princiapal": { tipo: "" },
  "Sala Secundaria": { tipo: "" },
};

const EstadoSalas: React.FC<EstadoSalasProps> = ({
  reservas,
  onVerCronograma,
  onReservarAhora,
}) => {
  const [tiempoActual, setTiempoActual] = useState(new Date());

  // Actualizar tiempo cada segundo para el countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular estado de cada sala
  const estadosSalas = useMemo((): EstadoSala[] => {
    const hoy = format(tiempoActual, "yyyy-MM-dd");
    const horaActual = format(tiempoActual, "HH:mm");

    return SALAS_DISPONIBLES.map((sala) => {
      // Filtrar reservas vigentes o en curso de esta sala
      const reservasSala = reservas.filter(
        (r) =>
          r.nombre_sala === sala &&
          ((r.estadoCalculado || r.estado)?.toLowerCase() === "vigente" ||
            (r.estadoCalculado || r.estado)?.toLowerCase() === "en curso"),
      );

      // Reservas de hoy
      const reservasSalaHoy = reservasSala.filter((r) => r.fecha === hoy);

      // Determinar si hay reservas hoy (futuras o en curso)
      const hayReservasHoy = reservasSalaHoy.some(
        (r) =>
          r.hora_inicio > horaActual ||
          (r.hora_inicio <= horaActual && r.hora_final > horaActual),
      );

      // Buscar reunión en curso (solo hoy)
      const reunionActual = reservasSalaHoy.find((r) => {
        return r.hora_inicio <= horaActual && r.hora_final > horaActual;
      });

      // Determinar qué reservas mostrar
      let proximasReservas: Reserva[] = [];
      let esReservaFutura = false;

      if (hayReservasHoy) {
        // Hay reservas hoy: mostrar próximas reservas de hoy ordenadas cronológicamente
        proximasReservas = reservasSalaHoy
          .filter((r) => r.hora_inicio > horaActual)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        esReservaFutura = false;
      } else {
        // No hay reservas hoy: buscar la próxima reserva de cualquier fecha futura
        const reservasFuturas = reservasSala
          .filter(
            (r) =>
              r.fecha > hoy || (r.fecha === hoy && r.hora_inicio > horaActual),
          )
          .sort((a, b) => {
            // Ordenar por fecha y luego por hora
            if (a.fecha !== b.fecha) {
              return a.fecha.localeCompare(b.fecha);
            }
            return a.hora_inicio.localeCompare(b.hora_inicio);
          });

        if (reservasFuturas.length > 0) {
          // Tomar la primera reserva futura como "próxima"
          proximasReservas = [reservasFuturas[0]];
          esReservaFutura = true;
        }
      }

      return {
        sala,
        ocupada: !!reunionActual,
        reunionActual: reunionActual || null,
        proximaReserva:
          proximasReservas.length > 0 ? proximasReservas[0] : null,
        proximasReservas,
        esReservaFutura,
      };
    });
  }, [reservas, tiempoActual]);

  // Calcular tiempo restante para una reserva en formato H:MM:SS
  const calcularTiempoRestante = (horaFinal: string): string => {
    const hoy = format(tiempoActual, "yyyy-MM-dd");
    const fechaFin = new Date(`${hoy}T${horaFinal}`);
    const diffSeconds = differenceInSeconds(fechaFin, tiempoActual);

    if (diffSeconds <= 0) return "00:00:00";

    const horas = Math.floor(diffSeconds / 3600);
    const minutos = Math.floor((diffSeconds % 3600) / 60);
    const segundos = diffSeconds % 60;

    const hDisplay = horas > 0 ? `${horas}:` : "0:";
    const mDisplay = minutos.toString().padStart(2, "0");
    const sDisplay = segundos.toString().padStart(2, "0");

    return `${hDisplay}${mDisplay}:${sDisplay}`;
  };

  // Formatear hora para mostrar
  const formatearHora = (hora: string): string => {
    const [h, m] = hora.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  // Día actual formateado
  const diaActual = format(tiempoActual, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  // Formatear etiqueta de fecha para próxima reserva (hoy o futura)
  const obtenerEtiquetaFechaReserva = (
    reserva: Reserva | null,
    esFutura: boolean,
  ): string => {
    if (!reserva) return "";

    if (esFutura) {
      // Mostrar fecha formateada para reservas futuras
      const fechaReserva = parseISO(reserva.fecha);
      return format(fechaReserva, "EEEE d 'de' MMMM", { locale: es });
    }

    return "Próxima reserva";
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
        {estadosSalas.map((estado) => {
          const infoSala = INFO_SALAS[estado.sala] || {
            tipo: "",
            capacidad: 10,
          };

          if (estado.ocupada && estado.reunionActual) {
            // Card OCUPADO - Mostrar solo el TÍTULO

            return (
              <Paper
                key={estado.sala}
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
                {/* Header en curso */}
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
                        {estado.sala}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {infoSala.tipo}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Indicador pulsante para reunión en curso */}
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
                        {estado.reunionActual.usuario_id
                          ? `${estado.reunionActual.usuario_id.first_name} ${estado.reunionActual.usuario_id.last_name}`
                          : "Usuario"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Reunión actual - Solo TÍTULO */}
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
                        {estado.reunionActual.titulo_reunion || "Sin título"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Footer con tiempo y botón */}
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
                        FINALIZA EN
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#0F9568",
                          fontFamily: "monospace",
                        }}
                      >
                        {calcularTiempoRestante(
                          estado.reunionActual.hora_final,
                        )}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => onVerCronograma(estado.sala)}
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
            // Card DISPONIBLE

            return (
              <Paper
                key={estado.sala}
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
                {/* Header Vigente */}
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
                        {estado.sala}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {infoSala.tipo}
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

                {/* Contenido */}
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
                        Disponible para reserva
                      </Typography>
                    </Box>
                  </Box>

                  {/* Próxima reserva - Solo TÍTULO */}
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
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#004680",
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        {estado.proximaReserva
                          ? estado.esReservaFutura
                            ? `PRÓXIMA RESERVA · ${obtenerEtiquetaFechaReserva(estado.proximaReserva, estado.esReservaFutura)}`
                            : "PRÓXIMA RESERVA"
                          : "SIN RESERVAS"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#6f7073" }}
                      >
                        {estado.proximaReserva
                          ? `${formatearHora(estado.proximaReserva.hora_inicio)} - ${estado.proximaReserva.titulo_reunion || "Sin título"}`
                          : estado.esReservaFutura
                            ? "Sin reservas programadas para hoy"
                            : "Sin reservas programadas"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Footer con disponibilidad y botón */}
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
                      onClick={() => onReservarAhora(estado.sala)}
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

export default EstadoSalas;
