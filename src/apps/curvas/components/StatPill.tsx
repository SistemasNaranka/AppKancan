import { Box, Typography } from "@mui/material";
import { MAIN_FONT, MONO_FONT } from "../utils/analisis.constants";

export const StatPill = ({ value, label }: { value: number | string; label: string }) => (
  <Box
    sx={{
      display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.35,
      borderRadius: 99, bgcolor: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0,
    }}
  >
    <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 900, fontSize: "0.82rem", color: "#B8DCFF", lineHeight: 1 }}>
      {typeof value === "number" ? value.toLocaleString("es-CO") : value}
    </Typography>
    <Typography sx={{ fontFamily: MAIN_FONT, fontWeight: 700, fontSize: "0.58rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.4 }}>
      {label}
    </Typography>
  </Box>
);