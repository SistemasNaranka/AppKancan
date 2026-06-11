// Vista principal del módulo de reservas: tabs (Reserva / Mis / Calendario) + diálogos de CRUD.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useGlobalSnackbar } from "@/shared/components/SnackbarsPosition/SnackbarContext";
import { useTutorial } from "@/shared/hooks/TutorialContext";

import { ReservasTour, TourProvider, useTourContext } from "../components";
import EstadoSalas from "../components/EstadoSalas";
import ProximasReuniones from "../components/ProximasReuniones";
import MisReservasCards from "../components/MisReservasCards";
import DialogNuevaReserva from "../components/DialogNuevaReserva";
import DialogEditarReserva from "../components/DialogEditarReserva";

import {
  getReservas,
  getMisReservas,
  verificarConflictoHorario,
  actualizarReservasFinalizadas,
} from "../services/reservas";
import type {
  Reserva,
  FiltrosReserva,
  Sala,
} from "../types/reservas.types";

import type { TabReservas } from "./reservasView/reservasView.styled";
import { ReservasViewHeader } from "./reservasView/ReservasViewHeader";
import { CalendarioTabContent } from "./reservasView/CalendarioTabContent";
import { DialogCancelarReserva } from "./reservasView/DialogCancelarReserva";
import { useReservasActions } from "./reservasView/useReservasActions";

