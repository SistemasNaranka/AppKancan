import React, { useState } from "react";
import {
  Box,
  Button,
  useTheme,
  IconButton,
  Popover,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

type Props = {
  idsSeleccionadosLength: number;
  loading: boolean;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  onAbrirDialogoAprobacion: () => void;
  tienePoliticaTrasladosJefezona?: boolean;
};

export const ControlesSuperiores: React.FC<Props> = ({
  idsSeleccionadosLength,
  loading,
  onAbrirDialogoAprobacion,
  tienePoliticaTrasladosJefezona = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenHelp = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseHelp = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100%",
        p: 2,
        flexGrow: 1,
        minHeight: 0,

        // 📱 En pantallas pequeñas: cambia a layout horizontal
        [theme.breakpoints.down("sm")]: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.5,
          height: "auto",
        },
      }}
    >
      {/* 🔹 Icono de ayuda */}
      <Box
        sx={{
          alignSelf: "flex-end",
          [theme.breakpoints.down("sm")]: {
            alignSelf: "center",
          },
        }}
      >
        <IconButton
          size="medium"
          onClick={handleOpenHelp}
          sx={{
            color: "primary.main",
            backgroundColor: theme.palette.background.paper,
            boxShadow: 2,
            mb: 6,
            "&:hover": {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.primary.main,
            },
            transition: "all 0.2s",

            // 📱 Reduce márgenes y tamaño en pantallas pequeñas
            [theme.breakpoints.down("sm")]: {
              mb: 0,
              p: 0.6,
            },
          }}
        >
          <HelpOutlineIcon
            fontSize="medium"
            sx={{
              [theme.breakpoints.down("sm")]: { fontSize: 24 },
              fontSize: 24,
            }}
          />
        </IconButton>
      </Box>

      {/* 🔹 Espaciador flexible solo en pantallas grandes */}
      <Box
        sx={{
          flexGrow: 3,
          [theme.breakpoints.down("sm")]: {
            display: "none",
          },
        }}
      />

      {/* 🔹 Botón APROBAR - Ocultar si tiene política TrasladosJefezona */}
      {!tienePoliticaTrasladosJefezona && (
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onAbrirDialogoAprobacion}
          disabled={idsSeleccionadosLength === 0 || loading}
          sx={{
            fontWeight: 700,
            borderRadius: 3,
            px: 6,
            py: 1.4,
            fontSize: "1.1rem",
            opacity: idsSeleccionadosLength === 0 ? 0.5 : 1,
            cursor: idsSeleccionadosLength === 0 ? "not-allowed" : "pointer",
            transition: "transform 0.15s",
            "&:hover": {
              backgroundColor: theme.palette.success.dark,
              transform: idsSeleccionadosLength === 0 ? "none" : "scale(1.04)",
            },

            // 📱 Botón más compacto y adaptable
            [theme.breakpoints.down("sm")]: {
              px: 3,
              py: 1,
              fontSize: "0.9rem",
              borderRadius: 2,
              flexShrink: 0,
            },
          }}
        >
          APROBAR
        </Button>
      )}

      {/* 🔹 Popover de ayuda */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseHelp}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 320,
              borderRadius: 3,
              boxShadow: 6,
              bgcolor: isDark ? "background.paper" : "#fff",
              border: "1px solid",
              borderColor: isDark ? "grey.700" : "grey.300",
              [theme.breakpoints.down("sm")]: {
                width: "90vw",
                p: 1.5,
              },
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LightbulbIcon color="warning" />
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary"
            textAlign="center"
            sx={{
              [theme.breakpoints.down("sm")]: {
                fontSize: "1rem",
              },
            }}
          >
            Guía rápida de aprobación
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TouchAppIcon color="primary" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
              }}
            >
              Haz clic en los traslados que deseas aprobar para seleccionarlos.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
              }}
            >
              Pulsa el botón <strong>“Aprobar”</strong> para confirmar.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockIcon color="primary" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
              }}
            >
              Ingresa tu contraseña de Ultra para completar la acción.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{
            fontStyle: "italic",
            [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
          }}
        >
          También puedes usar los filtros o “Seleccionar todo” para agilizar el
          proceso.
        </Typography>
      </Popover>
    </Box>
  );
};
