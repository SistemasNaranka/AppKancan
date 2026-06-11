// src/apps/reservas/services/reservas.ts

import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import {
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readMe,
  readUsers,
} from "@directus/sdk";
import type {
  Reservation,
  NewReservation,
  UpdateReservation,
  ReservationFilters,
} from "../types/reservas.types";
import { format } from "date-fns";
import {
  calculateReservationStatus,
} from "../types/reservas.types";

const RESERVATION_FIELDS = [
  "id",
  "date_created",
  {
    user_id: [
      "id",
      "first_name",
      "last_name",
      "email",
      { rol_usuario: ["id", "area"] },
    ],
  },
  "room_name",
  "date",
  "start_time",
  "end_time",
  "status",
  "meeting_title",
  "observations",
  "participants",
  "departament",
];

function processReservations(reservations: Reservation[]): Reservation[] {
  return reservations.map((reservation) => ({
    ...reservation,
    calculatedStatus: calculateReservationStatus(reservation),
  }));
}

function filterByCalculatedStatus(
  reservations: Reservation[],
  statusFilter: string,
): Reservation[] {
  if (!statusFilter) return reservations;

  const statusLower = statusFilter.toLowerCase();

  return reservations.filter((reservation) => {
    const calculatedStatus = (
      reservation.calculatedStatus || reservation.status
    ).toLowerCase();

    if (statusLower === "vigente") {
      return calculatedStatus === "vigente";
    }
    if (statusLower === "en curso") {
      return calculatedStatus === "en curso";
    }
    if (statusLower === "finalizado") {
      return (
        calculatedStatus === "finalizado" || calculatedStatus === "finalizada"
      );
    }
    if (statusLower === "cancelado") {
      return calculatedStatus === "cancelado" || calculatedStatus === "cancelada";
    }

    return true;
  });
}

export async function getReservations(
  filters?: ReservationFilters,
): Promise<Reservation[]> {
  try {
    const filter: any = {};

    if (filters?.date) {
      filter.date = { _eq: filters.date };
    }

    if (filters?.room_name) {
      filter.room_name = { _eq: filters.room_name };
    }

    if (filters?.user_id) {
      filter.user_id = { _eq: filters.user_id };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: RESERVATION_FIELDS,
          ...(Object.keys(filter).length > 0 && { filter }),
          sort: ["date", "start_time"],
          limit: -1,
        }),
      ),
    );

    let reservations = processReservations(items as Reservation[]);

    if (filters?.status) {
      reservations = filterByCalculatedStatus(reservations, filters.status);
    }

    return reservations;
  } catch (error) {
    console.error("❌ Error al cargar reservas:", error);
    throw error;
  }
}

export async function getMonthlyReservations(
  year: number,
  month: number,
): Promise<Reservation[]> {
  try {
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: RESERVATION_FIELDS,
          filter: {
            date: {
              _gte: firstDay,
              _lte: lastDay,
            },
          },
          sort: ["date", "start_time"],
          limit: -1,
        }),
      ),
    );

    return processReservations(items as Reservation[]);
  } catch (error) {
    console.error("❌ Error al cargar reservas del mes:", error);
    throw error;
  }
}

export async function getMyReservations(
  filters?: ReservationFilters,
): Promise<Reservation[]> {
  try {
    const me = await withAutoRefresh(() =>
      directus.request(
        readMe({
          fields: ["id"],
        }),
      ),
    );

    const filter: any = {
      user_id: { _eq: me.id },
    };

    if (filters?.date) {
      filter.date = { _eq: filters.date };
    }
    if (filters?.room_name) {
      filter.room_name = { _eq: filters.room_name };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: RESERVATION_FIELDS,
          filter,
          sort: ["-date", "-start_time"],
          limit: -1,
        }),
      ),
    );

    let reservations = processReservations(items as Reservation[]);

    if (filters?.status) {
      reservations = filterByCalculatedStatus(reservations, filters.status);
    }

    return reservations;
  } catch (error) {
    console.error("❌ Error al cargar mis reservas:", error);
    throw error;
  }
}

/**
 * Obtiene una reserva por ID
 */
export async function getReservationById(id: number): Promise<Reservation> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: RESERVATION_FIELDS,
          filter: {
            id: { _eq: id },
          },
        }),
      ),
    );

    if (!items || items.length === 0) {
      throw new Error("Reserva no encontrada");
    }

    const reservation = items[0] as Reservation;
    reservation.calculatedStatus = calculateReservationStatus(reservation);

    return reservation;
  } catch (error) {
    console.error("❌ Error al cargar reserva:", error);
    throw error;
  }
}

/**
 * Crea una nueva reserva
 */
export async function createReservation(data: NewReservation): Promise<Reservation> {
  try {
    const me = await withAutoRefresh(() =>
      directus.request(
        readMe({
          fields: ["id"],
        }),
      ),
    );

    const item = await withAutoRefresh(() =>
      directus.request(
        createItem("adm_meeting_reservations", {
          ...data,
          user_id: me.id,
          status: "Vigente",
        }),
      ),
    );

    return await getReservationById(item.id);
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    throw error;
  }
}

