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
import RoomStatusDisplay from "../components/EstadoSalas";
import ProximasReuniones from "../components/ProximasReuniones";
import MisReservasCards from "../components/MisReservasCards";
import DialogNuevaReserva from "../components/DialogNuevaReserva";
import DialogEditarReserva from "../components/DialogEditarReserva";

import {
  getReservations,
  getMyReservations,
  checkScheduleConflict,
  updateCompletedReservations,
} from "../services/reservas";
import type {
  Reservation,
  ReservationFilters,
  Room,
} from "../types/reservas.types";

import type { ReservationTab } from "./reservasView/reservasView.styled";
import { ReservationViewHeader } from "./reservasView/ReservasViewHeader";
import { CalendarioTabContent } from "./reservasView/CalendarioTabContent";
import { DialogCancelReservation } from "./reservasView/DialogCancelarReserva";
import { useReservationActions } from "./reservasView/useReservasActions";

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

  const [currentTab, setCurrentTab] = useState<ReservationTab>("Reserva");
  const [calendarView, setCalendarView] = useState<"semanal" | "mes">(
    "semanal",
  );
  const [initialRoom, setInitialRoom] = useState<string | undefined>(undefined);
  const [newDialog, setNewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [notifyCancellation, setNotifyCancellation] = useState<boolean>(true);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [initialReservationDate, setInitialReservationDate] = useState<string | undefined>(undefined);
  const [initialReservationRoom, setInitialReservationRoom] = useState<Room | undefined>(undefined);
  const [initialReservationHour, setInitialReservationHour] = useState<string | undefined>(undefined);

  const [myFilters] = useState<ReservationFilters>({});

  useEffect(() => {
    setTabChangeCallback((tab: ReservationTab) => {
      setCurrentTab(tab);
      if (tab !== "calendario") setInitialRoom(undefined);
    });
  }, [setTabChangeCallback]);

  useEffect(() => {
    setOpenDialogCallback(() => setNewDialog(true));
  }, [setOpenDialogCallback]);

  useEffect(() => {
    setCloseDialogCallback(() => setNewDialog(false));
  }, [setCloseDialogCallback]);

  useEffect(() => {
    if (activeTutorial === "reservas") {
      setCurrentTab("Reserva");
      setInitialRoom(undefined);
      const t = setTimeout(() => {
        const btn = floatingBtnRef.current?.querySelector("button");
        btn?.click();
        endTutorial();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [activeTutorial]);

  const { data: allReservations = [] } = useQuery({
    queryKey: ["reservas", "todas"],
    queryFn: () => getReservations({}),
    refetchInterval: 30000,
  });

  const { data: myReservations = [], isLoading: loadingMis } = useQuery({
    queryKey: ["reservas", "mis", myFilters],
    queryFn: () => getMyReservations(myFilters),
    refetchInterval: 30000,
  });

  useEffect(() => {
    updateCompletedReservations();
  }, [allReservations]);

  const reservationsForCalendar = React.useMemo(() => {
    if (
      isFullTourRunning &&
      tourPhase === "CALENDARIO" &&
      userCreatedReservation
    ) {
      return [userCreatedReservation];
    }
    return allReservations;
  }, [allReservations, isFullTourRunning, tourPhase, userCreatedReservation]);

  const {
    cancelMutation,
    handleCreateReservation,
    handleUpdateReservation,
    confirmCancel,
  } = useReservationActions({
    area,
    showSnackbar,
    onCancelSuccess: () => {
      setCancelDialog(false);
      setSelectedReservation(null);
    },
  });

  const handleOpenNewReservation = (
    fecha?: string,
    sala?: string,
    hora?: string,
  ) => {
    setInitialReservationDate(fecha);
    setInitialReservationRoom(sala as Room | undefined);
    setInitialReservationHour(hora);
    setNewDialog(true);
  };

  const handleCloseNewReservation = () => {
    setNewDialog(false);
    setInitialReservationDate(undefined);
    setInitialReservationRoom(undefined);
    setInitialReservationHour(undefined);
  };

  const handleEditReservation = (reserva: Reservation) => {
    if (isFullTourRunning) return;
    setSelectedReservation(reserva);
    setEditDialog(true);
  };

  const handleCancelReservation = (reserva: Reservation) => {
    if (isFullTourRunning) return;
    setSelectedReservation(reserva);
    setCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    await confirmCancel(
      selectedReservation,
      notifyCancellation,
      cancellationReason,
    );
  };

  const handleCheckConflict = async (
    room: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: number,
  ) => {
    if (isFullTourRunning) return false;
    return await checkScheduleConflict(
      room,
      date,
      startTime,
      endTime,
      excludeReservationId,
    );
  };

  const handleViewSchedule = (sala: string) => {
    if (isFullTourRunning) return;
    setInitialRoom(sala);
    setCalendarView("semanal");
    setCurrentTab("calendario");
  };

  const handleReserveNow = (sala: string) => {
    if (isFullTourRunning) return;
    const hoy = format(new Date(), "yyyy-MM-dd");
    handleOpenNewReservation(hoy, sala);
  };

  const handleStartTutorial = useCallback(() => {
    setCurrentTab("Reserva");
    setInitialRoom(undefined);
  }, []);

  const handleTabChange = (tab: ReservationTab) => {
    setCurrentTab(tab);
    if (tab !== "calendario") setInitialRoom(undefined);
  };

  return (
    <ReservasTour>
      <Box sx={{ mt: -1 }}>
        <ReservationViewHeader
          currentTab={currentTab}
          onTabChange={handleTabChange}
          isFullTourRunning={isFullTourRunning}
          floatingBtnRef={floatingBtnRef}
          onStartTutorial={handleStartTutorial}
          onOpenNewReservation={() => handleOpenNewReservation()}
        />

        {currentTab === "Reserva" && (
          <Box>
            <Box className="tour-estado-salas">
              <RoomStatusDisplay
                reservations={allReservations}
                onViewSchedule={handleViewSchedule}
                onReserveNow={handleReserveNow}
              />
            </Box>

            <Box className="tour-proximas-reuniones">
              <ProximasReuniones
                reservations={allReservations}
                onViewFullCalendar={() => {
                  if (isFullTourRunning) return;
                  setInitialRoom(undefined);
                  setCurrentTab("calendario");
                }}
              />
            </Box>
          </Box>
        )}

        {currentTab === "mis" && (
          <Box className="tour-tabla-reservas">
            <MisReservasCards
              reservations={myReservations}
              currentUserId={user?.id}
              onEdit={handleEditReservation}
              onCancel={handleCancelReservation}
              onNewReservation={() => handleOpenNewReservation()}
              loading={loadingMis}
            />
          </Box>
        )}

        {currentTab === "calendario" && (
          <CalendarioTabContent
            reservationsForCalendar={reservationsForCalendar}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            initialRoom={initialRoom}
            currentUserId={user?.id}
            isFullTourRunning={isFullTourRunning}
            tourPhase={tourPhase}
            userCreatedReservation={userCreatedReservation}
            onOpenNewReservation={handleOpenNewReservation}
            onEditReservation={handleEditReservation}
            onCancelReservation={handleCancelReservation}
          />
        )}

        <DialogNuevaReserva
          open={newDialog}
          onClose={handleCloseNewReservation}
          onSubmit={handleCreateReservation}
          verificarConflicto={handleCheckConflict}
          fechaInicial={initialReservationDate}
          salaInicial={initialReservationRoom}
          horaInicial={initialReservationHour}
        />

        <DialogEditarReserva
          open={editDialog}
          reserva={selectedReservation}
          onClose={() => {
            setEditDialog(false);
            setSelectedReservation(null);
          }}
          onSubmit={handleUpdateReservation}
          verificarConflicto={handleCheckConflict}
        />

        <DialogCancelReservation
          open={cancelDialog}
          reservation={selectedReservation}
          cancellationReason={cancellationReason}
          setCancellationReason={setCancellationReason}
          notifyCancellation={notifyCancellation}
          setNotifyCancellation={setNotifyCancellation}
          isPending={cancelMutation.isPending}
          onClose={() => {
            if (cancelMutation.isPending) return;
            setCancelDialog(false);
            setCancellationReason("");
          }}
          onConfirm={handleConfirmCancel}
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
