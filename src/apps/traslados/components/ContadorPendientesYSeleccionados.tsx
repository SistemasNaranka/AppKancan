import React from "react";
import { Box, Typography } from "@mui/material";
import { PendingActions, CheckCircle } from "@mui/icons-material";

interface Props {
  pendientes: number;
  seleccionados: number;
}

const ContadorPendientesYSeleccionados: React.FC<Props> = ({
  pendientes,
  seleccionados,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flex: 1,
        flexWrap: "wrap",
        mb: 3,
        alignItems: "center",
        minWidth: "auto",
      }}
    >
      {/* —— DOCUMENTOS PENDIENTES —— */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#e3f2fd", // Fondo azul claro (no blanco)
          borderRadius: "8px",
          padding: "6px 12px",
        }}
      >
        <PendingActions sx={{ color: "#004680", fontSize: 35 }} />
        <Typography
          variant="body1"
          fontWeight={700}
          component="span"
          sx={{
            color: "#004680",
            fontSize: "1.5rem",
            whiteSpace: "nowrap",
            overflow: "visible",
            userSelect: "none", //  Esto evita la selección de texto
            cursor: "default", // Opcional: evita que parezca interactivo
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
            backgroundColor: "#e8f5e9", // Fondo verde claro
            borderRadius: "8px",
            padding: "6px 12px",
          }}
        >
          <CheckCircle sx={{ color: "#388e3c", fontSize: 30 }} />
          <Typography
            variant="body1"
            fontWeight={700}
            component="span"
            sx={{
              color: "#388e3c",
              fontSize: "1.3rem",
              whiteSpace: "nowrap",
              overflow: "visible",
              userSelect: "none", //  Esto evita la selección de texto
              cursor: "default", //  evita que parezca interactivo
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
