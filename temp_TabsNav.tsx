import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import DashboardOutlinedIcon    from '@mui/icons-material/DashboardOutlined';
import ArticleOutlinedIcon      from '@mui/icons-material/ArticleOutlined';
import GroupsOutlinedIcon       from '@mui/icons-material/GroupsOutlined';
import AutorenewOutlinedIcon    from '@mui/icons-material/AutorenewOutlined';
import ArrowBackOutlinedIcon    from '@mui/icons-material/ArrowBackOutlined';
import { TabValue } from '../types/types';
import { useContracts } from '../hooks/useContracts';

interface TabConfig {
  value: TabValue;
  label: string;
  Icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { value: 'resumen',    label: 'Resumen',    Icon: DashboardOutlinedIcon  },
  { value: 'contratos',  label: 'Contratos',  Icon: ArticleOutlinedIcon    },
  { value: 'empleados',  label: 'Empleados',  Icon: GroupsOutlinedIcon     },
  { value: 'prorrogas',  label: 'Prórrogas',  Icon: AutorenewOutlinedIcon  },
];

const TabsNav: React.FC = () => {
  const { filters, setTab, counts, selectedContrato, select } = useContracts();
  const badgeFor = (value: TabValue): number | undefined => {
    if (value === 'contratos') {
      const urgent = (counts.criticos ?? 0) + (counts.por_vencer ?? 0);
      return urgent > 0 ? urgent : undefined;
    }
    if (value === 'prorrogas') {
      const pending = (counts.pendiente ?? 0) + (counts.en_revision ?? 0);
      return pending > 0 ? pending : undefined;
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Bot n Volver ÔÇö solo visible cuando hay un contrato seleccionado */}
        {selectedContrato && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => select(null)}
            sx={{
              borderColor: 'divider',
              color: '#fff',
              fontSize: '0.78rem',
              backgroundColor: '#004680',
              flexShrink: 0,
              '&:hover': { bgcolor: '#005aa3' },
            }}
          >
            Volver
          </Button>
        )}

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
            const badge    = badgeFor(value);
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
                    {badge !== undefined && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          lineHeight: 1,
                          px: 0.8,
                          py: 0.3,
                          borderRadius: 10,
                          bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'warning.main',
                          color: '#fff',
                        }}
                      >
                        {badge}
                      </Box>
                    )}
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
                  '&.Mui-selected': { color: '#fff' },
                }}
              />
            );
          })}
        </Tabs>
      </Box>
    </Box>
  );
};

export default TabsNav;
