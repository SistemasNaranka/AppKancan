import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddIcon from "@mui/icons-material/Add";
import { FloatingHelpButton } from "../../components";
import {
  AnimatedTab,
  TabContainer,
  ReservationTab,
  TAB_TITLES,
} from "./reservasView.styled";

const AZUL = "#004680";

interface ReservationViewHeaderProps {
  currentTab: ReservationTab;
  onTabChange: (tab: ReservationTab) => void;
  isFullTourRunning: boolean;
  floatingBtnRef: React.RefObject<HTMLDivElement>;
  onStartTutorial: () => void;
  onOpenNewReservation: () => void;
}

const TABS: { id: ReservationTab; label: string; icon: React.ReactNode }[] = [
  { id: "Reserva", label: "Reserva", icon: <EventAvailableIcon sx={{ fontSize: 18 }} /> },
  { id: "mis", label: "Mis reservas", icon: <ListAltIcon sx={{ fontSize: 18 }} /> },
  { id: "calendario", label: "Calendario", icon: <CalendarIcon sx={{ fontSize: 18 }} /> },
];

const TAB_SUBTITULOS: Record<ReservationTab, string> = {
  Reserva: "Reserva una sala disponible para tu equipo",
  mis: "Consulta y gestiona tus reservas",
  calendario: "Visualiza la ocupación de las salas",
};

const TAB_ICONOS: Record<ReservationTab, React.ReactNode> = {
  Reserva: <CalendarIcon sx={{ fontSize: 26 }} />,
  mis: <EventAvailableIcon sx={{ fontSize: 26 }} />,
  calendario: <EventNoteIcon sx={{ fontSize: 26 }} />,
};

export const ReservationViewHeader: React.FC<ReservationViewHeaderProps> = ({
  currentTab,
  onTabChange,
  isFullTourRunning,
  floatingBtnRef,
  onStartTutorial,
  onOpenNewReservation,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #eef2f6",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        bgcolor: "#fff",
        mb: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          flex: 1,
          minWidth: 0,
        }}
      >
        
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: 40, md: 48 },
            height: { xs: 40, md: 48 },
            borderRadius: 2.5,
            flexShrink: 0,
            color: AZUL,
            bgcolor: "#eaf2fb",
            border: "1px solid #d6e6f7",
          }}
        >
          {TAB_ICONOS[currentTab]}
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              color: "#0f2c4a",
              lineHeight: 1.2,
              fontSize: { xs: "1.15rem", md: "1.4rem" },
            }}
          >
            {TAB_TITLES[currentTab]}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mt: 0.4, lineHeight: 1.35 }}>
            {TAB_SUBTITULOS[currentTab]}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }}>
        <TabContainer>
          {TABS.map((tab, index) => {
            const isFirst = index === 0;
            const isLast = index === TABS.length - 1;
            const isActive = currentTab === tab.id;

            const handleClick = () => {
              if (isFullTourRunning) return;
              onTabChange(tab.id);
            };

            return (
              <AnimatedTab
                key={tab.id}
                isActive={isActive}
                isFirst={isFirst}
                isLast={isLast}
                onClick={handleClick}
                tabIndex={0}
                role="tab"
                aria-selected={isActive}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                  }
                }}
                sx={{
                  cursor: isFullTourRunning ? "not-allowed" : "pointer",
                  opacity: isFullTourRunning && !isActive ? 0.5 : 1,
                }}
              >
                {tab.icon}
                {tab.label}
              </AnimatedTab>
            );
          })}
        </TabContainer>
      </Box>

      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
        <div ref={floatingBtnRef} style={{ display: "inline-flex" }}>
          <FloatingHelpButton onBeforeStart={onStartTutorial} />
        </div>
        <Button
          className="tour-nueva-reserva"
          startIcon={<AddIcon />}
          variant="contained"
          onClick={onOpenNewReservation}
          sx={{
            boxShadow: "none",
            textTransform: "none",
            fontWeight: "600",
            backgroundColor: "rgb(15, 149, 104)",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#0B6B4B",
            },
          }}
        >
          Nueva reserva
        </Button>
      </Box>
    </Paper>
  );
};
