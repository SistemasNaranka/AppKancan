import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PendingActions, CheckCircle } from "@mui/icons-material";

interface Props {
  pendientes: number;
  seleccionados: number;
}

const ContadorPendientesYSeleccionados: React.FC<Props> = ({
  pendientes,
  seleccionados,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // 🔹 Detecta pantallas pequeñas (por debajo de 600px)
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: isSmallScreen ? 1.5 : 2,
        mb: isSmallScreen ? 1.5 : 2,
        flexWrap: "wrap",
        justifyContent: "flex-start",
      }}
    >
      {/* —— CARD: DOCUMENTOS PENDIENTES —— */}
      <Card
        variant="outlined"
        sx={{
          borderBottom: `4px solid ${theme.palette.info.main}`,
          borderRadius: isSmallScreen ? 1.5 : 2,
          boxShadow: 1,
          backgroundColor: isDark ? theme.palette.background.paper : "#fff",
          minWidth: isSmallScreen ? 150 : 180,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: isSmallScreen ? 1 : 1.5,
            "&:last-child": { pb: isSmallScreen ? 1 : 1.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PendingActions
              sx={{
                color: theme.palette.info.main,
                fontSize: isSmallScreen ? 20 : 24,
                mr: isSmallScreen ? 0.7 : 1,
              }}
            />
            <Typography
              fontWeight={700}
              sx={{ fontSize: isSmallScreen ? "1.1rem" : "1.5rem" }}
            >
              Pendientes:
            </Typography>
          </Box>

          <Typography
            variant="h6"
            sx={{
              ml: isSmallScreen ? 0.5 : 1,
              fontWeight: "bold",
              color: theme.palette.info.main,
              fontSize: isSmallScreen ? "1.3rem" : "1.5rem",
            }}
          >
            {pendientes}
          </Typography>
        </CardContent>
      </Card>

      {/* —— CARD: DOCUMENTOS SELECCIONADOS —— */}
      {seleccionados > 0 && (
        <Card
          variant="outlined"
          sx={{
            borderBottom: `4px solid ${theme.palette.warning.main}`,
            borderRadius: isSmallScreen ? 1.5 : 2,
            boxShadow: 1,
            backgroundColor: isDark ? theme.palette.background.paper : "#fff",
            minWidth: isSmallScreen ? 150 : 180,
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: isSmallScreen ? 1 : 1.5,
              "&:last-child": { pb: isSmallScreen ? 1 : 1.5 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckCircle
                sx={{
                  color: theme.palette.warning.main,
                  fontSize: isSmallScreen ? 20 : 24,
                  mr: isSmallScreen ? 0.7 : 1,
                }}
              />
              <Typography
                fontWeight={700}
                sx={{ fontSize: isSmallScreen ? "1.1rem" : "1.5rem" }}
              >
                Seleccionados:
              </Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{
                ml: isSmallScreen ? 0.5 : 1,
                fontWeight: "bold",
                color: theme.palette.warning.main,
                fontSize: isSmallScreen ? "1.3rem" : "1.5rem",
              }}
            >
              {seleccionados}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ContadorPendientesYSeleccionados;
