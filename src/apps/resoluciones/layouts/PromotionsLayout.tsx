import React, { useState } from "react";
import { Box, Typography, Paper, Divider, Chip } from "@mui/material";
import PromotionsFilterBar from "../components/PromotionsFilterBar";
import PromotionsList from "../components/PromotionsList";
import YearViewSummary from "../components/YearViewSummary";
import PromotionsCalendarMonth from "../components/PromotionsCalendarMonth";

const PromotionsLayout: React.FC = () => {
  const [selectedView, setSelectedView] = useState<"anual" | "mensual">("anual");
  const [focusedMonth, setFocusedMonth] = useState<number>(new Date().getMonth());

  /** Función que se pasa a YearViewSummary para manejar clic en mes */
  const handleMonthClick = (monthIdx: number) => {
    setFocusedMonth(monthIdx);
    setSelectedView("mensual");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Encabezado */}
      <Typography variant="h5" fontWeight="bold">
        Promociones
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Selector de vista */}
      <Box display="flex" justifyContent="center" mb={2}>
        <Chip
          label="Vista Anual"
          color={selectedView === "anual" ? "primary" : "default"}
          onClick={() => setSelectedView("anual")}
          sx={{ cursor: "pointer", mr: 1 }}
        />
        <Chip
          label="Vista Mensual"
          color={selectedView === "mensual" ? "primary" : "default"}
          onClick={() => setSelectedView("mensual")}
          sx={{ cursor: "pointer" }}
        />
      </Box>

      {/* Contenido principal */}
      <Box
  display="flex"
  gap={2}
  flex={1}
  flexDirection={{ xs: "column", md: "row" }} // 📌 vertical en xs/sm, horizontal en md+
>
  {/* Filtros */}
  <Paper sx={{ p: 2, borderRadius: 2, overflowY: "auto", flex: 1 }}>
    <PromotionsFilterBar />
  </Paper>

  {/* Vista de promociones */}
  <Paper sx={{ p: 2, borderRadius: 2, overflow: "auto", flex: 2 }}>
    {selectedView === "anual" && <YearViewSummary onMonthClick={handleMonthClick} />}
    {selectedView === "mensual" && <PromotionsCalendarMonth month={focusedMonth} />}
  </Paper>

  {/* Lista de promociones */}
  <Paper sx={{ p: 2, borderRadius: 2, overflowY: "auto", flex: 1 }}>
    <PromotionsList />
  </Paper>
</Box>
    </Paper>
  );
};

export default PromotionsLayout;
