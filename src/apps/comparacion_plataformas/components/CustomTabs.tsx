import React from "react";
import { Box, Typography } from "@mui/material";

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface CustomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #e0e0e0",
        backgroundColor: "transparent",
        mt: 0, // Ajustado a 0 para alineación perfecta con botones
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <Box
            key={tab.id}
            onClick={() => !isDisabled && onChange(tab.id)}
            sx={{
              padding: "10px 80px", // Reducido un poco para mayor elegancia
              cursor: isDisabled ? "not-allowed" : "pointer",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
              backgroundColor: isActive ? "#1976d2" : "#004680",
              color: isDisabled ? "#9e9e9e" : isActive ? "#ffffff" : "#ffffff",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.2s ease",
              marginRight: "4px",
              opacity: isDisabled ? 0.5 : 1,
              "&:hover": {
                backgroundColor: isDisabled ? "transparent" : isActive ? "#1976d2" : "#0262b0",
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default CustomTabs;