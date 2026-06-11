// Configuración de pasos y datos de ejemplo del tour interno del diálogo de nueva reserva.

import type { Sala } from "../../types/reservas.types";

export interface DialogTourStep {
  target: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
  isLast?: boolean;
  disableScrolling?: true;
  disableScrollParentFix?: true;
  spotlightClicks?: true;
  spotlightPadding?: number;
}

export const DIALOG_TOUR_STEPS: DialogTourStep[] = [
  {
    target: "tour-dialog-titulo",
    title: "Título de la Reunión",
    content:
      'Escribe un título descriptivo para tu reunión. Por ejemplo: "Sincronización semanal del equipo".',
    placement: "right",
    spotlightClicks: true,
    spotlightPadding: 9,
  },
  {
    target: "tour-dialog-sala",
    title: "Seleccionar Sala",
    content:
      "Elige entre Sala Principal (más grande) o Sala Secundaria (más compacta) según tus necesidades.",
    placement: "right",
  },
  {
    target: "tour-dialog-horas",
    title: "Horario de la Reunión",
    content: "Selecciona la hora de inicio y la hora de fin. La duración mínima es de 30 minutos.",
    placement: "right",
    spotlightPadding: 10,
  },
  {
    target: "tour-dialog-fecha",
    title: "Fecha de la Reserva",
    content: "Selecciona la fecha en el calendario. No puedes seleccionar fechas pasadas.",
    placement: "left",
    spotlightPadding: 20,
  },
  {
    target: "tour-dialog-observaciones",
    title: "Observaciones (Opcional)",
    content:
      "Agrega detalles adicionales como participantes, materiales necesarios o la agenda de la reunión.",
    placement: "right",
    spotlightPadding: 16,
  },
  {
    target: "tour-dialog-participantes",
    title: "Añadir Participantes",
    content:
      "Escribe el nombre y correo de cada participante y presiona el botón azul para agregarlos. Puedes buscar usuarios registrados escribiendo en el campo de correo.",
    placement: "right",
    spotlightPadding: 12,
  },
  {
    target: "tour-dialog-correo",
    title: "Notificar por Correo",
    content:
      "Si está activado, se enviará automáticamente un correo de confirmación a todos los participantes al crear la reserva.",
    placement: "top",
    spotlightPadding: 10,
  },
  {
    target: "tour-dialog-submit",
    title: "¡Confirma tu Reserva!",
    content:
      'Haz clic en "Confirmar Reservación". Si no llenaste el formulario, se usarán datos de ejemplo automáticamente.',
    placement: "top",
    highlight: true,
    isLast: true,
    spotlightPadding: 24,
  },
];

export const DATOS_EJEMPLO_TOUR = {
  meeting_title: "Reunión de Ejemplo - Tutorial",
  room_name: "Sala Principal" as Sala,
  observations: "Esta es una reserva de ejemplo.",
};
