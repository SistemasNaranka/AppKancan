// src/apps/reservas/views/ReservasView.tsx

import React, { useState } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
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
            sx={{ fontWeight: 700, color: "#1a2a3a", fontSize: "1rem" }}
          >
            Reservar Sala
          </Typography>
        </Box>

        {/* Pestañas de navegación - Centradas */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {tabs.map((tab) => (
              <Box
                key={tab.id}
                onClick={() => {
                  setTabActual(tab.id);
                  if (tab.id !== "calendario") {
                    setSalaInicial(undefined);
                  }
                }}
                sx={{
                  px: 2,
                  py: 0.5,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                  color: tabActual === tab.id ? "#1976d2" : "#6b7280",
                  borderBottom:
                    tabActual === tab.id
                      ? "2px solid #1976d2"
                      : "2px solid transparent",
                  transition: "all 0.2s",
                  "&:hover": {
                    color: "#1976d2",
                  },
                }}
              >
                {tab.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Espacio derecho para balance */}
        <Box sx={{ minWidth: 180 }} />
      </Box>

      {/* Contenido de Reserva */}
      {tabActual === "Reserva" && (
        <Box>
          {/* Estado de las salas */}
          <EstadoSalas
            reservas={todasReservas}
            onVerCronograma={handleVerCronograma}
            onReservarAhora={handleReservarAhora}
            onNuevaReserva={() => handleAbrirNuevaReserva()}
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
          {/* Subheader */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "#1a2a3a" }}
              >
                Mis Reservas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {
                  misReservas.filter((r) => {
                    const estado = (
                      r.estadoCalculado || r.estado
                    )?.toLowerCase();
                    return estado === "vigente" || estado === "en curso";
                  }).length
                }{" "}
                reservas activas
              </Typography>
            </Box>

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => handleAbrirNuevaReserva()}
              sx={{
                boxShadow: "none",
                textTransform: "none",
                fontWeight: "600",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#005da9",
                },
              }}
            >
              Nueva reserva
            </Button>
          </Box>

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
  );
};

export default ReservasView;
