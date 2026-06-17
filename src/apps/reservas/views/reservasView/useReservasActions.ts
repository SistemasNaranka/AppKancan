// Hook con las mutations (crear, actualizar, cancelar) y handlers de las reservas.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createReservation,
  updateReservation,
  cancelReservation,
} from "../../services/reservas";
import { sendReservationEmailNotification } from "../../services/correoReservas";
import type {
  Reservation,
  NewReservation,
  UpdateReservation,
} from "../../types/reservas.types";

interface UseReservationActionsParams {
  area: string | null | undefined;
  showSnackbar: (msg: string, sev: "success" | "error" | "warning" | "info") => void;
  onCancelSuccess: () => void;
}

export function useReservationActions({
  area,
  showSnackbar,
  onCancelSuccess,
}: UseReservationActionsParams) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: NewReservation) => createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      showSnackbar("Reserva creada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al crear la reserva", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      skipWebhook,
    }: {
      id: number;
      data: UpdateReservation;
      skipWebhook?: boolean;
    }) => updateReservation(id, data, skipWebhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      showSnackbar("Reserva actualizada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al actualizar la reserva", "error");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      onCancelSuccess();
      showSnackbar("Reserva cancelada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al cancelar la reserva", "error");
    },
  });

  const handleCreateReservation = async (data: NewReservation) => {
    const dataWithArea = { ...data, departament: area || undefined };
    await createMutation.mutateAsync(dataWithArea);
  };

  const handleUpdateReservation = async (
    id: number,
    data: UpdateReservation,
    skipWebhook?: boolean,
  ) => {
    await updateMutation.mutateAsync({ id, data, skipWebhook });
  };

  const confirmCancel = async (
    reservation: Reservation | null,
    notifyCancellation: boolean,
    cancellationReason: string,
  ) => {
    if (!reservation) return;

    await cancelMutation.mutateAsync(reservation.id);

    if (notifyCancellation) {
      try {
        const result = await sendReservationEmailNotification({
          evento: "reserva_cancelada",
          reserva: {
            room_name: reservation.room_name,
            date: reservation.date,
            start_time: (reservation.start_time || "").substring(0, 5),
            end_time: (reservation.end_time || "").substring(0, 5),
            meeting_title: reservation.meeting_title || "",
            observations: reservation.observations || "",
            participants: (reservation as any).participants || [],
          },
          ...({ motivo: cancellationReason.trim() } as any),
        });
        console.info("[n8n] correo cancelación enviado OK:", result);
      } catch (err) {
        console.warn("[n8n] correo cancelación NO enviado:", err);
      }
    } else {
      console.info("[n8n] envío de correo de cancelación desactivado");
    }
  };

  return {
    createMutation,
    updateMutation,
    cancelMutation,
    handleCreateReservation,
    handleUpdateReservation,
    confirmCancel,
  };
}
