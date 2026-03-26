import React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { TabValue } from "../types/types";
import { useContractContext } from "../contexts/ContractContext";

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface TabConfig {
  value: TabValue;
  label: string;
  Icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { value: "resumen", label: "Resumen", Icon: DashboardOutlinedIcon },
  { value: "todos", label: "Contratos", Icon: AssignmentOutlinedIcon },
];

// ─────────────────────────────────────────────────────────────────────────────
// TabsNav
// ─────────────────────────────────────────────────────────────────────────────

const TabsNav: React.FC = () => {
  const { filters, setTab, contratos } = useContractContext();

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: 3,
      }}
    >
      <Tabs
        value={filters.tab}
        onChange={(_, v: TabValue) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { display: "none" } }}
        sx={{
          minHeight: 52,
          "& .MuiTabs-flexContainer": {
            gap: 0.5,
            alignItems: "center",
            height: 52,
          },
        }}
      >
        {TABS.map(({ value, label, Icon }) => {
          const isActive = filters.tab === value;

          return (
            <Tab
              key={value}
              value={value}
              disableRipple
              icon={<Icon style={{ fontSize: 15 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  {label}
                </Box>
              }
              sx={{
                minHeight: 36,
                py: 0.75,
                px: 1.8,
                borderRadius: 2,
                fontSize: "0.8rem",
                fontWeight: isActive ? 700 : 500,
                textTransform: "none",
                letterSpacing: 0,
                color: isActive ? "#fff" : "text.secondary",
                bgcolor: isActive ? "primary.main" : "transparent",
                "&:hover": {
                  bgcolor: isActive ? "primary.dark" : "action.hover",
                },
                transition: "all 0.2s ease",
                "& .MuiTab-iconWrapper": {
                  color: isActive ? "rgba(255,255,255,0.85)" : "text.disabled",
                  mr: 0.5,
                },
                "&.Mui-selected": {
                  color: "#fff",
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default TabsNav;