export async function updateReservation(
  id: number,
  data: UpdateReservation,
  skipWebhook = false,
): Promise<Reservation> {
  try {
    const previousReservation = await getReservationById(id);

    await withAutoRefresh(() =>
      directus.request(updateItem("adm_meeting_reservations", id, data)),
    );

    const updatedReservation = await getReservationById(id);

    if (skipWebhook) return updatedReservation;

    const { sendReservationEmailNotification } = await import("./correoReservas");
    sendReservationEmailNotification({
      evento: "reserva_actualizada",
      reserva: updatedReservation as any,
      ...({
        reserva_anterior: previousReservation,
        cambios: {
          meeting_title: previousReservation.meeting_title !== data.meeting_title,
          room_name: previousReservation.room_name !== data.room_name,
          date: previousReservation.date !== data.date,
          start_time: previousReservation.start_time !== data.start_time,
          end_time: previousReservation.end_time !== data.end_time,
        },
      } as any),
    }).catch((err: unknown) =>
      console.warn("⚠️ [n8n] correo actualización NO enviado:", err),
    );

    return updatedReservation;
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    throw error;
  }
}

export async function cancelReservation(id: number): Promise<Reservation> {
  return await updateReservation(id, { status: "Cancelado" }, true);
}

export async function deleteReservation(id: number): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("adm_meeting_reservations", id)),
    );
  } catch (error) {
    console.error("❌ Error al eliminar reserva:", error);
    throw error;
  }
}

export async function checkScheduleConflict(
  room: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: number,
): Promise<boolean> {
  try {
    const filter: any = {
      room_name: { _eq: room },
      date: { _eq: date },
      status: { _neq: "Cancelado" },
      _or: [
        {
          _and: [
            { start_time: { _lte: startTime } },
            { end_time: { _gt: startTime } },
          ],
        },
        {
          _and: [
            { start_time: { _lt: endTime } },
            { end_time: { _gte: endTime } },
          ],
        },
        {
          _and: [
            { start_time: { _gte: startTime } },
            { end_time: { _lte: endTime } },
          ],
        },
      ],
    };

    if (excludeReservationId) {
      filter.id = { _neq: excludeReservationId };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: ["id"],
          filter,
          limit: 1,
        }),
      ),
    );

    return items.length > 0;
  } catch (error) {
    console.error("❌ Error al verificar conflicto:", error);
    return false;
  }
}

export interface DBReservationConfig {
  id: number;
  opening_time: string;
  closing_time: string; 
}

let _configCache: DBReservationConfig | null | undefined = undefined;

export function invalidateConfigCache(): void {
  _configCache = undefined;
}

export async function getReservationConfig(): Promise<DBReservationConfig | null> {
  if (_configCache !== undefined) return _configCache;

  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_reservation_configs", {
          fields: ["id", "opening_time", "closing_time"],
          limit: 1,
        }),
      ),
    );

    if (items && items.length > 0) {
      _configCache = items[0] as DBReservationConfig;
      return _configCache;
    }

    console.warn(
      "⚠️ No se encontró configuración de reservas, usando valores por defecto",
    );
    _configCache = null;
    return null;
  } catch (error) {
    console.error("❌ Error al cargar configuración de reservas:", error);
    return null;
  }
}

export async function updateCompletedReservations(): Promise<number> {
  try {
    const now = new Date();

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("adm_meeting_reservations", {
          fields: ["id", "date", "end_time", "status"],
          filter: {
            _and: [
              { status: { _neq: "Cancelado" } },
              { status: { _neq: "Finalizado" } },
              { date: { _lte: format(now, "yyyy-MM-dd") } },
            ],
          },
          limit: -1,
        }),
      ),
    );

    if (items.length === 0) {
      return 0;
    }

    const reservationsToComplete = items.filter((reservation: any) => {
      const endTime = new Date(`${reservation.date}T${reservation.end_time}`);
      return now >= endTime;
    });

    if (reservationsToComplete.length === 0) {
      return 0;
    }

    const updates = reservationsToComplete.map((reservation: any) =>
      withAutoRefresh(() =>
        directus.request(
          updateItem("adm_meeting_reservations", reservation.id, {
            status: "Finalizado",
          }),
        ),
      ),
    );

    await Promise.all(updates);

    return reservationsToComplete.length;
  } catch (error) {
    console.error("❌ Error al actualizar reservas finalizadas:", error);
    return 0;
  }
}

export const searchUsers = async (query: string) => {
  if (!query || query.length < 3) return [];

  try {
    const result = await withAutoRefresh(() =>
      directus.request(
        readUsers({
          fields: ["first_name", "last_name", "email"],
          filter: {
            _or: [
              { email: { _icontains: query } },
              { first_name: { _icontains: query } },
              { last_name: { _icontains: query } },
            ],
          },
          limit: 6,
        }),
      ),
    );
    return (result as any[]) || [];
  } catch (error) {
    console.error("Error al buscar usuarios en Directus:", error);
    return [];
  }
};
