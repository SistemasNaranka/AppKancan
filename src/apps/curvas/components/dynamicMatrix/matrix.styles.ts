import type { SxProps, Theme } from "@mui/material";

export const stickyActionColumnStyle = {
  position: "sticky",
  right: 0,
  bgcolor: "rgba(248, 250, 252, 0.8)",
  zIndex: 20,
  boxShadow: "-4px 0 8px rgba(0,0,0,0.03)",
  borderLeft: "1px solid #e2e8f0",
};

export const headerCellStyle: SxProps<Theme> = {
  bgcolor: "#1e293b",
  color: "white",
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.05em",
  py: 1.5,
  border: "1px solid rgba(255,255,255,0.1)",
};
