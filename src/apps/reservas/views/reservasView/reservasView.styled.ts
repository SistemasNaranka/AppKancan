// Tipos, constantes y styled components compartidos por la vista principal de reservas.

import { Box, keyframes, styled } from "@mui/material";

export type ReservationTab = "Reserva" | "mis" | "calendario";

export const TAB_TITLES: Record<ReservationTab, string> = {
  Reserva: "Reservar Sala",
  mis: "Mis Reservas",
  calendario: "Calendario",
};

const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const TabContainer = styled(Box)({
  display: "inline-flex",
  gap: 4,
  position: "relative",
});

// Pill estilo Horarios: activo relleno azul de marca, inactivo gris con hover suave.
export const AnimatedTab = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isActive" && prop !== "isFirst" && prop !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(
  ({ isActive }) => ({
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    letterSpacing: "0.2px",
    textTransform: "uppercase",
    borderRadius: 10,
    backgroundColor: isActive ? "#004680" : "transparent",
    color: isActive ? "#ffffff" : "#64748b",
    boxShadow: "none",
    minHeight: 40,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    position: "relative",
    transition: "background-color 0.2s ease, color 0.2s ease",
    animation: isActive ? `${tabFadeIn} 0.2s ease-out` : "none",
    "&:hover": {
      backgroundColor: isActive ? "#003a6b" : "#eef4fb",
      color: isActive ? "#ffffff" : "#004680",
    },
    "&:focus-visible": {
      outline: "2px solid #004680",
      outlineOffset: 2,
    },
  }),
);
