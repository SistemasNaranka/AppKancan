// src/apps/reservas/services/reservas.ts

import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem, updateItem, deleteItem, readMe } from "@directus/sdk";
import type {
  Reserva,
  NuevaReserva,
  ActualizarReserva,
  FiltrosReserva,
} from "../types/reservas.types";
import { calcularEstadoReserva } from "../types/reservas.types";

// Campos a traer de cada reserva
const RESERVATION_FIELDS = [
  "id",
  "date_created",
  {
    usuario_id: [
      "id",
      "first_name",
      "last_name",
      "email",
      { rol_usuario: ["id", "area"] }
    ]
  },
  "nombre_sala",
  "fecha",
  "hora_inicio",
  "hora_final",
  "estado",
  "observaciones",
];

/**
 * Procesa las reservas para calcular estados dinámicos
 * NO modifica la BD, solo calcula el estado para mostrar
 */
function procesarReservas(reservas: Reserva[]): Reserva[] {
  return reservas.map(reserva => ({
    ...reserva,
    estadoCalculado: calcularEstadoReserva(reserva),
  }));
}

/**
 * Filtra reservas en el cliente basado en el estado calculado
 */
function filtrarPorEstadoCalculado(reservas: Reserva[], estadoFiltro: string): Reserva[] {
  if (!estadoFiltro) return reservas;
  
  const estadoLower = estadoFiltro.toLowerCase();
  
  return reservas.filter(reserva => {
    const estadoCalculado = (reserva.estadoCalculado || reserva.estado).toLowerCase();
    
    // Mapear variantes
    if (estadoLower === "vigente") {
      return estadoCalculado === "vigente";
    }
    if (estadoLower === "en curso") {
      return estadoCalculado === "en curso";
    }
    if (estadoLower === "finalizado") {
      return estadoCalculado === "finalizado" || estadoCalculado === "finalizada";
    }
    if (estadoLower === "cancelado") {
      return estadoCalculado === "cancelado" || estadoCalculado === "cancelada";
    }
    
    return true;
  });
}

/**
 * Obtiene todas las reservas
 */
export async function getReservas(filtros?: FiltrosReserva): Promise<Reserva[]> {
  try {
    const filter: any = {};

    // Filtro por fecha - EXACTO
    if (filtros?.fecha) {
      filter.fecha = { _eq: filtros.fecha };
    }
    
    // Filtro por sala
    if (filtros?.nombre_sala) {
      filter.nombre_sala = { _eq: filtros.nombre_sala };
    }
    
    // Filtro por usuario
    if (filtros?.usuario_id) {
      filter.usuario_id = { _eq: filtros.usuario_id };
    }

    // NO filtrar por estado en la BD (se hace después con estado calculado)

    console.log("🔍 getReservas - Filtros aplicados a BD:", filter);

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("reuniones_reservas", {
          fields: RESERVATION_FIELDS,
          ...(Object.keys(filter).length > 0 && { filter }),
          sort: ["fecha", "hora_inicio"],
        })
      )
    );

    console.log("✅ getReservas - Reservas de BD:", items.length);

    // Procesar para calcular estados
    let reservas = procesarReservas(items as Reserva[]);
    
    // Filtrar por estado calculado en el cliente
    if (filtros?.estado) {
      reservas = filtrarPorEstadoCalculado(reservas, filtros.estado);
      console.log("✅ getReservas - Después de filtrar por estado:", reservas.length);
    }

    return reservas;
  } catch (error) {
    console.error("❌ Error al cargar reservas:", error);
    throw error;
  }
}

/**
 * Obtiene reservas de un mes específico (para calendario)
 */
