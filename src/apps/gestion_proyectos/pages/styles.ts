import { styled, Button, Box, Paper } from "@mui/material";

export const VolverButton = styled(Button)({
  backgroundColor: "#004680",
  color: "white",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#003d66",
  },
});

export const HeaderContainer = styled(Box)({
  padding: "20px 24px",
  borderRadius: 12,
  backgroundColor: "white",
  position: "sticky",
  top: 12,
  zIndex: 100,
  boxShadow: "0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: 24,
});

export const EditButton = styled(Button)({
  backgroundColor: "#f5f5f5",
  color: "#5A6A7E",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#e8e8e8",
  },
});

export const EditModalOverlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1300,
});

export const EditModalContent = styled(Paper)({
  padding: 24,
  borderRadius: 12,
  maxWidth: 600,
  width: "90%",
  maxHeight: "90vh",
  overflow: "auto",
});

export const TabContainer = styled(Box)({
  borderRadius: "20px 20px 20px 20px",
  padding: "2px 2px 0px 20px",
  position: "relative",
});

export const TabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "isFirst" && prop !== "isLast",
})<{ active?: boolean; isFirst?: boolean; isLast?: boolean }>(({ active, isFirst, isLast }) => ({
  borderRadius: isFirst ? "12px 12px 0 0" : isLast ? "12px 12px 0 0" : "12px 12px 0 0",
  padding: "10px 20px",
  fontWeight: active ? 600 : 500,
  fontSize: "0.85rem",
  textTransform: "none",
  minWidth: 0,
  gap: 6,
  transition: "all 0.3s ease",
  backgroundColor: active ? "white" : "transparent",
  color: active ? "#004680" : "#5A6A7E",
  boxShadow: active ? "0 -2px 8px rgba(0,0,0,0.08)" : "none",
  marginBottom: active ? "-8px" : "-1px",
  zIndex: active ? 2 : 1,
  position: "relative",
  height: active ? 44 : 40,
  "&:hover": {
    backgroundColor: active ? "white" : "rgba(255,255,255,0.5)",
    boxShadow: active ? "0 -2px 8px rgba(0,0,0,0.08)" : "none",
  },
}));