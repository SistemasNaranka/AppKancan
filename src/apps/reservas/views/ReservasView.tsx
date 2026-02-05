// src/apps/reservas/views/ReservasView.tsx

import React, { useState } from "react";

// Importar el componente de Tour
import { ReservasTour } from "../components/ReservasTour";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  styled,
  keyframes,
} from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";

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
} from "../services/reservas";
import type {
  Reserva,
  NuevaReserva,
  ActualizarReserva,
  FiltrosReserva,
  Sala,
} from "../types/reservas.types";

type TabReservas = "Reserva" | "mis" | "calendario";

// Títulos dinámicos por pestaña
const TITULOS_PESTANA: Record<TabReservas, string> = {
  "Reserva": "Reservar Sala",
  "mis": "Mis Reservas",
  "calendario": "Calendario",
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

const containerGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
  50% { box-shadow: 0 0 8px 2px rgba(25, 118, 210, 0.15); }
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
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(({ isActive, isFirst, isLast }) => ({
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
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: isFirst ? 10 : isLast ? 10 : 6,
    padding: "1px",
    background: isActive ? "none" : "transparent",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    pointerEvents: "none",
  },
  "&:hover": {
    backgroundColor: isActive 
      ? "white" 
      : "rgba(25, 118, 210, 0.06)",
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
}));

const ReservasView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { area } = useApps();

  const [tabActual, setTabActual] = useState<TabReservas>("Reserva");
  const [vistaCalendario, setVistaCalendario] = useState<"semanal" | "mes">(
    "semanal",
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

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

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

  // Mutación para crear reserva
  const mutationCrear = useMutation({
    mutationFn: (datos: NuevaReserva) => crearReserva(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setSnackbar({
        open: true,
        message: "Reserva creada exitosamente",
        severity: "success",
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || "Error al crear la reserva",
        severity: "error",
      });
    },
  });

  // Mutación para actualizar reserva
  const mutationActualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarReserva }) =>
      actualizarReserva(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setSnackbar({
        open: true,
        message: "Reserva actualizada exitosamente",
        severity: "success",
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || "Error al actualizar la reserva",
        severity: "error",
      });
    },
  });

  // Mutación para cancelar reserva
  const mutationCancelar = useMutation({
    mutationFn: (id: number) => cancelarReserva(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      setSnackbar({
        open: true,
        message: "Reserva cancelada exitosamente",
        severity: "success",
      });
      setDialogCancelar(false);
      setReservaSeleccionada(null);
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || "Error al cancelar la reserva",
        severity: "error",
      });
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
    hora?: string,
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
    setReservaSeleccionada(reserva);
    setDialogEditar(true);
  };

  const handleActualizarReserva = async (
    id: number,
    datos: ActualizarReserva,
  ) => {
    await mutationActualizar.mutateAsync({ id, datos });
  };

  const handleCancelarReserva = (reserva: Reserva) => {
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
    reservaIdExcluir?: number,
  ) => {
    return await verificarConflictoHorario(
      sala,
      fecha,
      horaInicio,
      horaFinal,
      reservaIdExcluir,
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handler para ver cronograma de una sala
  const handleVerCronograma = (sala: string) => {
    setSalaInicial(sala);
    setVistaCalendario("semanal");
    setTabActual("calendario");
  };

  // Handler para reservar ahora
  const handleReservarAhora = (sala: string) => {
    const hoy = format(new Date(), "yyyy-MM-dd");
    handleAbrirNuevaReserva(hoy, sala);
  };

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
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
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
                        setTabActual(tab.id);
                        if (tab.id !== "calendario") {
                          setSalaInicial(undefined);
                        }
                      }
                    }}
                  >
                    {tab.label}
                  </AnimatedTab>
                );
              })}
            </TabContainer>
          </Box>

          {/* Botón Nueva reserva - Alineado a la derecha */}
          <Button
            className="tour-nueva-reserva"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleAbrirNuevaReserva()}
            sx={{
              boxShadow: "none",
              textTransform: "none",
              fontWeight: "600",
              backgroundColor: "#0F9568",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: "#0B6B4B",
              },
            }}
          >
            Nueva reserva
          </Button>
        </Box>

        {/* Contenido de Reserva */}
        {tabActual === "Reserva" && (
          <Box>
            {/* Estado de las salas */}
            <EstadoSalas
              reservas={todasReservas}
              onVerCronograma={handleVerCronograma}
              onReservarAhora={handleReservarAhora}
            />

            {/* Próximas reuniones */}
            <ProximasReuniones
              reservas={todasReservas}
              onVerCalendarioCompleto={() => {
                setSalaInicial(undefined);
                setTabActual("calendario");
              }}
            />
          </Box>
        )}

        {/* Contenido de Mis reservas */}
        {tabActual === "mis" && (
          <Box>
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
            sx={{ width: "100%", height: "calc(100vh - 180px)", minHeight: 400 }}
          >
            {vistaCalendario === "semanal" ? (
              <VistaSemanal
                reservas={todasReservas}
                onNuevaReserva={handleAbrirNuevaReserva}
                onEditarReserva={handleEditarReserva}
                onCancelarReserva={handleCancelarReserva}
                usuarioActualId={user?.id}
                vistaCalendario={vistaCalendario}
                onCambiarVista={setVistaCalendario}
                salaInicial={salaInicial}
              />
            ) : (
              <VistaCalendario
                onNuevaReserva={handleAbrirNuevaReserva}
                onEditarReserva={handleEditarReserva}
                onCancelarReserva={handleCancelarReserva}
                usuarioActualId={user?.id}
                vistaCalendario={vistaCalendario}
                onCambiarVista={setVistaCalendario}
                salaInicial={salaInicial}
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
            <Button onClick={() => setDialogCancelar(false)}>No, mantener</Button>
            <Button
              onClick={confirmarCancelar}
              color="error"
              variant="contained"
              disabled={mutationCancelar.isPending}
              sx={{
                backgroundColor: "#ef4444",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#dc2626",
                },
              }}
            >
              Sí, cancelar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ReservasTour>
  );
};

export default ReservasView;