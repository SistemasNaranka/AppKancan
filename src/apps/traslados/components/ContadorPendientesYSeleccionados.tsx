import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
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

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flex: 1,
        flexWrap: "wrap",
        mb: 3,
        alignItems: "center",
      }}
    >
      {/* —— DOCUMENTOS PENDIENTES —— */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: isDark
            ? theme.palette.primary.light
            : theme.palette.primary.light,
          borderRadius: "8px",
          padding: "6px 12px",
        }}
      >
        <PendingActions
          sx={{
            color: isDark
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            fontSize: 35,
          }}
        />
        <Typography
          variant="body1"
          fontWeight={700}
          component="span"
          sx={{
            color: isDark
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            fontSize: "1.5rem",
            whiteSpace: "nowrap",
            userSelect: "none",
            cursor: "default",
          }}
        >
          Documentos Pendientes ({pendientes})
        </Typography>
      </Box>

      {/* —— DOCUMENTOS SELECCIONADOS —— */}
      {seleccionados > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: isDark
              ? theme.palette.success.main
              : theme.palette.success.main,
            borderRadius: "8px",
            padding: "6px 12px",
          }}
        >
          <CheckCircle
            sx={{
              color: isDark
                ? theme.palette.success.light
                : theme.palette.success.contrastText,
              fontSize: 30,
            }}
          />
          <Typography
            variant="body1"
            fontWeight={700}
            component="span"
            sx={{
              color: isDark
                ? theme.palette.success.light
                : theme.palette.success.contrastText,
              fontSize: "1.3rem",
              whiteSpace: "nowrap",
              userSelect: "none",
              cursor: "default",
            }}
          >
            Documentos seleccionados ({seleccionados})
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ContadorPendientesYSeleccionados;
