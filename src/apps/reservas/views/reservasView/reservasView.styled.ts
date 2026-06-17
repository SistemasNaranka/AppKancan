// Tipos, constantes y styled components compartidos por la vista principal de reservas.

import { Box, keyframes, styled } from "@mui/material";

export type ReservationTab = "Reserva" | "mis" | "calendario";

export const TAB_TITLES: Record<ReservationTab, string> = {
  Reserva: "Reservar Sala",
  mis: "Mis Reservas",
  calendario: "Calendario",
};

const tabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const TabContainer = styled(Box)({
  display: "inline-flex",
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 4,
  gap: 4,
  position: "relative",
  overflow: "hidden",
});

export const AnimatedTab = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isActive" && prop !== "isFirst" && prop !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(
  ({ isActive, isFirst, isLast }) => ({
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    borderRadius: isFirst ? 10 : isLast ? 10 : 6,
    backgroundColor: isActive ? "white" : "transparent",
    color: isActive ? "#1976d2" : "#6b7280",
    boxShadow: isActive
      ? "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)"
      : "none",
    minWidth: 80,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isActive ? "scale(1)" : "scale(0.95)",
    animation: isActive
      ? `${tabPulse} 0.3s ease-out, ${tabFadeIn} 0.2s ease-out`
      : "none",
    "&:hover": {
      backgroundColor: isActive ? "white" : "rgba(25, 118, 210, 0.06)",
      color: isActive ? "#1976d2" : "#374151",
      transform: isActive ? "scale(1.02)" : "scale(1)",
    },
    "&:focus-visible": {
      outline: "2px solid #1976d2",
      outlineOffset: 2,
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  }),
);
