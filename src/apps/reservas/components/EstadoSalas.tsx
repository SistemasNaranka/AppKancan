// src/apps/reservas/components/EstadoSalas.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import { format, differenceInSeconds, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva } from "../types/reservas.types";
import { SALAS_DISPONIBLES } from "../types/reservas.types";

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

 
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  
  const estadosSalas = useMemo((): EstadoSala[] => {
    const hoy = format(tiempoActual, "yyyy-MM-dd");
    const horaActual = format(tiempoActual, "HH:mm");

    return SALAS_DISPONIBLES.map((sala) => {
      
      const reservasSala = reservas.filter(
        (r) =>
          r.room_name === sala &&
          ((r.estadoCalculado || r.status)?.toLowerCase() === "vigente" ||
            (r.estadoCalculado || r.status)?.toLowerCase() === "en curso"),
      );

     
      const reservasSalaHoy = reservasSala.filter((r) => r.date === hoy);

      
      const hayReservasHoy = reservasSalaHoy.some(
        (r) =>
          r.start_time > horaActual ||
          (r.start_time <= horaActual && r.end_time > horaActual),
      );

      
      const reunionActual = reservasSalaHoy.find((r) => {
        return r.start_time <= horaActual && r.end_time > horaActual;
      });

      
      let proximasReservas: Reserva[] = [];
      let esReservaFutura = false;

      if (hayReservasHoy) {
        // Hay reservas hoy: mostrar próximas reservas de hoy ordenadas cronológicamente
        proximasReservas = reservasSalaHoy
          .filter((r) => r.start_time > horaActual)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        esReservaFutura = false;
      } else {
      
        const reservasFuturas = reservasSala
          .filter(
            (r) =>
              r.date > hoy || (r.date === hoy && r.start_time > horaActual),
          )
          .sort((a, b) => {
           
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            return a.start_time.localeCompare(b.start_time);
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


  const formatearHora = (hora: string): string => {
    const [h, m] = hora.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };


  
  const obtenerEtiquetaFechaReserva = (
    reserva: Reserva | null,
    esFutura: boolean,
  ): string => {
    if (!reserva) return "";

    if (esFutura) {
     
      const fechaReserva = parseISO(reserva.date);
      return format(fechaReserva, "EEEE d 'de' MMMM", { locale: es });
    }

    return "Próxima reserva";
  };

  // Calcula los días faltantes hasta la fecha de la reserva (a las 00:00).
  // Devuelve etiqueta amigable: "Hoy" / "Mañana" / "Faltan N días".
  const obtenerDiasFaltantesLabel = (reserva: Reserva | null): string | null => {
    if (!reserva) return null;
    try {
      const fechaReserva = parseISO(reserva.date);
      fechaReserva.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (fechaReserva.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
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
        {estadosSalas.map((estado) => {
          const infoSala = INFO_SALAS[estado.sala] || {
            tipo: "",
            capacidad: 10,
          };

          if (estado.ocupada && estado.reunionActual) {
            

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
                        {estado.reunionActual.user_id
                          ? `${estado.reunionActual.user_id.first_name} ${estado.reunionActual.user_id.last_name}`
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
                        {estado.reunionActual.meeting_title || "Sin título"}
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
                          estado.reunionActual.end_time,
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
                          {estado.proximaReserva
                            ? estado.esReservaFutura
                              ? `PRÓXIMA RESERVA · ${obtenerEtiquetaFechaReserva(estado.proximaReserva, estado.esReservaFutura)}`
                              : "PRÓXIMA RESERVA"
                            : "SIN RESERVAS"}
                        </Typography>
                        {estado.proximaReserva && (() => {
                          const label = obtenerDiasFaltantesLabel(estado.proximaReserva);
                          if (!label) return null;
                          // Color según urgencia
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
                        {estado.proximaReserva
                          ? `${formatearHora(estado.proximaReserva.start_time)} - ${estado.proximaReserva.meeting_title || "Sin título"}`
                          : estado.esReservaFutura
                            ? "Sin reservas programadas para hoy"
                            : "Sin reservas programadas"}
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