export async function getReservasMes(año: number, mes: number): Promise<Reserva[]> {
  try {
    // Primer día del mes
    const primerDia = `${año}-${String(mes).padStart(2, '0')}-01`;
    // Último día del mes
    const ultimoDia = new Date(año, mes, 0).getDate();
    const ultimaFecha = `${año}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("reuniones_reservas", {
          fields: RESERVATION_FIELDS,
          filter: {
            fecha: {
              _gte: primerDia,
              _lte: ultimaFecha,
            },
          },
          sort: ["fecha", "hora_inicio"],
        })
      )
    );

    return procesarReservas(items as Reserva[]);
  } catch (error) {
    console.error("❌ Error al cargar reservas del mes:", error);
    throw error;
  }
}

/**
 * Obtiene las reservas del usuario autenticado
 */
export async function getMisReservas(filtros?: FiltrosReserva): Promise<Reserva[]> {
  try {
    const me = await withAutoRefresh(() =>
      directus.request(
        readMe({
          fields: ['id']
        })
      )
    );

    const filter: any = {
      usuario_id: { _eq: me.id },
    };

    if (filtros?.fecha) {
      filter.fecha = { _eq: filtros.fecha };
    }
    if (filtros?.nombre_sala) {
      filter.nombre_sala = { _eq: filtros.nombre_sala };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("reuniones_reservas", {
          fields: RESERVATION_FIELDS,
          filter,
          sort: ["-fecha", "-hora_inicio"],
        })
      )
    );

    let reservas = procesarReservas(items as Reserva[]);
    
    if (filtros?.estado) {
      reservas = filtrarPorEstadoCalculado(reservas, filtros.estado);
    }

    return reservas;
  } catch (error) {
    console.error("❌ Error al cargar mis reservas:", error);
    throw error;
  }
}

/**
 * Obtiene una reserva por ID
 */
export async function getReservaById(id: number): Promise<Reserva> {
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("reuniones_reservas", {
          fields: RESERVATION_FIELDS,
          filter: {
            id: { _eq: id },
          },
        })
      )
    );

    if (!items || items.length === 0) {
      throw new Error("Reserva no encontrada");
    }

    const reserva = items[0] as Reserva;
    reserva.estadoCalculado = calcularEstadoReserva(reserva);
    
    return reserva;
  } catch (error) {
    console.error("❌ Error al cargar reserva:", error);
    throw error;
  }
}

/**
 * Crea una nueva reserva
 */
export async function crearReserva(datos: NuevaReserva): Promise<Reserva> {
  try {
    const me = await withAutoRefresh(() =>
      directus.request(
        readMe({
          fields: ['id']
        })
      )
    );

    const item = await withAutoRefresh(() =>
      directus.request(
        createItem("reuniones_reservas", {
          ...datos,
          usuario_id: me.id,
          estado: "Vigente",
        })
      )
    );

    return await getReservaById(item.id);
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    throw error;
  }
}

/**
 * Actualiza una reserva existente
 */
export async function actualizarReserva(
  id: number,
  datos: ActualizarReserva
): Promise<Reserva> {
  try {
    await withAutoRefresh(() =>
      directus.request(updateItem("reuniones_reservas", id, datos))
    );

    return await getReservaById(id);
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    throw error;
  }
}

/**
 * Cancela una reserva
 */
export async function cancelarReserva(id: number): Promise<Reserva> {
  return await actualizarReserva(id, { estado: "Cancelado" });
}

/**
 * Elimina una reserva
 */
export async function eliminarReserva(id: number): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(deleteItem("reuniones_reservas", id))
    );
  } catch (error) {
    console.error("❌ Error al eliminar reserva:", error);
    throw error;
  }
}

/**
 * Verifica si hay conflicto de horario
 */
export async function verificarConflictoHorario(
  sala: string,
  fecha: string,
  horaInicio: string,
  horaFinal: string,
  reservaIdExcluir?: number
): Promise<boolean> {
  try {
    const filter: any = {
      nombre_sala: { _eq: sala },
      fecha: { _eq: fecha },
      estado: { _neq: "Cancelado" },
      _or: [
        {
          _and: [
            { hora_inicio: { _lte: horaInicio } },
            { hora_final: { _gt: horaInicio } },
          ],
        },
        {
          _and: [
            { hora_inicio: { _lt: horaFinal } },
            { hora_final: { _gte: horaFinal } },
          ],
        },
        {
          _and: [
            { hora_inicio: { _gte: horaInicio } },
            { hora_final: { _lte: horaFinal } },
          ],
        },
      ],
    };

    if (reservaIdExcluir) {
      filter.id = { _neq: reservaIdExcluir };
    }

    const items = await withAutoRefresh(() =>
      directus.request(
        readItems("reuniones_reservas", {
          fields: ["id"],
          filter,
          limit: 1,
        })
      )
    );

    return items.length > 0;
  } catch (error) {
    console.error("❌ Error al verificar conflicto:", error);
    return false;
  }
}