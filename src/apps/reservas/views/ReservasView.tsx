// src/apps/reservas/views/ReservasView.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";

// Importar el componente de Tour
import {
  ReservasTour,
  TourProvider,
  useTourContext,
  FloatingHelpButton,
} from "../components";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  styled,
  keyframes,
  IconButton,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
  TextField,
} from "@mui/material";
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RoomIcon from '@mui/icons-material/MeetingRoom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { notificarCorreoReserva } from "../services/correoReservas";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";
import { useTutorial } from "@/shared/hooks/TutorialContext";

import AddIcon from '@mui/icons-material/Add';

// Componentes
import EstadoSalas from "../components/EstadoSalas";
import ProximasReuniones from "../components/ProximasReuniones";
import VistaSemanal from "../components/VistaSemanal";
import VistaCalendario from "../components/VistaCalendario";
import MisReservasCards from "../components/MisReservasCards";
import DialogNuevaReserva from "../components/DialogNuevaReserva";
import DialogEditarReserva from "../components/DialogEditarReserva";

// Services y types
import {
  getReservas,
  getMisReservas,
  crearReserva,
  actualizarReserva,
  cancelarReserva,
  verificarConflictoHorario,
  actualizarReservasFinalizadas,
} from "../services/reservas";
import type {
  Reserva,
  NuevaReserva,
  ActualizarReserva,
  FiltrosReserva,
  Sala,
} from "../types/reservas.types";
import { text } from "stream/consumers";

type TabReservas = "Reserva" | "mis" | "calendario";

// Títulos dinámicos por pestaña
const TITULOS_PESTANA: Record<TabReservas, string> = {
  Reserva: "Reservar Sala",
  mis: "Mis Reservas",
  calendario: "Calendario",
};

// Configuracion de animaciones para el segmented control
const tabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components para tabs animados
const TabContainer = styled(Box)({
  display: "inline-flex",
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 4,
  gap: 4,
  position: "relative",
  overflow: "hidden",
});

const AnimatedTab = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isActive" && prop !== "isFirst" && prop !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(
  ({ isActive, isFirst, isLast }) => ({
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    borderRadius: isFirst ? 10 : isLast ? 10 : 6,
    backgroundColor: isActive ? "white" : "transparent",
    color: isActive ? "#1976d2" : "#6b7280",
    boxShadow: isActive
      ? "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)"
      : "none",
    minWidth: 80,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isActive ? "scale(1)" : "scale(0.95)",
    animation: isActive
      ? `${tabPulse} 0.3s ease-out, ${tabFadeIn} 0.2s ease-out`
      : "none",
    "&:hover": {
      backgroundColor: isActive ? "white" : "rgba(25, 118, 210, 0.06)",
      color: isActive ? "#1976d2" : "#374151",
      transform: isActive ? "scale(1.02)" : "scale(1)",
    },
    "&:focus-visible": {
      outline: "2px solid #1976d2",
      outlineOffset: 2,
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  })
);

