import React, { useState } from "react";
import { Box, Typography, Collapse, Button, Chip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined";

export const AvisoUltraSync: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        flexShrink: 0,
        mb: { xs: 1, sm: 1.5 },
        borderRadius: 2.5,
        backgroundColor: "#f0f9ff",
        border: "1px solid #bae6fd",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(2, 132, 199, 0.05)",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* 🔹 Barra compacta de 1 sola línea (Llama la atención sin saturar) */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.25, sm: 2 },
          py: { xs: 0.75, sm: 1 },
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { backgroundColor: "#e0f2fe" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1 },
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <SyncProblemOutlinedIcon
            sx={{
              color: "#0284c7",
              fontSize: { xs: 18, sm: 20 },
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{
              color: "#0369a1",
              fontSize: { xs: "0.78rem", sm: "0.85rem" },
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            Aviso importante sobre la actualización de traslados
          </Typography>
          <Chip
            label="Temporal"
            size="small"
            sx={{
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
              fontWeight: 700,
              fontSize: "0.65rem",
              height: "18px",
              display: { xs: "none", sm: "inline-flex" },
              border: "1px solid #bae6fd",
            }}
          />
        </Box>

        <Button
          size="small"
          endIcon={
            expanded ? (
              <ExpandLessIcon sx={{ fontSize: "16px !important" }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: "16px !important" }} />
            )
          }
          sx={{
            color: "#0284c7",
            fontWeight: 700,
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            textTransform: "none",
            p: 0,
            minWidth: "auto",
            ml: 1,
            flexShrink: 0,
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          {expanded ? "Ocultar" : "Ver detalle"}
        </Button>
      </Box>

      {/* 🔹 Detalle del aviso (Información completa al expandir) */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: { xs: 1.25, sm: 2 },
            pb: 1.25,
            pt: 0.5,
            borderTop: "1px stroke #bae6fd",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#334155", fontSize: { xs: "0.78rem", sm: "0.85rem" }, lineHeight: 1.5, mb: 1 }}
          >
            Debido a los recientes cambios en el sistema <strong>Ultra</strong>, la información de traslados <strong>no está en tiempo real por el momento</strong>. 
            Este es un <strong>proceso temporal</strong>: los datos están actualizados hasta la fecha del <strong>04 de agosto</strong> y se estarán actualizando únicamente <strong>1 vez al día</strong> mientras se completan los ajustes.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.75,
              p: 1,
              backgroundColor: "#f0f9ff",
              borderRadius: 1.5,
              border: "1px solid #e0f2fe",
            }}
          >
            <InfoOutlinedIcon
              sx={{ fontSize: 16, color: "#0284c7", mt: "2px", flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              sx={{ color: "#0369a1", fontWeight: 600, fontSize: { xs: "0.72rem", sm: "0.78rem" }, lineHeight: 1.35 }}
            >
              Nota: Si apruebas o anulas un traslado hoy, este seguirá figurando en la aplicación hasta que se realice la siguiente actualización diaria.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default AvisoUltraSync;
