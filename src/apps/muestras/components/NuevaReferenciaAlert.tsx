import React from "react";
import { Alert, Slide, Typography, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface NuevaReferenciaAlertProps {
  ultimoAgregado: string | null;
  alertCounter: number;
}

const NuevaReferenciaAlert: React.FC<NuevaReferenciaAlertProps> = ({
  ultimoAgregado,
  alertCounter,
}) => {
  return (
    <Slide
      direction="right"
      in={!!ultimoAgregado}
      mountOnEnter
      unmountOnExit
      timeout={300}
    >
      <Alert
        key={alertCounter}
        severity="success"
        icon={
          <CheckCircleIcon
            sx={{
              fontSize: { xs: 20, sm: 24, md: 28 },
              animation: "pulse 0.6s ease-in-out",
            }}
          />
        }
        sx={{
          position: "absolute",
          top: { xs: 5, sm: 25, md: 30 },
          left: { xs: 5, sm: 25, md: 30 },
          right: { xs: 5, sm: "auto" },
          zIndex: 1300,
          minWidth: { xs: "auto", sm: 200, md: 250 },
          maxWidth: { xs: "calc(40% - 10px)", sm: "calc(80% - 40px)" },
          boxShadow: {
            xs: "0 2px 8px rgba(76, 175, 80, 0.12)",
            sm: "0 4px 14px rgba(76, 175, 80, 0.15)",
          },
          backgroundColor: "#f1f8f4",
          color: "#1b5e20",
          border: { xs: "1.5px solid #81c784", sm: "2px solid #81c784" },
          borderRadius: { xs: 1.5, sm: 2 },
          fontWeight: 600,
          py: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 },
          "& .MuiAlert-icon": {
            color: "#2e7d32",
            padding: { xs: "4px 0", sm: "7px 0" },
          },
          "& .MuiAlert-message": {
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            padding: 0,
            overflow: "hidden",
          },
        }}
      >
        <Typography
          variant="body2"
          fontWeight="600"
          color="#1b5e20"
          sx={{
            fontSize: { xs: "0.9rem", sm: "0.9rem", md: "1rem" },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Ref.{" "}
          <Box
            component="span"
            sx={{
              fontFamily: "monospace",
              fontWeight: 800,
              fontSize: { xs: "0.95rem", sm: "0.95rem", md: "1.05rem" },
            }}
          >
            {ultimoAgregado}
          </Box>{" "}
          agregada
        </Typography>
      </Alert>
    </Slide>
  );
};

export default NuevaReferenciaAlert;
