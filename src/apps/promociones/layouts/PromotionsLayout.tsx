import React from "react";
import { Box, Typography, Chip, Button, Card } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PromotionsFilterBar from "../components/PromotionsFilterBar";
import PromotionsList from "../components/PromotionsList";
import YearViewSummary from "../components/views/YearViewSummary";
import PromotionsCalendarMonth from "../components/views/PromotionsCalendarMonth";
import PromotionsCalendarWeek from "../components/views/PromotionsCalendarWeek";
import PromotionsCalendarDay from "../components/views/PromotionsCalendarDay";
import { usePromotionsFilter } from "../hooks/usePromotionsFilter";
import { ViewType } from "../hooks/PromotionsFilterContext";

const VIEW_TYPES: ViewType[] = ["anual", "mensual", "semanal", "dia"];

const PromotionsLayout: React.FC = () => {
  const { selectedView, setSelectedView } = usePromotionsFilter();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, md: 3 },
        minHeight: "100vh",
      }}
    >
      {/* Encabezado */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent={{ xs: "flex-start", md: "space-between" }}
        gap={{ xs: 1.5, md: 2 }}
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          borderRadius: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="800"
          sx={{
            color: "#1976d2",
            textShadow: "1px 2px 4px rgba(0, 0, 0, 0.1)",
            letterSpacing: "0.5px",
            fontSize: { xs: "1.6rem", sm: "2rem" },
            textAlign: { xs: "center", md: "left" },
            width: { xs: "100%", md: "auto" },
          }}
        >
          Promociones
        </Typography>

        {/* Selector de vista */}
        <Box
          display="flex"
          justifyContent={{ xs: "center", md: "center" }}
          flexWrap="wrap"
          gap={{ xs: 1, sm: 1.5 }}
          sx={{
            width: { xs: "100%", md: "auto" },
          }}
        >
          {VIEW_TYPES.map((view) => (
            <Chip
              key={view}
              label={`Vista ${view.charAt(0).toUpperCase() + view.slice(1)}`}
              variant={selectedView === view ? "filled" : "outlined"}
              color={selectedView === view ? "primary" : "default"}
              onClick={() => setSelectedView(view)}
              sx={{
                cursor: "pointer",
                borderRadius: 2,
                fontWeight: "600",
                px: { xs: 1, sm: 1.5 },
                py: { xs: 1, sm: 2.5 },
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                boxShadow:
                  selectedView === view
                    ? "0 4px 12px rgba(0,0,0,0.08)"
                    : "none",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            />
          ))}
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/promociones/crear")}
          sx={{
            borderRadius: 3,
            px: { xs: 2, sm: 3 },
            py: { xs: 0.8, sm: 1 },
            fontWeight: "600",
            textTransform: "none",
            fontSize: { xs: "0.85rem", sm: "1rem" },
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            width: { xs: "100%", md: "auto" },
            alignSelf: { xs: "center", md: "auto" },
            "&:hover": {
              boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Crear Promoción
        </Button>
      </Box>

      {/* Contenido principal */}
      <Box
        display="flex"
        gap={{ xs: 2, md: 3 }}
        flex={1}
        flexDirection={{ xs: "column", md: "row" }}
        sx={{ minHeight: 0 }}
      >
        {/* Filtros */}
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            overflowY: "auto",
            flex: 1,
            background: "none",
            boxShadow: "0 0px 0px rgba(0,0,0,0.05)",
            maxHeight: { xs: "auto", md: "calc(100vh - 200px)" },
          }}
        >
          <PromotionsFilterBar />
        </Card>

        {/* Vista de promociones */}
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            overflow: "auto",
            flex: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.03)",
            maxHeight: { xs: "auto", md: "calc(100vh - 200px)" },
          }}
        >
          {selectedView === "anual" && <YearViewSummary />}
          {selectedView === "mensual" && <PromotionsCalendarMonth />}
          {selectedView === "semanal" && <PromotionsCalendarWeek />}
          {selectedView === "dia" && <PromotionsCalendarDay />}
        </Card>

        {/* Lista de promociones */}
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            overflowY: "auto",
            flex: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.03)",
            maxHeight: { xs: "auto", md: "calc(100vh - 200px)" },
          }}
        >
          <PromotionsList />
        </Card>
      </Box>
    </Box>
  );
};

export default PromotionsLayout;
