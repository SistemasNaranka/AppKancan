// src/apps/reservas/views/ReservasView.tsx

import React, { useState, useEffect, useCallback } from "react";

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
} from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";

import { Add as AddIcon } from "@mui/icons-material";

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
    if (reservaSeleccionada) {
      await mutationCancelar.mutateAsync(reservaSeleccionada.id);
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
            <FloatingHelpButton onBeforeStart={handleStartTutorial} />
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
          onClose={() => setDialogCancelar(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Cancelar Reserva</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que deseas cancelar esta reserva?
              <br />
              <br />
              <strong>Sala:</strong> {reservaSeleccionada?.nombre_sala}
              <br />
              <strong>Fecha:</strong> {reservaSeleccionada?.fecha}
              <br />
              <strong>Hora:</strong> {reservaSeleccionada?.hora_inicio} -{" "}
              {reservaSeleccionada?.hora_final}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogCancelar(false)}>
              No, mantener
            </Button>
            <Button
              onClick={confirmarCancelar}
              color="error"
              variant="contained"
              sx={{
                boxShadow: "none",
                textTransform: "none",
                fontWeight: "600",
                "&:hover": {
                  boxShadow: "none",
                },
              }}
            >
              Sí, cancelar
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