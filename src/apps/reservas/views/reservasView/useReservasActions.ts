// Hook con las mutations (crear, actualizar, cancelar) y handlers de las reservas.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  crearReserva,
  actualizarReserva,
  cancelarReserva,
} from "../../services/reservas";
import { notificarCorreoReserva } from "../../services/correoReservas";
import type {
  Reserva,
  NuevaReserva,
  ActualizarReserva,
} from "../../types/reservas.types";

interface UseReservasActionsParams {
  area: string | null | undefined;
  showSnackbar: (msg: string, sev: "success" | "error" | "warning" | "info") => void;
  onCancelarSuccess: () => void;
}

export function useReservasActions({
  area,
  showSnackbar,
  onCancelarSuccess,
}: UseReservasActionsParams) {
  const queryClient = useQueryClient();

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

  const mutationActualizar = useMutation({
    mutationFn: ({
      id,
      datos,
      skipWebhook,
    }: {
      id: number;
      datos: ActualizarReserva;
      skipWebhook?: boolean;
    }) => actualizarReserva(id, datos, skipWebhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      showSnackbar("Reserva actualizada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al actualizar la reserva", "error");
    },
  });

  const mutationCancelar = useMutation({
    mutationFn: (id: number) => cancelarReserva(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      onCancelarSuccess();
      showSnackbar("Reserva cancelada exitosamente", "success");
    },
    onError: (error: any) => {
      showSnackbar(error?.message || "Error al cancelar la reserva", "error");
    },
  });

  const handleCrearReserva = async (datos: NuevaReserva) => {
    const datosConArea = { ...datos, departament: area || undefined };
    await mutationCrear.mutateAsync(datosConArea);
  };

  const handleActualizarReserva = async (
    id: number,
    datos: ActualizarReserva,
    skipWebhook?: boolean,
  ) => {
    await mutationActualizar.mutateAsync({ id, datos, skipWebhook });
  };

  const confirmarCancelar = async (
    reserva: Reserva | null,
    notificarCancelacion: boolean,
    motivoCancelacion: string,
  ) => {
    if (!reserva) return;

    await mutationCancelar.mutateAsync(reserva.id);

    if (notificarCancelacion) {
      try {
        const result = await notificarCorreoReserva({
          evento: "reserva_cancelada",
          reserva: {
            room_name: reserva.room_name,
            date: reserva.date,
            start_time: (reserva.start_time || "").substring(0, 5),
            end_time: (reserva.end_time || "").substring(0, 5),
            meeting_title: reserva.meeting_title || "",
            observations: reserva.observations || "",
            participants: (reserva as any).participants || [],
          },
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

  return {
    mutationCrear,
    mutationActualizar,
    mutationCancelar,
    handleCrearReserva,
    handleActualizarReserva,
    confirmarCancelar,
  };
}
