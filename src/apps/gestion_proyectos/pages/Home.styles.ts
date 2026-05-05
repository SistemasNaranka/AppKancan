import { Box, styled, keyframes } from "@mui/material";

export const tabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;
export const tabFadeIn = keyframes`
  from { opacity: 0.8; transform: translateY(1px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const TabContainer = styled(Box)({
    display: "inline-flex",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
});

export const AnimatedTab = styled(Box, {
    shouldForwardProp: (p) => p !== "isActive" && p !== "isFirst" && p !== "isLast",
})<{ isActive: boolean; isFirst: boolean; isLast: boolean }>(({ isActive }) => ({
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    borderRadius: 10,
    backgroundColor: isActive ? "white" : "transparent",
    color: isActive ? "#1976d2" : "#6b7280",
    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
    minWidth: 80,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isActive ? "scale(1)" : "scale(0.95)",
    animation: isActive ? `${tabPulse} 0.3s ease-out, ${tabFadeIn} 0.2s ease-out` : "none",
    "&:hover": {
        backgroundColor: isActive ? "white" : "rgba(25,118,210,0.06)",
        color: isActive ? "#1976d2" : "#374151",
        transform: isActive ? "scale(1.02)" : "scale(1)",
    },
    "&:active": { transform: "scale(0.98)" },
}));