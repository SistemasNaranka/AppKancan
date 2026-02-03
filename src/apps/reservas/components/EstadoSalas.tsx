// src/apps/reservas/components/EstadoSalas.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import {
  PersonOutlineOutlined as PersonOutlineOutlinedIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  AccessTimeOutlined as AccessTimeOutlinedIcon,
  CheckCircleOutlineOutlined as CheckCircleOutlineOutlinedIcon,
  DataUsageOutlined as DataUsageOutlinedIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { format, differenceInSeconds } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva } from "../types/reservas.types";
import { SALAS_DISPONIBLES } from "../types/reservas.types";

interface EstadoSalasProps {
  reservas: Reserva[];
  onVerCronograma: (sala: string) => void;
  onReservarAhora: (sala: string) => void;
  onNuevaReserva: () => void;
}

interface EstadoSala {
  sala: string;
  ocupada: boolean;
  reunionActual: Reserva | null;
  proximaReserva: Reserva | null;
}

// Información adicional de las salas
const INFO_SALAS: Record<string, { tipo: string }> = {
  "Sala A": { tipo: "" },
  "Sala B": { tipo: "" },
};

const EstadoSalas: React.FC<EstadoSalasProps> = ({
  reservas,
  onVerCronograma,
  onReservarAhora,
  onNuevaReserva,
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
      // Filtrar reservas de hoy para esta sala
      const reservasSalaHoy = reservas.filter(
        (r) =>
          r.nombre_sala === sala &&
          r.fecha === hoy &&
          ((r.estadoCalculado || r.estado)?.toLowerCase() === "vigente" ||
            (r.estadoCalculado || r.estado)?.toLowerCase() === "en curso")
      );

      // Buscar reunión en curso
      const reunionActual = reservasSalaHoy.find((r) => {
        return r.hora_inicio <= horaActual && r.hora_final > horaActual;
      });

      // Buscar próxima reserva
      const proximaReserva = reservasSalaHoy
        .filter((r) => r.hora_inicio > horaActual)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];

      return {
        sala,
        ocupada: !!reunionActual,
        reunionActual: reunionActual || null,
        proximaReserva: proximaReserva || null,
      };
    });
  }, [reservas, tiempoActual]);

// Calcular tiempo restante para una reserva en formato H:MM:SS
const calcularTiempoRestante = (horaFinal: string): string => {
  const hoy = format(tiempoActual, "yyyy-MM-dd");
  const fechaFin = new Date(`${hoy}T${horaFinal}`);
  const diffSeconds = differenceInSeconds(fechaFin, tiempoActual);

  if (diffSeconds <= 0) return "00:00:00";

  // 1. Extraer las horas (3600 segundos = 1 hora)
  const horas = Math.floor(diffSeconds / 3600);
  
  // 2. Extraer los minutos restantes del sobrante de las horas
  const minutos = Math.floor((diffSeconds % 3600) / 60);
  
  // 3. El resto son los segundos
  const segundos = diffSeconds % 60;

  // 4. Formatear con padStart para que siempre tengan 2 dígitos (excepto las horas)
  const hDisplay = horas > 0 ? `${horas}:` : "0:"; // O "" si prefieres no mostrar el 0
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
  const diaActual = format(tiempoActual, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header con título y botón */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <DataUsageOutlinedIcon sx={{ color: "#6b7280" }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
              Estado Actual de las Salas
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#6b7280", textTransform: "capitalize" }}>
            {diaActual} • Horario laboral: 7:00 AM - 4:30 PM
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon/>}
          onClick={onNuevaReserva}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            boxShadow: "none",
            backgroundColor: "#004680",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#005AA3",
            },
          }}
        >
          Nueva reserva
        </Button>
      </Box>

      {/* Cards de salas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
        }}
      >
        {estadosSalas.map((estado) => {
          const infoSala = INFO_SALAS[estado.sala] || { tipo: "Sala", capacidad: 10 };

          if (estado.ocupada && estado.reunionActual) {
            // Card OCUPADO
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
                {/* Header azul */}
                <Box
                  sx={{
                    background: "#004680",
                    color: "white",
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {estado.sala}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {infoSala.tipo}
                      </Typography>
                    </Box>
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

                {/* Contenido */}
                <Box sx={{ p: 2.5 }}>
                  {/* Organizador */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                    <PersonOutlineOutlinedIcon sx={{ color: "#004680", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", fontWeight: 600 }}>
                        ORGANIZADOR ACTUAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {estado.reunionActual.usuario_id
                          ? `${estado.reunionActual.usuario_id.first_name} ${estado.reunionActual.usuario_id.last_name}`
                          : "Usuario"}
                        {estado.reunionActual.usuario_id?.rol_usuario?.area && (
                          <Typography component="span" sx={{ color: "#6b7280" }}>
                            {" "}({estado.reunionActual.usuario_id.rol_usuario.area})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Reunión actual */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                    <DescriptionOutlinedIcon sx={{ color: "#004680", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#004680", display: "block", fontWeight: 600 }}>
                        REUNIÓN ACTUAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {estado.reunionActual.observaciones || "Sin título"}
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
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
                        FINALIZA EN
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#004680",
                          fontFamily: "monospace",
                        }}
                      >
                        {calcularTiempoRestante(estado.reunionActual.hora_final)}
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
                          borderColor: "#004680",
                          color: "#005AA3",
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
                {/* Header verde */}
                <Box
                  sx={{
                    background: "#0F9568",
                    color: "white",
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
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
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                    <CheckCircleOutlineOutlinedIcon sx={{ color: "#0F9568", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", fontWeight: 600 }}>
                        ESTADO ACTUAL
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "#6f7073",}}>
                        Disponible para reserva
                      </Typography>
                    </Box>
                  </Box>

                  {/* Próxima reserva */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
                    <AccessTimeOutlinedIcon sx={{ color: "#004680", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#004680", display: "block", fontWeight: 600 }}>
                        PRÓXIMA RESERVA
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "#6f7073"}}>
                        {estado.proximaReserva
                          ? `${formatearHora(estado.proximaReserva.hora_inicio)} - ${estado.proximaReserva.observaciones || "Sin título"}`
                          : "Sin reservas programadas hoy"}
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
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block" }}>
                        DISPONIBILIDAD
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "#0F9568",
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
                        backgroundColor: "#0F9568",
                        borderRadius: 2,
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#00af75",
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