const ReservasViewContent: React.FC = () => {
  const { user } = useAuth();
  const { area } = useApps();
  const { showSnackbar } = useGlobalSnackbar();

  const { activeTutorial, endTutorial } = useTutorial();
  const floatingBtnRef = useRef<HTMLDivElement>(null);

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
    "semanal",
  );
  const [salaInicial, setSalaInicial] = useState<string | undefined>(undefined);
  const [dialogNueva, setDialogNueva] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [dialogCancelar, setDialogCancelar] = useState(false);
  const [notificarCancelacion, setNotificarCancelacion] = useState<boolean>(true);
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>("");
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);
  const [fechaInicialReserva, setFechaInicialReserva] = useState<string | undefined>(undefined);
  const [salaInicialReserva, setSalaInicialReserva] = useState<Sala | undefined>(undefined);
  const [horaInicialReserva, setHoraInicialReserva] = useState<string | undefined>(undefined);

  const [filtrosMis] = useState<FiltrosReserva>({});

  useEffect(() => {
    setTabChangeCallback((tab: TabReservas) => {
      setTabActual(tab);
      if (tab !== "calendario") setSalaInicial(undefined);
    });
  }, [setTabChangeCallback]);

  useEffect(() => {
    setOpenDialogCallback(() => setDialogNueva(true));
  }, [setOpenDialogCallback]);

  useEffect(() => {
    setCloseDialogCallback(() => setDialogNueva(false));
  }, [setCloseDialogCallback]);

  useEffect(() => {
    if (activeTutorial === "reservas") {
      setTabActual("Reserva");
      setSalaInicial(undefined);
      const t = setTimeout(() => {
        const btn = floatingBtnRef.current?.querySelector("button");
        btn?.click();
        endTutorial();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [activeTutorial]);

  const { data: todasReservas = [] } = useQuery({
    queryKey: ["reservas", "todas"],
    queryFn: () => getReservas({}),
    refetchInterval: 30000,
  });

  const { data: misReservas = [], isLoading: loadingMis } = useQuery({
    queryKey: ["reservas", "mis", filtrosMis],
    queryFn: () => getMisReservas(filtrosMis),
    refetchInterval: 30000,
  });

  useEffect(() => {
    actualizarReservasFinalizadas();
  }, [todasReservas]);

  const reservasParaCalendario = React.useMemo(() => {
    if (
      isFullTourRunning &&
      tourPhase === "CALENDARIO" &&
      userCreatedReservation
    ) {
      return [userCreatedReservation];
    }
    return todasReservas;
  }, [todasReservas, isFullTourRunning, tourPhase, userCreatedReservation]);

  const {
    mutationCancelar,
    handleCrearReserva,
    handleActualizarReserva,
    confirmarCancelar,
  } = useReservasActions({
    area,
    showSnackbar,
    onCancelarSuccess: () => {
      setDialogCancelar(false);
      setReservaSeleccionada(null);
    },
  });

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

  const handleCerrarNuevaReserva = () => {
    setDialogNueva(false);
    setFechaInicialReserva(undefined);
    setSalaInicialReserva(undefined);
    setHoraInicialReserva(undefined);
  };

  const handleEditarReserva = (reserva: Reserva) => {
    if (isFullTourRunning) return;
    setReservaSeleccionada(reserva);
    setDialogEditar(true);
  };

  const handleCancelarReserva = (reserva: Reserva) => {
    if (isFullTourRunning) return;
    setReservaSeleccionada(reserva);
    setDialogCancelar(true);
  };

  const handleConfirmarCancelar = async () => {
    await confirmarCancelar(
      reservaSeleccionada,
      notificarCancelacion,
      motivoCancelacion,
    );
  };

  const handleVerificarConflicto = async (
    sala: string,
    fecha: string,
    horaInicio: string,
    horaFinal: string,
    reservaIdExcluir?: number,
  ) => {
    if (isFullTourRunning) return false;
    return await verificarConflictoHorario(
      sala,
      fecha,
      horaInicio,
      horaFinal,
      reservaIdExcluir,
    );
  };

  const handleVerCronograma = (sala: string) => {
    if (isFullTourRunning) return;
    setSalaInicial(sala);
    setVistaCalendario("semanal");
    setTabActual("calendario");
  };

  const handleReservarAhora = (sala: string) => {
    if (isFullTourRunning) return;
    const hoy = format(new Date(), "yyyy-MM-dd");
    handleAbrirNuevaReserva(hoy, sala);
  };

  const handleStartTutorial = useCallback(() => {
    setTabActual("Reserva");
    setSalaInicial(undefined);
  }, []);

  const handleTabChange = (tab: TabReservas) => {
    setTabActual(tab);
    if (tab !== "calendario") setSalaInicial(undefined);
  };

  return (
    <ReservasTour>
      <Box sx={{ mt: -1 }}>
        <ReservasViewHeader
          tabActual={tabActual}
          onTabChange={handleTabChange}
          isFullTourRunning={isFullTourRunning}
          floatingBtnRef={floatingBtnRef}
          onStartTutorial={handleStartTutorial}
          onAbrirNuevaReserva={() => handleAbrirNuevaReserva()}
        />

        {tabActual === "Reserva" && (
          <Box>
            <Box className="tour-estado-salas">
              <EstadoSalas
                reservas={todasReservas}
                onVerCronograma={handleVerCronograma}
                onReservarAhora={handleReservarAhora}
              />
            </Box>

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

        {tabActual === "calendario" && (
          <CalendarioTabContent
            reservasParaCalendario={reservasParaCalendario}
            vistaCalendario={vistaCalendario}
            setVistaCalendario={setVistaCalendario}
            salaInicial={salaInicial}
            usuarioActualId={user?.id}
            isFullTourRunning={isFullTourRunning}
            tourPhase={tourPhase}
            userCreatedReservation={userCreatedReservation}
            onAbrirNuevaReserva={handleAbrirNuevaReserva}
            onEditarReserva={handleEditarReserva}
            onCancelarReserva={handleCancelarReserva}
          />
        )}

        <DialogNuevaReserva
          open={dialogNueva}
          onClose={handleCerrarNuevaReserva}
          onSubmit={handleCrearReserva}
          verificarConflicto={handleVerificarConflicto}
          fechaInicial={fechaInicialReserva}
          salaInicial={salaInicialReserva}
          horaInicial={horaInicialReserva}
        />

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

        <DialogCancelarReserva
          open={dialogCancelar}
          reserva={reservaSeleccionada}
          motivoCancelacion={motivoCancelacion}
          setMotivoCancelacion={setMotivoCancelacion}
          notificarCancelacion={notificarCancelacion}
          setNotificarCancelacion={setNotificarCancelacion}
          isPending={mutationCancelar.isPending}
          onClose={() => {
            if (mutationCancelar.isPending) return;
            setDialogCancelar(false);
            setMotivoCancelacion("");
          }}
          onConfirm={handleConfirmarCancelar}
        />
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
