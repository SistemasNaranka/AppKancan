// Header de la vista de reservas: título, tabs animados, botón de tutorial y nueva reserva.

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";
import { FloatingHelpButton } from "../../components";
import {
  AnimatedTab,
  TabContainer,
  ReservationTab,
  TAB_TITLES,
} from "./reservasView.styled";

interface ReservationViewHeaderProps {
  currentTab: ReservationTab;
  onTabChange: (tab: ReservationTab) => void;
  isFullTourRunning: boolean;
  floatingBtnRef: React.RefObject<HTMLDivElement>;
  onStartTutorial: () => void;
  onOpenNewReservation: () => void;
}

const TABS: { id: ReservationTab; label: string }[] = [
  { id: "Reserva", label: "Reserva" },
  { id: "mis", label: "Mis reservas" },
  { id: "calendario", label: "Calendario" },
];

export const ReservationViewHeader: React.FC<ReservationViewHeaderProps> = ({
  currentTab,
  onTabChange,
  isFullTourRunning,
  floatingBtnRef,
  onStartTutorial,
  onOpenNewReservation,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        mb: 1,
        pb: 0.5,
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: 180,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            backgroundColor: "#1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CalendarIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a" }}>
          {TAB_TITLES[currentTab]}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
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
                {tab.label}
              </AnimatedTab>
            );
          })}
        </TabContainer>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
    </Box>
  );
};
