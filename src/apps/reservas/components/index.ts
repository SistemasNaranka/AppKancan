// src/apps/reservas/components/index.ts

export { default as TablaReservas } from "./TablaReservas";
export { default as MisReservasCards } from "./MisReservasCards";
export { default as FiltrosReservas } from "./FiltrosReservas";
export { default as DialogNuevaReserva } from "./DialogNuevaReserva";
export { default as DialogEditarReserva } from "./DialogEditarReserva";

// Nuevos componentes del rediseño
export { default as EstadoSalas } from "./EstadoSalas";
export { default as ProximasReuniones } from "./ProximasReuniones";
export { default as VistaSemanal } from "./VistaSemanal";
export { default as VistaCalendario } from "./VistaCalendario";
export { default as PulsatingMeetingIndicator } from "./PulsatingMeetingIndicator";

// Tour components
export { ReservasTour } from "./ReservasTour";
export { default as FloatingHelpButton } from "./FloatingHelpButton";
export type { TabReservas, TourPhase } from "./TourContext";
export { TourProvider, useTourContext } from "./TourContext";