// Componente interno que usa el contexto del tour
const ReservasViewContent: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { area } = useApps();
  const { showSnackbar } = useGlobalSnackbar();

  // Contexto global de tutoriales (disparo desde PeekButton)
  const { activeTutorial, endTutorial } = useTutorial();
  const floatingBtnRef = useRef<HTMLDivElement>(null);

  // Obtener el contexto del tour
  const {
    setTabChangeCallback,
    setOpenDialogCallback,
    setCloseDialogCallback,
    isFullTourRunning,
    tourPhase,
    userCreatedReservation,
  } = useTourContext();

  const [tabActual, setTabActual] = useState<TabReservas>("Reserva");
  const [vistaCalendario, setVistaCalendario] = useState<"semanal" | "mes">(
    "semanal"
  );
  const [salaInicial, setSalaInicial] = useState<string | undefined>(undefined);
  const [dialogNueva, setDialogNueva] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [dialogCancelar, setDialogCancelar] = useState(false);
  const [notificarCancelacion, setNotificarCancelacion] = useState<boolean>(true);
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>("");
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);
  const [fechaInicialReserva, setFechaInicialReserva] = useState<
    string | undefined
  >(undefined);
  const [salaInicialReserva, setSalaInicialReserva] = useState<
    Sala | undefined
  >(undefined);
  const [horaInicialReserva, setHoraInicialReserva] = useState<
    string | undefined
  >(undefined);

  // Filtros para cada sección
  const [filtrosMis, setFiltrosMis] = useState<FiltrosReserva>({});

  // Registrar callbacks para el tour
  useEffect(() => {
    setTabChangeCallback((tab: TabReservas) => {
      setTabActual(tab);
      if (tab !== "calendario") {
        setSalaInicial(undefined);
      }
    });
  }, [setTabChangeCallback]);

  useEffect(() => {
    setOpenDialogCallback(() => {
      setDialogNueva(true);
    });
  }, [setOpenDialogCallback]);

  useEffect(() => {
    setCloseDialogCallback(() => {
      setDialogNueva(false);
    });
  }, [setCloseDialogCallback]);

  // Disparo del tour cuando el PeekButton lo solicita
  useEffect(() => {
    if (activeTutorial === "reservas") {
      // Asegura la pestaña correcta
      setTabActual("Reserva");
      setSalaInicial(undefined);

      // Pequeño delay para que el FloatingHelpButton esté montado
      const t = setTimeout(() => {
        const btn = floatingBtnRef.current?.querySelector("button");
        btn?.click();
        endTutorial(); // limpia el flag global
      }, 200);

      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTutorial]);

  // Obtener todas las reservas
  const { data: todasReservas = [], isLoading: loadingTodas } = useQuery({
    queryKey: ["reservas", "todas"],
    queryFn: () => getReservas({}),
    refetchInterval: 30000,
  });

  // Obtener mis reservas
  const { data: misReservas = [], isLoading: loadingMis } = useQuery({
    queryKey: ["reservas", "mis", filtrosMis],
    queryFn: () => getMisReservas(filtrosMis),
    refetchInterval: 30000,
  });

  // Efecto para actualizar automáticamente las reservas finalizadas en la BD
  useEffect(() => {
    actualizarReservasFinalizadas();
  }, [todasReservas]); // Se ejecuta cuando las reservas se recargan

  // Determinar qué reservas mostrar en el calendario durante el tour
  const reservasParaCalendario = React.useMemo(() => {
    // Durante el tour en fase CALENDARIO, mostrar solo la reserva del usuario
    if (isFullTourRunning && tourPhase === "CALENDARIO" && userCreatedReservation) {
      return [userCreatedReservation];
    }
    return todasReservas;
  }, [todasReservas, isFullTourRunning, tourPhase, userCreatedReservation]);

  // Mutación para crear reserva
  const mutationCrear = useMutation({
    mutationFn: (datos: NuevaReserva) => crearReserva(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      showSnackbar("Reserva creada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al crear la reserva", "error");
    },
  });

  // Mutación para actualizar reserva
  const mutationActualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarReserva }) =>
      actualizarReserva(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      showSnackbar("Reserva actualizada exitosamente", "success");
    },

    onError: (error: any) => {
      showSnackbar(error?.message || "Error al actualizar la reserva", "error");
    },
  });

  // Mutación para cancelar reserva
  const mutationCancelar = useMutation({
    mutationFn: (id: number) => cancelarReserva(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setDialogCancelar(false);
      setReservaSeleccionada(null);
      showSnackbar("Reserva cancelada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al cancelar la reserva", "error");
    },
  });

  // Handlers
  const handleCrearReserva = async (datos: NuevaReserva) => {
    // Agregar el área del usuario a los datos de la reserva
    const datosConArea = {
      ...datos,
      area: area || null,
    };
    await mutationCrear.mutateAsync(datosConArea);
  };

  // Handler para abrir diálogo de nueva reserva
  const handleAbrirNuevaReserva = (
    fecha?: string,
    sala?: string,
    hora?: string
  ) => {
    setFechaInicialReserva(fecha);
    setSalaInicialReserva(sala as Sala | undefined);
    setHoraInicialReserva(hora);
    setDialogNueva(true);
  };

  // Handler para cerrar diálogo de nueva reserva
  const handleCerrarNuevaReserva = () => {
    setDialogNueva(false);
    setFechaInicialReserva(undefined);
    setSalaInicialReserva(undefined);
    setHoraInicialReserva(undefined);
  };

  const handleEditarReserva = (reserva: Reserva) => {
    // No abrir diálogos durante el tour
    if (isFullTourRunning) return;

    setReservaSeleccionada(reserva);
    setDialogEditar(true);
  };

  const handleActualizarReserva = async (
    id: number,
    datos: ActualizarReserva
  ) => {
    await mutationActualizar.mutateAsync({ id, datos });
  };

  const handleCancelarReserva = (reserva: Reserva) => {
    // No abrir diálogos durante el tour
    if (isFullTourRunning) return;

    setReservaSeleccionada(reserva);
    setDialogCancelar(true);
  };

  const confirmarCancelar = async () => {
    if (!reservaSeleccionada) return;

    await mutationCancelar.mutateAsync(reservaSeleccionada.id);

    // Notificación n8n post-cancelación. Solo si el toggle está activo.
    // No bloquea: si falla, solo logea (la cancelación ya quedó en BD).
    if (notificarCancelacion) {
      try {
        const result = await notificarCorreoReserva({
          evento: "reserva_cancelada",
          reserva: {
            nombre_sala: reservaSeleccionada.nombre_sala,
            fecha: reservaSeleccionada.fecha,
            hora_inicio: (reservaSeleccionada.hora_inicio || "").substring(0, 5),
            hora_final: (reservaSeleccionada.hora_final || "").substring(0, 5),
            titulo_reunion: reservaSeleccionada.titulo_reunion || "",
            observaciones: reservaSeleccionada.observaciones || "",
            participantes: (reservaSeleccionada as any).participantes || [],
          },
          // Campo extra fuera del type — n8n lo recibe en data.motivo
          ...({ motivo: motivoCancelacion.trim() } as any),
        });
        console.info("[n8n] correo cancelación enviado OK:", result);
      } catch (err) {
        console.warn("[n8n] correo cancelación NO enviado:", err);
      }
    } else {
      console.info("[n8n] envío de correo de cancelación desactivado");
    }
  };

  const handleVerificarConflicto = async (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir?: number
  ) => {
    // Durante el tour, no verificar conflictos
    if (isFullTourRunning) return false;

    return await verificarConflictoHorario(
      sala,
      fecha,
      horaInicio,
      horaFinal,
      reservaIdExcluir
    );
  };

  // Handler para ver cronograma de una sala
  const handleVerCronograma = (sala: string) => {
    // No navegar durante el tour
    if (isFullTourRunning) return;

    setSalaInicial(sala);
    setVistaCalendario("semanal");
    setTabActual("calendario");
  };

  // Handler para reservar ahora
  const handleReservarAhora = (sala: string) => {
    // No abrir diálogos durante el tour (excepto si es parte del tour)
    if (isFullTourRunning) return;

    const hoy = format(new Date(), "yyyy-MM-dd");
    handleAbrirNuevaReserva(hoy, sala);
  };

  // Handler para iniciar el tutorial - cambia a pestaña Reserva si es necesario
  const handleStartTutorial = useCallback(() => {
    // Siempre cambiar a la pestaña Reserva antes de iniciar el tour
    setTabActual("Reserva");
    setSalaInicial(undefined);
  }, []);

  // Pestañas
  const tabs: { id: TabReservas; label: string }[] = [
    { id: "Reserva", label: "Reserva" },
    { id: "mis", label: "Mis reservas" },
    { id: "calendario", label: "Calendario" },
  ];

  return (
    <ReservasTour>
      <Box sx={{ mt: -1 }}>
        {/* Header con pestañas */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            mb: 1,
            pb: 0.5,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          
          {/* Logo y título */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 180,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                backgroundColor: "#1976d2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#1a2a3a" }}
            >
              {TITULOS_PESTANA[tabActual]}
            </Typography>
          </Box>

          {/* Pestañas de navegación */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <TabContainer>
              {tabs.map((tab, index) => {
                const isFirst = index === 0;
                const isLast = index === tabs.length - 1;
                const isActive = tabActual === tab.id;

                return (
                  <AnimatedTab
                    key={tab.id}
                    isActive={isActive}
                    isFirst={isFirst}
                    isLast={isLast}
                    onClick={() => {
                      // No permitir cambiar de pestaña manualmente durante el tour
                      if (isFullTourRunning) return;

                      setTabActual(tab.id);
                      if (tab.id !== "calendario") {
                        setSalaInicial(undefined);
                      }
                    }}
                    tabIndex={0}
                    role="tab"
                    aria-selected={isActive}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (isFullTourRunning) return;
                        setTabActual(tab.id);
                        if (tab.id !== "calendario") {
                          setSalaInicial(undefined);
                        }
                      }
                    }}
                    sx={{
                      cursor: isFullTourRunning ? "not-allowed" : "pointer",
                      opacity: isFullTourRunning && !isActive ? 0.5 : 1,
                    }}
                  >
                    {tab.label}
                  </AnimatedTab>
                );
              })}
            </TabContainer>
          </Box>

          {/* Botones de ayuda y nueva reserva - Alineados a la derecha */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <div ref={floatingBtnRef} style={{ display: "inline-flex" }}>
              <FloatingHelpButton onBeforeStart={handleStartTutorial} />
            </div>
            <Button
              className="tour-nueva-reserva"
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => handleAbrirNuevaReserva()}
              sx={{
                boxShadow: "none",
                textTransform: "none",
                fontWeight: "600",
                backgroundColor: "rgb(15, 149, 104)",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#0B6B4B",
                },
              }}
            >
              Nueva reserva
            </Button>
          </Box>
        </Box>

        {/* Contenido de Reserva */}
        {tabActual === "Reserva" && (
          <Box>
            {/* Estado de las salas */}
            <Box className="tour-estado-salas">
              <EstadoSalas
                reservas={todasReservas}
                onVerCronograma={handleVerCronograma}
                onReservarAhora={handleReservarAhora}
              />
            </Box>

            {/* Próximas reuniones */}
            <Box className="tour-proximas-reuniones">
              <ProximasReuniones
                reservas={todasReservas}
                onVerCalendarioCompleto={() => {
                  if (isFullTourRunning) return;
                  setSalaInicial(undefined);
                  setTabActual("calendario");
                }}
              />
            </Box>
          </Box>
        )}

        {/* Contenido de Mis reservas */}
        {tabActual === "mis" && (
          <Box className="tour-tabla-reservas">
            <MisReservasCards
              reservas={misReservas}
              usuarioActualId={user?.id}
              onEditar={handleEditarReserva}
              onCancelar={handleCancelarReserva}
              onNuevaReserva={() => handleAbrirNuevaReserva()}
              loading={loadingMis}
            />
          </Box>
        )}

        {/* Contenido de Calendario */}
        {tabActual === "calendario" && (
          <Box
            sx={{
              width: "100%",
              height: "calc(100vh - 180px)",
              minHeight: 400,
            }}
          >
            {/* Banner durante el tour */}
            {isFullTourRunning && tourPhase === "CALENDARIO" && userCreatedReservation && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  backgroundColor: "#D1FAE5",
                  borderRadius: 2,
                  border: "1px solid #10B981",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#065F46", fontWeight: "bold", textAlign: "center" }}
                >
                  Mostrando solo tu reserva de ejemplo: "{userCreatedReservation.titulo_reunion}" 
                  en {userCreatedReservation.nombre_sala}
                </Typography>
              </Box>
            )}

            {vistaCalendario === "semanal" ? (
              <VistaSemanal
                reservas={reservasParaCalendario}
                onNuevaReserva={handleAbrirNuevaReserva}
                onEditarReserva={handleEditarReserva}
                onCancelarReserva={handleCancelarReserva}
                usuarioActualId={user?.id}
                vistaCalendario={vistaCalendario}
                onCambiarVista={setVistaCalendario}
                salaInicial={salaInicial || userCreatedReservation?.nombre_sala}
              />
            ) : (
              <VistaCalendario
                onNuevaReserva={handleAbrirNuevaReserva}
                onEditarReserva={handleEditarReserva}
                onCancelarReserva={handleCancelarReserva}
                usuarioActualId={user?.id}
                vistaCalendario={vistaCalendario}
                onCambiarVista={setVistaCalendario}
                salaInicial={salaInicial || userCreatedReservation?.nombre_sala}
              />
            )}
          </Box>
        )}

        {/* Diálogo Nueva Reserva */}
        <DialogNuevaReserva
          open={dialogNueva}
          onClose={handleCerrarNuevaReserva}
          onSubmit={handleCrearReserva}
          verificarConflicto={handleVerificarConflicto}
          fechaInicial={fechaInicialReserva}
          salaInicial={salaInicialReserva}
          horaInicial={horaInicialReserva}
        />

        {/* Diálogo Editar Reserva */}
        <DialogEditarReserva
          open={dialogEditar}
          reserva={reservaSeleccionada}
          onClose={() => {
            setDialogEditar(false);
            setReservaSeleccionada(null);
          }}
          onSubmit={handleActualizarReserva}
          verificarConflicto={handleVerificarConflicto}
        />

        {/* Diálogo Confirmar Cancelación */}
        <Dialog
          open={dialogCancelar}
          onClose={() => {
            if (mutationCancelar.isPending) return;
            setDialogCancelar(false);
            setMotivoCancelacion("");
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          {/* Header con color principal */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
              color: "white",
              p: 3,
              position: "relative",
            }}
          >
            <IconButton
              onClick={() => { setDialogCancelar(false); setMotivoCancelacion(""); }}
              disabled={mutationCancelar.isPending}
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                color: "rgba(255,255,255,0.8)",
                "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.15)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EventBusyIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Cancelar Reserva
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: "0.8rem" }}>
                  Esta acción no se puede deshacer
                </Typography>
              </Box>
            </Box>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            {/* Aviso */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                p: 1.8,
                mb: 2.5,
                bgcolor: "#FEF3C7",
                borderRadius: 2,
                border: "1px solid #FDE68A",
                alignItems: "flex-start",
              }}
            >
              <WarningAmberIcon sx={{ color: "#B45309", fontSize: 22, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: "#78350F", lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas cancelar esta reserva? Los participantes serán notificados si activas la opción de abajo.
              </Typography>
            </Box>

            {/* Detalles de la reserva */}
            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                overflow: "hidden",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#F9FAFB",
                  px: 2,
                  py: 1.2,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6B7280",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontSize: "0.7rem",
                  }}
                >
                  Detalles de la reserva
                </Typography>
              </Box>

              {/* Título de la reunión */}
              {reservaSeleccionada?.titulo_reunion && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                    Reunión
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mt: 0.3 }}>
                    {reservaSeleccionada.titulo_reunion}
                  </Typography>
                </Box>
              )}

              {/* Sala */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <RoomIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                    Sala
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                    {reservaSeleccionada?.nombre_sala}
                  </Typography>
                </Box>
              </Box>

              {/* Fecha */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <CalendarIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                    Fecha
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                    {reservaSeleccionada?.fecha
                      ? (() => {
                          try {
                            const [y, m, d] = reservaSeleccionada.fecha.split("-").map(Number);
                            const date = new Date(y, m - 1, d);
                            return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
                          } catch {
                            return reservaSeleccionada.fecha;
                          }
                        })()
                      : ""}
                  </Typography>
                </Box>
              </Box>

              {/* Hora (Inicio - Final en una sola línea) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                }}
              >
                <AccessTimeIcon sx={{ color: "#004680", fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                    Horario
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                    {(() => {
                      const fmt = (h?: string) => {
                        if (!h) return "";
                        const [hh, mm] = h.substring(0, 5).split(":").map(Number);
                        if (isNaN(hh) || isNaN(mm)) return h;
                        const ampm = hh >= 12 ? "PM" : "AM";
                        const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                        return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
                      };
                      return `${fmt(reservaSeleccionada?.hora_inicio)} — ${fmt(reservaSeleccionada?.hora_final)}`;
                    })()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Motivo de cancelación (opcional) */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#6B7280",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: "0.7rem",
                  display: "block",
                  mb: 0.8,
                }}
              >
                Motivo de la cancelación <span style={{ color: "#9CA3AF", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value.slice(0, 300))}
                placeholder="Ej. La reunión se reprogramará la próxima semana, conflicto de agenda…"
                disabled={mutationCancelar.isPending}
                helperText={`${motivoCancelacion.length}/300 — Se incluirá en el correo a los participantes`}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "white",
                    fontSize: "0.875rem",
                  },
                  "& .MuiFormHelperText-root": {
                    fontSize: "0.7rem",
                    color: "#9CA3AF",
                    ml: 0.5,
                  },
                }}
              />
            </Box>

            {/* Toggle notificar participantes */}
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#F9FAFB",
                borderRadius: 2,
                border: "1px solid #E5E7EB",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={notificarCancelacion}
                    onChange={(e) => setNotificarCancelacion(e.target.checked)}
                    disabled={mutationCancelar.isPending}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#004680" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#004680",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#374151", fontWeight: 500 }}>
                    Notificar a los participantes por correo
                  </Typography>
                }
                sx={{ ml: 0, mr: 0, width: "100%" }}
              />
            </Box>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={() => { setDialogCancelar(false); setMotivoCancelacion(""); }}
              disabled={mutationCancelar.isPending}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#374151",
                px: 2.5,
              }}
            >
              No, mantener
            </Button>
            <Button
              onClick={confirmarCancelar}
              disabled={mutationCancelar.isPending}
              variant="contained"
              startIcon={
                mutationCancelar.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <EventBusyIcon />
                )
              }
              sx={{
                bgcolor: "#dc2626",
                boxShadow: "none",
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#b91c1c", boxShadow: "none" },
              }}
            >
              {mutationCancelar.isPending ? "Cancelando..." : "Sí, cancelar reserva"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

    </ReservasTour>
  );
};

const ReservasView: React.FC = () => {
  return (
    <TourProvider>
      <ReservasViewContent />
    </TourProvider>
  );
};

export default ReservasView;