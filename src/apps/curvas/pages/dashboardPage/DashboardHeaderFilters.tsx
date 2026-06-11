// Barra superior con badges de estado, picker de fecha, búsqueda, modo histórico y botones de acción.

import React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { BRAND, MONO_FONT } from "./dashboard.constants";
import { FechaPickerConBadges } from "./FechaPickerConBadges";

interface DashboardHeaderFiltersProps {
  isPastDate: boolean;
  datosActuales: any | null;
  extractRef: (s: any) => string;
  setShowSelector: (v: boolean) => void;
  isHistoricalMode: boolean;
  setIsHistoricalMode: (v: boolean) => void;
  filtroFecha: string;
  setFiltroFecha: (s: string) => void;
  resumenFechas: Record<string, "pendiente" | "enviado">;
  filtroReferencia: string;
  setFiltroReferencia: (s: string) => void;
  isToday: boolean;
  hasChanges: boolean;
  saving: boolean;
  isConfirmed: boolean;
  handleSave: () => void;
  handleSend: () => void;
}

export const DashboardHeaderFilters: React.FC<DashboardHeaderFiltersProps> = ({
  isPastDate,
  datosActuales,
  extractRef,
  setShowSelector,
  isHistoricalMode,
  setIsHistoricalMode,
  filtroFecha,
  setFiltroFecha,
  resumenFechas,
  filtroReferencia,
  setFiltroReferencia,
  isToday,
  hasChanges,
  saving,
  isConfirmed,
  handleSave,
  handleSend,
}) => {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        py: 0.6,
        px: 1,
        justifyContent: { xs: "center", sm: "flex-end" },
        width: "100%",
        flexWrap: "nowrap",
      }}
    >
      {isPastDate && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            height: 40,
            borderRadius: "6px",
            bgcolor: "rgba(156, 163, 175, 0.12)",
            border: "1.5px solid rgba(156, 163, 175, 0.5)",
            backdropFilter: "blur(4px)",
            color: "#6b7280",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 900 }}>
            📖 SOLO LECTURA - HISTORIAL
          </Typography>
        </Box>
      )}

      {datosActuales && (
        <Box
          onClick={() => setShowSelector(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            px: 2,
            height: 40,
            borderRadius: "6px",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.35)",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontWeight: 800,
              fontSize: "0.58rem",
              letterSpacing: 1,
            }}
          >
            REF
          </Typography>
          <Typography
            sx={{
              color: "white",
              fontWeight: 900,
              fontFamily: MONO_FONT,
              fontSize: "0.85rem",
              letterSpacing: -0.2,
            }}
          >
            {extractRef(datosActuales).toUpperCase()}
          </Typography>
        </Box>
      )}

      <Box
        className="tour-curvas-fecha"
        sx={{
          bgcolor: "white",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          flexShrink: 0,
        }}
      >
        {!isHistoricalMode && (
          <FechaPickerConBadges
            filtroFecha={filtroFecha}
            setFiltroFecha={setFiltroFecha}
            resumenFechas={resumenFechas}
          />
        )}
        {isHistoricalMode && (
          <Button
            onClick={() => setIsHistoricalMode(false)}
            sx={{
              height: 40,
              px: 2,
              fontSize: "0.85rem",
              fontWeight: 800,
              color: BRAND.primary,
              textTransform: "none",
            }}
          >
            Volver a Fecha
          </Button>
        )}
      </Box>

      <TextField
        size="small"
        placeholder="Filtrar lote..."
        value={filtroReferencia}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFiltroReferencia(e.target.value)
        }
        slotProps={{
          input: {
            sx: {
              height: 40,
              fontWeight: 800,
              bgcolor: "white !important",
              color: BRAND.text,
              borderRadius: "6px",
              fontSize: "0.85rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              "& fieldset": { border: "none" },
              pl: 1,
            },
          },
        }}
        sx={{ width: { xs: 130, sm: 160 }, flexShrink: 0 }}
      />

      <Button
        onClick={() => setIsHistoricalMode(!isHistoricalMode)}
        startIcon={<LibraryBooksIcon sx={{ fontSize: 16 }} />}
        sx={{
          fontWeight: 900,
          borderRadius: "6px",
          textTransform: "none",
          color: "white",
          px: 2,
          height: 40,
          fontSize: "0.8rem",
          bgcolor: isHistoricalMode ? BRAND.primary : "#64748b",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          "&:hover": {
            bgcolor: isHistoricalMode ? BRAND.dark : "#475569",
          },
        }}
      >
        {isHistoricalMode ? "MODO HISTÓRICO" : "HISTÓRICO"}
      </Button>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        {isToday && hasChanges && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 900,
              borderRadius: "6px",
              background: "#d97706",
              color: "white",
              px: 2,
              height: 40,
              textTransform: "none",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              "&:hover": { background: "#b45309" },
            }}
          >
            Guardar
          </Button>
        )}
        {isToday && !isConfirmed && (
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            onClick={handleSend}
            disabled={saving || hasChanges}
            sx={{
              fontWeight: 900,
              borderRadius: "6px",
              background: BRAND.primary,
              color: "white",
              px: 2,
              height: 40,
              textTransform: "none",
              fontSize: "0.8rem",
              boxShadow: "0 4px 12px rgba(0,106,204,0.3)",
              "&:hover": { bgcolor: BRAND.dark },
            }}
          >
            Enviar
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
